/**
 * admin-index.js - 處理管理後台文章列表頁面的功能
 * 主要功能：
 * 1. 從後端獲取文章列表
 * 2. 顯示文章列表
 * 3. 提供編輯功能，連結到 create_post.html 頁面
 * 4. 提供刪除文章功能
 */

// 全局變數
let webhookUrl = '';
let postListData = [];
let currentDeletePostId = null;
let currentPage = 1; // 當前頁碼
let totalPages = 0; // 總頁數
let totalItems = 0; // 總筆數
const ITEMS_PER_PAGE = 10; // 每頁顯示10筆資料

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', () => {
  console.log('管理後台文章列表頁面腳本開始執行');
  
  // 從 URL 獲取頁碼參數
  currentPage = getPageFromUrl();
  console.log('當前頁碼:', currentPage);
  
  // 載入 webhook 配置
  loadWebhookConfig();
  
  // 設置刪除對話框事件
  setupDeleteModal();
});

// 從 URL 獲取頁碼參數
function getPageFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('pg');
  // 如果 URL 中沒有 pg 參數，則默認為 1
  return pageParam ? parseInt(pageParam) : 1;
}

// 載入 webhook 配置
function loadWebhookConfig() {
  console.log('開始讀取 webhook_config.json...');
  
  fetch('../../webhook_config.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`無法讀取 webhook_config.json: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(config => {
      console.log('成功讀取 webhook_config.json:', config);
      webhookUrl = config.webhookUrl;
      
      // 載入成功後獲取文章列表
      fetchPostList();
    })
    .catch(error => {
      console.error('讀取 webhook_config.json 時發生錯誤:', error);
      showStatusMessage('無法讀取 webhook 配置，請稍後再試', 'error');
    });
}

