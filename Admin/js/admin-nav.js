// 通用導覽列載入邏輯
document.addEventListener('DOMContentLoaded', function() {
  const navContainer = document.getElementById('admin-navbar');
  if (!navContainer) return;

  // 自動偵測設定檔路徑
  // 統一從根目錄載入設定檔
  const configPath = window.location.pathname.toLowerCase().includes('/admin/') ? '../nav_config.json' : 'nav_config.json';
  
  // 加入除錯訊息
  console.log('正在載入導覽列設定檔:', configPath);

  fetch(configPath)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      const { admin } = data;
      const currentPath = window.location.pathname.split('/').pop();
      
      const brandHTML = `
        <div class="nav-brand">
          <i class="fas fa-tools"></i>
          ${admin.brand}
        </div>
      `;

      const menuHTML = admin.links.map(link => {
        // 路徑處理邏輯
        let adjustedPath = link.path;
        // 如果在 Admin 目錄下且路徑以 "Admin/" 開頭，則移除 "Admin/" 前綴
        if (window.location.pathname.toLowerCase().includes('/admin/') && link.path.startsWith('Admin/')) {
          adjustedPath = link.path.replace('Admin/', '');
        }
        
        return `
        <li class="nav-item">
          <a href="${adjustedPath}"
             class="nav-link ${currentPath === link.path.split('/').pop() ? 'active' : ''}"
             title="${link.title}">
            <i class="${link.icon}"></i>
            <span class="nav-text">${link.title}</span>
          </a>
        </li>
        `;
      }).join('');

      navContainer.innerHTML = `
        ${brandHTML}
        <ul class="nav-menu">${menuHTML}</ul>
      `;
    })
    .catch(error => {
      console.error('導覽列載入失敗:', error);
      navContainer.innerHTML = '<div class="nav-error">導覽列初始化錯誤</div>';
    });
});