// ===== ニュース・コラムデータの描画 =====

console.log("[BOOT]", location.pathname, "baseURI:", document.baseURI);

// カテゴリスラッグと表示名のマッピング（フォールバック用）
const categorySlugMap = {
    'notice': 'お知らせ',
    'topics': 'トピックス',
    'seminar': 'セミナー'
};

// カテゴリ名からスラッグを取得（categorySlugがない場合のフォールバック）
function getCategorySlug(item) {
    // カテゴリ名から確実にスラッグを取得（優先）
    const categoryToSlugMap = {
        'お知らせ': 'notice',
        'トピックス': 'topics',
        'セミナー': 'seminar'
    };
    
    // デバッグ用：データの確認
    if (!item.category) {
        console.warn("[getCategorySlug] item.category is missing:", item);
    }
    
    // カテゴリ名からスラッグを取得（確実に正しいスラッグを返す）
    if (item.category && categoryToSlugMap[item.category]) {
        const slug = categoryToSlugMap[item.category];
        return slug;
    }
    
    // categorySlugが存在し、かつ正しい値の場合のみ使用
    if (item.categorySlug && (item.categorySlug === 'notice' || item.categorySlug === 'topics' || item.categorySlug === 'seminar')) {
        return item.categorySlug;
    }
    
    // フォールバック
    console.warn("[getCategorySlug] fallback used for item:", item.title, "category:", item.category, "categorySlug:", item.categorySlug);
    return item.category ? categoryToSlugMap[item.category] || item.category.toLowerCase().replace(/\s+/g, '-') : 'notice';
}

// スラッグからカテゴリ名を取得
function getCategoryName(slug, items) {
    const item = items.find(i => getCategorySlug(i) === slug);
    return item ? item.category : slug;
}

// JSONファイルのパスを階層に依存しない形で解決
function getJsonPath(filename) {
    // 現在のページのパスから、webディレクトリのルートを特定
    const currentPath = window.location.pathname;
    
    // パスを分割（web/ ディレクトリ内のページから見た階層を計算）
    // ファイル名（.htmlで終わるもの）は除外して、ディレクトリ階層のみを計算
    const pathParts = currentPath.split('/').filter(p => {
        if (!p) return false;
        // index.html は除外
        if (p === 'index.html') return false;
        // .html で終わるファイル名は除外（ディレクトリ階層のみをカウント）
        if (p.endsWith('.html')) return false;
        return true;
    });
    
    // web/ ディレクトリ内のページから見た場合、web/ 自体は階層に含めない
    // /web/index.html -> pathParts: ['web'] -> web/ 直下 -> ''
    // /web/about.html -> pathParts: ['web'] -> web/ 直下 -> ''
    // /web/news/index.html -> pathParts: ['web', 'news'] -> news/ 配下 -> '../'
    // /web/news/post.html -> pathParts: ['web', 'news'] -> news/ 配下 -> '../'
    // /web/column/index.html -> pathParts: ['web', 'column'] -> column/ 配下 -> '../'
    
    let basePath = '';
    // web/ 以外のディレクトリがある場合（news/, column/ など）は ../ を追加
    if (pathParts.length > 1 && pathParts[0] === 'web') {
        // web/ 配下で、さらにサブディレクトリがある場合
        basePath = '../';
    }
    // pathParts.length <= 1 または web/ 直下の場合は basePath は空文字列
    
    // キャッシュバスティング用のタイムスタンプを追加（開発時のみ）
    const timestamp = Date.now();
    const jsonPath = `${basePath}assets/data/${filename}?v=${timestamp}`;
    console.log("[getJsonPath] currentPath:", currentPath, "pathParts:", pathParts, "basePath:", basePath, "result:", jsonPath);
    return jsonPath;
}

// ニュースリンクURLを生成（ページ階層に応じて適切なパスを返す）
function getNewsLinkUrl(itemUrl) {
    const currentPath = window.location.pathname;
    
    // パスを分割して階層の深さを計算（ファイル名は除外）
    const pathParts = currentPath.split('/').filter(p => {
        if (!p) return false;
        if (p === 'index.html') return false;
        if (p.endsWith('.html')) return false;
        return true;
    });
    
    // web/ ディレクトリ内のページから見た階層の深さ
    // /web/index.html -> pathParts: ['web'] -> depth = 1 -> web/ 直下
    // /web/about.html -> pathParts: ['web'] -> depth = 1 -> web/ 直下
    // /web/news/index.html -> pathParts: ['web', 'news'] -> depth = 2 -> news/ 配下
    // /web/news/post.html -> pathParts: ['web', 'news'] -> depth = 2 -> news/ 配下
    const depth = pathParts.length;
    
    // news/post.html 形式のURLを現在のページの階層に応じて調整
    if (itemUrl.startsWith('news/')) {
        if (depth > 1) {
            // news/ や column/ 配下など、深い階層の場合
            // news/ ページ内の場合は news/ プレフィックスを削除
            if (currentPath.includes('/news/')) {
                return itemUrl.replace('news/', '');
            }
            // その他の深い階層（column/ など）の場合は ../ を追加
            return '../' + itemUrl;
        }
        // depth <= 1 の場合はそのまま（web/ 直下のページ）
        return itemUrl;
    } else if (!itemUrl.startsWith('../') && !itemUrl.startsWith('http') && !itemUrl.startsWith('/')) {
        // その他の相対パスの場合も同様に調整
        if (depth > 1) {
            return '../' + itemUrl;
        }
        return itemUrl;
    }
    
    return itemUrl;
}

