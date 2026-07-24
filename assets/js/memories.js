// Memory Gallery & Lightbox Module with LocalStorage Persistence
let allMemories = [];
let activeMemoryIndex = 0;
let filteredMemories = [];

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
    <div class="masonry-item group cursor-pointer" onclick="openLightbox(${index})">
      <div class="relative overflow-hidden rounded-2xl bg-stone-100 dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-800 card-hover">
        <img src="${mem.image}" alt="${mem.title}" loading="lazy" class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
          <div class="flex items-center justify-between text-xs text-amber-300 font-medium mb-1">
            <span>📅 ${mem.date}</span>
            <span>📍 ${mem.location}</span>
          </div>
          <h4 class="text-base font-bold font-serif-title mb-1">${mem.title}</h4>
          <p class="text-xs text-stone-300 line-clamp-2">${mem.caption}</p>
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

// Render Home Page Preview
async function initHomeMemories() {
  const memories = await fetchMemories();
  const grid = document.getElementById('home-memories-grid');
  if (grid) {
    const highlights = memories.slice(0, 4);
    grid.innerHTML = highlights.map((mem, index) => `
      <div class="relative group aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-stone-200/80 dark:border-zinc-800 card-hover" onclick="location.href='memories.html'">
        <img src="${mem.image}" alt="${mem.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
          <span class="text-xs text-amber-300 mb-0.5">📅 ${mem.date}</span>
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

  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightbox-modal');
    if (modal && !modal.classList.contains('hidden')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
    }
  });
}

function openLightbox(index) {
  if (index < 0 || index >= filteredMemories.length) return;
  activeMemoryIndex = index;

  const mem = filteredMemories[activeMemoryIndex];
  const modal = document.getElementById('lightbox-modal');
  const imgEl = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-title');
  const dateEl = document.getElementById('lightbox-date');
  const locEl = document.getElementById('lightbox-location');
  const captionEl = document.getElementById('lightbox-caption');

  if (!modal || !imgEl) return;

  imgEl.src = mem.image;
  imgEl.alt = mem.title;
  titleEl.textContent = mem.title;
  dateEl.textContent = `📅 ${mem.date}`;
  locEl.textContent = `📍 ${mem.location}`;
  captionEl.textContent = mem.caption;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  // Google Tag (gtag.js) Event Tracking
  if (typeof window.trackGAEvent === 'function') {
    window.trackGAEvent('view_memory', {
      memory_id: mem.id,
      memory_title: mem.title,
      memory_location: mem.location,
      memory_category: mem.category
    });
  }

  // Increment Local Analytics Counter for Admin Dashboard
  try {
    const stats = JSON.parse(localStorage.getItem('admin_analytics_stats')) || { articleViews: 0, memoryViews: 0, history: [] };
    stats.memoryViews = (stats.memoryViews || 0) + 1;
    stats.history.unshift({ type: 'Memory', title: mem.title, time: new Date().toLocaleTimeString('th-TH') });
    if (stats.history.length > 20) stats.history.pop();
    localStorage.setItem('admin_analytics_stats', JSON.stringify(stats));
  } catch (e) { console.error(e); }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
  }
}

function nextLightboxImage() {
  if (activeMemoryIndex < filteredMemories.length - 1) {
    openLightbox(activeMemoryIndex + 1);
  } else {
    openLightbox(0);
  }
}

function prevLightboxImage() {
  if (activeMemoryIndex > 0) {
    openLightbox(activeMemoryIndex - 1);
  } else {
    openLightbox(filteredMemories.length - 1);
  }
}

// Export functions to Window Scope
window.fetchMemories = fetchMemories;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.nextLightboxImage = nextLightboxImage;
window.prevLightboxImage = prevLightboxImage;
window.initHomeMemories = initHomeMemories;
window.initMemoriesPage = initMemoriesPage;
