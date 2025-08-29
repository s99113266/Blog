/**
 * index.js - 處理index.html的資料處理事件
 * 主要功能：當頁面載入時，發送POST請求獲取資料總筆數和文章列表
 */

// 立即執行的函數，確保變量不會污染全局命名空間
(function() {
  console.log('內聯腳本開始執行');
  
  // 全局變數
  const ITEMS_PER_PAGE = 10; // 每頁顯示10筆資料
  
  // 從URL獲取頁碼參數，如果沒有則默認為1
  function getPageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('pg');
    // 如果URL中沒有pg參數，則默認為1
    return pageParam ? parseInt(pageParam) : 1;
  }
  
  // 當前頁碼 - 從URL獲取，如果沒有則默認為1
  let currentPage = getPageFromUrl();
  console.log('當前頁碼: ' + currentPage);
  
  // 全局變數
  let totalPages = 0; // 總頁數
  let totalItems = 0; // 總筆數
  let postListData = []; // 文章列表數據
  let webhookUrl = ''; // Webhook URL

  // 生成文章列表HTML
  function generateArticleList(articles) {
    console.log('開始生成文章列表HTML');
    
    // 獲取文章列表容器
    const postListElement = document.querySelector('.post-list');
    if (!postListElement) {
      console.error('找不到.post-list元素，無法生成文章列表');
      return;
    }
    
    // 清空現有的文章元素
    const existingPosts = postListElement.querySelectorAll('.post-item');
    existingPosts.forEach(post => post.remove());
    
    // 創建文章列表容器
    const postsContainer = document.createElement('div');
    postsContainer.className = 'posts-container';
    
    // 獲取頁面標題元素
    const pageTitle = postListElement.querySelector('.page-title');
    
    // 將文章列表容器插入到適當位置
    if (pageTitle) {
      postListElement.insertBefore(postsContainer, pageTitle.nextSibling);
    } else {
      postListElement.appendChild(postsContainer);
    }
    
    // 如果沒有文章數據，顯示提示信息
    if (articles.length === 0) {
      postsContainer.innerHTML = '<div class="no-posts-message">暫無文章</div>';
      return;
    }
    
    // 計算當前頁的起始和結束索引
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, articles.length);
    
    // 顯示當前頁的文章
    console.log(`顯示第${startIndex+1}到第${endIndex}篇文章`);
    for (let i = startIndex; i < endIndex; i++) {
      const post = articles[i];
      if (!post) continue;
      
      // 創建文章元素
      const postElement = document.createElement('article');
      postElement.className = 'post-item';
      
      // 設置文章內容 - 適應JSON格式
      postElement.innerHTML = `
        <div class="post-category" data-category="${post.class || '未分類'}">${post.class || '未分類'}</div>
        <h2 class="post-title"><a href="article.html?no=${post.number || post.id}" target="_blank">${post.title || '無標題'}</a></h2>
        <div class="post-meta">發布日期：${post.pushdate || post.date || '未知日期'}</div>
        <p class="post-excerpt">${post.summary || (post.text ? getExcerpt(post.text, 150) : '無內容')}</p>
      `;
      
      // 將文章元素添加到容器中
      postsContainer.appendChild(postElement);
    }
    
    // 設置文章分類的顏色
    setPostCategoryColors();
    
    console.log('文章列表HTML生成完成');
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
  
  // 生成分頁區塊
  function generatePagination(totalPages, totalCount) {
    console.log('開始生成分頁區塊');
    
    // 獲取文章列表容器
    const postListElement = document.querySelector('.post-list');
    if (!postListElement) {
      console.error('找不到.post-list元素，無法生成分頁區塊');
      return;
    }
    
    // 創建一個顯示總筆數的元素
    const totalCountElement = document.createElement('div');
    totalCountElement.className = 'total-count-info';
    totalCountElement.textContent = `共有 ${totalCount} 篇文章，分 ${totalPages} 頁顯示`;
    
    // 檢查是否已存在總筆數信息，如果存在則移除
    const existingTotalCount = postListElement.querySelector('.total-count-info');
    if (existingTotalCount) {
      existingTotalCount.remove();
    }
    
    // 將元素插入到文章列表的頂部
    const pageTitle = postListElement.querySelector('.page-title');
    if (pageTitle) {
      postListElement.insertBefore(totalCountElement, pageTitle.nextSibling);
    } else {
      postListElement.prepend(totalCountElement);
    }
    
    // 檢查是否已存在分頁導航，如果存在則移除
    const existingPagination = postListElement.querySelector('.pagination');
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
    
    console.log('分頁區塊生成完成');
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
          
          // 更新URL中的頁碼參數
          updateUrlWithPage(page);
          
          // 如果有文章數據，重新顯示當前頁的文章
          if (window.postListData && window.postListData.length > 0) {
            generateArticleList(window.postListData);
          }
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
          
          // 更新URL中的頁碼參數
          updateUrlWithPage(currentPage);
          
          // 如果有文章數據，重新顯示當前頁的文章
          if (window.postListData && window.postListData.length > 0) {
            generateArticleList(window.postListData);
          }
        }
      });
    }
    
    // 下一頁按鈕點擊事件
    const nextButton = document.querySelector('.next-btn');
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (currentPage < window.totalPages) {
          currentPage++;
          updatePagination();
          
          // 更新URL中的頁碼參數
          updateUrlWithPage(currentPage);
          
          // 如果有文章數據，重新顯示當前頁的文章
          if (window.postListData && window.postListData.length > 0) {
            generateArticleList(window.postListData);
          }
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
      if (currentPage === window.totalPages) {
        nextButton.setAttribute('disabled', '');
      } else {
        nextButton.removeAttribute('disabled');
      }
    }
  }
  
  // 更新URL中的頁碼參數
  function updateUrlWithPage(page) {
    // 創建一個URL對象
    const url = new URL(window.location.href);
    // 設置或更新pg參數
    url.searchParams.set('pg', page.toString());
    // 使用history API更新URL，不重新加載頁面
    window.history.pushState({}, '', url);
    console.log('URL已更新:', url.toString());
  }
  
  // 從webhook_config.json讀取webhook URL
  function loadWebhookConfig() {
    console.log('開始讀取webhook_config.json...');
    
    return fetch('webhook_config.json')
      .then(response => {
        console.log('webhook_config.json 回應狀態:', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`無法讀取webhook_config.json: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(config => {
        console.log('成功讀取webhook_config.json:', config);
        webhookUrl = config.webhookUrl;
        console.log('設置webhookUrl:', webhookUrl);
        
        // 讀取成功後發送POST請求
        sendFirstPostRequest();
        
        return webhookUrl;
      })
      .catch(error => {
        console.error('讀取webhook_config.json時發生錯誤:', error);
        console.error('無法發送POST請求，因為無法獲取webhookUrl');
        
        // 顯示錯誤消息
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          background-color: #f44336;
          color: white;
          padding: 10px 15px;
          border-radius: 5px;
          font-family: sans-serif;
          font-size: 14px;
          z-index: 9999;
        `;
        errorMessage.textContent = '無法讀取webhook_config.json，無法發送POST請求';
        document.body.appendChild(errorMessage);
        
        return null;
      });
  }
  
  // 發送第一次POST請求（列表）
  function sendFirstPostRequest() {
    // 檢查webhookUrl是否已設置
    if (!webhookUrl) {
      console.error('webhookUrl未設置，無法發送請求');
      return;
    }
    console.log('開始發送第一次POST請求（列表）...');
    
    // 創建FormData物件
    const formData = new FormData();
    formData.append('page', '列表');
    formData.append('pg', currentPage.toString()); // 添加當前頁碼作為pg欄位
    
    console.log('使用Webhook URL:', webhookUrl);
    console.log('FormData內容:');
    console.log('  - page:', formData.get('page'));
    console.log('  - pg:', formData.get('pg'));
    
    // 使用XMLHttpRequest發送POST請求
    const xhr = new XMLHttpRequest();
    xhr.open('POST', webhookUrl, true);
    
    xhr.onload = function() {
      console.log('第一次POST請求收到回應:', xhr.status, xhr.statusText);
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('第一次POST請求成功!');
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('第一次POST請求返回數據:', data);
          
          // 直接處理返回的數據，不顯示JSON
          if (data.data && Array.isArray(data.data)) {
            console.log('成功從後端獲取文章列表數據');
            console.log('文章數量:', data.data.length);
            
            // 詳細顯示第一篇文章的所有屬性
            if (data.data.length > 0) {
              const firstPost = data.data[0];
              console.log('第一篇文章詳細資料:');
              console.log('- 主鍵索引 (id):', firstPost.id);
              console.log('- 文章編號 (number):', firstPost.number);
              console.log('- 文章標題 (title):', firstPost.title);
              console.log('- 發文日期 (pushdate):', firstPost.pushdate);
              console.log('- 文章摘要 (summary):', firstPost.summary);
              console.log('- 文章類別 (class):', firstPost.class);
            }
            
            // 保存文章列表數據
            window.postListData = data.data;
            
            // 直接生成文章列表
            generateArticleList(data.data);
          } else {
            console.warn('警告: 文章列表數據格式不符合預期');
            console.log('實際數據:', data);
          }
          
          // 發送第二次POST請求
          sendSecondPostRequest();
        } catch (e) {
          console.error('解析JSON時發生錯誤:', e);
          // 即使解析失敗，也嘗試發送第二次請求
          sendSecondPostRequest();
        }
      } else {
        console.error('第一次POST請求失敗:', xhr.status, xhr.statusText);
        // 即使第一次請求失敗，也嘗試發送第二次請求
        sendSecondPostRequest();
      }
    };
    
    xhr.onerror = function() {
      console.error('第一次POST請求發生網絡錯誤!');
      console.error('錯誤詳情:', xhr.statusText);
      // 即使第一次請求失敗，也嘗試發送第二次請求
      sendSecondPostRequest();
    };
    
    // 發送請求
    xhr.send(formData);
    console.log('第一次POST請求已發送，包含page=' + formData.get('page') + '和pg=' + formData.get('pg'));
  }
  
  // 發送第二次POST請求（總筆數）
  function sendSecondPostRequest() {
    console.log('開始發送第二次POST請求（總筆數）...');
    
    // 創建FormData物件
    const formData = new FormData();
    formData.append('page', '總筆數');
    formData.append('pg', currentPage.toString()); // 添加當前頁碼作為pg欄位
    
    console.log('使用Webhook URL:', webhookUrl);
    console.log('FormData內容:');
    console.log('  - page:', formData.get('page'));
    console.log('  - pg:', formData.get('pg'));
    
    // 使用XMLHttpRequest發送POST請求
    const xhr = new XMLHttpRequest();
    xhr.open('POST', webhookUrl, true);
    
    xhr.onload = function() {
      console.log('第二次POST請求收到回應:', xhr.status, xhr.statusText);
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('第二次POST請求成功!');
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('第二次POST請求返回數據:', data);
          
          // 處理獲取到的資料總筆數
          if (data.maxdata !== undefined) {
            console.log('資料總筆數 (maxdata):', data.maxdata);
            
            // 保存總筆數
            window.totalItems = data.maxdata;
            
            // 計算總頁數
            window.totalPages = Math.ceil(data.maxdata / ITEMS_PER_PAGE);
            
            console.log('總頁數:', window.totalPages);
            
            // 生成分頁區塊
            generatePagination(window.totalPages, data.maxdata);
          } else {
            console.warn('警告: 返回數據中沒有maxdata欄位');
            console.log('實際數據:', data);
          }
        } catch (e) {
          console.error('解析JSON時發生錯誤:', e);
        }
      } else {
        console.error('第二次POST請求失敗:', xhr.status, xhr.statusText);
      }
    };
    
    xhr.onerror = function() {
      console.error('第二次POST請求發生網絡錯誤!');
      console.error('錯誤詳情:', xhr.statusText);
    };
    
    // 發送請求
    xhr.send(formData);
    console.log('第二次POST請求已發送，包含page=' + formData.get('page') + '和pg=' + formData.get('pg'));
  }

  // 獲取資料總筆數
  function fetchTotalDataCount() {
  console.log('%c開始獲取資料總筆數...', 'color: blue; font-weight: bold;');
  
  // 檢查webhookUrl是否已設置
  if (!webhookUrl) {
    console.error('webhookUrl未設置，無法發送請求');
    console.log('請確保webhook_config.json中包含正確的webhookUrl');
    showErrorMessage('無法發送POST請求：webhookUrl未設置');
    return;
  }
  
  // 創建FormData物件
  const formData = new FormData();
  
  // 添加page欄位，值為"總筆數"
  formData.append('page', '總筆數');
  formData.append('pg', currentPage.toString()); // 添加當前頁碼作為pg欄位
  
  console.log('使用Webhook URL:', webhookUrl);
  
  // 顯示加載指示器
  showLoadingIndicator('正在發送第二次POST請求...');
  
  // 發送POST請求前的詳細日誌
  console.log('%c正在發送第二次POST請求...', 'background: #ff9800; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  console.log('請求方法: POST');
  console.log('請求URL:', webhookUrl);
  console.log('請求參數:', {page: '總筆數'});
  
  // 檢查FormData內容
  console.log('FormData內容:');
  for (let pair of formData.entries()) {
    console.log(`  - ${pair[0]}: ${pair[1]}`);
  }
  
  // 發送POST請求
  console.log('%c即將發送POST請求到:', 'background: #E91E63; color: white; font-size: 14px; font-weight: bold; padding: 5px;', webhookUrl);
  
  // 使用XMLHttpRequest作為備用方法，以防fetch API有問題
  const xhr = new XMLHttpRequest();
  xhr.open('POST', webhookUrl, true);
  xhr.onload = function() {
    console.log('%cXMLHttpRequest 回應:', 'color: purple; font-weight: bold;', xhr.status, xhr.statusText);
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
        console.log('%cXMLHttpRequest 成功:', 'color: green; font-weight: bold;', data);
        // 處理返回的數據
        handleTotalDataCount(data.maxdata);
      } catch (e) {
        console.error('解析JSON時發生錯誤:', e);
      }
    } else {
      console.error('XMLHttpRequest 請求失敗:', xhr.status, xhr.statusText);
    }
  };
  xhr.onerror = function() {
    console.error('XMLHttpRequest 網絡錯誤');
  };
  xhr.send(formData);
  
  // 同時使用fetch API發送請求
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
  console.log('%c開始獲取文章列表...', 'color: blue; font-weight: bold;');
  
  // 檢查webhookUrl是否已設置
  if (!webhookUrl) {
    console.error('webhookUrl未設置，無法發送請求');
    console.log('請確保webhook_config.json中包含正確的webhookUrl');
    showErrorMessage('無法發送POST請求：webhookUrl未設置');
    return;
  }
  
  // 創建FormData物件
  const formData = new FormData();
  
  // 添加page欄位，值為"列表"
  formData.append('page', '列表');
  formData.append('pg', currentPage.toString()); // 添加當前頁碼作為pg欄位
  
  console.log('使用Webhook URL:', webhookUrl);
  
  // 顯示加載指示器
  showLoadingIndicator('正在發送第一次POST請求...');
  
  // 發送POST請求前的詳細日誌
  console.log('%c正在發送第一次POST請求...', 'background: #ff9800; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  console.log('請求方法: POST');
  console.log('請求URL:', webhookUrl);
  console.log('請求參數:', {page: '列表'});
  
  // 檢查FormData內容
  console.log('FormData內容:');
  for (let pair of formData.entries()) {
    console.log(`  - ${pair[0]}: ${pair[1]}`);
  }
  
  // 發送POST請求
  console.log('%c即將發送POST請求到:', 'background: #E91E63; color: white; font-size: 14px; font-weight: bold; padding: 5px;', webhookUrl);
  
  // 使用XMLHttpRequest作為備用方法，以防fetch API有問題
  const xhr = new XMLHttpRequest();
  xhr.open('POST', webhookUrl, true);
  xhr.onload = function() {
    console.log('%cXMLHttpRequest 回應:', 'color: purple; font-weight: bold;', xhr.status, xhr.statusText);
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
        console.log('%cXMLHttpRequest 成功:', 'color: green; font-weight: bold;', data);
        // 處理返回的數據
        displayJsonResponse(data);
        
        // 保存文章列表數據
        if (data.data && Array.isArray(data.data)) {
          postListData = data.data;
          // 渲染文章列表
          renderPostList();
          // 創建分頁導航
          createPagination(totalPages);
          // 顯示當前頁的文章
          displayCurrentPagePosts();
        }
        
        // 獲取資料總筆數
        fetchTotalDataCount();
      } catch (e) {
        console.error('解析JSON時發生錯誤:', e);
      }
    } else {
      console.error('XMLHttpRequest 請求失敗:', xhr.status, xhr.statusText);
    }
  };
  xhr.onerror = function() {
    console.error('XMLHttpRequest 網絡錯誤');
  };
  xhr.send(formData);
  
  // 同時使用fetch API發送請求
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
        console.log('- 主鍵索引 (id):', firstPost.id);
        console.log('- 文章編號 (number):', firstPost.number);
        console.log('- 文章標題 (title):', firstPost.title);
        console.log('- 發文日期 (pushdate):', firstPost.pushdate);
        console.log('- 文章內容 (text):', firstPost.text ? firstPost.text.substring(0, 100) + '...' : '無內容');
        console.log('- 文章摘要 (summary):', firstPost.summary ? firstPost.summary.substring(0, 100) + '...' : '無內容');
        console.log('- 文章類別 (class):', firstPost.class);
        console.log('- 狀態 (state):', firstPost.state);
        
        // 檢查是否有其他屬性
        const knownProps = ['id', 'title', 'text', 'pushdate', 'summary', 'class', 'state', 'number'];
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
        console.log(`${index + 1}. ${post.title} (編號: ${post.number}, 類別: ${post.class})`);
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
  // 創建一個新的div元素來顯示JSON數據
  const jsonDisplayElement = document.createElement('div');
  jsonDisplayElement.id = 'json-response-display';
  jsonDisplayElement.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 80%;
    max-width: 800px;
    max-height: 300px;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 15px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    white-space: pre-wrap;
    word-break: break-all;
  `;
  
  // 添加一個關閉按鈕
  const closeButton = document.createElement('button');
  closeButton.textContent = '關閉';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 3px 8px;
    cursor: pointer;
  `;
  closeButton.onclick = function() {
    document.body.removeChild(jsonDisplayElement);
  };
  
  // 添加JSON數據
  const jsonContent = document.createElement('pre');
  jsonContent.textContent = JSON.stringify(data, null, 2);
  
  // 組合元素
  jsonDisplayElement.appendChild(closeButton);
  jsonDisplayElement.appendChild(jsonContent);
  
  // 移除可能已存在的JSON顯示元素
  const existingElement = document.getElementById('json-response-display');
  if (existingElement) {
    document.body.removeChild(existingElement);
  }
  
  // 添加到頁面
  document.body.appendChild(jsonDisplayElement);
  
  // 記錄到控制台
  console.log('JSON數據已顯示在頁面上', data);
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

  // 更新URL中的頁碼參數
  function updateUrlWithPage(page) {
  // 創建一個URL對象
  const url = new URL(window.location.href);
  // 設置或更新pg參數
  url.searchParams.set('pg', page.toString());
  // 使用history API更新URL，不重新加載頁面
  window.history.pushState({}, '', url);
  console.log('URL已更新:', url.toString());
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
        // 更新URL中的頁碼參數
        updateUrlWithPage(page);
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
        // 更新URL中的頁碼參數
        updateUrlWithPage(currentPage);
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
        // 更新URL中的頁碼參數
        updateUrlWithPage(currentPage);
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
      <div class="post-category" data-category="${post.class}">${post.class}</div>
      <h2 class="post-title"><a href="article.html?no=${post.number || post.id}" target="_blank">${post.title}</a></h2>
      <div class="post-meta">發布日期：${post.pushdate || post.date}</div>
      <p class="post-excerpt">${post.summary ? getExcerpt(post.summary, 150) : (post.text ? getExcerpt(post.text, 150) : '')}</p>
    `;
    
    // 將文章元素添加到容器中
    postsContainer.appendChild(postElement);
  }
  
  // 設置文章分類的顏色
  setPostCategoryColors();
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
          backgroundColor = 'var(--category-tech)';
          break;
        case '生活':
          backgroundColor = 'var(--category-life)';
          break;
        case '心情':
          backgroundColor = 'var(--category-mood)';
          break;
      }
      
      element.style.backgroundColor = backgroundColor;
    });
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
    console.log('%c初始化應用程序...', 'background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
    
    // 先讀取webhook_config.json
    loadWebhookConfig()
      .then(url => {
        if (url) {
          console.log('%c成功載入webhook_config.json，開始獲取資料', 'color: green; font-weight: bold;');
          console.log('%c按照需求順序：先發送"列表"請求，再發送"總筆數"請求', 'color: blue; font-weight: bold;');
          // 按照需求順序：先發送"列表"請求，再發送"總筆數"請求
          fetchPostList();
        } else {
          console.error('%c無法載入webhook_config.json', 'color: red; font-weight: bold;');
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

  // 立即執行，讀取配置並發送POST請求
  console.log('開始讀取配置並發送POST請求');
  loadWebhookConfig();
  
  // 也在window.onload事件中執行，以防萬一
  window.addEventListener('load', function() {
    console.log('window.onload事件觸發，再次確保配置讀取和POST請求發送');
    // 檢查是否已經發送過請求
    if (!window.postRequestSent) {
      window.postRequestSent = true;
      loadWebhookConfig();
    }
  });
  
  // 顯示加載指示器
  function showLoadingIndicator(message) {
  // 移除可能已存在的加載指示器
  const existingIndicator = document.getElementById('loading-indicator');
  if (existingIndicator) {
    document.body.removeChild(existingIndicator);
  }
  
  // 創建加載指示器
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading-indicator';
  loadingIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 9999;
    display: flex;
    align-items: center;
  `;
  
  // 添加旋轉動畫
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    margin-right: 10px;
    animation: spin 1s linear infinite;
  `;
  
  // 添加CSS動畫
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // 添加消息
  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  
  // 組合元素
  loadingIndicator.appendChild(spinner);
  loadingIndicator.appendChild(messageElement);
  
  // 添加到頁面
  document.body.appendChild(loadingIndicator);
  
  // 5秒後自動移除
  setTimeout(() => {
    if (document.body.contains(loadingIndicator)) {
      document.body.removeChild(loadingIndicator);
    }
  }, 5000);
}

  // 顯示錯誤消息
  function showErrorMessage(message) {
  // 創建錯誤消息元素
  const errorMessage = document.createElement('div');
  errorMessage.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background-color: #f44336;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 9999;
  `;
  errorMessage.textContent = message;
  
  // 添加關閉按鈕
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    position: absolute;
    top: 5px;
    right: 5px;
  `;
  closeButton.onclick = function() {
    document.body.removeChild(errorMessage);
  };
  
  // 組合元素
  errorMessage.appendChild(closeButton);
  
  // 添加到頁面
  document.body.appendChild(errorMessage);
  
  // 5秒後自動移除
  setTimeout(() => {
    if (document.body.contains(errorMessage)) {
      document.body.removeChild(errorMessage);
    }
  }, 5000);
}
})();