// コラムリンクURLを生成
function getColumnLinkUrl(itemUrl) {
    const currentPath = window.location.pathname;
    const isColumnPage = currentPath.includes('/column/') && !currentPath.includes('/post.html');
    
    if (isColumnPage) {
        // COLUMNページからは、column/プレフィックスを削除
        if (itemUrl.startsWith('column/')) {
            return itemUrl.replace('column/', '');
        }
        return itemUrl;
    } else {
        // TOPページからはそのまま
        return itemUrl;
    }
}

/**
 * ニュースデータを描画（TOPページ・NEWSページ共通）
 */
async function renderNewsBlock() {
    console.log("[renderNewsBlock] start");
    
    const listContainers = document.querySelectorAll('.news-list');
    if (listContainers.length === 0) {
        console.log("[renderNewsBlock] no containers found");
        return;
    }
    
    const jsonPath = getJsonPath('news.json');
    console.log("[FETCH] url:", jsonPath);
    console.log("[FETCH] resolved:", new URL('assets/data/news.json', document.baseURI).toString());
    
    try {
        const response = await fetch(jsonPath);
        console.log("[FETCH] status:", response.status, response.url);
        
        if (!response.ok) {
            throw new Error("Fetch failed: " + response.status + " " + response.url);
        }
        
        const newsData = await response.json();
        console.log("[renderNewsBlock] loaded", newsData.length, "items");
        
        // URLパラメータからカテゴリフィルタとタグフィルタを取得
        const urlParams = new URLSearchParams(window.location.search);
        const filterCategorySlug = urlParams.get('category');
        const filterTag = urlParams.get('tag');
        
        // カテゴリスラッグでフィルタリング
        let filteredData = newsData;
        if (filterCategorySlug) {
            filteredData = filteredData.filter(item => getCategorySlug(item) === filterCategorySlug);
            console.log("[renderNewsBlock] filtered by category slug:", filterCategorySlug, "items:", filteredData.length);
        }
        
        // タグでフィルタリング
        if (filterTag) {
            filteredData = filteredData.filter(item => {
                if (!item.tags || !Array.isArray(item.tags)) return false;
                return item.tags.some(tag => tag === filterTag);
            });
            console.log("[renderNewsBlock] filtered by tag:", filterTag, "items:", filteredData.length);
        }
        
        // 各ニュースリストに対して処理
        listContainers.forEach((listContainer, containerIndex) => {
            // テンプレート要素を取得
            const template = listContainer.querySelector('.news-item[data-template="news-item"]');
            if (!template) {
                console.warn("[renderNewsBlock] template not found in container", containerIndex);
                return;
            }
            
            // 親要素を取得
            const parent = template.parentElement;
            
            // 既存の要素をクリア（テンプレート以外）
            const existingItems = listContainer.querySelectorAll('.news-item:not([data-template="news-item"])');
            existingItems.forEach(item => item.remove());
            
            // テンプレートを非表示にする（または削除）
            template.style.display = 'none';
            
            // セクションタイプを判定
            let sectionType = 'all'; // デフォルトはすべて
            
            // まず、現在のページパスから判定（優先）
            const currentPath = window.location.pathname;
            if (currentPath.includes('/press.html')) {
                sectionType = 'releases';
            } else if (currentPath.includes('/topics.html')) {
                sectionType = 'topics';
            } else if (currentPath.includes('/seminar.html')) {
                sectionType = 'seminar';
            } else {
                // ページパスで判定できない場合、親セクションのbadgeテキストから判定
                const section = listContainer.closest('.news-block');
                if (section) {
                    const badge = section.querySelector('.section-head__badge');
                    if (badge) {
                        const badgeText = badge.textContent.trim().toUpperCase();
                        if (badgeText === 'RELEASES') {
                            sectionType = 'releases';
                        } else if (badgeText === 'TOPICS') {
                            sectionType = 'topics';
                        } else if (badgeText === 'SEMINAR') {
                            sectionType = 'seminar';
                        }
                    }
                }
            }
            
            // セクションタイプとカテゴリでフィルタリング
            // タグフィルターが適用されたfilteredDataを使用
            let sectionFilteredData = filteredData;
            
            // セクションタイプをカテゴリスラッグにマッピング
            const sectionTypeToCategorySlug = {
                'releases': 'notice',  // RELEASES → お知らせ
                'topics': 'topics',    // TOPICS → トピックス
                'seminar': 'seminar'   // SEMINAR → セミナー
            };
            
            console.log("[renderNewsBlock] sectionType:", sectionType, "filterCategorySlug:", filterCategorySlug, "filterTag:", filterTag);
            
            // URLパラメータのカテゴリフィルタを優先
            if (filterCategorySlug) {
                // URLパラメータで指定されたカテゴリでフィルタリング（タグフィルターは既に適用済み）
                sectionFilteredData = sectionFilteredData.filter(item => getCategorySlug(item) === filterCategorySlug);
                console.log("[renderNewsBlock] filtered by URL param category:", filterCategorySlug, "items:", sectionFilteredData.length);
            } else if (sectionType !== 'all') {
                // セクションタイプに基づいてカテゴリでフィルタリング
                const categorySlugForSection = sectionTypeToCategorySlug[sectionType];
                if (categorySlugForSection) {
                    console.log("[renderNewsBlock] filtering by section type:", sectionType, "category:", categorySlugForSection);
                    console.log("[renderNewsBlock] before filter - items:", sectionFilteredData.length);
                    sectionFilteredData = sectionFilteredData.filter(item => {
                        const itemCategorySlug = getCategorySlug(item);
                        const matches = itemCategorySlug === categorySlugForSection;
                        if (!matches) {
                            console.log("[renderNewsBlock] filtered out:", item.title, "item.category:", item.category, "item.categorySlug:", item.categorySlug, "resolved slug:", itemCategorySlug, "expected:", categorySlugForSection);
                        }
                        return matches;
                    });
                    console.log("[renderNewsBlock] after filter - items:", sectionFilteredData.length);
                }
            }
            
            // JSONデータから要素を生成（フィルタリング済みデータを使用）
            sectionFilteredData.forEach((item) => {
                const clone = template.cloneNode(true);
                clone.removeAttribute('data-template');
                clone.style.display = ''; // テンプレートのdisplay:noneを解除
                
                // 日付のフォーマット（YYYY-MM-DD -> YYYY.MM.DD）
                const formattedDate = item.date.replace(/-/g, '.');
                
                const timeEl = clone.querySelector('.news-date');
                if (timeEl) {
                    timeEl.setAttribute('datetime', item.date);
                    timeEl.textContent = formattedDate;
                } else {
                    console.warn("[renderNewsBlock] .news-date not found");
                }
                
                const linkEl = clone.querySelector('.news-title');
                if (linkEl) {
                    const url = getNewsLinkUrl(item.url);
                    linkEl.setAttribute('href', url);
                    linkEl.textContent = item.title;
                    console.log("[renderNewsBlock] link set:", url, "title:", item.title);
                } else {
                    console.warn("[renderNewsBlock] .news-title not found");
                }
                
                const catEl = clone.querySelector('.news-cat');
                if (catEl && !catEl.textContent.trim()) {
                    // カテゴリが空の場合のみ設定（既に設定されている場合は上書きしない）
                    // セクションタイプに応じてカテゴリを設定
                    if (sectionType === 'topics') {
                        catEl.textContent = 'Topics';
                    } else if (sectionType === 'seminar') {
                        catEl.textContent = 'Seminar';
                    } else {
                        catEl.textContent = 'News Releases';
                    }
                }
                
                parent.appendChild(clone);
            });
        });
        
        console.log("[renderNewsBlock] completed");
    } catch (error) {
        console.error('[renderNewsBlock] Error loading news.json:', error);
    }
}

