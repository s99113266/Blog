fetch('footer_config.json')
  .then(response => response.json())
  .then(data => {
    const footer = document.getElementById('footer');
    const p = document.createElement('p');
    p.textContent = data.copyright;
    footer.appendChild(p);
  })
  .catch(error => console.error('Error loading footer:', error));