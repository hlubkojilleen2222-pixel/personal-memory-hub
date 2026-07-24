// Admin Dashboard Controller Script
const ADMIN_PASSCODE = 'admin123';

document.addEventListener('DOMContentLoaded', async () => {
  const loginSection = document.getElementById('admin-login-section');
  const dashboardSection = document.getElementById('admin-dashboard-section');
  const passcodeForm = document.getElementById('passcode-form');
  const passcodeInput = document.getElementById('passcode-input');
  const passcodeError = document.getElementById('passcode-error');

  // Check existing session auth
  if (sessionStorage.getItem('admin_authed') === 'true') {
    showDashboard();
  }

  // Passcode Auth Submit
  if (passcodeForm) {
    passcodeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (passcodeInput.value === ADMIN_PASSCODE) {
        sessionStorage.setItem('admin_authed', 'true');
        showDashboard();
      } else {
        passcodeError.classList.remove('hidden');
        passcodeInput.value = '';
      }
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('admin_authed');
      window.location.reload();
    });
  }

  async function showDashboard() {
    if (loginSection) loginSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');

    // Load initial data into Admin State
    await window.fetchArticles();
    await window.fetchMemories();

    renderAdminDashboardOverview();
    initAdminTabs();
    initArticlesAdmin();
    initMemoriesAdmin();
    initExportAdmin();
  }
});

// Admin Tab Switching
function initAdminTabs() {
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => {
        b.classList.remove('bg-amber-600', 'text-white');
        b.classList.add('bg-stone-100', 'dark:bg-zinc-800', 'text-stone-600', 'dark:text-zinc-400');
      });

      btn.classList.remove('bg-stone-100', 'dark:bg-zinc-800', 'text-stone-600', 'dark:text-zinc-400');
      btn.classList.add('bg-amber-600', 'text-white');

      const targetTab = btn.getAttribute('data-tab');
      tabPanes.forEach((pane) => {
        if (pane.id === targetTab) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });
    });
  });
}

// -------------------------------------------------------------
// 1. Articles Admin Logic
// -------------------------------------------------------------
let editingArticleId = null;

function initArticlesAdmin() {
  const form = document.getElementById('article-form');
  const cancelBtn = document.getElementById('cancel-article-edit-btn');
  const mdInput = document.getElementById('art-content-input');
  const mdPreview = document.getElementById('art-md-preview');

  renderAdminArticlesList();

  // Live Markdown Preview Listener
  if (mdInput && mdPreview) {
    mdInput.addEventListener('input', () => {
      mdPreview.innerHTML = window.renderMarkdown(mdInput.value) || '<p class="text-stone-400 italic">ตัวอย่างเนื้อหาจะแสดงตรงนี้...</p>';
    });
  }

  // Article Form Submit (Create or Edit)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const articles = JSON.parse(localStorage.getItem('custom_articles')) || [];
      const title = document.getElementById('art-title-input').value.trim();
      const category = document.getElementById('art-category-input').value;
      const readTime = document.getElementById('art-readtime-input').value.trim() || '5 นาที';
      const coverImage = document.getElementById('art-cover-input').value.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop';
      const excerpt = document.getElementById('art-excerpt-input').value.trim();
      const content = document.getElementById('art-content-input').value;

      if (editingArticleId) {
        // Edit existing article
        const index = articles.findIndex((a) => a.id === editingArticleId);
        if (index !== -1) {
          articles[index] = {
            ...articles[index],
            title,
            category,
            readTime,
            coverImage,
            excerpt,
            content
          };
          window.showToast('แก้ไขบทความสำเร็จ!');
        }
        editingArticleId = null;
      } else {
        // Create new article
        const newArticle = {
          id: 'art-' + Date.now(),
          title,
          category,
          date: new Date().toISOString().split('T')[0],
          readTime,
          coverImage,
          excerpt,
          content
        };
        articles.unshift(newArticle);
        window.showToast('เพิ่มบทความใหม่เรียบร้อยแล้ว!');
      }

      localStorage.setItem('custom_articles', JSON.stringify(articles));
      resetArticleForm();
      renderAdminArticlesList();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetArticleForm);
  }
}