// 獲取文章列表
function fetchPostList() {
  console.log('開始獲取文章列表...');
  
  if (!webhookUrl) {
    console.error('webhookUrl 未設置，無法發送請求');
    showStatusMessage('無法發送請求，webhookUrl 未設置', 'error');
    return;
  }
  
  // 顯示載入指示器
  const postListContent = document.getElementById('post-list-content');
  postListContent.innerHTML = `
    <div class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i> 正在載入文章列表...
    </div>
  `;
  
  // 創建 FormData 物件
  const formData = new FormData();
  formData.append('page', '列表');
  formData.append('pg', currentPage.toString()); // 添加當前頁碼
  
  // 發送 POST 請求
  fetch(webhookUrl, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`網路回應不正常: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('獲取文章列表成功:', data);
    
    // 保存文章列表數據
    if (data.data && Array.isArray(data.data)) {
      postListData = data.data;
      
      // 顯示文章列表
      displayPostList(postListData);
      
      // 獲取總筆數，用於分頁
      fetchTotalCount();
    } else {
      console.warn('警告: 文章列表數據格式不符合預期');
      postListContent.innerHTML = `
        <div class="no-posts-message">
          <i class="fas fa-exclamation-circle"></i> 無法獲取文章列表，數據格式不正確
        </div>
      `;
    }
  })
  .catch(error => {
    console.error('獲取文章列表時發生錯誤:', error);
    postListContent.innerHTML = `
      <div class="no-posts-message">
        <i class="fas fa-exclamation-circle"></i> 獲取文章列表失敗，請稍後再試
      </div>
    `;
  });
}

// 顯示文章列表
function displayPostList(posts) {
  console.log('開始顯示文章列表:', posts);
  
  const postListContent = document.getElementById('post-list-content');
  
  // 如果沒有文章，顯示提示信息
  if (!posts || posts.length === 0) {
    postListContent.innerHTML = `
      <div class="no-posts-message">
        <i class="fas fa-info-circle"></i> 暫無文章
      </div>
    `;
    return;
  }
  
  // 創建文章列表 HTML
  let postsHTML = '';
  
  // 添加文章項目
  posts.forEach(post => {
    const postId = post.number || post.id;
    const postTitle = post.title || '無標題';
    const postCategory = post.class || '未分類';
    const postDate = post.pushdate || post.date || '未知日期';
    const postExcerpt = post.summary || (post.text ? getExcerpt(post.text, 150) : '無內容');
    
    postsHTML += `
      <article class="post-item" data-post-id="${postId}">
        <div class="post-category" data-category="${postCategory}">${postCategory}</div>
        <h2 class="post-title">
          <a href="../article.html?no=${postId}" target="_blank">${postTitle}</a>
        </h2>
        <div class="post-meta">發布日期：${postDate}</div>
        <p class="post-excerpt">${postExcerpt}</p>
        <div class="post-actions">
          <a href="create_post.html?no=${postId}" class="edit-btn">
            <i class="fas fa-edit"></i> 編輯
          </a>
          <button class="delete-btn" data-post-id="${postId}">
            <i class="fas fa-trash-alt"></i> 刪除
          </button>
        </div>
      </article>
    `;
  });
  
  // 更新 DOM
  postListContent.innerHTML = postsHTML;
  
  // 設置文章分類的顏色
  setPostCategoryColors();
  
  // 添加刪除按鈕事件監聽
  setupDeleteButtons();
}

// 從文章內容中提取摘要
function getExcerpt(content, maxLength = 150) {
  if (!content) return '';
  
  // 移除 HTML 標籤
  const plainText = content.replace(/<[^>]+>/g, '');
  
  // 截取指定長度
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // 截取並添加省略號
  return plainText.substring(0, maxLength) + '...';
}

// 設置文章分類的顏色
function setPostCategoryColors() {
  const categoryElements = document.querySelectorAll('.post-category');
  
  categoryElements.forEach(element => {
    const category = element.getAttribute('data-category');
    let backgroundColor = '#777'; // 默認顏色
    
    // 根據分類設置顏色
    switch(category) {
      case '技術':
        backgroundColor = '#4CAF50';
        break;
      case '生活':
        backgroundColor = '#2196F3';
        break;
      case '心情':
        backgroundColor = '#FF9800';
        break;
    }
    
    element.style.backgroundColor = backgroundColor;
  });
}

// 設置刪除按鈕事件監聽
function setupDeleteButtons() {
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const postId = this.getAttribute('data-post-id');
      showDeleteConfirmation(postId);
    });
  });
}

// 注意：編輯文章功能已改為直接使用連結，不再需要此函數

// 顯示刪除確認對話框
function showDeleteConfirmation(postId) {
  console.log('顯示刪除確認對話框:', postId);
  
  // 保存當前要刪除的文章 ID
  currentDeletePostId = postId;
  
  // 顯示對話框
  const deleteModal = document.getElementById('delete-modal');
  deleteModal.style.display = 'flex';
  
  // 查找文章標題
  const post = postListData.find(p => (p.number || p.id) == postId);
  if (post) {
    const message = document.querySelector('.delete-modal-message');
    message.textContent = `您確定要刪除「${post.title}」這篇文章嗎？此操作無法撤銷。`;
  }
}

// 設置刪除對話框事件
function setupDeleteModal() {
  const deleteModal = document.getElementById('delete-modal');
  const cancelButton = document.getElementById('delete-modal-cancel');
  const confirmButton = document.getElementById('delete-modal-confirm');
  
  // 取消按鈕事件
  cancelButton.addEventListener('click', () => {
    deleteModal.style.display = 'none';
    currentDeletePostId = null;
  });
  
  // 確認按鈕事件
  confirmButton.addEventListener('click', () => {
    if (currentDeletePostId) {
      // 獲取管理員密碼
      const adminPassword = document.getElementById('admin-password').value;
      
      // 檢查密碼是否為空
      if (!adminPassword.trim()) {
        alert('請輸入管理員密碼');
        return;
      }
      
      // 刪除文章
      deletePost(currentDeletePostId, adminPassword);
      
      // 清空密碼欄位
      document.getElementById('admin-password').value = '';
    }
    deleteModal.style.display = 'none';
  });
  
  // 點擊對話框外部關閉對話框
  deleteModal.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
      deleteModal.style.display = 'none';
      currentDeletePostId = null;
    }
  });
}

// 刪除文章
function deletePost(postId, password) {
  console.log('刪除文章:', postId);
  
  if (!webhookUrl) {
    console.error('webhookUrl 未設置，無法發送請求');
    showStatusMessage('無法發送請求，webhookUrl 未設置', 'error');
    return;
  }
  
  // 創建 FormData 物件
  const formData = new FormData();
  formData.append('page', '刪除');
  formData.append('no', postId);
  formData.append('pwd', password);
  
  // 顯示載入狀態
  showStatusMessage('正在刪除文章...', 'info');
  
  // 發送 POST 請求
  fetch(webhookUrl, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`網路回應不正常: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('刪除文章回應:', data);
    
    // 檢查回應狀態
    if (data.state === 0) {
      showStatusMessage('文章刪除成功', 'success');
      
      // 重新獲取文章列表
      fetchPostList();
    } else {
      showStatusMessage('刪除文章失敗: ' + (data.message || '未知錯誤'), 'error');
    }
  })
  .catch(error => {
    console.error('刪除文章時發生錯誤:', error);
    showStatusMessage('刪除文章時發生錯誤: ' + error.message, 'error');
  });
}

