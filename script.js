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

// أسماء التصنيفات بالعربي
const CATEGORY_LABELS = {
  thumbnails: 'ثمبنيلات',
  branding: 'هويات بصرية',
  cards: 'بطاقات أعمال',
  ads: 'إعلانات',
  cv: 'سير ذاتية'
};
const CATEGORY_ORDER = ['thumbnails', 'branding', 'cards', 'ads', 'cv'];
const FALLBACK_ART_CLASSES = ['art1', 'art2', 'art3', 'art4', 'art5', 'art6'];

// ===== لون مميز وثابت لكل قسم (يعتمد على اسم القسم نفسه، بدون أي تخزين) =====
const ACCENT_POOL = ['#00D9FF', '#FF2D6F', '#FFB020', '#7C4DFF', '#00E5A0', '#FF6B4A', '#4DD0E1', '#C77DFF'];
function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
}
function accentFor(str) { return ACCENT_POOL[hashStr(str) % ACCENT_POOL.length]; }
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ===== Lightbox (نافذة تكبير الصور/الفيديوهات + تنقل بين عناصر نفس القسم) =====
let lightboxEl, lbList = [], lbIndex = 0, lbType = 'image';

function initLightbox() {
  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.innerHTML = `
    <button class="lightbox-btn lightbox-close" aria-label="إغلاق">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <button class="lightbox-btn lightbox-prev" aria-label="السابق">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button class="lightbox-btn lightbox-next" aria-label="التالي">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="lightbox-content"></div>
    <div class="lightbox-caption"></div>
  `;
  document.body.appendChild(lightboxEl);

  lightboxEl.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightboxEl.querySelector('.lightbox-prev').addEventListener('click', () => stepLightbox(-1));
  lightboxEl.querySelector('.lightbox-next').addEventListener('click', () => stepLightbox(1));
  lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightboxEl.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
}

function stepLightbox(dir) {
  if (lbList.length < 2) return;
  lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
  renderLightbox();
}

function renderLightbox() {
  const content = lightboxEl.querySelector('.lightbox-content');
  const caption = lightboxEl.querySelector('.lightbox-caption');
  const item = lbList[lbIndex];
  content.innerHTML = '';

  const src = lbType === 'image' ? item.image : item.video;
  if (src) {
    if (lbType === 'image') {
      const img = document.createElement('img');
      img.src = src;
      img.alt = item.name || '';
      content.appendChild(img);
    } else {
      const video = document.createElement('video');
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      content.appendChild(video);
    }
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'lightbox-fallback';
    fallback.style.background = `linear-gradient(160deg, ${item._accent || accentFor(item.name || '')}, #120F16)`;
    fallback.textContent = item.name || '';
    content.appendChild(fallback);
  }

  const sub = lbType === 'image' ? (item.cat || '') : (item.tag2 || '');
  caption.innerHTML = `<div class="lb-name">${item.name || ''}</div><div class="lb-sub">${sub}</div>`;

  const showNav = lbList.length > 1;
  lightboxEl.querySelector('.lightbox-prev').style.display = showNav ? 'flex' : 'none';
  lightboxEl.querySelector('.lightbox-next').style.display = showNav ? 'flex' : 'none';
}

function openLightbox(list, index, type) {
  lbList = list; lbIndex = index; lbType = type;
  renderLightbox();
  lightboxEl.classList.add('open');
}

function closeLightbox() {
  lightboxEl.classList.remove('open');
  const media = lightboxEl.querySelector('.lightbox-content video');
  if (media) media.pause();
  setTimeout(() => { lightboxEl.querySelector('.lightbox-content').innerHTML = ''; }, 300);
}

