// ===== メガメニュー（Service）ホバー安定化処理（Netyear風） =====
// 読み込み確認ログ
console.log('[MegaMenu] loaded on', location.pathname);

window.initMegaMenu = function initMegaMenu() {
    let closeTimer = null;
    let currentItem = null; // 現在ホバー中のitemを状態として保持
    let isInitialized = false; // イベントリスナーの重複登録を防ぐ
    
    // backdrop/overlayを毎回再取得（DOM差し替え対応）
    const getOrCreateBackdrop = () => {
        let backdrop = document.querySelector('.mega-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'mega-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');
            document.body.appendChild(backdrop);
        }
        return backdrop;
    };
    
    const getOrCreateOverlay = () => {
        let overlay = document.querySelector('.mega-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mega-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            document.body.appendChild(overlay);
        }
        return overlay;
    };
    
    // 全メニューを閉じる関数
    const closeAll = (delay = 300) => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            const megaItems = document.querySelectorAll('.gnav-item--has-mega');
            megaItems.forEach((item) => {
                item.classList.remove('is-open');
                const trigger = item.querySelector('.gnav-link[aria-haspopup="true"]');
                if (trigger) {
                    trigger.setAttribute('aria-expanded', 'false');
                }
            });
            const backdrop = getOrCreateBackdrop();
            const overlay = getOrCreateOverlay();
            backdrop.classList.remove('is-open');
            overlay.classList.remove('is-open');
            document.body.classList.remove('is-mega-open');
            currentItem = null;
        }, delay);
    };

    // メニューを開く関数
    const openItem = (item) => {
        clearTimeout(closeTimer);
        
        // 他のメニューを閉じる
        const megaItems = document.querySelectorAll('.gnav-item--has-mega');
        megaItems.forEach((i) => {
            if (i !== item) {
                i.classList.remove('is-open');
                const trigger = i.querySelector('.gnav-link[aria-haspopup="true"]');
                if (trigger) {
                    trigger.setAttribute('aria-expanded', 'false');
                }
            }
        });
        
        item.classList.add('is-open');
        const trigger = item.querySelector('.gnav-link[aria-haspopup="true"]');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'true');
        }
        
        const backdrop = getOrCreateBackdrop();
        const overlay = getOrCreateOverlay();
        backdrop.classList.add('is-open');
        overlay.classList.add('is-open');
        document.body.classList.add('is-mega-open');
        
        currentItem = item; // 現在のitemを更新
        
        // PC: Serviceリンク基準でパネル位置を計算
        const mega = item.querySelector('.mega');
        const isMobile = window.matchMedia('(max-width: 960px)').matches;
        if (mega && !isMobile && trigger) {
            // パネルの幅を計測（一時的に表示して計測）
            mega.style.position = 'fixed';
            mega.style.visibility = 'hidden';
            mega.style.opacity = '0';
            mega.style.display = 'block';
            mega.style.pointerEvents = 'none';
            
            const panelWidth = mega.offsetWidth || mega.getBoundingClientRect().width || Math.min(1040, window.innerWidth - 48);
            
            // トリガーとメインヘッダーの位置を取得
            const triggerRect = trigger.getBoundingClientRect();
            // メインヘッダーを取得（複数の方法で試行）
            const headerMain = document.querySelector('.header__main') || 
                              document.querySelector('.header > div:first-child') ||
                              document.querySelector('.header');
            const headerMainRect = headerMain?.getBoundingClientRect();
            
            // CSS変数から値を取得
            const GAP = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mega-gap')) || 0;
            const X_OFFSET = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mega-x-offset')) || 0;
            
            // 位置を計算（画面中央に配置）
            const screenCenterX = window.innerWidth / 2;
            const left = Math.max(24, Math.min(screenCenterX - panelWidth / 2 + X_OFFSET, window.innerWidth - panelWidth - 24));
            // メインヘッダーが見つからない場合はトリガーの位置を使用
            const top = (headerMainRect ? headerMainRect.bottom : triggerRect.bottom) + GAP;
            
            // 位置を設定
            mega.style.setProperty('left', left + 'px', 'important');
            mega.style.setProperty('top', top + 'px', 'important');
            
            // 計測用スタイルを削除（CSSクラスで表示制御）
            mega.style.removeProperty('display');
            mega.style.removeProperty('visibility');
            mega.style.removeProperty('opacity');
            mega.style.removeProperty('pointer-events');
        }
    };

    // パネル位置を更新する関数（PCのみ）
    const updateMegaPosition = (item) => {
        const mega = item.querySelector('.mega');
        const trigger = item.querySelector('.gnav-link');
        const isMobile = window.matchMedia('(max-width: 960px)').matches;
        
        if (!mega || !trigger || isMobile || !item.classList.contains('is-open')) {
            return;
        }
        
        // トリガー（Serviceリンク）の位置を取得
        const triggerRect = trigger.getBoundingClientRect();
        
        // GAPをCSS変数から取得（フォールバック: 0px）
        const GAP = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mega-gap')) || 0;
        
        // メインヘッダー要素を取得（お知らせバーは除外、複数の方法で試行）
        const headerMain = document.querySelector('.header__main') || 
                          document.querySelector('.header > div:first-child') ||
                          document.querySelector('.header');
        const headerMainRect = headerMain?.getBoundingClientRect();
        
        // XオフセットをCSS変数から取得（フォールバック: 0px）
        const X_OFFSET = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mega-x-offset')) || 0;
        
        // パネルの幅を取得（既に表示されているのでそのまま取得可能）
        const panelWidth = mega.getBoundingClientRect().width || mega.offsetWidth || Math.min(1040, window.innerWidth - 48);
        
        // 位置を計算（画面中央に配置）
        const screenCenterX = window.innerWidth / 2;
        const left = Math.max(24, Math.min(screenCenterX - panelWidth / 2 + X_OFFSET, window.innerWidth - panelWidth - 24));
        const top = (headerMainRect ? headerMainRect.bottom : triggerRect.bottom) + GAP;
        
        // 位置を設定（!importantでCSSを上書き）
        mega.style.setProperty('left', left + 'px', 'important');
        mega.style.setProperty('top', top + 'px', 'important');
    };

    // イベントリスナーの登録（1回のみ）
    const setupEventListeners = () => {
        if (isInitialized) return; // 既に登録済みならスキップ
        isInitialized = true;
        
        const isMobile = window.matchMedia('(max-width: 960px)').matches;
        
        if (!isMobile) {
            // PC: mouseover/mouseoutでイベント委譲
            document.addEventListener('mouseover', (e) => {
                const item = e.target.closest('.gnav-item--has-mega');
                if (!item) return;
                
                const mega = item.querySelector('.mega');
                if (!mega) return;
                
                // 同じitem内の移動は無視
                if (item === currentItem) {
                    clearTimeout(closeTimer);
                    return;
                }
                
                // 別itemに移動した場合
                if (currentItem && currentItem !== item) {
                    closeAll(0);
                    setTimeout(() => {
                        openItem(item);
                    }, 50);
                } else {
                    // 新規にホバー
                    clearTimeout(closeTimer);
                    openItem(item);
                }
            });
            
            document.addEventListener('mouseout', (e) => {
                const item = e.target.closest('.gnav-item--has-mega');
                if (!item) return;
                
                const mega = item.querySelector('.mega');
                if (!mega) return;
                
                const relatedTarget = e.relatedTarget;
                
                // マウスが同じitem内またはmegaパネル内に移動する場合は閉じない
                if (relatedTarget) {
                    const relatedItem = relatedTarget.closest('.gnav-item--has-mega');
                    if (relatedItem === item) {
                        return; // 同じitem内の移動
                    }
                    if (mega.contains(relatedTarget) || mega === relatedTarget) {
                        return; // megaパネル内への移動
                    }
                }
                
                // マウスが外に出た場合は遅延で閉じる
                closeAll(300);
            });
            
            // megaパネル内のmouseover/mouseoutも処理
            document.addEventListener('mouseover', (e) => {
                const mega = e.target.closest('.mega');
                if (!mega) return;
                
                const item = mega.closest('.gnav-item--has-mega');
                if (!item) return;
                
                // パネル内にマウスが入ったら閉じタイマーをキャンセル
                clearTimeout(closeTimer);
                if (!item.classList.contains('is-open')) {
                    openItem(item);
                }
            });
            
            document.addEventListener('mouseout', (e) => {
                const mega = e.target.closest('.mega');
                if (!mega) return;
                
                const item = mega.closest('.gnav-item--has-mega');
                if (!item) return;
                
                const relatedTarget = e.relatedTarget;
                
                // マウスが同じitem内に戻る場合は閉じない
                if (relatedTarget) {
                    const relatedItem = relatedTarget.closest('.gnav-item--has-mega');
                    if (relatedItem === item) {
                        return; // 同じitem内への戻り
                    }
                }
                
                // マウスが外に出た場合は遅延で閉じる
                closeAll(300);
            });
        }
        
        // キーボード対応（イベント委譲）
        document.addEventListener('focusin', (e) => {
            const item = e.target.closest('.gnav-item--has-mega');
            if (!item) return;
            
            const trigger = item.querySelector('.gnav-link[aria-haspopup="true"]');
            if (trigger && e.target === trigger) {
                openItem(item);
            }
        });
        
        document.addEventListener('focusout', (e) => {
            const item = e.target.closest('.gnav-item--has-mega');
            if (!item) return;
            
            const relatedTarget = e.relatedTarget;
            // フォーカスがメガメニュー内に移動する場合は閉じない
            if (relatedTarget && item.contains(relatedTarget)) {
                return;
            }
            closeAll(180);
        });
        
        // モバイル: クリックで開閉（イベント委譲）
        if (isMobile) {
            document.addEventListener('click', (e) => {
                const item = e.target.closest('.gnav-item--has-mega');
                if (!item) return;
                
                const trigger = item.querySelector('.gnav-link[aria-haspopup="true"]');
                if (!trigger || !e.target.closest('.gnav-link')) return;
                
                e.preventDefault();
                if (item.classList.contains('is-open')) {
                    closeAll(0);
                } else {
                    openItem(item);
                }
            });
        }

        // backdrop/overlayクリックで閉じる（イベント委譲）
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mega-backdrop') || e.target.classList.contains('mega-overlay')) {
                closeAll(0);
            }
        });

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
        
        // スクロール・リサイズ時にパネル位置を更新（PCのみ）
        if (!isMobile) {
            let resizeTimer = null;
            const handleResize = () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    const megaItems = document.querySelectorAll('.gnav-item--has-mega');
                    megaItems.forEach((item) => {
                        if (item.classList.contains('is-open')) {
                            updateMegaPosition(item);
                        }
                    });
                }, 100);
            };
            
            window.addEventListener('scroll', () => {
                const megaItems = document.querySelectorAll('.gnav-item--has-mega');
                megaItems.forEach((item) => {
                    if (item.classList.contains('is-open')) {
                        updateMegaPosition(item);
                    }
                });
            }, { passive: true });
            
            window.addEventListener('resize', handleResize);
        }
    };
    
    // 初期化と診断ログ
    const init = () => {
        const megaItems = document.querySelectorAll('.gnav-item--has-mega');
        
        // 自己診断ログ：起動時の状態を確認
        const links = Array.from(megaItems).map(item => {
            const link = item.querySelector('.gnav-link');
            return {
                text: link?.textContent?.trim() || 'N/A',
                href: link?.href || 'N/A',
                hasMega: !!item.querySelector('.mega')
            };
        });
        
        console.log('[MegaMenu init]', {
            pathname: location.pathname,
            items: megaItems.length,
            links: links,
            backdrop: !!document.querySelector('.mega-backdrop'),
            overlay: !!document.querySelector('.mega-overlay')
        });
        
        // イベントリスナーを1回だけ登録
        setupEventListeners();
    };

    // 初期化トリガー：DOMContentLoaded / site:header-ready / MutationObserver
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // 既に読み込み済みの場合、少し待ってから初期化（partial読み込み待ち）
        setTimeout(init, 100);
    }

    // ヘッダー注入完了イベントをリッスン（renderContent.js/main.jsでヘッダー注入後に発火）
    document.addEventListener('site:header-ready', () => {
        console.log('[MegaMenu] site:header-ready event received');
        init();
    });

    // ヘッダーが動的に読み込まれた場合も対応（MutationObserver）
    const observer = new MutationObserver(() => {
        const megaItems = document.querySelectorAll('.gnav-item--has-mega');
        if (megaItems.length > 0) {
            console.log('[MegaMenu] DOM changed, re-initializing...');
            init();
            // 一度だけ実行するため、observerは切断しない（DOM差し替えに対応）
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
