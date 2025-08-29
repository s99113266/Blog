// 動態載入類別選項
fetch('../categories_config.json')
  .then(response => response.json())
  .then(data => {
    const categorySelect = document.getElementById('category');
    data.categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  });

// 表單提交處理
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 處理 TinyMCE 編輯器
  const contentTextarea = document.getElementById('content');
  
  // 確保 TinyMCE 編輯器的內容同步到 textarea
  if (tinymce.get('content')) {
    tinymce.get('content').save();
    
    // 檢查內容是否為空
    if (!contentTextarea.value.trim()) {
      alert('請填寫文章內容');
      return;
    }
    
    // 暫時移除 required 屬性以避免驗證錯誤
    contentTextarea.removeAttribute('required');
  }
  
  // 取得webhook URL
  const webhookConfig = await fetch('../../webhook_config.json')
    .then(response => response.json());

  // 使用 FormData 代替 JSON
  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('content', document.getElementById('content').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('page', document.getElementById('page').value);
  formData.append('pwd', document.getElementById('pwd').value);

  const statusMessage = document.getElementById('statusMessage');
  
  try {
    const response = await fetch(webhookConfig.webhookUrl, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      statusMessage.textContent = '文章提交成功！';
      statusMessage.className = 'status-message success';
      document.getElementById('postForm').reset();
    } else {
      throw new Error('伺服器回應錯誤');
    }
  } catch (error) {
    statusMessage.textContent = `提交失敗：${error.message}`;
    statusMessage.className = 'status-message error';
  }
  
  statusMessage.style.display = 'block';
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 5000);
});

// 載入共用元件
document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    fetch('../header.js').then(res => res.text()),
    fetch('../footer.js').then(res => res.text())
  ]).then(([headerScript, footerScript]) => {
    eval(headerScript);
    eval(footerScript);
  });
});