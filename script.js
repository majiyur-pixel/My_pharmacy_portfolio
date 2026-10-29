(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Current year, scroll progress, sticky header state and mobile navigation.
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  const progress = $('#scrollProgress');
  const header = $('.site-header');
  let scrollQueued = false;
  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScrollUI); }
  }, { passive: true });
  updateScrollUI();

  const menuToggle = $('#menuToggle');
  const nav = $('#navLinks');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menuToggle.textContent = open ? '×' : '☰';
    });
    $$('a', nav).forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation'); menuToggle.textContent = '☰';
    }));
  }

  // Reveal the full set of meaningful content, including QA/QC and all roadmap cards.
  const revealTargets = $$('.section-heading, .about-text, .profile-panel, .journey-card, .interest-card, .qa-card, .qa-bottomline, .project-card, .skill-panel, .learning-panel, .ambition-box, .roadmap-grid, .roadmap-card, .contact-section > *, .hero-visual');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealTargets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', `${(i % 4) * 75}ms`);
    });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealTargets.forEach(el => observer.observe(el));
  } else revealTargets.forEach(el => el.classList.add('is-visible'));

  // Cursor-lit cards and real pointer-driven perspective tilt on desktop.
  if (finePointer && !reduceMotion) {
    const tiltCards = $$('.qa-card, .journey-card, .interest-card, .project-card, .roadmap-card, .profile-panel, .skill-panel, .learning-panel');
    tiltCards.forEach(card => {
      let frame = 0;
      const reset = () => {
        card.style.setProperty('--tilt-x', '0deg'); card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--pointer-x', '50%'); card.style.setProperty('--pointer-y', '50%');
        card.classList.remove('is-tilting');
      };
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          card.style.setProperty('--tilt-x', `${(0.5 - py) * 7}deg`);
          card.style.setProperty('--tilt-y', `${(px - 0.5) * 8}deg`);
          card.style.setProperty('--pointer-x', `${px * 100}%`);
          card.style.setProperty('--pointer-y', `${py * 100}%`);
          card.classList.add('is-tilting');
        });
      });
      card.addEventListener('pointerleave', reset);
      card.addEventListener('pointercancel', reset);
    });

    const hero = $('#heroVisual');
    if (hero) {
      let frame = 0;
      hero.addEventListener('pointermove', event => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          hero.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg)`;
        });
      });
      hero.addEventListener('pointerleave', () => { hero.style.transform = ''; });
    }
  }

  // Live molecular network: lightweight canvas animation, no external 3D dependency.
  const canvas = $('#moleculeCanvas');
  const hero = $('#heroVisual');
  if (canvas && hero && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      let width = 0, height = 0, dpr = 1, raf = 0, particles = [], lastTime = 0, pointer = { x: -9999, y: -9999, active: false };
      const movePointer = event => {
        const rect = hero.getBoundingClientRect();
        pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.active = true;
      };
      hero.addEventListener('pointermove', movePointer, { passive: true });
      hero.addEventListener('pointerleave', () => { pointer.active = false; pointer.x = -9999; pointer.y = -9999; }, { passive: true });
      const resize = () => {
        const rect = hero.getBoundingClientRect();
        width = Math.max(1, rect.width); height = Math.max(1, rect.height);
        dpr = Math.min(window.devicePixelRatio || 1, 1.7);
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.max(28, Math.min(58, Math.round(width / 8)));
        particles = Array.from({ length: count }, (_, i) => ({
          x: Math.random() * width, y: Math.random() * height,
          z: .3 + Math.random() * .7, r: .7 + Math.random() * 1.9,
          vx: (Math.random() - .5) * .24, vy: (Math.random() - .5) * .24,
          phase: Math.random() * Math.PI * 2, hue: i % 5 === 0 ? 265 : (i % 7 === 0 ? 150 : 190)
        }));
      };
      const draw = time => {
        if (document.hidden) { raf = 0; return; }
        const delta = Math.min(2, (time - (lastTime || time)) / 16.67); lastTime = time;
        ctx.clearRect(0, 0, width, height);
        const linkDistance = Math.min(112, width * .26);
        if (pointer.active) {
          const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 150);
          glow.addColorStop(0, 'rgba(98,232,255,.075)'); glow.addColorStop(1, 'rgba(98,232,255,0)');
          ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
        }
        for (const p of particles) {
          p.x += p.vx * delta; p.y += p.vy * delta;
          if (p.x < -10) p.x = width + 10; if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10; if (p.y > height + 10) p.y = -10;
          p.phase += .008 * delta;
          // A soft, local field makes particles react to the pointer without hijacking it.
          if (pointer.active) {
            const dx = pointer.x - p.x, dy = pointer.y - p.y, dist = Math.hypot(dx, dy);
            if (dist > 1 && dist < 145) { const force = (1 - dist / 145) * .16 * delta; p.x -= dx / dist * force; p.y -= dy / dist * force; }
          }
        }
        if (pointer.active) {
          for (const p of particles) { const d = Math.hypot(pointer.x - p.x, pointer.y - p.y); if (d < 145) {
            ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(98,232,255,${(1 - d / 145) * .32})`; ctx.lineWidth = .7; ctx.stroke();
          }}
          ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 15 + Math.sin(time / 280) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(98,232,255,.42)'; ctx.lineWidth = .8; ctx.stroke();
        }
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j], dx = a.x - b.x, dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);
            if (distance < linkDistance) {
              const alpha = (1 - distance / linkDistance) * .24 * Math.min(a.z, b.z);
              ctx.strokeStyle = `rgba(98,232,255,${alpha})`;
              ctx.lineWidth = .65 + alpha;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          const pulse = .72 + Math.sin(a.phase) * .28;
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${a.hue},100%,78%,${.28 + a.z * .52})`;
          ctx.shadowBlur = a.r * 5; ctx.shadowColor = `hsla(${a.hue},100%,70%,.45)`; ctx.fill(); ctx.shadowBlur = 0;
        }
        raf = requestAnimationFrame(draw);
      };
      const start = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(draw); };
      const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
      resize(); start();
      if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); }).observe(hero);
      else window.addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else { lastTime = 0; start(); } });
    }
  }

  // Keep navigation highlight in sync with the visible section.
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const activeId = entry.target.id;
        $$('.nav-links a[href^="#"]').forEach(link => {
          if (link.getAttribute('href') === `#${activeId}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    $$('main section[id]').forEach(section => sectionObserver.observe(section));
  }

  // Skill explorer: category tabs reveal a focused, honest learning summary.
  const skillSummaries = {
    pharmacy: { title: 'Pharmacy foundations', body: 'Building understanding of core subjects, dosage forms, practical concepts, and scientific terminology.', status: 'STATUS · LEARNING' },
    quality: { title: 'QA / QC preparation', body: 'Developing familiarity with GMP concepts, SOP awareness, documentation, analytical thinking, laboratory safety, and quality principles.', status: 'STATUS · PREPARING' },
    digital: { title: 'Digital and data skills', body: 'Practising beginner coding and spreadsheet skills while exploring responsible ways technology may support pharmacy learning.', status: 'STATUS · DEVELOPING' }
  };
  const skillContent = $('#skillTabContent');
  $$('.skill-tab').forEach(button => button.addEventListener('click', () => {
    const item = skillSummaries[button.dataset.skill];
    if (!item || !skillContent) return;
    $$('.skill-tab').forEach(tab => { const active = tab === button; tab.classList.toggle('is-active', active); tab.setAttribute('aria-pressed', String(active)); });
    skillContent.replaceChildren();
    const title = document.createElement('strong'); title.textContent = item.title;
    const body = document.createElement('p'); body.textContent = item.body;
    const statusLine = document.createElement('span'); statusLine.textContent = item.status;
    skillContent.append(title, body, statusLine);
  }));

  // Project cards open a real detail dialog; keyboard activation is supported.
  const projectDialog = $('#projectDialog');
  const projectTitle = $('#projectDialogTitle');
  const projectBody = $('#projectDialogBody');
  const projectTags = $('#projectDialogTags');
  const openProjectDetails = card => {
    if (!projectDialog || !projectTitle || !projectBody || !projectTags) return;
    projectTitle.textContent = $('h3', card)?.textContent?.trim() || 'Project details';
    projectBody.textContent = $('p:not(.project-meta)', card)?.textContent?.trim() || 'Details will be added as this project develops.';
    projectTags.replaceChildren(...$$('.project-tags span', card).map(tag => { const span = document.createElement('span'); span.textContent = tag.textContent; return span; }));
    if (typeof projectDialog.showModal === 'function') projectDialog.showModal();
    else projectDialog.setAttribute('open', '');
  };
  $$('.project-card').forEach(card => {
    card.tabIndex = 0; card.setAttribute('role', 'button');
    const title = $('h3', card)?.textContent?.trim();
    card.setAttribute('aria-label', title ? `Open details for ${title}` : 'Open project details');
    card.addEventListener('click', event => { if (event.target.closest('a,button')) return; openProjectDetails(card); });
    card.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target === card) { event.preventDefault(); openProjectDetails(card); } });
  });
  $('#closeProjectDialog')?.addEventListener('click', () => { if (projectDialog?.open) projectDialog.close(); else projectDialog?.removeAttribute('open'); });
  projectDialog?.addEventListener('click', event => { if (event.target === projectDialog) projectDialog.close(); });

  // Progress bars animate only when their section enters view, not immediately on page load.
  const skillsLayout = $('.skills-layout');
  if (skillsLayout && !reduceMotion && 'IntersectionObserver' in window) {
    const progressObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('progress-activated'); progressObserver.unobserve(entry.target); }
    }), { threshold: 0.25 });
    progressObserver.observe(skillsLayout);
  } else if (skillsLayout) skillsLayout.classList.add('progress-activated');

  // Portfolio content editor: local browser save, JSON export/import and reset.
  const storageKey = 'majibur-pharmacy-portfolio-v1';
  const sample = {
    name: 'MAJIBUR RAHMAN',
    tagline: 'PHARMACY × TECHNOLOGY × INNOVATION',
    intro: 'I’m a B.Pharm student building my foundation in pharmaceutical science while exploring quality systems, Python, and thoughtful uses of AI in healthcare.',
    about: 'I’m MAJIBUR RAHMAN, a first-year B.Pharm student at Lovely Professional University (LPU), India. I’m interested in pharmaceutical quality assurance and quality control, while exploring coding, Python, and artificial intelligence in healthcare. I’m currently developing my knowledge through academic practicals, student projects, and continuous learning. My goal is to build a career that connects pharmaceutical science with emerging technologies.',
    email: 'majiyur@gmail.com', learning: ''
  };
  const fields = { name: $('#editName'), tagline: $('#editTagline'), intro: $('#editIntro'), about: $('#editAbout'), email: $('#editEmail'), learning: $('#editLearning') };
  const editor = $('#editorBackdrop');
  const form = $('#portfolioForm');
  const status = $('#editorStatus');
  const readData = () => {
    try { const value = JSON.parse(localStorage.getItem(storageKey) || 'null'); return value && typeof value === 'object' ? { ...sample, ...value } : { ...sample }; }
    catch { return { ...sample }; }
  };
  const applyData = data => {
    const name = data.name || sample.name;
    const tagline = data.tagline || sample.tagline;
    const headline = $('#heroHeadline');
    const accent = $('#heroAccent');
    const brand = $('.brand-copy small');
    const brandName = $('.brand-copy strong');
    const footerBrand = $('.footer-brand');
    const footerName = $('#footerName');
    const profileName = $('#profileName');
    if (brandName) brandName.textContent = name;
    if (brand) brand.textContent = tagline;
    if (footerBrand) footerBrand.innerHTML = `${escapeHtml(name)}<span>+</span>`;
    if (footerName) footerName.textContent = name;
    if (profileName) profileName.textContent = name;
    if (headline && data.heroHeadline) headline.textContent = data.heroHeadline;
    if (accent && data.heroAccent) accent.textContent = data.heroAccent;
    const intro = $('#heroIntro'); if (intro) intro.textContent = data.intro || sample.intro;
    const about = $('#aboutText'); if (about) about.textContent = data.about || sample.about;
    const emailLink = $('#emailLink'); if (emailLink) { emailLink.href = `mailto:${data.email || sample.email}`; }
    const learningPanel = $('.learning-panel');
    if (learningPanel && data.learning) {
      let list = $('.custom-learning-log', learningPanel);
      if (!list) { list = document.createElement('ul'); list.className = 'custom-learning-log'; list.style.cssText = 'display:grid;gap:8px;margin-top:16px;padding-left:18px;color:#b7d0df;font-size:.78rem'; learningPanel.appendChild(list); }
      list.replaceChildren(...data.learning.split('\n').map(x => x.trim()).filter(Boolean).map(item => { const li = document.createElement('li'); li.textContent = item; return li; }));
    } else { $('.custom-learning-log', learningPanel || document)?.remove(); }
  };
  const escapeHtml = str => String(str).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const openEditor = () => {
    if (!editor) return;
    const data = readData();
    Object.entries(fields).forEach(([key, field]) => { if (field) field.value = data[key] ?? ''; });
    editor.hidden = false; document.body.classList.add('editor-open');
    $('#closeEditor')?.focus();
  };
  const closeEditor = () => { if (editor) editor.hidden = true; document.body.classList.remove('editor-open'); $('#openEditor')?.focus(); };
  $('#openEditor')?.addEventListener('click', openEditor);
  $('#openEditor2')?.addEventListener('click', openEditor);
  $('#closeEditor')?.addEventListener('click', closeEditor);
  editor?.addEventListener('click', event => { if (event.target === editor) closeEditor(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && editor && !editor.hidden) closeEditor(); });
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field ? field.value.trim() : '']));
    try {
      localStorage.setItem(storageKey, JSON.stringify(data)); applyData(data);
      if (status) status.textContent = 'Saved in this browser. Export a backup to move it to another device.';
    } catch {
      if (status) status.textContent = 'This browser blocked local storage. Export a backup to keep your edits.';
    }
  });
  $('#exportData')?.addEventListener('click', () => {
    const data = readData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'majibur-portfolio-backup.json'; a.click(); URL.revokeObjectURL(url);
    if (status) status.textContent = 'Backup exported.';
  });
  $('#resetData')?.addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); } catch { /* storage can be unavailable */ }
    applyData(sample); Object.entries(fields).forEach(([key, field]) => { if (field) field.value = sample[key] || ''; });
    if (status) status.textContent = 'Sample content restored in this browser.';
  });
  $('#importData')?.addEventListener('click', () => importFile?.click());
  const importFile = $('#importFile');
  if (importFile) {
    // Import remains keyboard-accessible through the editor's optional JSON input hook.
    importFile.addEventListener('change', async () => {
      const file = importFile.files?.[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const safe = Object.fromEntries(Object.keys(sample).map(key => [key, typeof data[key] === 'string' ? data[key] : sample[key]]));
        localStorage.setItem(storageKey, JSON.stringify(safe)); applyData(safe);
        Object.entries(fields).forEach(([key, field]) => { if (field) field.value = safe[key] || ''; });
        if (status) status.textContent = 'Backup imported.';
      } catch { if (status) status.textContent = 'That backup file could not be read.'; }
      importFile.value = '';
    });
  }
  const initialData = readData(); applyData(initialData);
})();