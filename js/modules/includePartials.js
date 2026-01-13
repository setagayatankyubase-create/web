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
    document.querySelectorAll(".header__nav a").forEach(link => {
        const href = link.getAttribute("href");
        if (!href) return;
        
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

// ===== partial読み込み初期化 =====
window.initPartials = async function initPartials() {
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
}
