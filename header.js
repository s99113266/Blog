// 導航配置
let navConfig = {};

// 載入導航配置
function loadNavConfig() {
  fetch('nav_config.json')
    .then(response => response.json())
    .then(data => {
      navConfig = data;
      createHeader();
    })
    .catch(error => console.error('無法載入導航配置:', error));
}

// 生成導航欄
// 生成導航欄
function createHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  
  const nav = document.createElement('nav');
  const ul = document.createElement('ul');
  
  navConfig.links.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.url;
    a.textContent = link.name;
    li.appendChild(a);
    ul.appendChild(li);
  });

  nav.appendChild(ul);
  header.appendChild(nav);
}

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', loadNavConfig);