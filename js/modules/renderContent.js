// ===== ニュース・コラムデータの描画 =====

/**
 * ニュースデータを描画（TOPページ用）
 */
async function renderNewsBlock() {
    const listContainer = document.querySelector('.news-list');
    if (!listContainer) return;
    
    const template = document.getElementById('news-item-template');
    if (!template) return;
    
    // JSONファイルのパス（相対パス）
    const jsonPath = 'assets/data/news.json';
    
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            console.error('Failed to load news.json');
            return;
        }
        
        const newsData = await response.json();
        
        // テンプレートを除く既存の要素をクリア
        const existingItems = listContainer.querySelectorAll('.news-item');
        existingItems.forEach(item => {
            // テンプレート要素内の要素は除外
            if (!item.closest('template')) {
                item.remove();
            }
        });
        
        // JSONデータからHTMLを生成
        newsData.forEach(item => {
            // テンプレートを複製
            const clone = template.content.cloneNode(true);
            
            // 日付のフォーマット（YYYY-MM-DD -> YYYY.MM.DD）
            const formattedDate = item.date.replace(/-/g, '.');
            
            // データを挿入
            const timeEl = clone.querySelector('.news-date');
            if (timeEl) {
                timeEl.setAttribute('datetime', item.date);
                timeEl.textContent = formattedDate;
            }
            
            const linkEl = clone.querySelector('.news-title');
            if (linkEl) {
                linkEl.setAttribute('href', item.url);
                linkEl.textContent = item.title;
            }
            
            listContainer.appendChild(clone);
        });
    } catch (error) {
        console.error('Error loading news.json:', error);
    }
}

/**
 * コラムデータを描画（TOPページ用）
 */
async function renderTopColumns() {
    const gridContainer = document.querySelector('.top-column__grid');
    if (!gridContainer) return;
    
    const template = document.getElementById('top-post-template');
    if (!template) return;
    
    // JSONファイルのパス（TOPページからの相対パス）
    const jsonPath = 'assets/data/columns.json';
    
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            console.error('Failed to load columns.json');
            return;
        }
        
        const columnsData = await response.json();
        
        // テンプレートを除く既存の要素をクリア
        const existingPosts = gridContainer.querySelectorAll('.top-post');
        existingPosts.forEach(post => {
            // テンプレート要素内の要素は除外
            if (!post.closest('template')) {
                post.remove();
            }
        });
        
        // JSONデータからHTMLを生成（最新3件のみ）
        columnsData.slice(0, 3).forEach(item => {
            // テンプレートを複製
            const clone = template.content.cloneNode(true);
            
            // 日付のフォーマット（YYYY-MM-DD -> YYYY.MM.DD）
            const formattedDate = item.date.replace(/-/g, '.');
            
            // 画像パスの調整（TOPページからの相対パス）
            let imagePath = item.image;
            if (!imagePath.startsWith('assets/') && !imagePath.startsWith('../')) {
                imagePath = `assets/img/${imagePath}`;
            }
            
            // データを挿入
            const linkEl = clone.querySelector('.top-post__link');
            if (linkEl) {
                linkEl.setAttribute('href', item.url);
            }
            
            const imgEl = clone.querySelector('.top-post__media img');
            if (imgEl) {
                imgEl.setAttribute('src', imagePath);
                imgEl.setAttribute('alt', item.alt || item.title);
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
    } catch (error) {
        console.error('Error loading columns.json:', error);
    }
}

/**
 * コラム一覧ページのデータを描画
 */
async function renderColumnListPage() {
    const gridContainer = document.querySelector('.column-list-page__grid');
    if (!gridContainer) return;
    
    const template = document.getElementById('column-card-template');
    if (!template) return;
    
    // JSONファイルのパス（コラムページからの相対パス）
    const jsonPath = '../assets/data/columns.json';
    
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            console.error('Failed to load columns.json');
            return;
        }
        
        const columnsData = await response.json();
        
        // テンプレートを除く既存の要素をクリア
        const existingCards = gridContainer.querySelectorAll('.column-list-page__card');
        existingCards.forEach(card => {
            // テンプレート要素内の要素は除外
            if (!card.closest('template')) {
                card.remove();
            }
        });
        
        // JSONデータからHTMLを生成
        columnsData.forEach(item => {
            // テンプレートを複製
            const clone = template.content.cloneNode(true);
            
            // 日付のフォーマット（YYYY-MM-DD -> YYYY.MM.DD）
            const formattedDate = item.date.replace(/-/g, '.');
            
            // 画像パスの調整（コラムページからの相対パス）
            let imagePath = item.image;
            if (!imagePath.startsWith('../') && !imagePath.startsWith('assets/')) {
                imagePath = `../${imagePath}`;
            } else if (imagePath.startsWith('assets/')) {
                imagePath = `../${imagePath}`;
            }
            
            // データを挿入
            const cardEl = clone.querySelector('.column-list-page__card');
            if (cardEl) {
                cardEl.setAttribute('data-category', item.category);
            }
            
            const imgEl = clone.querySelector('.column-list-page__media img');
            if (imgEl) {
                imgEl.setAttribute('src', imagePath);
                imgEl.setAttribute('alt', item.alt || item.title);
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
                titleLinkEl.setAttribute('href', item.url);
                titleLinkEl.textContent = item.title;
            }
            
            const leadEl = clone.querySelector('.column-list-page__lead');
            if (leadEl) {
                leadEl.textContent = item.excerpt || '';
            }
            
            gridContainer.appendChild(clone);
        });
    } catch (error) {
        console.error('Error loading columns.json:', error);
    }
}

// グローバルに公開
window.renderNewsBlock = renderNewsBlock;
window.renderTopColumns = renderTopColumns;
window.renderColumnListPage = renderColumnListPage;
