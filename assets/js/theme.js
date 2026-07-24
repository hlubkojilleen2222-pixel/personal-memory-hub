// Dark/Light Theme Switcher Module
(function () {
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');

  // Determine initial theme
  const userTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // Initial check
  if (userTheme === 'dark' || (!userTheme && systemTheme)) {
    applyTheme(true);
  } else {
    applyTheme(false);
  }

  // Toggle Listener
  document.addEventListener('DOMContentLoaded', () => {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(!isDark);
      });
    });
  });
})();
