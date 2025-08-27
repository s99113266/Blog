// 頁腳配置
let footerConfig = {};

// 載入頁腳配置
function loadFooterConfig() {
  fetch('footer_config.json')
    .then(response => response.json())
    .then(data => {
      footerConfig = data;
      createFooter();
    })
    .catch(error => console.error('無法載入頁腳配置:', error));
}

// 生成頁腳
// 生成頁腳
function createFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  
  const p = document.createElement('p');
  p.textContent = footerConfig.copyright;
  footer.appendChild(p);
}

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', loadFooterConfig);