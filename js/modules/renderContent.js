// ===== ニュース・コラムデータの描画 =====

console.log("[BOOT]", location.pathname, "baseURI:", document.baseURI);

// JSONファイルのパスを階層に依存しない形で解決
function getJsonPath(filename) {
    // 現在のページのパスから、webディレクトリのルートを特定
    const currentPath = window.location.pathname;
    let basePath = '';
    
    if (currentPath.includes('/news/') || currentPath.includes('/column/')) {
        // news/ または column/ 配下の場合
        basePath = '../';
    } else {
        // TOPページなどの場合
        basePath = '';
    }
    
    const jsonPath = `${basePath}assets/data/${filename}`;
    console.log("[getJsonPath] currentPath:", currentPath, "basePath:", basePath, "result:", jsonPath);
    return jsonPath;
}

// ニュースリンクURLを生成（ページ階層に応じて適切なパスを返す）
function getNewsLinkUrl(itemUrl) {
    const currentPath = window.location.pathname;
    const isNewsPage = currentPath.includes('/news/') && !currentPath.includes('/post.html');
    
    if (isNewsPage) {
        // NEWSページからは、news/プレフィックスを削除
        if (itemUrl.startsWith('news/')) {
            return itemUrl.replace('news/', '');
        }
        return itemUrl;
    } else {
        // TOPページからはそのまま
        return itemUrl;
    }
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
            
            // セクションタイプを判定（親セクションのbadgeテキストから）
            const section = listContainer.closest('.news-block');
            let sectionType = 'all'; // デフォルトはすべて
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
            
            // 現在のページパスからも判定
            const currentPath = window.location.pathname;
            if (currentPath.includes('/press.html')) {
                sectionType = 'releases';
            } else if (currentPath.includes('/topics.html')) {
                sectionType = 'topics';
            } else if (currentPath.includes('/seminar.html')) {
                sectionType = 'seminar';
            }
            
            // フィルタリング（現時点ではすべて表示、将来的にtypeフィールドで分類可能）
            const filteredData = newsData; // すべて表示
            
            // JSONデータから要素を生成
            filteredData.forEach((item) => {
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
        
        // JSONデータから要素を生成
        columnsData.forEach((item) => {
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
        
        const leadEl = postArticle.querySelector('.post__lead');
        if (leadEl) {
            leadEl.textContent = postData.excerpt || '';
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
            postData.content.forEach(paragraph => {
                const p = document.createElement('p');
                p.textContent = paragraph;
                bodyEl.appendChild(p);
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
            const relatedPosts = data
                .filter(item => item.category === postData.category && item.id !== postId)
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
        
        // サイドバー：カテゴリを表示
        const categoriesList = document.getElementById('post-categories');
        if (categoriesList) {
            // すべてのユニークなカテゴリを取得
            const uniqueCategories = [...new Set(data.map(item => item.category))];
            
            categoriesList.innerHTML = '';
            uniqueCategories.forEach(category => {
                const li = document.createElement('li');
                li.className = 'post-sidebar__category';
                
                // カテゴリページへのリンク（現時点では同じページに戻る）
                const categoryUrl = isColumn 
                    ? `index.html?category=${encodeURIComponent(category)}`
                    : `index.html?category=${encodeURIComponent(category)}`;
                
                li.innerHTML = `
                    <a href="${categoryUrl}" class="post-sidebar__category-link">${category}</a>
                `;
                categoriesList.appendChild(li);
            });
        }
        
        console.log("[renderPostContent] completed");
    } catch (error) {
        console.error('[renderPostContent] Error loading post content:', error);
    }
}

// グローバルに公開
window.renderNewsBlock = renderNewsBlock;
window.renderTopColumns = renderTopColumns;
window.renderColumnListPage = renderColumnListPage;
window.renderPostContent = renderPostContent;