// ===== أداة بناء عنصر أكورديون واحد (تُستخدم للصور والفيديوهات) =====
function createAccordionItem({ headerLeftHTML, contentEl, exclusiveGroup, accentKey }) {
  const accent = accentFor(accentKey || 'default');
  const wrap = document.createElement('div');
  wrap.className = 'cat-acc';
  wrap.style.setProperty('--accent', accent);
  wrap.style.setProperty('--accent-glow', hexToRgba(accent, 0.14));

  const header = document.createElement('button');
  header.className = 'cat-header';
  header.setAttribute('aria-expanded', 'false');
  header.innerHTML = `
    <span class="cat-header-left">
      <span class="cat-dot"></span>
      <span class="cat-name">${headerLeftHTML.name}</span>
      <span class="cat-count">${headerLeftHTML.count}</span>
    </span>
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
          item.wrap.classList.remove('open');
          item.header.setAttribute('aria-expanded', 'false');
        }
      });
    }
    header.classList.toggle('open', !isOpen);
    panel.classList.toggle('open', !isOpen);
    wrap.classList.toggle('open', !isOpen);
    header.setAttribute('aria-expanded', String(!isOpen));
  });

  wrap.append(header, panel);
  if (exclusiveGroup) exclusiveGroup.push({ header, panel, wrap });
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

    const grouped = {};
    items.forEach(item => {
      const cat = item.category || 'أخرى';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    const knownPresent = CATEGORY_ORDER.filter(c => grouped[c] && grouped[c].length);
    const others = Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c));
    const finalOrder = [...knownPresent, ...others];

    const exclusiveGroup = [];
    finalOrder.forEach(cat => {
      const catItems = grouped[cat];
      const label = CATEGORY_LABELS[cat] || cat;
      const grid = document.createElement('div');
      grid.className = 'photo-grid';

      catItems.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'p-card';

        if (item.image) {
          const img = document.createElement('img');
          img.className = 'art-img';
          img.src = item.image;
          img.alt = item.name || '';
          img.loading = 'lazy';
          card.appendChild(img);
        } else {
          const fb = document.createElement('div');
          fb.className = 'art-fallback ' + FALLBACK_ART_CLASSES[idx % FALLBACK_ART_CLASSES.length];
          card.appendChild(fb);
        }

        const fade = document.createElement('div');
        fade.className = 'fade';

        const expandHint = document.createElement('div');
        expandHint.className = 'expand-hint';
        expandHint.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `
          <div class="name">${item.name || ''}</div>
          <div class="cat">${item.cat || ''}</div>
        `;

        card.append(fade, expandHint, info);
        card.addEventListener('click', () => openLightbox(catItems, idx, 'image'));
        grid.appendChild(card);
      });

      const accItem = createAccordionItem({
        headerLeftHTML: { name: label, count: catItems.length },
        contentEl: grid,
        exclusiveGroup,
        accentKey: label
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
    const videoLabel = 'عرض جميع الفيديوهات';

    items.forEach((item, idx) => {
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

      const controls = document.createElement('div');
      controls.className = 'r-controls';
      controls.innerHTML = `
        <button class="r-btn r-mute" aria-label="كتم/تشغيل الصوت" type="button">
          <svg class="icon-unmuted" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="#fff"/><path d="M16.5 12c0-1.5-.8-2.8-2-3.5v7c1.2-.7 2-2 2-3.5z" fill="#fff"/></svg>
          <svg class="icon-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" style="display:none;"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="#fff"/><path d="M18 9l4 4m0-4l-4 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
        <button class="r-btn r-expand" aria-label="تكبير" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      `;

      const meta = document.createElement('div');
      meta.className = 'r-meta';
      meta.innerHTML = `
        <div><div class="name">${item.name || ''}</div><div class="tag2">${item.tag2 || ''}</div></div>
        <div class="r-dur">${item.duration || ''}</div>
      `;

      card.append(video, overlay, controls, meta);
      grid.appendChild(card);
      allVideos.push({ card, video, overlay, controls, item, idx });
    });

    const accItem = createAccordionItem({
      headerLeftHTML: { name: videoLabel, count: items.length },
      contentEl: grid,
      accentKey: videoLabel
    });
    root.appendChild(accItem);

    initVideoControls(allVideos, items);
    observeReveal();
  } catch (err) {
    console.error('تعذر تحميل بيانات الفيديوهات:', err);
  }
}

// ===== تحكم الفيديو: تشغيل/إيقاف + كتم/صوت + تكبير + منع تشغيل أكثر من مقطع بنفس الوقت =====
function initVideoControls(allVideos, items) {
  function resetCard({ card, overlay }) {
    overlay.querySelector('.icon-play').style.display = 'block';
    overlay.querySelector('.icon-pause').style.display = 'none';
    overlay.classList.remove('is-playing');
    card.classList.remove('is-playing');
  }

  allVideos.forEach(entry => {
    const { card, video, overlay, controls, idx } = entry;
    const muteBtn = controls.querySelector('.r-mute');
    const expandBtn = controls.querySelector('.r-expand');
    const iconUnmuted = muteBtn.querySelector('.icon-unmuted');
    const iconMuted = muteBtn.querySelector('.icon-muted');

    // زر التشغيل: يشغّل/يوقف المعاينة الصغيرة فقط (ما يفتح أي نافذة)
    overlay.addEventListener('click', () => {
      if (video.paused) {
        allVideos.forEach(other => {
          if (other.video !== video && !other.video.paused) {
            other.video.pause();
            resetCard(other);
          }
        });
        video.play();
        overlay.querySelector('.icon-play').style.display = 'none';
        overlay.querySelector('.icon-pause').style.display = 'block';
        overlay.classList.add('is-playing');
        card.classList.add('is-playing');
      } else {
        video.pause();
        resetCard(entry);
      }
    });
    video.addEventListener('ended', () => resetCard(entry));

    // زر الكتم/الصوت
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      iconUnmuted.style.display = video.muted ? 'none' : 'block';
      iconMuted.style.display = video.muted ? 'block' : 'none';
    });

    // زر التكبير: هو الوحيد اللي يفتح النافذة المكبّرة (مع إمكانية التنقل بين كل المقاطع)
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.pause();
      resetCard(entry);
      openLightbox(items, idx, 'video');
    });
  });
}

initLightbox();
loadPhotos();
loadVideos();
