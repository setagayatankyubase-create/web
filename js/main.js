/* =================================================
   Main JavaScript（メイン初期化）
   common.js を先に読み込む必要があります
   ================================================= */

// Utils と共通関数は common.js から読み込まれる

// ===== ページ遷移アニメーション =====
(() => {
    if (Utils.prefersReducedMotion) return;
    
    // 初回訪問かどうかを判定（sessionStorageを使用）
    const storage = Utils.storage.session;
    const isFirstLoad = !storage.get('page-transition-shown');
    
    // 初回ロード時のフェードインアニメーション
    if (isFirstLoad) {
        if (document.body) {
            document.body.style.opacity = '0';
            document.body.style.willChange = 'opacity, transform';
        }
        
        const fadeIn = () => {
            if (!document.body) return;
            
            // より滑らかなアニメーションのために即座に開始
            requestAnimationFrame(() => {
                document.body.classList.add('page-transition-in');
                setTimeout(() => {
                    document.body.classList.remove('page-transition-in');
                    document.body.style.opacity = '';
                    document.body.style.willChange = '';
                    // stickyを機能させるためにoverflowを確実にリセット（body、ラッパー、htmlすべて）
                    const pt = document.querySelector('.page-transition-in');
                    if (pt) {
                        pt.style.overflow = '';
                        pt.style.overflowX = '';
                        pt.style.overflowY = '';
                    }
                    document.body.style.overflow = '';
                    document.body.style.overflowX = '';
                    document.body.style.overflowY = '';
                    document.documentElement.style.overflow = '';
                    document.documentElement.style.overflowX = '';
                    document.documentElement.style.overflowY = '';
                    
                    // 初回ロード完了を記録
                    storage.set('page-transition-shown', '1');
                }, 400);
            });
        };
        
        Utils.onReady(fadeIn);
    } else {
        // 2回目以降のロード時：シンプルなフェードイン
        if (document.body) {
            document.body.style.opacity = '0';
            document.body.classList.add('page-transition-in-simple');
            
            Utils.onReady(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        document.body.classList.add('loaded');
                        setTimeout(() => {
                            document.body.classList.remove('page-transition-in-simple', 'loaded');
                            document.body.style.opacity = '';
                            // stickyを機能させるためにoverflowを確実にリセット
                            document.body.style.overflow = '';
                            document.body.style.overflowX = '';
                            document.body.style.overflowY = '';
                            document.documentElement.style.overflow = '';
                            document.documentElement.style.overflowX = '';
                            document.documentElement.style.overflowY = '';
                        }, 300);
                    });
                });
            });
        }
    }
    
    // リンククリック時：2回目以降はシンプルなフェードアウト
    if (!isFirstLoad) {
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
            
            // シンプルなフェードアウト
            document.body.style.willChange = 'opacity';
            document.body.classList.add('page-transition-out');
            setTimeout(() => {
                window.location.href = link.href;
            }, 300);
        });
    } else {
        // 初回はアンカーリンクのスムーススクロールのみ
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
            const isAnchor = href.startsWith('#');
            
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
            }
        });
    }
})();

// loadPartial, resolveRelativeLinks, setActiveNav は common.js から読み込まれる

