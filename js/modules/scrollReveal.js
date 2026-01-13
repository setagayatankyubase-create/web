// ===== スクロール出現アニメーション =====
window.initScrollReveal = function initScrollReveal() {
    const revealElements = document.querySelectorAll('[data-anim="reveal"]');
    
    if (window.Utils?.prefersReducedMotion) {
        revealElements.forEach(el => el.classList.add('reveal--in'));
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal--in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1
    });
    
    revealElements.forEach(element => observer.observe(element));
}
