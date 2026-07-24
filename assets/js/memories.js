// Memory Gallery Module with Full-Screen Split Photo & Caption Viewer
let allMemories = [];
let filteredMemories = [];
let activeMemoryIndex = 0;

async function fetchMemories() {
  try {
    const localData = localStorage.getItem('custom_memories');
    if (localData) {
      allMemories = JSON.parse(localData);
      filteredMemories = [...allMemories];
      return allMemories;
    }

    const res = await fetch('./data/memories.json');
    if (!res.ok) throw new Error('Failed to load memories dataset');
    allMemories = await res.json();
    localStorage.setItem('custom_memories', JSON.stringify(allMemories));
    filteredMemories = [...allMemories];
    return allMemories;
  } catch (err) {
    console.error('Error fetching memories:', err);
    return [];
  }
}

function createMemoryCardHTML(mem, index) {
  return `
    <div class="masonry-item group cursor-pointer" onclick="openFullscreenMemoryViewer(${index})">
      <div class="relative overflow-hidden rounded-2xl bg-stone-100 dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-800 card-hover">
        <img src="${mem.image}" alt="${mem.title}" loading="lazy" class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
          <div class="flex items-center justify-between text-xs text-amber-300 font-medium mb-1">
            <span><i class="fa-solid fa-calendar-days"></i> ${mem.date}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${mem.location}</span>
          </div>
          <h4 class="text-base font-bold font-serif-title mb-1">${mem.title}</h4>
          <p class="text-xs text-stone-300 line-clamp-2">${mem.caption}</p>
          <div class="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
            <span>ดูรูปภาพเต็มจอพร้อมเรื่องราว</span> <i class="fa-solid fa-expand text-[10px]"></i>
          </div>
        </div>
        <div class="p-4 bg-white dark:bg-zinc-900 border-t border-stone-100 dark:border-zinc-800">
          <div class="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
            <span><i class="fa-solid fa-calendar-days"></i> ${mem.date}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${mem.location}</span>
          </div>
          <h4 class="text-base font-bold font-serif-title text-stone-800 dark:text-zinc-100 mb-1">${mem.title}</h4>
          <p class="text-xs text-stone-600 dark:text-zinc-400 line-clamp-2">${mem.caption}</p>
        </div>
      </div>
    </div>
  `;
}

