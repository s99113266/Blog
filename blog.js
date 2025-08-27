// 部落格主人資訊配置
let authorInfo = {};

// 分類標籤配置
let categoriesConfig = {};

// 獲取分類顏色
function getCategoryColor(categoryName) {
  switch(categoryName) {
    case '技術':
      return 'var(--category-tech)';
    case '生活':
      return 'var(--category-life)';
    case '心情':
      return 'var(--category-mood)';
    default:
      return '#777';
  }
}

// 計算每個分類的文章數量
function countPostsByCategory(category) {
  const postItems = document.querySelectorAll('.post-item');
  
  if (category === 'all') {
    return postItems.length;
  }
  
  let count = 0;
  postItems.forEach(post => {
    const postCategory = post.querySelector('.post-category').getAttribute('data-category');
    if (postCategory === category) {
      count++;
    }
  });
  
  return count;
}

// 渲染部落格主人資訊
function renderAuthorInfo() {
  const authorContainer = document.getElementById('author-info');
  if (!authorContainer) return;
  
  const authorHTML = `
    <img src="${authorInfo.avatar}" alt="${authorInfo.name}" class="author-avatar">
    <div class="author-info-text">
      <h3 class="author-name">${authorInfo.name}</h3>
      <p class="author-title">${authorInfo.title}</p>
      <p class="author-bio">${authorInfo.bio}</p>
    </div>
    <div class="social-links">
      ${authorInfo.social.map(social => `
        <a href="${social.url}" class="social-link" title="${social.platform}" target="_blank">
          <i class="${social.icon}"></i>
        </a>
      `).join('')}
    </div>
  `;
  
  authorContainer.innerHTML = authorHTML;
}

// 渲染分類標籤
function renderCategories() {
  const categoryContainer = document.getElementById('category-list');
  if (!categoryContainer) return;
  
  // 添加"全部"分類
  let categoriesHTML = `
    <a href="index.html" class="category-tag" data-category="all">
      <span class="category-tag-icon" style="background-color: #777;"></span>
      全部文章
      <span class="category-tag-count">${countPostsByCategory('all')}</span>
    </a>
  `;
  
  // 添加其他分類
  categoriesConfig.categories.forEach(category => {
    const categoryColor = getCategoryColor(category.name);
    const postCount = countPostsByCategory(category.name);
    
    categoriesHTML += `
      <a href="index.html?category=${encodeURIComponent(category.name)}" class="category-tag" data-category="${category.name}">
        <span class="category-tag-icon" style="background-color: ${categoryColor};"></span>
        ${category.name}
        <span class="category-tag-count">${postCount}</span>
      </a>
    `;
  });
  
  categoryContainer.innerHTML = categoriesHTML;
}

// 根據分類過濾文章
function filterPostsByCategory(category) {
  const postItems = document.querySelectorAll('.post-item');
  
  postItems.forEach(post => {
    const postCategory = post.querySelector('.post-category').getAttribute('data-category');
    if (postCategory === category) {
      post.style.display = 'block';
    } else {
      post.style.display = 'none';
    }
  });
}

// 更新頁面標題
function updatePageTitle(category) {
  const pageTitle = document.querySelector('.page-title');
  if (pageTitle) {
    pageTitle.textContent = `${category}文章`;
  }
}

// 高亮顯示當前選中的分類
function highlightActiveCategory(category) {
  const categoryTags = document.querySelectorAll('.category-tag');
  
  categoryTags.forEach(tag => {
    if (tag.getAttribute('data-category') === category) {
      tag.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      tag.style.fontWeight = 'bold';
    }
  });
}

// 設置分類過濾功能
function setupCategoryFilter() {
  // 獲取 URL 參數
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  
  // 如果有分類參數，過濾文章
  if (categoryParam) {
    filterPostsByCategory(categoryParam);
    updatePageTitle(categoryParam);
    highlightActiveCategory(categoryParam);
  }
}

// 載入設定檔
function loadConfigurations() {
  // 載入作者資訊
  fetch('author_info.json')
    .then(response => response.json())
    .then(data => {
      authorInfo = data;
      renderAuthorInfo();
    })
    .catch(error => console.error('無法載入作者資訊:', error));

  // 載入分類設定
  fetch('categories_config.json')
    .then(response => response.json())
    .then(data => {
      categoriesConfig = data;
      renderCategories();
    })
    .catch(error => console.error('無法載入分類設定:', error));
}

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', () => {
  // 檢查頁面結構
  const container = document.querySelector('.container');
  const sidebar = document.querySelector('.sidebar');
  const postList = document.querySelector('.post-list');
  
  console.log('頁面結構檢查:');
  console.log('container:', container);
  console.log('sidebar:', sidebar);
  console.log('postList:', postList);
  
  // 載入設定檔
  loadConfigurations();
  
  // 設置分類過濾功能
  setupCategoryFilter();
});