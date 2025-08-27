/**
 * index.js - 處理index.html的資料處理事件
 * 主要功能：當頁面載入時，發送POST請求獲取資料總筆數和文章列表
 */

// 全局變數
const ITEMS_PER_PAGE = 10; // 每頁顯示10筆資料
let currentPage = 1; // 當前頁碼
let totalPages = 0; // 總頁數
let totalItems = 0; // 總筆數
let postListData = []; // 文章列表數據
let webhookUrl = ''; // Webhook URL

// 從webhook_config.json讀取Webhook URL
function loadWebhookConfig() {
  console.log('開始讀取webhook_config.json...');
  
  return fetch('webhook_config.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`無法讀取webhook_config.json: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(config => {
      console.log('成功讀取webhook_config.json:', config);
      webhookUrl = config.webhookUrl;
      console.log('設置webhookUrl:', webhookUrl);
      return webhookUrl;
    })
    .catch(error => {
      console.error('讀取webhook_config.json時發生錯誤:', error);
      return null;
    });
}

// 獲取資料總筆數
function fetchTotalDataCount() {
  console.log('開始獲取資料總筆數...');
  
  // 檢查webhookUrl是否已設置
  if (!webhookUrl) {
    console.error('webhookUrl未設置，無法發送請求');
    console.log('請確保webhook_config.json中包含正確的webhookUrl');
    return;
  }
  
  // 創建FormData物件
  const formData = new FormData();
  
  // 添加page欄位，值為"總筆數"
  formData.append('page', '總筆數');
  
  console.log('使用Webhook URL:', webhookUrl);
  
  // 發送POST請求
  fetch(webhookUrl, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    console.log('收到回應:', response);
    if (!response.ok) {
      throw new Error(`網路回應不正常: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('===== 第二次POST請求返回的資料 =====');
    console.log('完整返回數據:', data);
    console.log('資料總筆數 (maxdata):', data.maxdata);
    console.log('資料類型:', typeof data.maxdata);
    console.log('=====================================');
    
    // 在這裡可以處理獲取到的資料總筆數
    // 例如：更新UI顯示總筆數、計算分頁等
    handleTotalDataCount(data.maxdata);
  })
  .catch(error => {
    console.error('獲取資料總筆數時發生錯誤:', error);
    console.log('請檢查網絡連接和API端點是否正確');
  });
}


// 處理獲取到的資料總筆數
function handleTotalDataCount(totalCount) {
  // 保存總筆數
  totalItems = totalCount;
  
  // 計算總頁數
  totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // 顯示總筆數和分頁資訊
  displayTotalCountInfo(totalCount);
  
  // 不再調用fetchPostList，因為已經在initApp中調用了
}

// 獲取文章列表
function fetchPostList() {
  console.log('開始獲取文章列表...');
  
  // 檢查webhookUrl是否已設置
  if (!webhookUrl) {
    console.error('webhookUrl未設置，無法發送請求');
    console.log('請確保webhook_config.json中包含正確的webhookUrl');
    return;
  }
  
  // 創建FormData物件
  const formData = new FormData();
  
  // 添加page欄位，值為"列表"
  formData.append('page', '列表');
  
  console.log('使用Webhook URL:', webhookUrl);
  
  // 發送POST請求
  fetch(webhookUrl, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    console.log('收到回應:', response);
    if (!response.ok) {
      throw new Error(`網路回應不正常: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('%c===== 第一次POST請求返回的資料（後端資料） =====', 'background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
    console.log('完整返回數據:', data);
    
    // 詳細分析返回的數據結構
    console.log('數據類型:', typeof data);
    console.log('是否包含data屬性:', data.hasOwnProperty('data'));
    
    // 在頁面上顯示返回的JSON數據
    displayJsonResponse(data);
    
    if (data.data && Array.isArray(data.data)) {
      console.log('%c成功從後端獲取文章列表數據', 'color: green; font-weight: bold;');
      console.log('文章數量:', data.data.length);
      
      // 詳細顯示第一篇文章的所有屬性
      console.log('%c第一篇文章詳細資料:', 'color: #2196F3; font-weight: bold;');
      if (data.data.length > 0) {
        const firstPost = data.data[0];
        console.log('- 文章編號 (id):', firstPost.id);
        console.log('- 文章標題 (title):', firstPost.title);
        console.log('- 發文日期 (date):', firstPost.date);
        console.log('- 文章內容 (summary):', firstPost.summary ? firstPost.summary.substring(0, 100) + '...' : '無內容');
        
        // 檢查是否有其他屬性
        const knownProps = ['id', 'title', 'date', 'summary'];
        const otherProps = Object.keys(firstPost).filter(key => !knownProps.includes(key));
        if (otherProps.length > 0) {
          console.log('- 其他屬性:', otherProps);
          otherProps.forEach(prop => {
            console.log(`  - ${prop}:`, firstPost[prop]);
          });
        }
      }
      
      // 顯示所有文章的標題列表
      console.log('%c所有文章標題列表:', 'color: #FF9800; font-weight: bold;');
      data.data.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title} (ID: ${post.id})`);
      });
    } else {
      console.log('%c警告: 文章列表數據格式不符合預期', 'color: red; font-weight: bold;');
      console.log('實際數據:', data.data);
    }
    
    console.log('%c=====================================', 'background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
    
    // 保存文章列表數據
    postListData = data.data || [];
    console.log('使用後端返回的數據進行渲染');
    
    // 渲染文章列表
    renderPostList();
    
    // 創建分頁導航
    createPagination(totalPages);
    
    // 顯示當前頁的文章
    displayCurrentPagePosts();
    
    // 獲取資料總筆數（原本的第一次POST）
    fetchTotalDataCount();
  })
  .catch(error => {
    console.error('獲取文章列表時發生錯誤:', error);
    console.log('請檢查網絡連接和API端點是否正確');
    
    // 顯示錯誤提示
    const postsContainer = document.querySelector('.posts-container');
    if (postsContainer) {
      postsContainer.innerHTML = '<div class="error-message">無法獲取文章列表，請稍後再試</div>';
    }
  });
}


// 在頁面上顯示返回的JSON數據
function displayJsonResponse(data) {
  // 直接將JSON數據轉換為字符串，設置為body的innerHTML
  document.body.innerHTML = JSON.stringify(data);
}

// 渲染文章列表
function renderPostList() {
  const postListElement = document.querySelector('.post-list');
  if (!postListElement) return;
  
  // 移除現有的文章元素
  const existingPosts = postListElement.querySelectorAll('.post-item');
  existingPosts.forEach(post => post.remove());
  
  // 獲取頁面標題元素
  const pageTitle = postListElement.querySelector('.page-title');
  const totalCountInfo = postListElement.querySelector('.total-count-info');
  
  // 創建文章列表容器
  const postsContainer = document.createElement('div');
  postsContainer.className = 'posts-container';
  
  // 將文章列表容器插入到適當位置
  if (totalCountInfo) {
    postListElement.insertBefore(postsContainer, totalCountInfo.nextSibling);
  } else if (pageTitle) {
    postListElement.insertBefore(postsContainer, pageTitle.nextSibling);
  } else {
    postListElement.appendChild(postsContainer);
  }
}

// 顯示總筆數資訊
function displayTotalCountInfo(totalCount) {
  const postListElement = document.querySelector('.post-list');
  if (!postListElement) return;
  
  // 創建一個顯示總筆數的元素
  const totalCountElement = document.createElement('div');
  totalCountElement.className = 'total-count-info';
  totalCountElement.textContent = `共有 ${totalCount} 篇文章，分 ${totalPages} 頁顯示`;
  
  // 將元素插入到文章列表的頂部
  const pageTitle = postListElement.querySelector('.page-title');
  if (pageTitle) {
    postListElement.insertBefore(totalCountElement, pageTitle.nextSibling);
  } else {
    postListElement.prepend(totalCountElement);
  }
}

// 創建分頁導航
function createPagination(totalPages) {
  const postListElement = document.querySelector('.post-list');
  if (!postListElement) return;
  
  // 檢查是否已存在分頁導航，如果存在則移除
  const existingPagination = document.querySelector('.pagination');
  if (existingPagination) {
    existingPagination.remove();
  }
  
  // 創建分頁導航容器
  const paginationElement = document.createElement('div');
  paginationElement.className = 'pagination';
  
  // 添加分頁按鈕
  let paginationHTML = '';
  
  // 上一頁按鈕
  paginationHTML += `<button class="pagination-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>上一頁</button>`;
  
  // 頁碼按鈕
  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `<button class="pagination-btn page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  
  // 下一頁按鈕
  paginationHTML += `<button class="pagination-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>下一頁</button>`;
  
  paginationElement.innerHTML = paginationHTML;
  
  // 將分頁導航添加到文章列表底部
  postListElement.appendChild(paginationElement);
  
  // 添加分頁按鈕事件監聽
  setupPaginationEvents();
}

// 設置分頁按鈕事件
function setupPaginationEvents() {
  // 頁碼按鈕點擊事件
  const pageButtons = document.querySelectorAll('.page-btn');
  pageButtons.forEach(button => {
    button.addEventListener('click', () => {
      const page = parseInt(button.getAttribute('data-page'));
      if (page !== currentPage) {
        currentPage = page;
        updatePagination();
        displayCurrentPagePosts();
      }
    });
  });
  
  // 上一頁按鈕點擊事件
  const prevButton = document.querySelector('.prev-btn');
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePagination();
        displayCurrentPagePosts();
      }
    });
  }
  
  // 下一頁按鈕點擊事件
  const nextButton = document.querySelector('.next-btn');
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
        displayCurrentPagePosts();
      }
    });
  }
}