function resetArticleForm() {
  editingArticleId = null;
  const form = document.getElementById('article-form');
  if (form) form.reset();
  document.getElementById('art-submit-btn').textContent = '➕ เพิ่มบทความใหม่';
  document.getElementById('cancel-article-edit-btn').classList.add('hidden');
  document.getElementById('art-md-preview').innerHTML = '<p class="text-stone-400 italic">ตัวอย่างเนื้อหาจะแสดงตรงนี้...</p>';
}

function renderAdminArticlesList() {
  const container = document.getElementById('admin-articles-list');
  if (!container) return;

  const articles = JSON.parse(localStorage.getItem('custom_articles')) || [];
  if (articles.length === 0) {
    container.innerHTML = '<p class="text-stone-500 text-center py-6 text-sm">ยังไม่มีบทความในระบบ</p>';
    return;
  }

  container.innerHTML = articles.map((art) => `
    <div class="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-4 shadow-sm">
      <div class="flex items-center gap-3 overflow-hidden">
        <img src="${art.coverImage}" class="w-14 h-14 rounded-lg object-cover flex-shrink-0">
        <div class="min-w-0">
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">${art.category}</span>
          <h4 class="font-bold text-sm text-stone-800 dark:text-zinc-100 truncate mt-1">${art.title}</h4>
          <span class="text-xs text-stone-500">📅 ${art.date} • ⏱️ ${art.readTime}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button onclick="editArticle('${art.id}')" class="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-semibold rounded-lg transition-colors">
          ✏️ แก้ไข
        </button>
        <button onclick="deleteArticle('${art.id}')" class="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold rounded-lg transition-colors">
          🗑️ ลบ
        </button>
      </div>
    </div>
  `).join('');
}

function editArticle(id) {
  const articles = JSON.parse(localStorage.getItem('custom_articles')) || [];
  const art = articles.find((a) => a.id === id);
  if (!art) return;

  editingArticleId = id;
  document.getElementById('art-title-input').value = art.title;
  document.getElementById('art-category-input').value = art.category;
  document.getElementById('art-readtime-input').value = art.readTime;
  document.getElementById('art-cover-input').value = art.coverImage;
  document.getElementById('art-excerpt-input').value = art.excerpt;
  document.getElementById('art-content-input').value = art.content;
  document.getElementById('art-md-preview').innerHTML = window.renderMarkdown(art.content);

  document.getElementById('art-submit-btn').textContent = '💾 บันทึกการแก้ไข';
  document.getElementById('cancel-article-edit-btn').classList.remove('hidden');

  window.scrollTo({ top: document.getElementById('article-form').offsetTop - 100, behavior: 'smooth' });
}

function deleteArticle(id) {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบทความนี้?')) return;

  let articles = JSON.parse(localStorage.getItem('custom_articles')) || [];
  articles = articles.filter((a) => a.id !== id);
  localStorage.setItem('custom_articles', JSON.stringify(articles));
  renderAdminArticlesList();
  window.showToast('ลบบทความเรียบร้อยแล้ว');
}

// -------------------------------------------------------------
// 2. Memories Admin Logic
// -------------------------------------------------------------
let editingMemoryId = null;

function initMemoriesAdmin() {
  const form = document.getElementById('memory-form');
  const cancelBtn = document.getElementById('cancel-memory-edit-btn');
  const fileInput = document.getElementById('mem-file-input');
  const urlInput = document.getElementById('mem-image-input');

  renderAdminMemoriesGrid();

  // Convert File to Base64 Data URL if uploaded
  if (fileInput && urlInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          urlInput.value = event.target.result;
          window.showToast('โหลดรูปภาพเรียบร้อยแล้ว!');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const memories = JSON.parse(localStorage.getItem('custom_memories')) || [];
      const title = document.getElementById('mem-title-input').value.trim();
      const date = document.getElementById('mem-date-input').value || new Date().toISOString().split('T')[0];
      const location = document.getElementById('mem-location-input').value.trim() || 'Thailand';
      const category = document.getElementById('mem-category-input').value;
      const image = document.getElementById('mem-image-input').value.trim() || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop';
      const caption = document.getElementById('mem-caption-input').value.trim();

      if (editingMemoryId) {
        const index = memories.findIndex((m) => m.id === editingMemoryId);
        if (index !== -1) {
          memories[index] = {
            ...memories[index],
            title,
            date,
            location,
            category,
            image,
            caption
          };
          window.showToast('แก้ไขภาพความทรงจำสำเร็จ!');
        }
        editingMemoryId = null;
      } else {
        const newMemory = {
          id: 'mem-' + Date.now(),
          title,
          date,
          location,
          category,
          image,
          caption
        };
        memories.unshift(newMemory);
        window.showToast('เพิ่มภาพความทรงจำใหม่เรียบร้อยแล้ว!');
      }

      localStorage.setItem('custom_memories', JSON.stringify(memories));
      resetMemoryForm();
      renderAdminMemoriesGrid();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetMemoryForm);
  }
}

