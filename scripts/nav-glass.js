function initTopNavGlass(nav) {
    const links = Array.from(nav.querySelectorAll('a'));
    if (!links.length) return;

    let indicator = nav.querySelector('.top-nav-indicator');
    if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = 'top-nav-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        nav.prepend(indicator);
    }

    let activeLink = nav.querySelector('a.active, a[aria-current="page"]') || links[0];
    const storageKey = 'topNavLastHref';

    function moveIndicator(link, animate) {
        if (!link) return;

        const navRect = nav.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const x = linkRect.left - navRect.left;

        if (!animate) {
            const previousTransition = indicator.style.transition;
            indicator.style.transition = 'none';
            indicator.style.width = `${linkRect.width}px`;
            indicator.style.transform = `translateX(${x}px)`;
            indicator.style.opacity = '1';
            indicator.getBoundingClientRect();
            indicator.style.transition = previousTransition;
            return;
        }

        indicator.style.width = `${linkRect.width}px`;
        indicator.style.transform = `translateX(${x}px)`;
        indicator.style.opacity = '1';
    }

    const previousHref = sessionStorage.getItem(storageKey);
    const previousLink = previousHref ? links.find((link) => link.getAttribute('href') === previousHref) : null;

    if (previousLink && previousLink !== activeLink) {
        moveIndicator(previousLink, false);
        requestAnimationFrame(() => moveIndicator(activeLink, true));
    } else {
        moveIndicator(activeLink, false);
    }

    links.forEach((link) => {
        link.addEventListener('click', function () {
            sessionStorage.setItem(storageKey, link.getAttribute('href') || '');
            activeLink = link;
            moveIndicator(link, true);
        });

        link.addEventListener('mouseenter', function () {
            moveIndicator(link, true);
        });

        link.addEventListener('focus', function () {
            moveIndicator(link, true);
        });
    });

    nav.addEventListener('mouseleave', function () {
        moveIndicator(activeLink, true);
    });

    window.addEventListener('resize', function () {
        moveIndicator(activeLink, false);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.top-nav').forEach(initTopNavGlass);
});