/**
 * コラムデータを描画（TOPページ用）
 */
async function renderTopColumns() {
    console.log("[renderTopColumns] start");
    
    const gridContainer = document.querySelector('.top-column__grid');
    if (!gridContainer) {
        console.log("[renderTopColumns] container not found");
        return;
    }
    
    const jsonPath = getJsonPath('columns.json');
    console.log("[FETCH] url:", jsonPath);
    
    try {
        const response = await fetch(jsonPath);
        console.log("[FETCH] status:", response.status, response.url);
        
        if (!response.ok) {
            throw new Error("Fetch failed: " + response.status + " " + response.url);
        }
        
        const columnsData = await response.json();
        const displayData = columnsData.slice(0, 3); // 最新3件のみ
        console.log("[renderTopColumns] loaded", displayData.length, "items");
        
        // テンプレート要素を取得
        const template = gridContainer.querySelector('.top-post[data-template="top-post"]');
        if (!template) {
            console.warn("[renderTopColumns] template not found");
            return;
        }
        
        // 既存の要素をクリア（テンプレート以外）
        const existingPosts = gridContainer.querySelectorAll('.top-post:not([data-template="top-post"])');
        existingPosts.forEach(post => post.remove());
        
        // テンプレートを非表示にする
        template.style.display = 'none';
        
        // JSONデータから要素を生成
        displayData.forEach((item) => {
            const clone = template.cloneNode(true);
            clone.removeAttribute('data-template');
            clone.style.display = ''; // テンプレートのdisplay:noneを解除
            
            // 日付のフォーマット（YYYY-MM-DD -> YYYY.MM.DD）
            const formattedDate = item.date.replace(/-/g, '.');
            
            // 画像パスの調整（TOPページからの相対パス）
            let imagePath = item.image;
            if (!imagePath.startsWith('assets/') && !imagePath.startsWith('../')) {
                imagePath = `assets/img/${imagePath}`;
            }
            
            const linkEl = clone.querySelector('.top-post__link');
            if (linkEl) {
                const url = getColumnLinkUrl(item.url);
                linkEl.setAttribute('href', url);
                console.log("[renderTopColumns] link set:", url);
            } else {
                console.warn("[renderTopColumns] .top-post__link not found");
            }
            
            const imgEl = clone.querySelector('.top-post__media img');
            if (imgEl) {
                imgEl.setAttribute('src', imagePath);
                imgEl.setAttribute('alt', item.alt || item.title);
            } else {
                console.warn("[renderTopColumns] .top-post__media img not found");
            }
            
            const catEl = clone.querySelector('.top-post__cat');
            if (catEl) {
                catEl.textContent = item.category;
            }
            
            const dateEl = clone.querySelector('.top-post__date');
            if (dateEl) {
                dateEl.setAttribute('datetime', item.date);
                dateEl.textContent = formattedDate;
            }
            
            const headingEl = clone.querySelector('.top-post__heading');
            if (headingEl) {
                headingEl.textContent = item.title;
            }
            
            const excerptEl = clone.querySelector('.top-post__excerpt');
            if (excerptEl) {
                excerptEl.textContent = item.excerpt || '';
            }
            
            gridContainer.appendChild(clone);
        });
        
        console.log("[renderTopColumns] completed");
    } catch (error) {
        console.error('[renderTopColumns] Error loading columns.json:', error);
    }
}