// ===== DOMContentLoaded時の初期化 =====
Utils.onReady(async function() {
    console.log("[INIT] start");
    
    try {
    // ヘッダーとフッターを読み込む
    await window.loadPartial("#site-header", "partials/header.html");
    await window.loadPartial("#site-footer", "partials/footer.html");
    
    // ヘッダー注入完了イベントを投げる（megaMenu.js用）
    document.dispatchEvent(new Event('site:header-ready'));
    
    // ヘッダー読み込み後、お知らせスクロールを描画
    if (typeof window.renderHeaderNews === 'function') {
        await window.renderHeaderNews();
    }
    
    // TOPページの重要なお知らせを描画
    if (typeof window.renderNoticeList === 'function') {
        await window.renderNoticeList();
    }
    
    // CTAを読み込む（存在する場合のみ）
    const ctaContainer = document.querySelector("#site-cta");
    if (ctaContainer) {
        await window.loadPartial("#site-cta", "partials/cta.html");
    }
    
    // フッターとCTAのリンクも解決
    const footer = document.querySelector("#site-footer");
    if (footer) {
        window.resolveRelativeLinks(footer);
    }
    if (ctaContainer) {
        window.resolveRelativeLinks(ctaContainer);
    }
    
    // スマホ版固定CTAをbody直下に追加
    if (!document.querySelector('.mobile-fixed-cta')) {
        const mobileFixedCta = document.createElement('div');
        mobileFixedCta.className = 'mobile-fixed-cta';
        mobileFixedCta.setAttribute('aria-label', 'お問い合わせ');
        
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '';
        const contactUrl = basePath ? `${basePath}/contact.html` : '/web/contact.html';
        
        mobileFixedCta.innerHTML = `<a href="${contactUrl}" class="mobile-fixed-cta__button">お問い合わせはこちら</a>`;
        document.body.appendChild(mobileFixedCta);
        
        // リンクを解決
        window.resolveRelativeLinks(mobileFixedCta);
        
        // スクロールで表示/非表示を制御
        if (window.matchMedia('(max-width: 959px)').matches) {
            let lastScrollY = window.scrollY;
            let ticking = false;
            
            const handleScroll = () => {
                const currentScrollY = window.scrollY;
                
                // 下にスクロールしたら出現（100px以上スクロール）
                if (currentScrollY > 100 && currentScrollY > lastScrollY) {
                    mobileFixedCta.classList.add('is-visible');
                }
                // 上にスクロールしたら消える、またはトップに近づいたら消える
                else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
                    mobileFixedCta.classList.remove('is-visible');
                }
                
                lastScrollY = currentScrollY;
                ticking = false;
            };
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(handleScroll);
                    ticking = true;
                }
            });
            
            // 初期状態をチェック
            handleScroll();
        }
    }
    
    window.setActiveNav();
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
    // DOMが完全に読み込まれてから実行（少し遅延を入れて確実に要素を取得）
    setTimeout(() => {
        if (typeof window.initScrollReveal === 'function') {
            window.initScrollReveal();
        } else {
            // フォールバック: scrollReveal.jsが読み込まれていない場合
            (() => {
                // 特定のページでは無効化
                const currentPath = window.location.pathname;
                const excludedPages = ['/law.html', '/privacy.html', '/contact.html', '/web/law.html', '/web/privacy.html', '/web/contact.html'];
                const isExcluded = excludedPages.some(page => currentPath.includes(page));
                
                if (isExcluded) {
                    return; // 除外ページではアニメーションを適用しない
                }
                
                // セクション要素を自動的に取得してアニメーションを適用
                const sections = document.querySelectorAll('main section.section');
                const sectionInners = document.querySelectorAll('main .section-inner > *:not(header):not(nav):not(.hero)');
                const cards = document.querySelectorAll('.card, .problem-card, .service-card-item, .flow-step, .top-service-row, .value-card, .service-card');
                const headings = document.querySelectorAll('.section-head:not(.hero .section-head), .page-hero-common__content');
                const valueCards = document.querySelectorAll('.value-card, .top-service-row');
                
                const existingElements = document.querySelectorAll('[data-anim]');
                const allElements = new Set();
                
                existingElements.forEach(el => allElements.add(el));
                sections.forEach(el => {
                    if (!el.classList.contains('hero') && !el.closest('.hero')) {
                        allElements.add(el);
                    }
                });
                sectionInners.forEach(el => allElements.add(el));
                cards.forEach(el => allElements.add(el));
                headings.forEach(el => allElements.add(el));
                valueCards.forEach(el => allElements.add(el));
                
                const heroSection = document.querySelector('.hero, .page-hero-common');
                if (heroSection) {
                    allElements.delete(heroSection);
                    const heroChildren = heroSection.querySelectorAll('*');
                    heroChildren.forEach(child => allElements.delete(child));
                }
                
                const elementsArray = Array.from(allElements);
                
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
                
                const revealElements = document.querySelectorAll('[data-anim]');
                
                if (revealElements.length === 0) {
                    console.warn('[ScrollReveal] No elements found for animation');
                    return;
                }
                
                if (Utils.prefersReducedMotion) {
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
                    const animType = element.getAttribute('data-anim') || 'reveal';
                    element.classList.add(`reveal--${animType}`);
                    observer.observe(element);
                });
            })();
        }
    }, 200); // 200ms遅延で確実にDOMが読み込まれてから実行
    
    // ===== ニュース・コラムデータの描画 =====
    try {
        // ヘッダーのお知らせスクロールは上で既に描画済み
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
        // body直下に追加された動的なnet-linesのみ削除（ページ内の既存net-linesは残す）
        document.querySelectorAll('body > .net-lines:not(.hero__net-lines)').forEach(el => el.remove());
        
        // 既存の動的net-linesを削除（left/rightクラスを持つもの）
        document.querySelectorAll('body > .net-lines--left, body > .net-lines--right').forEach(el => el.remove());
        
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
if (typeof window.initMegaMenu === 'function') {
    window.initMegaMenu();
}

// ===== モバイルメニュー（ハンバーガーメニュー）開閉処理 =====
if (typeof window.initMobileMenu === 'function') {
    window.initMobileMenu();
}