// 獲取總筆數
function fetchTotalCount() {
  console.log('開始獲取總筆數...');
  
  if (!webhookUrl) {
    console.error('webhookUrl 未設置，無法發送請求');
    return;
  }
  
  // 創建 FormData 物件
  const formData = new FormData();
  formData.append('page', '總筆數');
  formData.append('pg', currentPage.toString()); // 添加當前頁碼
  
  // 發送 POST 請求
  fetch(webhookUrl, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`網路回應不正常: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('獲取總筆數成功:', data);
    
    // 保存總筆數
    if (data.maxdata !== undefined) {
      totalItems = data.maxdata;
      
      // 計算總頁數
      totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      
      // 生成分頁區塊
      generatePagination();
    } else {
      console.warn('警告: 返回數據中沒有 maxdata 欄位');
    }
  })
  .catch(error => {
    console.error('獲取總筆數時發生錯誤:', error);
  });
}

// 生成分頁區塊
function generatePagination() {
  console.log('開始生成分頁區塊');
  console.log('總筆數:', totalItems);
  console.log('總頁數:', totalPages);
  console.log('當前頁碼:', currentPage);
  
  const postListContent = document.getElementById('post-list-content');
  
  // 檢查是否已存在分頁導航，如果存在則移除
  const existingPagination = document.querySelector('.pagination');
  if (existingPagination) {
    existingPagination.remove();
  }
  
  // 創建總筆數信息
  const totalCountInfo = document.createElement('div');
  totalCountInfo.className = 'total-count-info';
  totalCountInfo.textContent = `共有 ${totalItems} 篇文章，分 ${totalPages} 頁顯示`;
  
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
  postListContent.appendChild(totalCountInfo);
  postListContent.appendChild(paginationElement);
  
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
        navigateToPage(page);
      }
    });
  });
  
  // 上一頁按鈕點擊事件
  const prevButton = document.querySelector('.prev-btn');
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        navigateToPage(currentPage - 1);
      }
    });
  }
  
  // 下一頁按鈕點擊事件
  const nextButton = document.querySelector('.next-btn');
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        navigateToPage(currentPage + 1);
      }
    });
  }
}

// 導航到指定頁面
function navigateToPage(page) {
  // 更新 URL 中的頁碼參數
  const url = new URL(window.location.href);
  url.searchParams.set('pg', page.toString());
  window.location.href = url.toString();
}

// 顯示狀態消息
function showStatusMessage(message, type = 'info') {
  const statusMessage = document.getElementById('status-message');
  statusMessage.textContent = message;
  statusMessage.className = 'status-message';
  
  // 添加類型樣式
  switch (type) {
    case 'success':
      statusMessage.classList.add('success');
      break;
    case 'error':
      statusMessage.classList.add('error');
      break;
    default:
      statusMessage.classList.add('info');
  }
  
  // 顯示消息
  statusMessage.style.display = 'block';
  
  // 5 秒後自動隱藏
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 5000);
}