/**
 * コラム一覧ページのデータを描画
 */
async function renderColumnListPage() {
    console.log("[renderColumnListPage] start");
    
    const gridContainer = document.querySelector('.column-list-page__grid');
    if (!gridContainer) {
        console.log("[renderColumnListPage] container not found");
        return;
    }
    
    const jsonPath = getJsonPath('columns.json');
    console.log("[FETCH] url:", jsonPath);
    
    try {
        const response = await fetch(jsonPath);
        console.log("[FETCH] status:", response.status, response.url);
        
        if (!response.ok) {
            throw new Error("Fetch failed: " + response.status + " " + response.url);
        }
        
        const columnsData = await response.json();
        console.log("[renderColumnListPage] loaded", columnsData.length, "items");
        
        // URLパラメータからカテゴリフィルタとタグフィルタを取得
        const urlParams = new URLSearchParams(window.location.search);
        const filterCategorySlug = urlParams.get('category');
        const filterTag = urlParams.get('tag');
        
        // カテゴリスラッグでフィルタリング
        let filteredData = columnsData;
        if (filterCategorySlug) {
            filteredData = filteredData.filter(item => getCategorySlug(item) === filterCategorySlug);
            console.log("[renderColumnListPage] filtered by category slug:", filterCategorySlug, "items:", filteredData.length);
        }
        
        // タグでフィルタリング
        if (filterTag) {
            filteredData = filteredData.filter(item => {
                if (!item.tags || !Array.isArray(item.tags)) return false;
                return item.tags.some(tag => tag === filterTag);
            });
            console.log("[renderColumnListPage] filtered by tag:", filterTag, "items:", filteredData.length);
        }
        
        // テンプレート要素を取得
        const template = gridContainer.querySelector('.column-list-page__card[data-template="column-card"]');
        if (!template) {
            console.warn("[renderColumnListPage] template not found");
            return;
        }
        
        // 既存の要素をクリア（テンプレート以外）
        const existingCards = gridContainer.querySelectorAll('.column-list-page__card:not([data-template="column-card"])');
        existingCards.forEach(card => card.remove());
        
        // テンプレートを非表示にする
        template.style.display = 'none';
        
        // JSONデータから要素を生成（フィルタリング済みデータを使用）
        filteredData.forEach((item) => {
            const clone = template.cloneNode(true);
            clone.removeAttribute('data-template');
            clone.style.display = ''; // テンプレートのdisplay:noneを解除
            clone.setAttribute('data-category', item.category);
            
            // 日付のフォーマット（YYYY-MM-DD -> YYYY.MM.DD）
            const formattedDate = item.date.replace(/-/g, '.');
            
            // 画像パスの調整（コラムページからの相対パス）
            let imagePath = item.image;
            if (!imagePath.startsWith('../') && !imagePath.startsWith('assets/')) {
                imagePath = `../${imagePath}`;
            } else if (imagePath.startsWith('assets/')) {
                imagePath = `../${imagePath}`;
            }
            
            const imgEl = clone.querySelector('.column-list-page__media img');
            if (imgEl) {
                imgEl.setAttribute('src', imagePath);
                imgEl.setAttribute('alt', item.alt || item.title);
            } else {
                console.warn("[renderColumnListPage] .column-list-page__media img not found");
            }
            
            const categoryEl = clone.querySelector('.column-list-page__category');
            if (categoryEl) {
                categoryEl.textContent = item.category;
            }
            
            const dateEl = clone.querySelector('.column-list-page__date');
            if (dateEl) {
                dateEl.textContent = formattedDate;
            }
            
            const titleLinkEl = clone.querySelector('.column-list-page__title a');
            if (titleLinkEl) {
                const url = getColumnLinkUrl(item.url);
                titleLinkEl.setAttribute('href', url);
                titleLinkEl.textContent = item.title;
                console.log("[renderColumnListPage] link set:", url, "title:", item.title);
            } else {
                console.warn("[renderColumnListPage] .column-list-page__title a not found");
            }
            
            const leadEl = clone.querySelector('.column-list-page__lead');
            if (leadEl) {
                leadEl.textContent = item.excerpt || '';
            }
            
            gridContainer.appendChild(clone);
        });
        
        // カテゴリフィルターボタンを動的に生成
        const categoryFilter = document.querySelector('.column-category-filter');
        if (categoryFilter) {
            // すべてのユニークなカテゴリを取得（スラッグと表示名のペア）
            const categoryMap = new Map();
            columnsData.forEach(item => {
                const slug = getCategorySlug(item);
                if (!categoryMap.has(slug)) {
                    categoryMap.set(slug, item.category);
                }
            });
            
            // 既存のボタンをクリア（「すべて」ボタン以外）
            const existingButtons = categoryFilter.querySelectorAll('.category-filter-btn:not([data-category="all"])');
            existingButtons.forEach(btn => btn.remove());
            
            // カテゴリボタンを生成
            const allButton = categoryFilter.querySelector('[data-category="all"]');
            categoryMap.forEach((categoryName, categorySlug) => {
                const button = document.createElement('button');
                button.className = 'category-filter-btn';
                button.setAttribute('data-category', categorySlug);
                button.textContent = categoryName;
                
                // URLパラメータと一致する場合はアクティブにする
                if (filterCategorySlug === categorySlug) {
                    button.classList.add('is-active');
                    if (allButton) allButton.classList.remove('is-active');
                }
                
                categoryFilter.appendChild(button);
            });
            
            // フィルターボタンのイベントリスナーを設定
            const filterButtons = categoryFilter.querySelectorAll('.category-filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const selectedCategorySlug = this.getAttribute('data-category');
                    const currentUrl = new URL(window.location);
                    
                    if (selectedCategorySlug === 'all') {
                        currentUrl.searchParams.delete('category');
                    } else {
                        currentUrl.searchParams.set('category', selectedCategorySlug);
                    }
                    
                    window.location.href = currentUrl.toString();
                });
            });
        }
        
        console.log("[renderColumnListPage] completed");
    } catch (error) {
        console.error('[renderColumnListPage] Error loading columns.json:', error);
    }
}

