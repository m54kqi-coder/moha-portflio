// ===== Navigation Scroll =====
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => { header.classList.toggle('scrolled', window.scrollY > 40); });

// ===== Mobile Menu =====
const burger = document.getElementById('burger');
const navLinks = document.querySelector('.nav-links');
burger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('mobile-open');
  burger.classList.toggle('open', isOpen);
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('mobile-open');
  burger.classList.remove('open');
}));

// ===== Reveal on Scroll (يُطبق أيضاً على العناصر المُولّدة لاحقاً) =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.1 });
function observeReveal(root = document) {
  root.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
}
observeReveal();

// أسماء الفلاتر بالعربي لكل تصنيف (fallback لو التصنيف جديد يعرض نفسه كما هو)
const CATEGORY_LABELS = {
  thumbnails: 'ثمبنيلات',
  branding: 'هويات بصرية',
  cards: 'بطاقات أعمال',
  ads: 'إعلانات',
  cv: 'سير ذاتية'
};
const FALLBACK_ART_CLASSES = ['art1','art2','art3','art4','art5','art6'];

// ===== تحميل الصور من data/photos.json وبناء الشبكة + الفلاتر تلقائياً =====
async function loadPhotos() {
  const grid = document.getElementById('photoGrid');
  const filterBar = document.getElementById('filterBar');
  if (!grid) return;
  try {
    const res = await fetch('data/photos.json', { cache: 'no-store' });
    const data = await res.json();
    const items = data.items || [];

    // بناء أزرار الفلتر تلقائياً من التصنيفات الموجودة فعلياً بالبيانات
    const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.filter = cat;
      btn.textContent = CATEGORY_LABELS[cat] || cat;
      filterBar.appendChild(btn);
    });

    // بناء بطاقات الصور
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'p-card reveal';
      card.dataset.category = item.category || '';

      const art = document.createElement('div');
      if (item.image) {
        art.className = 'art';
        art.style.backgroundImage = `url('${item.image}')`;
        art.style.backgroundSize = 'cover';
        art.style.backgroundPosition = 'center';
      } else {
        art.className = 'art ' + FALLBACK_ART_CLASSES[idx % FALLBACK_ART_CLASSES.length];
      }

      const fade = document.createElement('div');
      fade.className = 'fade';

      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = `
        <div class="num">${String(idx + 1).padStart(2, '0').replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d])}</div>
        <div class="name">${item.name || ''}</div>
        <div class="cat">${item.cat || ''}</div>
      `;

      card.append(art, fade, info);
      grid.appendChild(card);
    });

    observeReveal();
    initFilters();
  } catch (err) {
    console.error('تعذر تحميل بيانات الصور:', err);
  }
}

// ===== تفعيل الفلاتر (تشتغل على أي بطاقات حالياً بالصفحة) =====
function initFilters() {
  const filterChips = document.querySelectorAll('.filter-chip');
  const photoCards = document.querySelectorAll('.photo-grid .p-card');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      photoCards.forEach(card => {
        card.classList.toggle('filtered-out', filter !== 'all' && card.dataset.category !== filter);
      });
    });
  });
}

// ===== تحميل الفيديوهات من data/videos.json وبناء الشبكة + التحكم المخصص =====
async function loadVideos() {
  const grid = document.getElementById('reelGrid');
  if (!grid) return;
  try {
    const res = await fetch('data/videos.json', { cache: 'no-store' });
    const data = await res.json();
    const items = data.items || [];

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'r-card reveal';

      const video = document.createElement('video');
      video.className = 'custom-video';
      video.preload = 'none';
      video.loop = true;
      video.playsInline = true;
      if (item.video) video.src = item.video;

      const overlay = document.createElement('div');
      overlay.className = 'play-btn-overlay';
      overlay.innerHTML = `
        <svg class="icon-play" width="20" height="20" viewBox="0 0 24 24" fill="#F5F1EC"><path d="M8 5v14l11-7z"/></svg>
        <svg class="icon-pause" width="20" height="20" viewBox="0 0 24 24" fill="#F5F1EC" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
      `;

      const meta = document.createElement('div');
      meta.className = 'r-meta';
      meta.innerHTML = `
        <div><div class="name">${item.name || ''}</div><div class="tag2">${item.tag2 || ''}</div></div>
        <div class="r-dur">${item.duration || ''}</div>
      `;

      card.append(video, overlay, meta);
      grid.appendChild(card);
    });

    observeReveal();
    initVideoControls();
  } catch (err) {
    console.error('تعذر تحميل بيانات الفيديوهات:', err);
  }
}

// ===== أزرار تشغيل/إيقاف الفيديو المخصصة =====
function initVideoControls() {
  document.querySelectorAll('.r-card').forEach(card => {
    const video = card.querySelector('video');
    const playBtn = card.querySelector('.play-btn-overlay');
    const iconPlay = card.querySelector('.icon-play');
    const iconPause = card.querySelector('.icon-pause');
    if (!video || !playBtn) return;

    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
        playBtn.classList.add('is-playing');
        card.classList.add('is-playing');
      } else {
        video.pause();
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
        playBtn.classList.remove('is-playing');
        card.classList.remove('is-playing');
      }
    });
    video.addEventListener('ended', () => {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      playBtn.classList.remove('is-playing');
      card.classList.remove('is-playing');
    });
  });
}

loadPhotos();
loadVideos();
