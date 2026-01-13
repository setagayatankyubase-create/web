// ===== メガメニュー（Service）ホバー安定化処理 =====
window.initMegaMenu = function initMegaMenu() {
    // ヘッダーが読み込まれるまで待つ
    const init = () => {
        const megaItems = document.querySelectorAll('.gnav-item--has-mega');
        if (megaItems.length === 0) {
            // ヘッダーがまだ読み込まれていない場合、少し待って再試行
            setTimeout(init, 100);
            return;
        }

        megaItems.forEach((item) => {
            const mega = item.querySelector('.mega');
            if (!mega) return;

            let openTimer = null;
            let closeTimer = null;
            const isMobile = window.matchMedia('(max-width: 960px)').matches;

            const open = () => {
                clearTimeout(closeTimer);
                clearTimeout(openTimer);
                openTimer = setTimeout(() => {
                    item.classList.add('is-open');
                }, 80); // 誤爆防止のための遅延
            };

            const close = () => {
                clearTimeout(openTimer);
                clearTimeout(closeTimer);
                closeTimer = setTimeout(() => {
                    item.classList.remove('is-open');
                }, 200); // パネルへ移動する間の猶予
            };

            // PC: ホバー処理
            if (!isMobile) {
                item.addEventListener('mouseenter', open);
                item.addEventListener('mouseleave', close);
                mega.addEventListener('mouseenter', () => clearTimeout(closeTimer));
                mega.addEventListener('mouseleave', close);
            }

            // キーボード対応
            item.addEventListener('focusin', open);
            item.addEventListener('focusout', (e) => {
                // フォーカスがメガメニュー内に移動する場合は閉じない
                if (!item.contains(e.relatedTarget)) {
                    close();
                }
            });

            // モバイル: クリックで開閉
            if (isMobile) {
                const link = item.querySelector('.gnav-link');
                if (link) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        item.classList.toggle('is-open');
                    });
                }
            }
        });

        // Escキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                megaItems.forEach((item) => {
                    item.classList.remove('is-open');
                });
            }
        });

        // 外側クリックで閉じる（モバイル用）
        document.addEventListener('click', (e) => {
            if (window.matchMedia('(max-width: 960px)').matches) {
                const wrap = e.target.closest('.gnav-item--has-mega');
                if (!wrap) {
                    megaItems.forEach((item) => {
                        item.classList.remove('is-open');
                    });
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
