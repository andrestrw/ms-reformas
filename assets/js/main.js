/* =========================================================
   MS REFORMAS – Interacciones
   ========================================================= */
(function () {
  'use strict';

  const SITE = window.SITE || {};
  const PROJECTS = window.PROJECTS || [];
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const waUrl = (text) => `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  /* ---------- Datos de contacto ---------- */
  function fillSiteData() {
    $$('[data-wa-link]').forEach((a) => {
      a.href = waUrl('Hola MS Reformas, quisiera pedir información sobre una reforma.');
      if (a.hasAttribute('data-wa-text')) a.textContent = `wa.me/${SITE.whatsapp}`;
    });
    $$('[data-phone]').forEach((a) => { a.href = `tel:+${SITE.whatsapp}`; a.textContent = SITE.phoneDisplay; });
    $$('[data-email]').forEach((a) => { a.href = `mailto:${SITE.email}`; a.textContent = SITE.email; });
    $$('[data-location]').forEach((el) => { el.textContent = SITE.location; });
    $$('[data-instagram]').forEach((a) => { a.href = SITE.instagram; });
    $$('[data-facebook]').forEach((a) => { a.href = SITE.facebook; });
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Header y menú ---------- */
  function initHeader() {
    const header = $('#header');
    const burger = $('#burger');
    const nav = $('#nav');
    const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (burger && nav) {
      const toggle = (open) => {
        burger.classList.toggle('is-open', open);
        nav.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';
      };
      burger.addEventListener('click', () => toggle(!nav.classList.contains('is-open')));
      $$('a', nav).forEach((a) => a.addEventListener('click', () => toggle(false)));
    }

    // Link activo según sección visible
    const links = $$('.nav__link');
    const sections = links.map((l) => {
      const id = (l.getAttribute('href') || '').split('#')[1];
      return id ? document.getElementById(id) : null;
    });
    if (!sections.some(Boolean)) return;
    const spy = () => {
      const y = window.scrollY + window.innerHeight * 0.35;
      let idx = 0;
      sections.forEach((s, i) => { if (s && s.offsetTop <= y) idx = i; });
      links.forEach((l, i) => l.classList.toggle('is-active', i === idx));
    };
    spy();
    window.addEventListener('scroll', spy, { passive: true });
  }

  /* ---------- Reveal + contadores ---------- */
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const dur = 1800;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        // escalonado entre hermanos
        const siblings = $$('.reveal', el.parentElement);
        const i = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = `${Math.min(i * 90, 450)}ms`;
        el.classList.add('is-visible');
        // quitar el retraso tras la animación para que los hover respondan al instante
        setTimeout(() => { el.style.transitionDelay = ''; }, 1500);
        $$('[data-count]', el).forEach(animateCount);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Carrusel genérico ---------- */
  function Carousel(root, dotsWrap, images, { autoplay = 5000 } = {}) {
    if (!root || !images.length) return;
    const track = $('.carousel__track', root);
    track.innerHTML = images.map((src, i) => `<img src="${esc(src)}" alt="Imagen ${i + 1}" loading="${i ? 'lazy' : 'eager'}" draggable="false" />`).join('');
    let index = 0;
    let timer;

    if (dotsWrap) {
      dotsWrap.innerHTML = images.map((_, i) => `<button class="dot" aria-label="Ir a imagen ${i + 1}"></button>`).join('');
      $$('.dot', dotsWrap).forEach((d, i) => d.addEventListener('click', () => { go(i); restart(); }));
    }
    const go = (i) => {
      index = (i + images.length) % images.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      if (dotsWrap) $$('.dot', dotsWrap).forEach((d, j) => d.classList.toggle('is-active', j === index));
    };
    const restart = () => {
      clearInterval(timer);
      if (autoplay) timer = setInterval(() => go(index + 1), autoplay);
    };
    $('.carousel__prev', root)?.addEventListener('click', () => { go(index - 1); restart(); });
    $('.carousel__next', root)?.addEventListener('click', () => { go(index + 1); restart(); });
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', restart);

    // swipe
    let x0 = null;
    root.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    root.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart(); }
      x0 = null;
    });

    go(0);
    restart();
  }

  /* ---------- Hero slider ---------- */
  function initHero() {
    const slides = $$('.hero__slide');
    const dotsWrap = $('#heroDots');
    if (!slides.length) return;
    let index = 0;
    let timer;
    dotsWrap.innerHTML = slides.map((_, i) => `<button class="dot" aria-label="Diapositiva ${i + 1}"></button>`).join('');
    const dots = $$('.dot', dotsWrap);
    const go = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle('is-active', j === index));
      dots.forEach((d, j) => d.classList.toggle('is-active', j === index));
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(index + 1), 6000); };
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); restart(); }));
    $('#heroPrev')?.addEventListener('click', () => { go(index - 1); restart(); });
    $('#heroNext')?.addEventListener('click', () => { go(index + 1); restart(); });
    go(0);
    restart();

    // parallax suave
    const wrap = $('.hero__slides');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) wrap.style.transform = `translateY(${y * 0.3}px)`;
    }, { passive: true });
  }

  /* ---------- Tarjetas de proyectos ---------- */
  function projectCard(p) {
    return `
      <a class="project reveal" href="proyecto.html?id=${encodeURIComponent(p.id)}">
        <span class="badge"><i></i>${esc(p.category)}</span>
        <img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy" />
        <div class="project__overlay">
          <h3>${esc(p.title)}</h3>
          <span>${esc(p.location)}</span>
          <span class="btn">Ver proyecto →</span>
        </div>
      </a>`;
  }

  function initProjects() {
    const grid = $('#projectsGrid');
    if (grid) grid.innerHTML = PROJECTS.map(projectCard).join('');
  }

  /* ---------- Formulario WhatsApp ---------- */
  function initForm() {
    const form = $('#contactForm');
    if (!form) return;
    const err = $('#formError');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      $$('.field', form).forEach((f) => f.classList.remove('has-error'));
      const missing = ['nombre', 'mensaje'].filter((k) => !String(d[k] || '').trim());
      if (missing.length) {
        missing.forEach((k) => form.elements[k].closest('.field').classList.add('has-error'));
        err.textContent = 'Por favor completa tu nombre y el mensaje.';
        form.elements[missing[0]].focus();
        return;
      }
      err.textContent = '';
      const lines = [
        'Hola MS Reformas 👋',
        `Soy ${d.nombre.trim()} ${String(d.apellido || '').trim()}`.trim() + '.',
        d.zona ? `Quiero reformar: ${d.zona.trim()}` : '',
        d.email ? `Email: ${d.email.trim()}` : '',
        '',
        d.mensaje.trim()
      ].filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== ''));
      window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
      form.reset();
    });
  }

  /* ---------- Página de proyecto ---------- */
  function initProjectPage() {
    const root = $('#projectPage');
    if (!root) return;
    const id = new URLSearchParams(location.search).get('id');
    const p = PROJECTS.find((x) => x.id === id) || PROJECTS[0];
    if (!p) return;

    document.title = `${p.title} | Proyectos | MS Reformas`;
    $('#pHeroBg').style.backgroundImage = `url('${p.cover}')`;
    $('#pCat').textContent = p.category;
    $('#pTitle').textContent = p.title;
    $('#pLoc').textContent = p.location;
    $('#pCrumb').textContent = p.title;
    $('#pDesc').textContent = p.description;
    $('#pFeatures').innerHTML = p.features.map((f) => `<li>${esc(f)}</li>`).join('');
    $('#pInfoLoc').textContent = p.location;
    $('#pInfoCat').textContent = p.category;
    $('#pConsult').href = waUrl(`Hola MS Reformas, me interesa un proyecto similar a "${p.title}". ¿Podemos hablar?`);

    Carousel($('#projectCarousel'), $('#projectDots'), p.gallery, { autoplay: 5500 });

    const more = $('#moreProjects');
    if (more) more.innerHTML = PROJECTS.filter((x) => x.id !== p.id).slice(0, 3).map(projectCard).join('');
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    fillSiteData();
    initHeader();
    initHero();
    initProjects();
    initProjectPage();
    Carousel($('#galleryCarousel'), $('#galleryDots'), window.GALLERY || []);
    initForm();
    initReveal(); // al final, para incluir elementos generados dinámicamente
  });
})();
