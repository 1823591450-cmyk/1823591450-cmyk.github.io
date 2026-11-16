/* ============================================================
   周轩 · 作品集  —  交互
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- 导航 ---------------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* 移动端菜单 */
  const toggle = $('#navToggle');
  const links = $('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('.nav__links a').forEach(a =>
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------------- 同一时刻只播一个 ---------------- */
  function pauseOthers(except) {
    $$('video').forEach(v => { if (v !== except) v.pause(); });
  }

  /* ---------------- 播放器：点击封面开始播放 ---------------- */
  const playSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function renderIdle(fig) {
    const src = fig.dataset.src;
    const poster = fig.dataset.poster;
    const label = fig.dataset.label || '';
    fig.dataset.playing = '0';
    fig.innerHTML =
      '<img src="' + poster + '" alt="' + (label || '视频封面') + '">' +
      '<button class="player__play" aria-label="播放：' + label + '">' + playSVG + '</button>' +
      '<figcaption>' + label + '</figcaption>';
    fig.querySelector('.player__play').addEventListener('click', () => playInline(fig));
  }

  function playInline(fig) {
    if (fig.dataset.playing === '1') return;
    fig.dataset.playing = '1';
    const label = fig.dataset.label || '';

    const v = document.createElement('video');
    v.src = fig.dataset.src;
    v.poster = fig.dataset.poster;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.setAttribute('aria-label', label);
    v.addEventListener('play', () => pauseOthers(v));

    fig.innerHTML = '';
    fig.appendChild(v);
    const cap = document.createElement('figcaption');
    cap.textContent = label;
    fig.appendChild(cap);

    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  $$('.player').forEach(fig => {
    if (fig.dataset.bound === '1') return;
    fig.dataset.bound = '1';
    fig.dataset.playing = '0';
    const btn = fig.querySelector('.player__play');
    if (btn) btn.addEventListener('click', () => playInline(fig));
  });

  /* ---------------- 洞穴：地表 / 天井切换 ---------------- */
  const cavePlayer = $('#cavePlayer');
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      if (!cavePlayer) return;
      // 停掉当前视频
      const cur = cavePlayer.querySelector('video');
      if (cur) cur.pause();

      cavePlayer.dataset.src = tab.dataset.src;
      cavePlayer.dataset.poster = tab.dataset.poster;
      cavePlayer.dataset.label = tab.dataset.label;
      renderIdle(cavePlayer);
    });
  });

  /* ---------------- 全屏播放层 ---------------- */
  const modal = $('#modal');
  const stage = $('#modalStage');
  const cap = $('#modalCap');
  let lastFocus = null;

  function openModal(src, poster, label, kind) {
    lastFocus = document.activeElement;
    stage.innerHTML = '';

    if (kind === 'image') {
      const im = document.createElement('img');
      im.src = src;
      im.alt = label || '';
      im.decoding = 'async';
      stage.appendChild(im);
      modal.setAttribute('aria-label', '图片查看');
    } else {
      const v = document.createElement('video');
      v.src = src;
      v.poster = poster || '';
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.addEventListener('play', () => pauseOthers(v));
      stage.appendChild(v);
      modal.setAttribute('aria-label', '视频播放');
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    }

    cap.textContent = label || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#modalClose').focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    const v = stage.querySelector('video');
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    stage.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$('[data-play]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      openModal(a.dataset.play, a.dataset.poster, a.dataset.label);
    });
  });

  $$('[data-img]').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      openModal(b.dataset.img, '', b.dataset.label, 'image');
    });
  });

  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* ---------------- 滚动渐入 ---------------- */
  const items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    items.forEach((el, i) => {
      el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
      io.observe(el);
    });
  } else {
    items.forEach(el => el.classList.add('in'));
  }

  /* 兜底：快速滚动或截图场景下，IO 可能漏掉已经掠过的元素 */
  let ticking = false;
  const sweep = () => {
    const limit = window.innerHeight * 0.94;
    items.forEach(el => {
      if (!el.classList.contains('in') && el.getBoundingClientRect().top < limit) {
        el.classList.add('in');
      }
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sweep);
  }, { passive: true });
  window.addEventListener('load', sweep);

  /* ---------------- 导航高亮当前区块 ---------------- */
  const sections = ['games', 'videos', 'skills', 'about']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const navLinks = $$('.nav__links a[href^="#"]');

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const id = en.target.id;
          navLinks.forEach(a =>
            a.classList.toggle('is-current', a.getAttribute('href') === '#' + id)
          );
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(s => spy.observe(s));
  }
})();
