// ===== モバイルメニュー（ハンバーガーメニュー）開閉処理 =====
// 読み込み確認ログ
console.log('[MobileMenu] loaded on', location.pathname);

window.initMobileMenu = function initMobileMenu() {
    let isInitialized = false;

    const init = () => {
        const toggle = document.querySelector('.header__menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        const overlay = document.querySelector('.mobile-menu-overlay');

        if (!toggle || !mobileMenu) {
            console.warn('[MobileMenu] Required elements not found');
            return;
        }

        if (isInitialized) return;
        isInitialized = true;

        // モバイル判定（959px以下）
        const isMobile = () => window.matchMedia('(max-width: 959px)').matches;

        // メニューを開く
        const openMenu = () => {
            if (!isMobile()) return;
            
            toggle.setAttribute('aria-expanded', 'true');
            mobileMenu.classList.add('is-open');
            mobileMenu.setAttribute('aria-hidden', 'false');
            if (overlay) {
                overlay.classList.add('is-open');
                overlay.setAttribute('aria-hidden', 'false');
            }
            document.body.classList.add('is-mobile-menu-open');
        };

        // メニューを閉じる
        const closeMenu = () => {
            toggle.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('is-open');
            mobileMenu.setAttribute('aria-hidden', 'true');
            if (overlay) {
                overlay.classList.remove('is-open');
                overlay.setAttribute('aria-hidden', 'true');
            }
            document.body.classList.remove('is-mobile-menu-open');

            // サブメニューも全て閉じる
            const submenuItems = mobileMenu.querySelectorAll('.mobile-menu__item.is-open');
            submenuItems.forEach(item => {
                item.classList.remove('is-open');
                const button = item.querySelector('.mobile-menu__link--toggle');
                if (button) {
                    button.setAttribute('aria-expanded', 'false');
                }
            });
        };

        // ハンバーガーボタンクリック
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (mobileMenu.classList.contains('is-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // オーバーレイクリックで閉じる
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                closeMenu();
            });
        }

        // Escキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
                closeMenu();
            }
        });

        // サブメニューの開閉（Service等）
        const submenuToggles = mobileMenu.querySelectorAll('.mobile-menu__link--toggle');
        submenuToggles.forEach(toggleBtn => {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const item = toggleBtn.closest('.mobile-menu__item');
                if (!item) return;

                const isOpen = item.classList.contains('is-open');
                
                // 他のサブメニューを閉じる
                const allItems = mobileMenu.querySelectorAll('.mobile-menu__item.is-open');
                allItems.forEach(i => {
                    if (i !== item) {
                        i.classList.remove('is-open');
                        const btn = i.querySelector('.mobile-menu__link--toggle');
                        if (btn) {
                            btn.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                // クリックしたアイテムを開閉
                if (isOpen) {
                    item.classList.remove('is-open');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('is-open');
                    toggleBtn.setAttribute('aria-expanded', 'true');
                }
            });
        });

        // メニューリンククリック時（通常リンクの場合）は閉じる
        const menuLinks = mobileMenu.querySelectorAll('.mobile-menu__link:not(.mobile-menu__link--toggle)');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                // 少し遅延させてから閉じる（遷移を見せるため）
                setTimeout(() => {
                    closeMenu();
                }, 100);
            });
        });

        // リサイズ時にPCサイズになったらメニューを閉じる
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (!isMobile() && mobileMenu.classList.contains('is-open')) {
                    closeMenu();
                }
            }, 100);
        });

        console.log('[MobileMenu] initialized');
    };

    // 初期化トリガー
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // 既に読み込み済みの場合、少し待ってから初期化（partial読み込み待ち）
        setTimeout(init, 100);
    }

    // ヘッダー注入完了イベントをリッスン（renderContent.js/main.jsでヘッダー注入後に発火）
    document.addEventListener('site:header-ready', () => {
        console.log('[MobileMenu] site:header-ready event received');
        isInitialized = false; // リセットして再初期化
        init();
    });

    // ヘッダーが動的に読み込まれた場合も対応（MutationObserver）
    const observer = new MutationObserver(() => {
        const toggle = document.querySelector('.header__menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        if (toggle && mobileMenu && !isInitialized) {
            console.log('[MobileMenu] DOM changed, initializing...');
            init();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

// 即座に実行
if (typeof window.initMobileMenu === 'function') {
    window.initMobileMenu();
}
