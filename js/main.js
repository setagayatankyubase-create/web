// ===== 共通ユーティリティ関数 =====
const Utils = {
    // リデュースモーションのチェック
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    
    // DOMContentLoadedの初期化ヘルパー
    onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    },
    
    // スクロール位置計算（ヘッダー高さを考慮）
    getScrollPosition(element, offset = 20) {
        const header = document.querySelector('.header');
        const headerHeight = header?.offsetHeight || 112;
        return element.getBoundingClientRect().top + window.pageYOffset - headerHeight - offset;
    },
    
    // ストレージアクセス（安全）
    storage: {
        session: {
            get(key) {
                try { return sessionStorage.getItem(key); } catch (e) { return null; }
            },
            set(key, val) {
                try { sessionStorage.setItem(key, val); } catch (e) {}
            }
        },
        local: {
            get(key) {
                try { return localStorage.getItem(key); } catch (e) { return null; }
            },
            set(key, val) {
                try { localStorage.setItem(key, val); } catch (e) {}
            }
        }
    }
};

// ===== ページ遷移アニメーション =====
(() => {
    if (Utils.prefersReducedMotion) return;
    
    if (document.body) {
        document.body.style.opacity = '0';
    }
    
    const fadeIn = () => {
        if (!document.body) return;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.classList.add('page-transition-in');
                setTimeout(() => {
                    document.body.classList.remove('page-transition-in');
                    document.body.style.opacity = '';
                }, 450);
            });
        });
    };
    
    Utils.onReady(fadeIn);
    
    // リンククリック時：フェードアウト
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        const isAnchor = href.startsWith('#');
        const isDownload = link.hasAttribute('download');
        const isBlank = link.getAttribute('target') === '_blank';
        const isMailto = href.startsWith('mailto:');
        const isTel = href.startsWith('tel:');
        const isJavaScript = href.startsWith('javascript:');
        const isData = href.startsWith('data:');
        
        // アンカーリンクの場合はスムーススクロール
        if (isAnchor) {
            const targetId = href.substring(1);
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    e.preventDefault();
                    window.scrollTo({
                        top: Utils.getScrollPosition(targetElement),
                        behavior: 'smooth'
                    });
                }
            }
            return;
        }
        
        if (isDownload || isBlank || isMailto || isTel || isJavaScript || isData) return;
        
        // 外部リンクの判定
        try {
            const url = new URL(link.href, window.location.href);
            const currentUrl = new URL(window.location.href);
            if (url.origin !== currentUrl.origin && href.startsWith('http')) return;
            if (url.pathname === currentUrl.pathname && !url.hash) return;
        } catch (err) {
            if (!href.match(/^[^/]/) && !href.startsWith('./') && !href.startsWith('../')) return;
        }
        
        if (link.closest('form') && link.type === 'submit') return;
        
        e.preventDefault();
        document.body.classList.add('page-transition-out');
        setTimeout(() => {
            window.location.href = link.href;
        }, 300);
    });
})();

