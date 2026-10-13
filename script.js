/* GScode — interacciones ligeras, sin dependencias externas */
(() => {
  'use strict';
  document.documentElement.classList.add('js-enabled');

  const CONTACT_PHONE = '527443768542'; // Número GScode, incluye código de México (52).
  const nav = document.getElementById('main-nav');
  const menuButton = document.querySelector('.menu-button');
  const menuIcon = menuButton.querySelector('use');
  const header = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const sections = [...document.querySelectorAll('main section[id]')];

  const closeMenu = () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
    menuIcon.setAttribute('href', '#i-menu');
    document.body.classList.remove('menu-open');
  };

  menuButton.addEventListener('click', () => {
    const isOpen = !nav.classList.contains('open');
    nav.classList.toggle('open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    menuIcon.setAttribute('href', isOpen ? '#i-x' : '#i-menu');
    document.body.classList.toggle('menu-open', isOpen && window.innerWidth <= 850);
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('open')) closeMenu();
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 850) closeMenu();
  });

  const updateNav = () => {
    header.classList.toggle('scrolled', window.scrollY > 8);
    const pos = window.scrollY + 135;
    let id = 'inicio';
    for (const section of sections) {
      if (section.offsetTop <= pos) id = section.id;
    }
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
  };
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Servicio con pestañas accesibles: mouse, táctil y flechas del teclado.
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = selected => {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.classList.toggle('selected', active);
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('tabindex', active ? '0' : '-1');
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  };
  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      let next = idx;
      if (event.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });
  selectTab(tabs[0]);

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .10, rootMargin: '0px 0px -25px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // Un solo acordeón abierto a la vez.
  document.querySelectorAll('.faq-list details').forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      document.querySelectorAll('.faq-list details').forEach(other => { if (other !== item) other.open = false; });
    });
  });

  // Prepara el texto y abre WhatsApp; este formulario no recopila ni almacena datos.
  const form = document.getElementById('quote-form');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = document.getElementById('contact-name').value.trim();
    const service = document.getElementById('contact-type').value;
    const message = document.getElementById('contact-message').value.trim();
    if (!name || !service || !message) return;
    const text = `Hola, soy ${name}.\n\nMe interesa: ${service}.\n\nDetalles: ${message}\n\nEnviado desde el sitio de GScode.`;
    const url = `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(text)}`;
    // Si el navegador bloquea una nueva pestaña, se redirige en la misma.
    const opened = window.open(url, '_blank');
    if (opened) opened.opener = null;
    else window.location.href = url;
  });

  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
