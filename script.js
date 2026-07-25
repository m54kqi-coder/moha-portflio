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

// ===== Reveal on Scroll =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.1 });
function observeReveal(root = document) {
  root.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
}
observeReveal();

// أسماء التصنيفات بالعربي (fallback لو التصنيف جديد يعرض اسمه كما هو)
const CATEGORY_LABELS = {
  thumbnails: 'ثمبنيلات',
  branding: 'هويات بصرية',
  cards: 'بطاقات أعمال',
  ads: 'إعلانات',
  cv: 'سير ذاتية'
};
const CATEGORY_ORDER = ['thumbnails', 'branding', 'cards', 'ads', 'cv'];
const FALLBACK_ART_CLASSES = ['art1', 'art2', 'art3', 'art4', 'art5', 'art6'];

// ===== أداة بناء عنصر أكورديون واحد (تُستخدم للصور والفيديوهات) =====
function createAccordionItem({ headerLeftHTML, contentEl, exclusiveGroup }) {
  const wrap = document.createElement('div');
  wrap.className = 'cat-acc';

  const header = document.createElement('button');
  header.className = 'cat-header';
  header.setAttribute('aria-expanded', 'false');
  header.innerHTML = `
    <span class="cat-header-left">${headerLeftHTML}</span>
    <svg class="chevron" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  `;

  const panel = document.createElement('div');
  panel.className = 'acc-panel';
  const inner = document.createElement('div');
  inner.className = 'acc-inner';
  const innerPad = document.createElement('div');
  innerPad.className = 'acc-inner-pad';
  innerPad.appendChild(contentEl);
  inner.appendChild(innerPad);
  panel.appendChild(inner);

  header.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open');
    if (exclusiveGroup) {
      exclusiveGroup.forEach(item => {
        if (item.header !== header) {
          item.header.classList.remove('open');
          item.panel.classList.remove('open');
          item.header.setAttribute('aria-expanded', 'false');
        }
      });
    }
    header.classList.toggle('open', !isOpen);
    panel.classList.toggle('open', !isOpen);
    header.setAttribute('aria-expanded', String(!isOpen));
  });

  wrap.append(header, panel);
  if (exclusiveGroup) exclusiveGroup.push({ header, panel });
  return wrap;
}

// ===== تحميل الصور وبناء أكورديون التصنيفات =====
async function loadPhotos() {
  const root = document.getElementById('photoAccordion');
  if (!root) return;
  try {
    const res = await fetch('data/photos.json', { cache: 'no-store' });
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      root.innerHTML = '<div class="empty-msg">لا توجد أعمال مضافة بعد.</div>';
      return;
    }

    // تجميع الأعمال حسب التصنيف
    const grouped = {};
    items.forEach(item => {
      const cat = item.category || 'أخرى';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    // ترتيب التصنيفات: المعروفة أولاً بترتيب ثابت، ثم أي تصنيف جديد بعدها
    const knownPresent = CATEGORY_ORDER.filter(c => grouped[c] && grouped[c].length);
    const others = Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c));
    const finalOrder = [...knownPresent, ...others];

    const exclusiveGroup = [];
    finalOrder.forEach(cat => {
      const catItems = grouped[cat];
      const grid = document.createElement('div');
      grid.className = 'photo-grid';

      catItems.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'p-card';

        const art = document.createElement('div');
        if (item.image) {
          art.className = 'art';
          art.style.backgroundImage = `url('${item.image}')`;
        } else {
          art.className = 'art ' + FALLBACK_ART_CLASSES[idx % FALLBACK_ART_CLASSES.length];
        }

        const fade = document.createElement('div');
        fade.className = 'fade';

        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `
          <div class="name">${item.name || ''}</div>
          <div class="cat">${item.cat || ''}</div>
        `;

        card.append(art, fade, info);
        grid.appendChild(card);
      });

      const accItem = createAccordionItem({
        headerLeftHTML: `<span class="cat-name">${CATEGORY_LABELS[cat] || cat}</span><span class="cat-count">${catItems.length}</span>`,
        contentEl: grid,
        exclusiveGroup
      });
      root.appendChild(accItem);
    });

    observeReveal();
  } catch (err) {
    console.error('تعذر تحميل بيانات الصور:', err);
  }
}

// ===== تحميل الفيديوهات وبناء أكورديون واحد يحتوي كل المقاطع =====
async function loadVideos() {
  const root = document.getElementById('videoAccordion');
  if (!root) return;
  try {
    const res = await fetch('data/videos.json', { cache: 'no-store' });
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      root.innerHTML = '<div class="empty-msg">لا توجد مقاطع مضافة بعد.</div>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'reel-grid';
    const allVideos = [];

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'r-card';

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
      allVideos.push({ card, video, overlay });
    });

    const accItem = createAccordionItem({
      headerLeftHTML: `<span class="cat-name">عرض جميع الفيديوهات</span><span class="cat-count">${items.length}</span>`,
      contentEl: grid
    });
    root.appendChild(accItem);

    initVideoControls(allVideos);
    observeReveal();
  } catch (err) {
    console.error('تعذر تحميل بيانات الفيديوهات:', err);
  }
}

// ===== أزرار تشغيل/إيقاف الفيديو + منع تشغيل أكثر من مقطع بنفس الوقت =====
function initVideoControls(allVideos) {
  function resetCard({ card, video, overlay }) {
    const iconPlay = overlay.querySelector('.icon-play');
    const iconPause = overlay.querySelector('.icon-pause');
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
    overlay.classList.remove('is-playing');
    card.classList.remove('is-playing');
  }

  allVideos.forEach(entry => {
    const { card, video, overlay } = entry;
    const iconPlay = overlay.querySelector('.icon-play');
    const iconPause = overlay.querySelector('.icon-pause');

    overlay.addEventListener('click', () => {
      if (video.paused) {
        // أوقف كل المقاطع الثانية قبل تشغيل هذا (يشتغل مقطع واحد فقط بنفس الوقت)
        allVideos.forEach(other => {
          if (other.video !== video && !other.video.paused) {
            other.video.pause();
            resetCard(other);
          }
        });
        video.play();
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
        overlay.classList.add('is-playing');
        card.classList.add('is-playing');
      } else {
        video.pause();
        resetCard(entry);
      }
    });

    video.addEventListener('ended', () => resetCard(entry));
  });
}

loadPhotos();
loadVideos();
