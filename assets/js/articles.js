// Articles Manager Module with LocalStorage Persistence & Admin Hooks
let allArticles = [];
let activeCategory = 'All';

async function fetchArticles() {
  try {
    const localData = localStorage.getItem('custom_articles');
    if (localData) {
      allArticles = JSON.parse(localData);
      return allArticles;
    }

    const res = await fetch('./data/articles.json');
    if (!res.ok) throw new Error('Failed to load articles dataset');
    allArticles = await res.json();
    localStorage.setItem('custom_articles', JSON.stringify(allArticles));
    return allArticles;
  } catch (err) {
    console.error('Error fetching articles:', err);
    return [];
  }
}

// Convert Simple Markdown to HTML
function renderMarkdown(mdText) {
  if (!mdText) return '';
  let html = mdText
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-amber-700 dark:text-amber-400 mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold border-b border-stone-200 dark:border-zinc-700 pb-2 mt-6 mb-3">$1</h2>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-amber-500 pl-4 py-2 my-4 italic bg-amber-500/5 rounded-r">$1</blockquote>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/gim, '</p><p class="mb-3">');

  return `<p class="mb-3">${html}</p>`;
}

// Render Article Cards
function createArticleCardHTML(article) {
  const categoryColors = {
    Life: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    Tech: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    Travel: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    Thoughts: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
  };

  const badgeStyle = categoryColors[article.category] || 'bg-stone-100 text-stone-800 dark:bg-zinc-800 dark:text-zinc-300';

  return `
    <article class="card-hover bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer" onclick="openArticleModal('${article.id}')">
      <div class="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-zinc-800">
        <img src="${article.coverImage}" alt="${article.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <span class="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-md ${badgeStyle}">
          ${article.category}
        </span>
      </div>
      <div class="p-6 flex flex-col flex-1">
        <div class="flex items-center gap-3 text-xs text-stone-500 dark:text-zinc-400 mb-3">
          <span>📅 ${article.date}</span>
          <span>•</span>
          <span>⏱️ ${article.readTime}</span>
        </div>
        <h3 class="text-xl font-bold font-serif-title mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
          ${article.title}
        </h3>
        <p class="text-stone-600 dark:text-zinc-400 text-sm line-clamp-3 mb-4 flex-1">
          ${article.excerpt}
        </p>
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
          อ่านต่อ <span>→</span>
        </div>
      </div>
    </article>
  `;
}

