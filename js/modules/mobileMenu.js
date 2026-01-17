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
            console.warn('[MobileMenu] Required elements not found', {
                toggle: !!toggle,
                mobileMenu: !!mobileMenu
            });
            return;
        }

        if (isInitialized) {
            console.log('[MobileMenu] Already initialized, skipping');
            return;
        }
        isInitialized = true;
        console.log('[MobileMenu] Initializing menu system');

        // モバイル判定（959px以下）
        const isMobile = () => window.matchMedia('(max-width: 959px)').matches;

        // メニューを開く
        const openMenu = () => {
            console.log('[MobileMenu] openMenu called, isMobile:', isMobile());
            if (!isMobile()) {
                console.warn('[MobileMenu] Not mobile, skipping open');
                return;
            }
            
            console.log('[MobileMenu] Opening menu...');
            toggle.setAttribute('aria-expanded', 'true');
            mobileMenu.classList.add('is-open');
            mobileMenu.setAttribute('aria-hidden', 'false');
            if (overlay) {
                overlay.classList.add('is-open');
                overlay.setAttribute('aria-hidden', 'false');
            }
            document.body.classList.add('is-mobile-menu-open');
            
            console.log('[MobileMenu] Menu opened, classes:', {
                'mobileMenu.is-open': mobileMenu.classList.contains('is-open'),
                'overlay.is-open': overlay ? overlay.classList.contains('is-open') : 'no overlay',
                'body.is-mobile-menu-open': document.body.classList.contains('is-mobile-menu-open')
            });
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
            console.log('[MobileMenu] Toggle clicked');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const isCurrentlyOpen = mobileMenu.classList.contains('is-open');
            console.log('[MobileMenu] Current state:', isCurrentlyOpen ? 'open' : 'closed');
            
            if (isCurrentlyOpen) {
                console.log('[MobileMenu] Closing menu');
                closeMenu();
            } else {
                console.log('[MobileMenu] Opening menu');
                openMenu();
            }
            
            // 状態を再確認
            console.log('[MobileMenu] After toggle - is-open:', mobileMenu.classList.contains('is-open'));
        }, true); // capture phaseで実行して他のハンドラーより先に処理

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
        const setupSubmenuToggles = () => {
            const submenuToggles = mobileMenu.querySelectorAll('.mobile-menu__link--toggle');
            console.log('[MobileMenu] Found submenu toggles:', submenuToggles.length);
            
            submenuToggles.forEach((toggleBtn, index) => {
                // 既存のイベントリスナーを削除（重複防止）
                const newToggleBtn = toggleBtn.cloneNode(true);
                toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
                
                newToggleBtn.addEventListener('click', (e) => {
                    console.log('[MobileMenu] Submenu toggle clicked:', index);
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    const item = newToggleBtn.closest('.mobile-menu__item');
                    if (!item) {
                        console.warn('[MobileMenu] Parent item not found');
                        return;
                    }

                    const isOpen = item.classList.contains('is-open');
                    console.log('[MobileMenu] Submenu current state:', isOpen ? 'open' : 'closed');
                    
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
                        console.log('[MobileMenu] Closing submenu');
                        item.classList.remove('is-open');
                        newToggleBtn.setAttribute('aria-expanded', 'false');
                    } else {
                        console.log('[MobileMenu] Opening submenu');
                        item.classList.add('is-open');
                        newToggleBtn.setAttribute('aria-expanded', 'true');
                    }
                    
                    // 状態を再確認
                    console.log('[MobileMenu] Submenu after toggle - is-open:', item.classList.contains('is-open'));
                }, true); // capture phaseで実行
            });
        };
        
        // 初期化時にサブメニュートグルを設定
        setupSubmenuToggles();

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