// ===== 共通partial読み込み関数 =====
async function loadPartial(selector, url) {
    const target = document.querySelector(selector);
    if (!target) return;
    
    // パス解決: 絶対パス（/で始まる）を現在のページのパスに基づいて解決
    const currentPath = window.location.pathname;
    // ファイル名を除いたディレクトリパスを取得（例: /web/news/index.html -> /web/news/）
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '';
    
    // 複数のパス候補を試行
    const urlCandidates = [];
    
    if (url.startsWith('/')) {
        // GitHub Pagesプロジェクトサイト構造を考慮（/web/が含まれる場合）
        // 現在のパスが /web/ で始まる場合、partialsも /web/ で始まる必要がある
        if (currentPath.startsWith('/web/')) {
            // 候補1: /web/プレフィックス付きの絶対パス
            urlCandidates.push('/web' + url);
        }
        
        // 候補2: 絶対パスをそのまま試行（ローカルサーバーやユーザーサイトの場合）
        urlCandidates.push(url);
        
        // 候補3: 現在のディレクトリからの相対パスを計算
        // 現在のディレクトリの深さを計算（/web/news/ -> 深さ2）
        const depth = basePath.split('/').filter(p => p).length;
        const relativePath = '../'.repeat(depth) + url.substring(1); // 先頭の/を削除
        urlCandidates.push(relativePath);
        
        // 候補4: 先頭の/を削除した相対パス（ルートディレクトリから見た場合）
        urlCandidates.push(url.substring(1));
    } else {
        // 相対パスの場合
        // 現在のパスが /web/ で始まる場合、/web/ プレフィックスを追加
        if (currentPath.startsWith('/web/')) {
            // 候補1: /web/ プレフィックス付きの絶対パス
            urlCandidates.push('/web/' + url);
        }
        
        // 候補2: 現在のディレクトリからの相対パス（そのまま）
        urlCandidates.push(url);
        
        // 候補3: basePathからの相対パス（念のため）
        if (basePath) {
            urlCandidates.push(basePath + '/' + url);
        }
    }
    
    for (const candidateUrl of urlCandidates) {
        try {
            const response = await fetch(candidateUrl);
            if (response.ok) {
                target.innerHTML = await response.text();
                
                // partialsファイル内のリンクを相対パスに変換
                resolveRelativeLinks(target);
                
                return; // 成功したら終了
            }
        } catch (error) {
            // 次の候補を試す
            continue;
        }
    }
    
    // すべての候補が失敗した場合
    console.error(`Failed to load partial: ${url} (tried: ${urlCandidates.join(', ')})`);
}

// ===== partialsファイル内のリンクを相対パスに変換 =====
function resolveRelativeLinks(container) {
    if (!container) return;
    
    // 現在のページのパスからディレクトリレベルを計算
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(p => p);
    
    // ルートからの相対的な深さを計算
    // /web/index.html -> pathParts = ['web', 'index.html'] -> 深さ1（ルート直下）
    // /web/news/index.html -> pathParts = ['web', 'news', 'index.html'] -> 深さ2（news/配下）
    // /web/column/index.html -> pathParts = ['web', 'column', 'index.html'] -> 深さ2（column/配下）
    const depth = pathParts.length;
    
    // 必要な相対パスのプレフィックス（ルートからの深さが2以上の場合は../が必要）
    // depth=1（ルート直下）: プレフィックスなし
    // depth=2（news/またはcolumn/配下）: ../
    const prefix = depth > 1 ? '../' : '';
    
    // data-relative-link属性を持つリンクを処理
    const links = container.querySelectorAll('a[data-relative-link]');
    links.forEach(link => {
        let href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
            return; // 外部リンク、アンカー、メールリンクはスキップ
        }
        
        // 相対パスに変換
        link.setAttribute('href', prefix + href);
    });
}

// ===== ナビゲーションのis-activeクラス設定 =====
function setActiveNav() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    
    document.querySelectorAll(".header__nav a").forEach(link => {
        const href = link.getAttribute("href");
        if (!href) return;
        
        // Service リンクの特別処理：service.html と service-creative.html の両方で active にする
        if (link.classList.contains('gnav-link')) {
            // href に service.html が含まれるか、service-creative.html が含まれる場合
            const hrefLower = href.toLowerCase();
            if (hrefLower.includes('service.html') || hrefLower.includes('service-creative.html')) {
                if (currentFile === 'service.html' || currentFile === 'service-creative.html') {
                    link.classList.add("is-active");
                    return;
                } else {
                    link.classList.remove("is-active");
                    return;
                }
            }
        }
        
        // 絶対パスと現在のパスを正規化して比較
        const linkPath = href.startsWith('/') ? href : new URL(href, window.location.origin).pathname;
        const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath + 'index.html' : currentPath;
        const normalizedLinkPath = linkPath.endsWith('/') ? linkPath + 'index.html' : linkPath;
        
        // パスが一致する場合、または両方ともindex.htmlで終わる場合
        if (normalizedLinkPath === normalizedCurrentPath || 
            (normalizedLinkPath.endsWith('/index.html') && normalizedCurrentPath.endsWith('/index.html') && 
             normalizedLinkPath.replace('/index.html', '') === normalizedCurrentPath.replace('/index.html', ''))) {
            link.classList.add("is-active");
        } else {
            link.classList.remove("is-active");
        }
    });
}

