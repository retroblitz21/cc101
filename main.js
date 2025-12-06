// Main script: menu, swiper, modal, slide buttons

document.addEventListener('DOMContentLoaded', () => {
  // Menu toggle
  const menuBtn = document.querySelector('.menu');
  const nav = document.querySelector('.nav');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nav.classList.toggle('active');
    });
  }

  // Initialize Swiper (autoplay, nicer speed)
  const swiper = new Swiper('.swiper', {
    direction: 'horizontal',
    loop: true,
    speed: 900,
    autoplay: { delay: 4500, disableOnInteraction: false },
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    scrollbar: { el: '.swiper-scrollbar' },
  });

  // Modal elements
  const modal = document.createElement('div');
  modal.id = 'mediaModal';
  modal.className = 'modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-panel">
      <button class="modal-close" aria-label="Close">✕</button>
      <h3 id="modalTitle">Trailer</h3>
      <div class="modal-body">
        <img id="modalImage" class="modal-image" style="display:none" />
        <div class="videoWrap" id="videoWrap"></div>
        <div class="lore" id="loreText"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const videoWrap = document.getElementById('videoWrap');
  const loreText = document.getElementById('loreText');
  const modalTitle = document.getElementById('modalTitle');
  const modalImage = document.getElementById('modalImage');

  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function openModal({ videoId, title, lore, search, code }) {
    modal.setAttribute('aria-hidden', 'false');
    modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    modalTitle.textContent = title || 'Trailer';
    // clear previous
    videoWrap.innerHTML = '';
    loreText.innerHTML = '';
    modalImage.style.display = 'none';
    modalImage.src = '';

    // Insert video if available
    if (videoId) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      videoWrap.appendChild(iframe);
    } else if (search) {
      const a = document.createElement('a');
      a.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(search)}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Open search results on YouTube';
      a.className = 'btn';
      videoWrap.appendChild(a);
    } else {
      videoWrap.innerHTML = '<p style="color:#ddd;padding:12px">Trailer not available.</p>';
    }

    // Insert lore and optional code block
    // If an image was provided, show it above the lore
    if (arguments[0] && arguments[0].image) {
      try { modalImage.src = arguments[0].image; modalImage.style.display = 'block'; } catch(e){}
    }

    if (code) {
      const pre = document.createElement('pre');
      pre.className = 'code-panel';
      pre.innerHTML = escapeHtml(code);
      loreText.appendChild(pre);
    } else if (lore) {
      loreText.textContent = lore;
    }
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    videoWrap.innerHTML = '';
    loreText.textContent = '';
  }

  // clicking backdrop or close button closes modal
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-close')) {
      closeModal();
    }
  });

  // attach handlers to each slide's buttons
  document.querySelectorAll('.swiper-slide').forEach(slide => {
    const watchBtn = slide.querySelector('.btn.watch');
    const loreBtn = slide.querySelector('.btn.lore');
    const videoId = slide.dataset.video || '';
    const title = slide.dataset.title || '';
    const lore = slide.dataset.lore || '';
    const search = slide.dataset.search || '';
    const codeEl = slide.querySelector('.slide-code');
    const code = codeEl ? codeEl.textContent.trim() : '';

    if (watchBtn) watchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Play inline in the slide instead of opening modal
      if (videoId) {
        // if a video is already playing, remove it
        const existing = slide.querySelector('.slide-video');
        if (existing) { removeInlineVideo(slide); if (swiper && swiper.autoplay) swiper.autoplay.start(); return; }
        // pause autoplay
        if (swiper && swiper.autoplay) swiper.autoplay.stop();
        const container = document.createElement('div');
        container.className = 'slide-video';
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        // close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'slide-video-close';
        closeBtn.setAttribute('aria-label','Close video');
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', () => { removeInlineVideo(slide); if (swiper && swiper.autoplay) swiper.autoplay.start(); });
        container.appendChild(iframe);
        container.appendChild(closeBtn);
        slide.querySelector('.slide-media').appendChild(container);
      } else if (search) {
        // fallback: open search in new tab
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(search)}`, '_blank');
      } else {
        // open modal if no inline video
        // pass the slide image to modal so lore shows the image
        const imgSrc = slide.querySelector('.slide-media img')?.src || '';
        openModal({ videoId: '', title, lore, search, code:'', image: imgSrc });
      }
    });

    if (loreBtn) loreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // show lore in modal and include slide image
      const imgSrc = slide.querySelector('.slide-media img')?.src || '';
      openModal({ videoId: '', title: title || 'Lore', lore, search, code, image: imgSrc });
      // if code present, perform typing effect inside code-panel after modal created
      if (code) {
        // small delay to ensure modal is visible
        setTimeout(()=>{
          const pre = document.querySelector('.code-panel');
          if (!pre) return;
          const text = code;
          pre.textContent = '';
          let i=0;
          const speed = 18; // ms per char
          function type(){
            if (i < text.length) { pre.textContent += text.charAt(i++); pre.scrollTop = pre.scrollHeight; setTimeout(type, speed); }
          }
          type();
        }, 250);
      }
    });
  });

  // Remove any inline videos when slide changes (resume autoplay)
  if (swiper) {
    swiper.on('slideChange', () => {
      document.querySelectorAll('.slide-video').forEach(v => v.remove());
      if (swiper && swiper.autoplay) swiper.autoplay.start();
    });
  }

  function removeInlineVideo(slide) {
    const existing = slide.querySelector('.slide-video');
    if (existing) existing.remove();
  }

});