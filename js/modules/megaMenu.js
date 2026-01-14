// ===== メガメニュー（Service）ホバー安定化処理（Netyear風） =====
window.initMegaMenu = function initMegaMenu() {
    // ヘッダーが読み込まれるまで待つ
    const init = () => {
        const megaItems = document.querySelectorAll('.gnav-item--has-mega');
        const overlay = document.querySelector('.mega-overlay');
        
        if (megaItems.length === 0) {
            // ヘッダーがまだ読み込まれていない場合、少し待って再試行
            setTimeout(init, 100);
            return;
        }

        let closeTimer = null;

        // 全メニューを閉じる関数
        const closeAll = (delay = 180) => {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => {
                megaItems.forEach((item) => {
                    item.classList.remove('is-open');
                });
                overlay?.classList.remove('is-open');
            }, delay);
        };

        // メニューを開く関数
        const openItem = (item) => {
            clearTimeout(closeTimer);
            // 他のメニューを閉じる
            megaItems.forEach((i) => {
                if (i !== item) {
                    i.classList.remove('is-open');
                }
            });
            item.classList.add('is-open');
            overlay?.classList.add('is-open');
        };

        megaItems.forEach((item) => {
            const mega = item.querySelector('.mega');
            const trigger = item.querySelector('.gnav-link');
            if (!mega || !trigger) return;

            const isMobile = window.matchMedia('(max-width: 960px)').matches;

            // PC: ホバー処理
            if (!isMobile) {
                item.addEventListener('mouseenter', () => openItem(item));
                item.addEventListener('mouseleave', () => closeAll(180));
                mega.addEventListener('mouseenter', () => clearTimeout(closeTimer));
                mega.addEventListener('mouseleave', () => closeAll(180));
            }

            // キーボード対応
            trigger.addEventListener('focus', () => openItem(item));
            item.addEventListener('focusout', (e) => {
                // フォーカスがメガメニュー内に移動する場合は閉じない
                if (!item.contains(e.relatedTarget)) {
                    closeAll(180);
                }
            });

            // モバイル: クリックで開閉
            if (isMobile) {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (item.classList.contains('is-open')) {
                        closeAll(0);
                    } else {
                        openItem(item);
                    }
                });
            }
        });

        // overlayクリックで閉じる
        overlay?.addEventListener('click', () => closeAll(0));

        // Escキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAll(0);
            }
        });

        // 外側クリックで閉じる（モバイル用）
        document.addEventListener('click', (e) => {
            if (window.matchMedia('(max-width: 960px)').matches) {
                const wrap = e.target.closest('.gnav-item--has-mega');
                if (!wrap) {
                    closeAll(0);
                }
            }
        });
    };

    // DOMContentLoaded時、またはヘッダー読み込み後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // 既に読み込み済みの場合、少し待ってから初期化（partial読み込み待ち）
        setTimeout(init, 100);
    }

    // ヘッダーが動的に読み込まれた場合も対応
    const observer = new MutationObserver(() => {
        const megaItems = document.querySelectorAll('.gnav-item--has-mega');
        if (megaItems.length > 0) {
            init();
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