function renderMasonryGrid(memoriesList, targetContainerId = 'memories-grid') {
  const container = document.getElementById(targetContainerId);
  if (!container) return;

  if (memoriesList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-stone-500 dark:text-zinc-400">
        <p class="text-4xl mb-3">🖼️</p>
        <p class="text-lg font-medium">ไม่พบภาพความทรงจำในหมวดหมู่นี้</p>
      </div>
    `;
    return;
  }

  container.innerHTML = memoriesList.map((mem, index) => createMemoryCardHTML(mem, index)).join('');
}

// Open Full-Screen Split Photo & Story Viewer
function openFullscreenMemoryViewer(index) {
  if (index < 0 || index >= filteredMemories.length) return;
  activeMemoryIndex = index;

  const mem = filteredMemories[activeMemoryIndex];

  // Google Tag (gtag.js) Event Tracking
  if (typeof window.trackGAEvent === 'function') {
    window.trackGAEvent('view_memory', {
      memory_id: mem.id,
      memory_title: mem.title,
      memory_location: mem.location,
      memory_category: mem.category
    });
  }

  // Increment Analytics Counter
  try {
    const stats = JSON.parse(localStorage.getItem('admin_analytics_stats')) || { articleViews: 0, memoryViews: 0, history: [] };
    stats.memoryViews = (stats.memoryViews || 0) + 1;
    stats.history.unshift({ type: 'Memory', title: mem.title, time: new Date().toLocaleTimeString('th-TH') });
    if (stats.history.length > 20) stats.history.pop();
    localStorage.setItem('admin_analytics_stats', JSON.stringify(stats));
  } catch (e) { console.error(e); }

  const modal = document.getElementById('fullscreen-memory-modal');
  const imgEl = document.getElementById('fs-memory-img');
  const titleEl = document.getElementById('fs-memory-title');
  const dateEl = document.getElementById('fs-memory-date');
  const locEl = document.getElementById('fs-memory-location');
  const categoryEl = document.getElementById('fs-memory-category');
  const captionEl = document.getElementById('fs-memory-caption');

  if (!modal || !imgEl) return;

  imgEl.src = mem.image;
  imgEl.alt = mem.title;
  titleEl.textContent = mem.title;
  dateEl.innerHTML = `<i class="fa-solid fa-calendar-days text-amber-400"></i> ${mem.date}`;
  locEl.innerHTML = `<i class="fa-solid fa-location-dot text-amber-400"></i> ${mem.location}`;
  if (categoryEl) categoryEl.textContent = mem.category;
  captionEl.textContent = mem.caption;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeFullscreenMemoryViewer() {
  const modal = document.getElementById('fullscreen-memory-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
  }
}

function nextFullscreenMemory() {
  if (activeMemoryIndex < filteredMemories.length - 1) {
    openFullscreenMemoryViewer(activeMemoryIndex + 1);
  } else {
    openFullscreenMemoryViewer(0);
  }
}

function prevFullscreenMemory() {
  if (activeMemoryIndex > 0) {
    openFullscreenMemoryViewer(activeMemoryIndex - 1);
  } else {
    openFullscreenMemoryViewer(filteredMemories.length - 1);
  }
}

// Render Home Page Preview
async function initHomeMemories() {
  const memories = await fetchMemories();
  const grid = document.getElementById('home-memories-grid');
  if (grid) {
    const highlights = memories.slice(0, 4);
    grid.innerHTML = highlights.map((mem) => `
      <div class="relative group aspect-square rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 dark:border-zinc-800 card-hover" onclick="location.href='memories.html'">
        <img src="${mem.image}" alt="${mem.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
          <span class="text-xs text-amber-300 mb-0.5"><i class="fa-solid fa-calendar-days"></i> ${mem.date}</span>
          <h4 class="text-sm font-bold">${mem.title}</h4>
        </div>
      </div>
    `).join('');
  }
}

// Render Memories Page
async function initMemoriesPage() {
  await fetchMemories();
  renderMasonryGrid(filteredMemories);

  const categoryBtns = document.querySelectorAll('.memory-filter-btn');
  categoryBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach((b) => {
        b.classList.remove('bg-amber-600', 'text-white');
        b.classList.add('bg-stone-100', 'dark:bg-zinc-800', 'text-stone-600', 'dark:text-zinc-400');
      });

      btn.classList.remove('bg-stone-100', 'dark:bg-zinc-800', 'text-stone-600', 'dark:text-zinc-400');
      btn.classList.add('bg-amber-600', 'text-white');

      const cat = btn.getAttribute('data-category');
      if (cat === 'All') {
        filteredMemories = [...allMemories];
      } else {
        filteredMemories = allMemories.filter((m) => m.category === cat);
      }
      renderMasonryGrid(filteredMemories);
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('fullscreen-memory-modal');
    if (modal && !modal.classList.contains('hidden')) {
      if (e.key === 'Escape') closeFullscreenMemoryViewer();
      if (e.key === 'ArrowRight') nextFullscreenMemory();
      if (e.key === 'ArrowLeft') prevFullscreenMemory();
    }
  });
}

// Export functions to Window Scope
window.fetchMemories = fetchMemories;
window.openFullscreenMemoryViewer = openFullscreenMemoryViewer;
window.closeFullscreenMemoryViewer = closeFullscreenMemoryViewer;
window.nextFullscreenMemory = nextFullscreenMemory;
window.prevFullscreenMemory = prevFullscreenMemory;
window.initHomeMemories = initHomeMemories;
window.initMemoriesPage = initMemoriesPage;