// ===== DOMContentLoaded時の初期化 =====
Utils.onReady(async function() {
    console.log("[INIT] start");
    
    try {
    // ヘッダーとフッターを読み込む
    await loadPartial("#site-header", "partials/header.html");
    await loadPartial("#site-footer", "partials/footer.html");
    
    // CTAを読み込む（存在する場合のみ）
    const ctaContainer = document.querySelector("#site-cta");
    if (ctaContainer) {
        await loadPartial("#site-cta", "partials/cta.html");
    }
    
    // フッターとCTAのリンクも解決
    const footer = document.querySelector("#site-footer");
    if (footer) {
        resolveRelativeLinks(footer);
    }
    if (ctaContainer) {
        resolveRelativeLinks(ctaContainer);
    }
    
    setActiveNav();
    // ヘッダーのスクロール検知
    const header = document.querySelector('.header');
    if (header) {
        let ticking = false;
        const handleScroll = () => {
            const currentScroll = window.pageYOffset || window.scrollY;
            if (currentScroll > 20) {
                header.classList.add('is-scrolled', 'scrolled');
            } else {
                header.classList.remove('is-scrolled', 'scrolled');
            }
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(handleScroll);
                ticking = true;
            }
        });
        handleScroll();
    }
    
    // 現在のページにis-activeクラスを追加
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (!link.classList.contains('is-active')) {
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPath || (currentPath === '/' && linkPath.includes('index.html'))) {
                link.classList.add('is-active');
            }
        }
    });
    
    // フォーム送信処理（Contactページ用）
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            const messageArea = document.getElementById('form-message');
            
            if (!data.name || !data.email || !data.message) {
                if (messageArea) {
                    messageArea.textContent = '必須項目を入力してください。';
                    messageArea.className = 'form-message form-message--error';
                    messageArea.style.display = 'block';
                }
                return;
            }
            
            console.log('送信データ:', data);
            if (messageArea) {
                messageArea.textContent = 'お問い合わせありがとうございます。内容を確認次第、ご連絡いたします。';
                messageArea.className = 'form-message form-message--success';
                messageArea.style.display = 'block';
                contactForm.reset();
            }
        });
    }
    
    // おすすめプラン診断
    const diagnosisForm = document.querySelector('.diagnosis-form');
    if (diagnosisForm) {
        const submitBtn = diagnosisForm.querySelector('.diagnosis-submit');
        submitBtn.addEventListener('click', () => {
            const purpose = diagnosisForm.querySelector('input[name="purpose"]:checked');
            if (!purpose) {
                alert('すべての質問に答えてください。');
                return;
            }
            
            const targetId = purpose.getAttribute('data-target');
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: Utils.getScrollPosition(targetElement),
                        behavior: 'smooth'
                    });
                    targetElement.style.transition = 'box-shadow 0.3s ease';
                    targetElement.style.boxShadow = '0 0 0 4px rgba(47, 107, 255, 0.2)';
                    setTimeout(() => {
                        targetElement.style.boxShadow = '';
                    }, 2000);
                }
            }
        });
    }
    
    // ===== 初回ロード演出 =====
    (() => {
        const root = document.documentElement;
        const storage = Utils.storage.session;
        const isFirstVisit = !storage.get('visited');
        
        const setReady = () => {
            root.classList.remove('is-preload');
            root.classList.add('is-ready');
        };
        
        const startHeroAnimation = () => {
            root.classList.add('is-preload');
            root.classList.remove('is-ready');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        setReady();
                        storage.set('visited', '1');
                    }, 150);
                });
            });
        };
        
        if (Utils.prefersReducedMotion) {
            setReady();
            storage.set('visited', '1');
        } else if (isFirstVisit) {
            startHeroAnimation();
        } else {
            setReady();
        }
    })();
    
    // ===== スクロール出現アニメーション =====
    (() => {
        const revealElements = document.querySelectorAll('[data-anim="reveal"]');
        
        if (Utils.prefersReducedMotion) {
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
    })();
    
    // ===== フローティングCTA =====
    (() => {
        const cta = document.getElementById('floatingCta');
        if (!cta) return;
        
        const closeBtn = cta.querySelector('.floatingCta__close');
        const storage = Utils.storage.local;
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
    })();
    
    // ===== ニュース・コラムデータの描画 =====
    try {
        if (typeof window.renderNewsBlock === 'function') {
            await window.renderNewsBlock();
        }
        if (typeof window.renderTopColumns === 'function') {
            await window.renderTopColumns();
        }
        if (typeof window.renderColumnListPage === 'function') {
            await window.renderColumnListPage();
        }
        if (typeof window.renderPostContent === 'function') {
            await window.renderPostContent();
        }
    } catch (error) {
        console.error("[INIT ERROR] render functions:", error);
    }
    
    // ===== コラムページ：カテゴリフィルター（renderColumnListPage内で処理されるため、ここでは削除） =====
    // カテゴリフィルターは renderColumnListPage() 内で動的に生成・設定される
    } catch (error) {
        console.error("[INIT ERROR]", error);
    }
    
    console.log("[INIT] completed");
});