/**
 * 個別記事ページの内容を描画（ニュース・コラム共通）
 */
async function renderPostContent() {
    console.log("[renderPostContent] start");
    
    const postArticle = document.querySelector('.post');
    if (!postArticle) {
        console.log("[renderPostContent] post article not found");
        return;
    }
    
    // URLパラメータから記事IDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    console.log("[renderPostContent] postId:", postId, "URL:", window.location.href);
    
    if (!postId) {
        console.error('[renderPostContent] Post ID not found in URL parameters');
        return;
    }
    
    // 現在のパスからニュースかコラムかを判定
    const currentPath = window.location.pathname;
    const isNews = currentPath.includes('/news/');
    const isColumn = currentPath.includes('/column/');
    
    console.log("[renderPostContent] currentPath:", currentPath, "isNews:", isNews, "isColumn:", isColumn);
    
    if (!isNews && !isColumn) {
        console.log("[renderPostContent] not a news or column page");
        return;
    }
    
    // JSONファイルのパス
    const jsonFilename = isColumn ? 'columns.json' : 'news.json';
    const jsonPath = getJsonPath(jsonFilename);
    console.log("[FETCH] url:", jsonPath);
    
    try {
        const response = await fetch(jsonPath);
        console.log("[FETCH] status:", response.status, response.url);
        
        if (!response.ok) {
            throw new Error("Fetch failed: " + response.status + " " + response.url);
        }
        
        const data = await response.json();
        
        console.log("[renderPostContent] searching for ID:", postId);
        console.log("[renderPostContent] available IDs:", data.map(item => item.id));
        
        // IDで記事を検索
        const postData = data.find(item => item.id === postId);
        
        if (!postData) {
            console.error('[renderPostContent] Post data not found for ID:', postId);
            console.error('[renderPostContent] Available IDs:', data.map(item => item.id));
            return;
        }
        
        console.log("[renderPostContent] post data found:", postData.title);
        
        // 日付のフォーマット（YYYY-MM-DD -> YYYY.MM.DD）
        const formattedDate = postData.date.replace(/-/g, '.');
        
        // パンくずを生成
        const breadcrumbEl = document.getElementById('breadcrumb');
        if (breadcrumbEl) {
            const breadcrumbList = document.createElement('ul');
            breadcrumbList.className = 'breadcrumb__list';
            
            // ホームへのリンク
            const homeItem = document.createElement('li');
            homeItem.className = 'breadcrumb__item';
            const homeLink = document.createElement('a');
            homeLink.className = 'breadcrumb__link';
            homeLink.href = isColumn ? '../../index.html' : '../../index.html';
            homeLink.textContent = 'ホーム';
            homeItem.appendChild(homeLink);
            breadcrumbList.appendChild(homeItem);
            
            // 一覧ページへのリンク
            const listItem = document.createElement('li');
            listItem.className = 'breadcrumb__item';
            const listLink = document.createElement('a');
            listLink.className = 'breadcrumb__link';
            listLink.href = 'index.html';
            listLink.textContent = isColumn ? 'コラム' : 'ニュース';
            listItem.appendChild(listLink);
            breadcrumbList.appendChild(listItem);
            
            // 現在の記事（リンクなし）
            const currentItem = document.createElement('li');
            currentItem.className = 'breadcrumb__item';
            const currentLink = document.createElement('span');
            currentLink.className = 'breadcrumb__link';
            currentLink.textContent = postData.title;
            currentItem.appendChild(currentLink);
            breadcrumbList.appendChild(currentItem);
            
            breadcrumbEl.appendChild(breadcrumbList);
        }
        
        // データを挿入
        const dateEl = postArticle.querySelector('.post__date');
        if (dateEl) {
            dateEl.setAttribute('datetime', postData.date);
            dateEl.textContent = formattedDate;
        }
        
        const tagEl = postArticle.querySelector('.post__tag');
        if (tagEl) {
            tagEl.textContent = postData.category;
        }
        
        const titleEl = postArticle.querySelector('.post__title');
        if (titleEl) {
            titleEl.textContent = postData.title;
        }
        
        const heroImgEl = postArticle.querySelector('.post__hero img');
        if (heroImgEl && postData.image) {
            // 画像パスの調整
            let imagePath = postData.image;
            if (isColumn && !imagePath.startsWith('../')) {
                imagePath = `../${imagePath}`;
            } else if (isNews && !imagePath.startsWith('../')) {
                imagePath = `../${imagePath}`;
            }
            heroImgEl.setAttribute('src', imagePath);
            heroImgEl.setAttribute('alt', postData.alt || postData.title);
        }
        
        // 本文を挿入
        const bodyEl = postArticle.querySelector('.post__body');
        if (bodyEl && postData.content && Array.isArray(postData.content)) {
            bodyEl.innerHTML = '';
            postData.content.forEach(item => {
                // オブジェクトの場合（見出し + 段落の構造）
                if (typeof item === 'object' && item !== null) {
                    // 見出しがある場合
                    if (item.heading) {
                        const h2 = document.createElement('h2');
                        h2.className = 'post__heading';
                        h2.textContent = item.heading;
                        bodyEl.appendChild(h2);
                    }
                    // 段落がある場合
                    if (item.paragraph) {
                        const p = document.createElement('p');
                        p.textContent = item.paragraph;
                        bodyEl.appendChild(p);
                    }
                } else if (typeof item === 'string') {
                    // 文字列の場合はそのまま段落として表示
                    const p = document.createElement('p');
                    p.textContent = item;
                    bodyEl.appendChild(p);
                }
            });
        }
        
        // ページタイトルとメタ情報を更新
        if (document.title) {
            document.title = `${postData.title} | SOCIAL BASE`;
        }
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', postData.excerpt || postData.title);
        }
        
        // サイドバー：関連記事を表示
        const relatedPostsList = document.getElementById('related-posts');
        if (relatedPostsList) {
            // 同じカテゴリの他の記事を取得（現在の記事を除く）
            const currentCategorySlug = getCategorySlug(postData);
            const relatedPosts = data
                .filter(item => getCategorySlug(item) === currentCategorySlug && item.id !== postId)
                .slice(0, 5); // 最大5件
            
            if (relatedPosts.length > 0) {
                relatedPostsList.innerHTML = '';
                relatedPosts.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'post-sidebar__item';
                    
                    const formattedDate = item.date.replace(/-/g, '.');
                    // ニュースかコラムかでリンク生成関数を切り替え
                    const linkUrl = isColumn ? getColumnLinkUrl(item.url) : getNewsLinkUrl(item.url);
                    
                    li.innerHTML = `
                        <a href="${linkUrl}" class="post-sidebar__link">
                            <span class="post-sidebar__link-date">${formattedDate}</span>
                            <span>${item.title}</span>
                        </a>
                    `;
                    relatedPostsList.appendChild(li);
                });
            } else {
                relatedPostsList.innerHTML = '<li class="post-sidebar__item"><p style="color: var(--text-secondary); font-size: 14px;">関連記事はありません</p></li>';
            }
        }
        
        // サイドバー：カテゴリを表示（3つすべて常に表示）
        const categoriesList = document.getElementById('post-categories');
        if (categoriesList) {
            // 定義されている3つのカテゴリ（お知らせ、トピックス、セミナー）
            const allCategories = [
                { name: 'お知らせ', slug: 'notice' },
                { name: 'トピックス', slug: 'topics' },
                { name: 'セミナー', slug: 'seminar' }
            ];
            
            // データから各カテゴリの記事数をカウント
            const categoryMap = new Map(); // key: slug, value: {name, count}
            
            // まず、すべてのカテゴリを初期化
            allCategories.forEach(cat => {
                categoryMap.set(cat.slug, { name: cat.name, count: 0 });
            });
            
            // データから記事数をカウント（各記事は必ずどれかのカテゴリに属している）
            data.forEach(item => {
                const slug = getCategorySlug(item);
                if (categoryMap.has(slug)) {
                    categoryMap.get(slug).count++;
                }
            });
            
            // 3つすべてのカテゴリを表示（記事数が0でも表示）
            categoriesList.innerHTML = '';
            allCategories.forEach(cat => {
                const info = categoryMap.get(cat.slug);
                const count = info ? info.count : 0;
                
                const li = document.createElement('li');
                li.className = 'post-sidebar__category';
                
                // カテゴリページへのリンク（各カテゴリの個別ページ）
                // カテゴリスラッグとページ名のマッピング
                const categoryPageMap = {
                    'notice': 'press.html',   // お知らせ → press.html
                    'topics': 'topics.html',  // トピックス → topics.html
                    'seminar': 'seminar.html' // セミナー → seminar.html
                };
                
                const categoryUrl = isColumn 
                    ? `index.html?category=${encodeURIComponent(cat.slug)}` // コラムの場合は一覧ページ
                    : (categoryPageMap[cat.slug] || `index.html?category=${encodeURIComponent(cat.slug)}`); // ニュースの場合は各カテゴリページ
                
                const currentCategorySlug = getCategorySlug(postData);
                const isActive = cat.slug === currentCategorySlug;
                
                li.innerHTML = `
                    <a href="${categoryUrl}" class="post-sidebar__category-link ${isActive ? 'is-active' : ''}">
                        ${cat.name}
                        <span class="post-sidebar__category-count">(${count})</span>
                    </a>
                `;
                categoriesList.appendChild(li);
            });
        }
        
        // サイドバー：タグを表示（全データから集計）
        const tagsList = document.getElementById('post-tags');
        if (tagsList) {
            // 全データからタグを集計
            const tagSet = new Set();
            data.forEach(item => {
                if (item.tags && Array.isArray(item.tags)) {
                    item.tags.forEach(tag => {
                        if (tag && tag.trim()) {
                            tagSet.add(tag.trim());
                        }
                    });
                }
            });
            
            // タグをソート（アルファベット順）
            const sortedTags = Array.from(tagSet).sort();
            
            tagsList.innerHTML = '';
            
            if (sortedTags.length > 0) {
                // 集計したタグを表示
                sortedTags.forEach(tag => {
                    const li = document.createElement('li');
                    li.className = 'post-sidebar__tag';
                    const tagLink = document.createElement('a');
                    tagLink.className = 'post-sidebar__tag-link';
                    
                    // 現在のページがニュースかコラムかを判定
                    const currentPath = window.location.pathname;
                    const isColumn = currentPath.includes('/column/');
                    
                    // タグフィルター用のURLを生成
                    if (isColumn) {
                        tagLink.href = `../column/index.html?tag=${encodeURIComponent(tag)}`;
                    } else {
                        tagLink.href = `../news/index.html?tag=${encodeURIComponent(tag)}`;
                    }
                    
                    tagLink.textContent = tag;
                    li.appendChild(tagLink);
                    tagsList.appendChild(li);
                });
            } else {
                // タグがない場合の表示
                const emptyLi = document.createElement('li');
                emptyLi.className = 'post-sidebar__tag';
                emptyLi.innerHTML = '<span style="color: var(--text-secondary); font-size: 13px;">タグはありません</span>';
                tagsList.appendChild(emptyLi);
            }
        }
        
        console.log("[renderPostContent] completed");
    } catch (error) {
        console.error('[renderPostContent] Error loading post content:', error);
    }
}