// 更新分頁導航
function updatePagination() {
  // 更新頁碼按鈕狀態
  const pageButtons = document.querySelectorAll('.page-btn');
  pageButtons.forEach(button => {
    const page = parseInt(button.getAttribute('data-page'));
    if (page === currentPage) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // 更新上一頁按鈕狀態
  const prevButton = document.querySelector('.prev-btn');
  if (prevButton) {
    if (currentPage === 1) {
      prevButton.setAttribute('disabled', '');
    } else {
      prevButton.removeAttribute('disabled');
    }
  }
  
  // 更新下一頁按鈕狀態
  const nextButton = document.querySelector('.next-btn');
  if (nextButton) {
    if (currentPage === totalPages) {
      nextButton.setAttribute('disabled', '');
    } else {
      nextButton.removeAttribute('disabled');
    }
  }
}

// 顯示當前頁的文章
function displayCurrentPagePosts() {
  // 獲取文章列表容器
  const postsContainer = document.querySelector('.posts-container');
  if (!postsContainer) return;
  
  // 清空容器
  postsContainer.innerHTML = '';
  
  // 計算當前頁的起始和結束索引
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, postListData.length);
  
  // 如果沒有文章數據，顯示提示信息
  if (postListData.length === 0) {
    postsContainer.innerHTML = '<div class="no-posts-message">暫無文章</div>';
    return;
  }
  
  // 顯示當前頁的文章
  console.log('顯示文章數據來源:', postListData.length > 0 ? '後端數據' : '無數據');
  for (let i = startIndex; i < endIndex; i++) {
    const post = postListData[i];
    if (!post) continue;
    
    // 創建文章元素
    const postElement = document.createElement('article');
    postElement.className = 'post-item';
    
    // 設置文章內容 - 適應新的JSON格式
    postElement.innerHTML = `
      <h2 class="post-title"><a href="post.html?id=${post.id}">${post.title}</a></h2>
      <div class="post-meta">發布日期：${post.date}</div>
      <p class="post-excerpt">${post.summary ? getExcerpt(post.summary, 150) : ''}</p>
    `;
    
    // 將文章元素添加到容器中
    postsContainer.appendChild(postElement);
  }
}

// 從文章內容中提取摘要
function getExcerpt(content, maxLength = 150) {
  if (!content) return '';
  
  // 移除HTML標籤
  const plainText = content.replace(/<[^>]+>/g, '');
  
  // 截取指定長度
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // 截取並添加省略號
  return plainText.substring(0, maxLength) + '...';
}


// 初始化應用程序
function initApp() {
  console.log('初始化應用程序...');
  
  // 先讀取webhook_config.json
  loadWebhookConfig()
    .then(url => {
      if (url) {
        console.log('成功載入webhook_config.json，開始獲取資料');
        // 先獲取文章列表（原本的第二次POST）
        fetchPostList();
      } else {
        console.error('無法載入webhook_config.json');
        console.log('請確保webhook_config.json文件存在且包含正確的webhookUrl');
        
        // 顯示錯誤提示
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
          margin: 20px;
          padding: 15px;
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 5px;
          font-family: sans-serif;
        `;
        errorMessage.textContent = '無法載入webhook_config.json，請確保文件存在且包含正確的webhookUrl';
        document.body.insertBefore(errorMessage, document.body.firstChild);
      }
    });
}

// 確保在頁面載入時執行
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded 事件觸發');
  // 初始化應用程序
  initApp();
});

// 添加window.onload作為備用
window.onload = function() {
  console.log('window.onload 事件觸發');
  // 檢查是否已經執行過fetchTotalDataCount
  if (totalItems === 0 && webhookUrl === '') {
    console.log('DOMContentLoaded可能未觸發，使用window.onload執行');
    initApp();
  }
};

// 立即執行一次，確保代碼運行
console.log('index.js 已載入');
setTimeout(() => {
  if (totalItems === 0 && webhookUrl === '') {
    console.log('延遲執行initApp');
    initApp();
  }
}, 1000);