// ===== スクロール出現アニメーション（全体適用版） =====
window.initScrollReveal = function initScrollReveal() {
    // 特定のページでは無効化
    const currentPath = window.location.pathname;
    const excludedPages = ['/law.html', '/privacy.html', '/contact.html', '/web/law.html', '/web/privacy.html', '/web/contact.html'];
    const isExcluded = excludedPages.some(page => currentPath.includes(page));
    
    if (isExcluded) {
        return; // 除外ページではアニメーションを適用しない
    }
    
    // DOMが完全に読み込まれるまで待つ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initScrollReveal, 100);
        });
        return;
    }
    
    // セクション要素を自動的に取得してアニメーションを適用
    const sections = document.querySelectorAll('main section.section');
    const sectionInners = document.querySelectorAll('main .section-inner > *:not(header):not(nav):not(.hero)');
    const cards = document.querySelectorAll('.card, .problem-card, .service-card-item, .flow-step, .top-service-row, .value-card, .service-card');
    const headings = document.querySelectorAll('.section-head:not(.hero .section-head), .page-hero-common__content');
    const valueCards = document.querySelectorAll('.value-card, .top-service-row');
    
    // 既存のdata-anim要素と、自動適用する要素を結合
    const existingElements = document.querySelectorAll('[data-anim]');
    const allElements = new Set();
    
    // 既存要素を追加
    existingElements.forEach(el => allElements.add(el));
    
    // セクション要素を追加（ヒーローを除外）
    sections.forEach(el => {
        if (!el.classList.contains('hero') && !el.closest('.hero')) {
            allElements.add(el);
        }
    });
    
    // その他の要素を追加
    sectionInners.forEach(el => allElements.add(el));
    cards.forEach(el => allElements.add(el));
    headings.forEach(el => allElements.add(el));
    valueCards.forEach(el => allElements.add(el));
    
    // 除外する要素（ヒーローセクションなど、最初から表示されているもの）
    const heroSection = document.querySelector('.hero, .page-hero-common');
    if (heroSection) {
        allElements.delete(heroSection);
        // ヒーロー内の要素も除外
        const heroChildren = heroSection.querySelectorAll('*');
        heroChildren.forEach(child => allElements.delete(child));
    }
    
    // 配列に変換してインデックスでアクセス可能にする
    const elementsArray = Array.from(allElements);
    
    // 各要素にdata-anim属性を自動追加
    elementsArray.forEach((element, index) => {
        if (!element || !element.hasAttribute) return;
        if (!element.hasAttribute('data-anim')) {
            // より控えめなアニメーション（fadeを多く、slide-upを減らす）
            const animTypes = ['fade', 'fade', 'slide-up', 'fade', 'scale-fade'];
            const animType = animTypes[index % animTypes.length];
            element.setAttribute('data-anim', animType);
            // 遅延を削除（動きを控えめに）
        }
    });
    
    // 複数のアニメーションタイプに対応
    const revealElements = document.querySelectorAll('[data-anim]');
    
    if (revealElements.length === 0) {
        console.warn('[ScrollReveal] No elements found for animation');
        return;
    }
    
    if (window.Utils?.prefersReducedMotion) {
        revealElements.forEach(el => {
            const animType = el.getAttribute('data-anim');
            if (animType) {
                el.classList.add(`reveal--${animType}--in`);
            }
        });
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const animType = entry.target.getAttribute('data-anim') || 'reveal';
                const delay = entry.target.getAttribute('data-anim-delay') || '0';
                
                // requestAnimationFrameを使用してより滑らかに
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        entry.target.classList.add(`reveal--${animType}--in`);
                    }, parseInt(delay));
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -100px 0px', // 控えめなタイミング
        threshold: 0.05 // 標準的なトリガー
    });
    
    revealElements.forEach(element => {
        // 初期状態を設定
        const animType = element.getAttribute('data-anim') || 'reveal';
        element.classList.add(`reveal--${animType}`);
        observer.observe(element);
    });
}
