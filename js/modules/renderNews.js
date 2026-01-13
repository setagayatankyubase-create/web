// ===== ニュースデータの描画 =====
async function renderNewsTop() {
    const listContainer = document.querySelector('.news-top__list');
    if (!listContainer) return;
    
    // JSONファイルのパス（ルート相対、/web/プレフィックス付き）
    const jsonPath = '/web/assets/data/news.json';
    
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            console.error('Failed to load news.json');
            return;
        }
        
        const newsData = await response.json();
        
        // 既存のリストをクリア
        listContainer.innerHTML = '';
        
        // JSONデータからHTMLを生成
        newsData.forEach(item => {
            const li = document.createElement('li');
            li.className = 'news-top__item';
            
            // 日付のフォーマット（YYYY-MM-DD -> YYYY.MM.DD）
            const formattedDate = item.date.replace(/-/g, '.');
            
            li.innerHTML = `
                <time class="news-top__date" datetime="${item.date}">${formattedDate}</time>
                <span class="news-top__category">${item.category}</span>
                <a class="news-top__title-link" href="${item.url}">${item.title}</a>
            `;
            
            listContainer.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading news.json:', error);
    }
}

window.renderNewsTop = renderNewsTop;
