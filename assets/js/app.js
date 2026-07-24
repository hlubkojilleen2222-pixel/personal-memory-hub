// Global App Script
document.addEventListener('DOMContentLoaded', () => {
  // Active Navigation Link Highlight
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('text-amber-600', 'dark:text-amber-400', 'font-bold');
      link.classList.remove('text-stone-600', 'dark:text-zinc-400');
    }
  });

  // Mobile Menu Drawer Handler
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menuDrawer = document.getElementById('mobile-menu-drawer');
  const closeMenuBtn = document.getElementById('close-menu-btn');

  if (menuBtn && menuDrawer) {
    menuBtn.addEventListener('click', () => {
      menuDrawer.classList.remove('hidden');
    });
  }

  if (closeMenuBtn && menuDrawer) {
    closeMenuBtn.addEventListener('click', () => {
      menuDrawer.classList.add('hidden');
    });
  }
});
