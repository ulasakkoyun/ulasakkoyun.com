(function () {
    const transitionKey = 'pageTransitionDirection';
    const exitDurationMs = 580;

    function isInternalPageLink(link) {
        if (!link) return false;
        if (link.target && link.target !== '_self') return false;
        if (link.hasAttribute('download')) return false;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return false;

        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return false;

        const samePath = url.pathname === window.location.pathname;
        if (samePath && url.hash) return false;

        return url.pathname.endsWith('.html') || samePath;
    }

    function playEnterTransition() {
        const direction = sessionStorage.getItem(transitionKey);
        if (!direction) return;

        sessionStorage.removeItem(transitionKey);
        document.body.classList.add(direction === 'backward' ? 'page-enter-from-left' : 'page-enter-from-right');

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                document.body.classList.add('page-enter-active');
                document.body.classList.remove('page-enter-from-right');
                document.body.classList.remove('page-enter-from-left');
            });
        });

        window.setTimeout(function () {
            document.body.classList.remove('page-enter-active');
        }, 780);
    }

    function attachExitTransition() {
        document.addEventListener('click', function (event) {
            if (event.defaultPrevented) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const link = event.target.closest('a');
            if (!isInternalPageLink(link)) return;

            const href = link.getAttribute('href');
            if (!href) return;

            const targetUrl = new URL(href, window.location.href);
            const isSamePageWithoutHash = targetUrl.pathname === window.location.pathname && !targetUrl.hash;
            if (isSamePageWithoutHash) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const navLinks = Array.from(document.querySelectorAll('.top-nav a'));
            const currentIndex = navLinks.findIndex(function (navLink) {
                return navLink.classList.contains('active') || navLink.getAttribute('aria-current') === 'page';
            });
            const targetIndex = navLinks.indexOf(link);

            const direction = currentIndex !== -1 && targetIndex !== -1 && targetIndex < currentIndex
                ? 'backward'
                : 'forward';

            event.preventDefault();
            sessionStorage.setItem(transitionKey, direction);
            document.body.classList.add(direction === 'backward' ? 'page-leave-to-right' : 'page-leave-to-left');

            window.setTimeout(function () {
                window.location.href = href;
            }, exitDurationMs);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        playEnterTransition();
        attachExitTransition();
    });
})();