// Render Articles Grid
function renderArticlesGrid(articlesList, targetContainerId = 'articles-container') {
  const container = document.getElementById(targetContainerId);
  if (!container) return;

  if (articlesList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-stone-500 dark:text-zinc-400">
        <p class="text-4xl mb-3">🔍</p>
        <p class="text-lg font-medium">ไม่พบบทความที่คุณค้นหา</p>
        <p class="text-sm text-stone-400 dark:text-zinc-500 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นดูนะครับ</p>
      </div>
    `;
    return;
  }

  container.innerHTML = articlesList.map(createArticleCardHTML).join('');
}

// Render Recent Articles on Home Page
async function initHomeArticles() {
  const articles = await fetchArticles();
  const recentContainer = document.getElementById('recent-articles-container');
  if (recentContainer) {
    const recent = articles.slice(0, 3);
    recentContainer.innerHTML = recent.map(createArticleCardHTML).join('');
  }
}

// Render Articles Page
async function initArticlesPage() {
  const articles = await fetchArticles();
  renderArticlesGrid(articles);

  const searchInput = document.getElementById('article-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterArticles(e.target.value, activeCategory);
    });
  }

  const categoryBtns = document.querySelectorAll('.category-filter-btn');
  categoryBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach((b) => {
        b.classList.remove('bg-amber-600', 'text-white');
        b.classList.add('bg-stone-100', 'dark:bg-zinc-800', 'text-stone-600', 'dark:text-zinc-400');
      });

      btn.classList.remove('bg-stone-100', 'dark:bg-zinc-800', 'text-stone-600', 'dark:text-zinc-400');
      btn.classList.add('bg-amber-600', 'text-white');

      activeCategory = btn.getAttribute('data-category');
      const searchQuery = searchInput ? searchInput.value : '';
      filterArticles(searchQuery, activeCategory);
    });
  });
}

function filterArticles(searchQuery, category) {
  let filtered = allArticles;

  if (category && category !== 'All') {
    filtered = filtered.filter((art) => art.category.toLowerCase() === category.toLowerCase());
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((art) =>
      art.title.toLowerCase().includes(q) ||
      art.excerpt.toLowerCase().includes(q) ||
      art.category.toLowerCase().includes(q)
    );
  }

  renderArticlesGrid(filtered);
}

// Modal Reader Function
function openArticleModal(articleId) {
  const article = allArticles.find((a) => a.id === articleId);
  if (!article) return;

  const modal = document.getElementById('article-modal');
  const modalContent = document.getElementById('article-modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="relative">
      <div class="h-64 sm:h-80 w-full overflow-hidden rounded-t-2xl relative">
        <img src="${article.coverImage}" alt="${article.title}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <button onclick="closeArticleModal()" class="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-md transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div class="absolute bottom-6 left-6 right-6 text-white">
          <span class="inline-block px-3 py-1 bg-amber-500/90 text-xs font-semibold rounded-full mb-3 backdrop-blur-md">
            ${article.category}
          </span>
          <h1 class="text-2xl sm:text-3xl font-bold font-serif-title leading-tight mb-2">${article.title}</h1>
          <div class="flex items-center gap-4 text-xs text-stone-200">
            <span>📅 ${article.date}</span>
            <span>•</span>
            <span>⏱️ ${article.readTime}</span>
          </div>
        </div>
      </div>

      <div class="p-6 sm:p-10 prose-custom text-stone-800 dark:text-zinc-200">
        ${renderMarkdown(article.content)}
      </div>

      <div class="p-6 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50 dark:bg-zinc-900/50 rounded-b-2xl">
        <span class="text-xs text-stone-500 dark:text-zinc-400">แบ่งปันบทความนี้</span>
        <button onclick="copyArticleLink('${article.title}')" class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
          คัดลอกลิงก์บทความ
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  // Google Tag (gtag.js) Event Tracking
  if (typeof window.trackGAEvent === 'function') {
    window.trackGAEvent('view_article', {
      article_id: article.id,
      article_title: article.title,
      article_category: article.category
    });
  }

  // Increment Local Analytics Counter for Admin Dashboard
  try {
    const stats = JSON.parse(localStorage.getItem('admin_analytics_stats')) || { articleViews: 0, memoryViews: 0, history: [] };
    stats.articleViews = (stats.articleViews || 0) + 1;
    stats.history.unshift({ type: 'Article', title: article.title, time: new Date().toLocaleTimeString('th-TH') });
    if (stats.history.length > 20) stats.history.pop();
    localStorage.setItem('admin_analytics_stats', JSON.stringify(stats));
  } catch (e) { console.error(e); }
}

function closeArticleModal() {
  const modal = document.getElementById('article-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
  }
}

function copyArticleLink(title) {
  navigator.clipboard.writeText(window.location.href);
  showToast(`คัดลอกลิงก์บทความ "${title.substring(0, 20)}..." สำเร็จแล้ว!`);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-3 rounded-xl shadow-xl text-sm z-50 transition-all duration-300 transform translate-y-4 opacity-0';
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Export to Global Window Scope
window.fetchArticles = fetchArticles;
window.renderMarkdown = renderMarkdown;
window.openArticleModal = openArticleModal;
window.closeArticleModal = closeArticleModal;
window.copyArticleLink = copyArticleLink;
window.initHomeArticles = initHomeArticles;
window.initArticlesPage = initArticlesPage;
window.showToast = showToast;
