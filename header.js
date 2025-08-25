fetch('nav_config.json')
  .then(response => response.json())
  .then(data => {
    const header = document.getElementById('header');
    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    
    data.links.forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.name;
      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(ul);
    header.appendChild(nav);
  })
  .catch(error => console.error('Error loading navigation:', error));