/**
 * ヘッダーのお知らせスクロールを描画
 */
async function renderHeaderNews() {
    console.log("[renderHeaderNews] start");
    
    // ヘッダーが読み込まれるまで少し待つ
    let headerNewsTrack = document.querySelector('.header-news__track');
    let retries = 0;
    while (!headerNewsTrack && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        headerNewsTrack = document.querySelector('.header-news__track');
        retries++;
    }
    
    if (!headerNewsTrack) {
        console.error("[renderHeaderNews] container not found after retries");
        return;
    }
    
    const jsonPath = getJsonPath('news.json');
    console.log("[renderHeaderNews] jsonPath:", jsonPath);
    
    try {
        const response = await fetch(jsonPath);
        console.log("[renderHeaderNews] fetch status:", response.status, "url:", response.url);
        
        if (!response.ok) {
            throw new Error("Fetch failed: " + response.status + " " + response.url);
        }
        
        const newsData = await response.json();
        console.log("[renderHeaderNews] newsData loaded:", newsData.length, "items");
        
        // 最新5件を取得
        const displayData = newsData.slice(0, 5);
        console.log("[renderHeaderNews] displayData:", displayData.length, "items");
        
        // カテゴリからタグタイプを取得する関数
        function getTagType(category) {
            const categoryMap = {
                '制作枠': 'is-notice',
                '記事公開': 'is-notice',
                '価格': 'is-update',
                'サービス': 'is-notice',
                '重要': 'is-important',
                'キャンペーン': 'is-campaign',
                '更新': 'is-update'
            };
            return categoryMap[category] || 'is-notice';
        }
        
        // カテゴリからタグ表示名を取得する関数
        function getTagLabel(category) {
            const labelMap = {
                '制作枠': 'お知らせ',
                '記事公開': 'お知らせ',
                '価格': '更新',
                'サービス': 'お知らせ',
                '重要': '重要',
                'キャンペーン': 'キャンペーン',
                '更新': '更新'
            };
            return labelMap[category] || 'お知らせ';
        }
        
        // 既存の要素をクリア
        headerNewsTrack.innerHTML = '';
        
        // ニュースデータから要素を生成（ループ用に2回生成）
        for (let loop = 0; loop < 2; loop++) {
            displayData.forEach((item) => {
                const link = document.createElement('a');
                link.className = 'header-news__item';
                
                // URLパスの調整（現在のページの階層に応じて）
                // ヘッダーは全ページで表示されるため、現在のページのパスに応じて適切な相対パスを生成
                // getNewsLinkUrl 関数を使用して一貫性を保つ
                const newsUrl = getNewsLinkUrl(item.url);
                link.setAttribute('href', newsUrl);
                
                const tagType = getTagType(item.category);
                const tagLabel = getTagLabel(item.category);
                
                link.innerHTML = `
                    <span class="header-news__tag ${tagType}">${tagLabel}</span>
                    <span class="header-news__title">${item.title}</span>
                `;
                
                headerNewsTrack.appendChild(link);
            });
        }
        
        console.log("[renderHeaderNews] completed");
    } catch (error) {
        console.error('[renderHeaderNews] Error loading news.json:', error);
        console.error('[renderHeaderNews] Error details:', {
            message: error.message,
            jsonPath: jsonPath,
            currentPath: window.location.pathname
        });
        
        // エラーが発生した場合でも、空のメッセージを表示しないようにする
        // （オプション：エラーメッセージを表示するか、何も表示しない）
    }
}

// グローバルに公開
window.renderNewsBlock = renderNewsBlock;
window.renderTopColumns = renderTopColumns;
window.renderColumnListPage = renderColumnListPage;
window.renderPostContent = renderPostContent;
window.renderHeaderNews = renderHeaderNews;