function resetMemoryForm() {
  editingMemoryId = null;
  const form = document.getElementById('memory-form');
  if (form) form.reset();
  document.getElementById('mem-submit-btn').textContent = '➕ เพิ่มภาพความทรงจำ';
  document.getElementById('cancel-memory-edit-btn').classList.add('hidden');
}

function renderAdminMemoriesGrid() {
  const container = document.getElementById('admin-memories-grid');
  if (!container) return;

  const memories = JSON.parse(localStorage.getItem('custom_memories')) || [];
  if (memories.length === 0) {
    container.innerHTML = '<p class="text-stone-500 text-center py-6 text-sm col-span-full">ยังไม่มีความทรงจำในระบบ</p>';
    return;
  }

  container.innerHTML = memories.map((mem) => `
    <div class="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
      <div class="aspect-square relative overflow-hidden bg-stone-100 dark:bg-zinc-800">
        <img src="${mem.image}" class="w-full h-full object-cover">
        <span class="absolute top-2 left-2 px-2.5 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-md">${mem.category}</span>
      </div>
      <div class="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 class="font-bold text-sm text-stone-800 dark:text-zinc-100 truncate">${mem.title}</h4>
          <span class="text-xs text-stone-500">📅 ${mem.date} • 📍 ${mem.location}</span>
        </div>
        <div class="flex items-center gap-2 mt-3 pt-2 border-t border-stone-100 dark:border-zinc-800">
          <button onclick="editMemory('${mem.id}')" class="flex-1 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-semibold rounded transition-colors text-center">
            ✏️ แก้ไข
          </button>
          <button onclick="deleteMemory('${mem.id}')" class="flex-1 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold rounded transition-colors text-center">
            🗑️ ลบ
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function editMemory(id) {
  const memories = JSON.parse(localStorage.getItem('custom_memories')) || [];
  const mem = memories.find((m) => m.id === id);
  if (!mem) return;

  editingMemoryId = id;
  document.getElementById('mem-title-input').value = mem.title;
  document.getElementById('mem-date-input').value = mem.date;
  document.getElementById('mem-location-input').value = mem.location;
  document.getElementById('mem-category-input').value = mem.category;
  document.getElementById('mem-image-input').value = mem.image;
  document.getElementById('mem-caption-input').value = mem.caption;

  document.getElementById('mem-submit-btn').textContent = '💾 บันทึกการแก้ไข';
  document.getElementById('cancel-memory-edit-btn').classList.remove('hidden');

  window.scrollTo({ top: document.getElementById('memory-form').offsetTop - 100, behavior: 'smooth' });
}

function deleteMemory(id) {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบความทรงจำนี้?')) return;

  let memories = JSON.parse(localStorage.getItem('custom_memories')) || [];
  memories = memories.filter((m) => m.id !== id);
  localStorage.setItem('custom_memories', JSON.stringify(memories));
  renderAdminMemoriesGrid();
  window.showToast('ลบความทรงจำเรียบร้อยแล้ว');
}

// -------------------------------------------------------------
// 3. Export / Backup / Reset Data Logic
// -------------------------------------------------------------
function initExportAdmin() {
  const exportArticlesBtn = document.getElementById('export-articles-btn');
  const exportMemoriesBtn = document.getElementById('export-memories-btn');
  const resetDefaultsBtn = document.getElementById('reset-defaults-btn');

  if (exportArticlesBtn) {
    exportArticlesBtn.addEventListener('click', () => {
      const articles = localStorage.getItem('custom_articles') || '[]';
      downloadFile(articles, 'articles.json', 'application/json');
      window.showToast('ส่งออกไฟล์ articles.json สำเร็จ!');
    });
  }

  if (exportMemoriesBtn) {
    exportMemoriesBtn.addEventListener('click', () => {
      const memories = localStorage.getItem('custom_memories') || '[]';
      downloadFile(memories, 'memories.json', 'application/json');
      window.showToast('ส่งออกไฟล์ memories.json สำเร็จ!');
    });
  }

  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('คุณแน่ใจหรือไม่ว่าจะรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นจากไฟล์ JSON?')) {
        localStorage.removeItem('custom_articles');
        localStorage.removeItem('custom_memories');
        window.showToast('รีเซ็ตข้อมูลเรียบร้อยแล้วกำลังรีโหลด...');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  }
}

function downloadFile(content, fileName, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

function renderAdminDashboardOverview() {
  const container = document.getElementById('admin-overview-dashboard');
  if (!container) return;

  const articles = JSON.parse(localStorage.getItem('custom_articles')) || [];
  const memories = JSON.parse(localStorage.getItem('custom_memories')) || [];
  const stats = JSON.parse(localStorage.getItem('admin_analytics_stats')) || { articleViews: 0, memoryViews: 0, history: [] };

  const articleCategories = new Set(articles.map((a) => a.category));
  const memoryCategories = new Set(memories.map((m) => m.category));
  const totalCategories = new Set([...articleCategories, ...memoryCategories]).size;
  const totalViews = (stats.articleViews || 0) + (stats.memoryViews || 0);

  container.innerHTML = `
    <!-- Top 4 Summary Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
          📝
        </div>
        <div>
          <span class="text-xs text-stone-500 dark:text-zinc-400 font-medium">บทความทั้งหมด</span>
          <h3 class="text-2xl font-bold text-stone-800 dark:text-zinc-100 font-serif-title">${articles.length} <span class="text-xs font-normal text-stone-400">รายการ</span></h3>
        </div>
      </div>

      <div class="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
          🖼️
        </div>
        <div>
          <span class="text-xs text-stone-500 dark:text-zinc-400 font-medium">ภาพความทรงจำ</span>
          <h3 class="text-2xl font-bold text-stone-800 dark:text-zinc-100 font-serif-title">${memories.length} <span class="text-xs font-normal text-stone-400">ภาพ</span></h3>
        </div>
      </div>

      <div class="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
          🏷️
        </div>
        <div>
          <span class="text-xs text-stone-500 dark:text-zinc-400 font-medium">หมวดหมู่เนื้อหา</span>
          <h3 class="text-2xl font-bold text-stone-800 dark:text-zinc-100 font-serif-title">${totalCategories} <span class="text-xs font-normal text-stone-400">หมวด</span></h3>
        </div>
      </div>

      <div class="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold">
          👁️
        </div>
        <div>
          <span class="text-xs text-stone-500 dark:text-zinc-400 font-medium">การเปิดชมทั้งหมด</span>
          <h3 class="text-2xl font-bold text-stone-800 dark:text-zinc-100 font-serif-title">${totalViews} <span class="text-xs font-normal text-stone-400">ครั้ง</span></h3>
        </div>
      </div>
    </div>

    <!-- Recent Engagement Activity Stream -->
    <div class="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-bold text-sm text-stone-800 dark:text-zinc-100 flex items-center gap-2">
          <span>⚡</span> กิจกรรมการเปิดดูเสมือนจริงล่าสุด (Live Interaction Feed)
        </h4>
        <span class="text-xs text-stone-400">อัปเดตอัตโนมัติ</span>
      </div>
      
      ${stats.history && stats.history.length > 0 ? `
        <div class="space-y-2 max-h-36 overflow-y-auto pr-1">
          ${stats.history.slice(0, 5).map((item) => `
            <div class="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-stone-50 dark:bg-zinc-800/60 text-stone-700 dark:text-zinc-300">
              <div class="flex items-center gap-2 truncate">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'Article' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}">${item.type}</span>
                <span class="truncate font-medium">${item.title}</span>
              </div>
              <span class="text-stone-400 text-[11px] flex-shrink-0 ml-2">${item.time}</span>
            </div>
          `).join('')}
        </div>
      ` : `
        <p class="text-xs text-stone-400 italic py-2">ยังไม่มีประวัติการเปิดอ่านในเซสชันนี้ (ทดลองคลิกอ่านบทความหน้าเว็บเพื่อดูสถิติได้เลยครับ)</p>
      `}
    </div>
  `;
}

// Export to Global Window Scope
window.renderAdminDashboardOverview = renderAdminDashboardOverview;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.editMemory = editMemory;
window.deleteMemory = deleteMemory;

