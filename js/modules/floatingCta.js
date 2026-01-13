// ===== フローティングCTA =====
window.initFloatingCta = function initFloatingCta() {
    const cta = document.getElementById('floatingCta');
    if (!cta) return;
    
    const closeBtn = cta.querySelector('.floatingCta__close');
    const storage = window.Utils?.storage?.local;
    if (!storage) return;
    
    const storageKey = 'floatingCtaDismissedAt';
    const days7 = 7 * 24 * 60 * 60 * 1000;
    const dismissedAt = Number(storage.get(storageKey) || 0);
    const isDismissed = dismissedAt && (Date.now() - dismissedAt) < days7;
    
    const hide = () => {
        cta.classList.remove('is-show');
        cta.classList.add('is-hide');
    };
    const show = () => {
        cta.classList.remove('is-hide');
        cta.classList.add('is-show');
    };
    
    hide();
    if (isDismissed) return;
    
    let canShowByTime = false;
    setTimeout(() => { canShowByTime = true; }, 1200);
    
    const service = document.getElementById('service');
    if (service) {
        const io = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting) && canShowByTime) show();
        }, { threshold: 0.2 });
        io.observe(service);
    } else {
        setTimeout(show, 1200);
    }
    
    const footer = document.querySelector('footer');
    if (footer) {
        const footerIO = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) hide();
        }, { threshold: 0.05 });
        footerIO.observe(footer);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hide();
            storage.set(storageKey, String(Date.now()));
        });
    }
}