// ===== ヒーロータイピングアニメーション =====
(() => {
    const typingTitle = document.getElementById('hero-typing-title');
    if (!typingTitle) return;
    
    const typingLines = typingTitle.querySelectorAll('.typing-line');
    if (typingLines.length === 0) return;
    
    typingLines.forEach(line => line.textContent = '');
    
    let currentLineIndex = 0;
    let currentCharIndex = 0;
    const typingSpeed = 80;
    const lineDelay = 300;
    
    function typeNextChar() {
        if (currentLineIndex >= typingLines.length) return;
        
        const currentLine = typingLines[currentLineIndex];
        const targetText = currentLine.getAttribute('data-text');
        
        if (currentCharIndex < targetText.length) {
            currentLine.textContent = targetText.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            setTimeout(typeNextChar, typingSpeed);
        } else {
            currentLineIndex++;
            currentCharIndex = 0;
            if (currentLineIndex < typingLines.length) {
                setTimeout(typeNextChar, lineDelay);
            }
        }
    }
    
    Utils.onReady(() => setTimeout(typeNextChar, 500));
})();

// ===== 分子線（ネットワーク線）の共通追加 =====
(() => {
    if (window.location.pathname.includes('contact.html')) return;
    
    const svgPaths = [
        { d: "M80 80 L210 140 L180 260 L60 220 Z" },
        { d: "M250 120 L360 80 L420 160 L320 210 Z" },
        { d: "M130 320 L240 360 L210 460 L90 420 Z" }
    ];
    
    const svgNodes = [
        { cx: 80, cy: 80 }, { cx: 210, cy: 140 }, { cx: 180, cy: 260 }, { cx: 60, cy: 220 },
        { cx: 250, cy: 120 }, { cx: 360, cy: 80 }, { cx: 420, cy: 160 }, { cx: 320, cy: 210 },
        { cx: 130, cy: 320 }, { cx: 240, cy: 360 }, { cx: 210, cy: 460 }, { cx: 90, cy: 420 }
    ];
    
    function createNetLines(className) {
        const container = document.createElement('div');
        container.className = `net-lines ${className}`;
        container.setAttribute('aria-hidden', 'true');
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'net-lines__svg');
        svg.setAttribute('viewBox', '0 0 640 520');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        svgPaths.forEach(pathData => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'net-lines__path');
            path.setAttribute('d', pathData.d);
            svg.appendChild(path);
        });
        
        svgNodes.forEach(node => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'net-lines__node');
            circle.setAttribute('cx', node.cx);
            circle.setAttribute('cy', node.cy);
            circle.setAttribute('r', '6');
            svg.appendChild(circle);
        });
        
        container.appendChild(svg);
        return container;
    }
    
    function initNetLines() {
        document.querySelector('.net-lines:not(.net-lines--right)')?.remove();
        document.querySelectorAll('.net-lines--right').forEach(el => el.remove());
        
        document.body.appendChild(createNetLines('net-lines--left'));
        document.body.appendChild(createNetLines('net-lines--right net-lines--right-1'));
        document.body.appendChild(createNetLines('net-lines--right net-lines--right-2'));
    }
    
    Utils.onReady(initNetLines);
})();

// COMING SOONカードのクリックイベントを確実に抑止
document.addEventListener('click', function(e) {
    const target = e.target.closest('.service-card-item.is-coming-soon');
    if (target) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

// ===== メガメニュー（Service）ホバー安定化処理 =====
(function initMegaMenu() {
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
})();
