(() => {
  const panel1 = document.getElementById('panel-section-1');
  const leftCol = panel1 ? panel1.querySelector('.left') : null;
  const steps = Array.from(panel1 ? panel1.querySelectorAll('.step') : []);
  const media = panel1 ? panel1.querySelector('.media') : null;
  const heroImage = panel1 ? panel1.querySelector('#heroImage') : null;
  const number = panel1 ? panel1.querySelector('#stepperNumber') : null;
  const fillEl = panel1 ? panel1.querySelector('#stepperFill') : null;
  const rail = fillEl ? fillEl.parentElement : null;

  const images = ['images/1.avif', 'images/2.avif', 'images/3.avif'];
  const alts = ['Finance example', 'Customs example', 'Operations example'];

  // Preload images to avoid flicker
  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  let active = 0;

  const pad2 = (n) => String(n).padStart(2, '0');

  function setActive(index) {
    if (index === active || index < 0 || index >= steps.length) return;
    // Show only the active step in the fixed area
    steps.forEach((el, i) => el.classList.toggle('is-active', i === index));
    active = index;

    // Update image with a fade
    if (media) media.classList.add('fade-out');
    const nextSrc = images[index];
    if (nextSrc) {
      const temp = new Image();
      temp.onload = () => {
        heroImage.src = nextSrc;
        heroImage.alt = alts[index] || '';
        if (media) media.classList.remove('fade-out');
      };
      temp.src = nextSrc;
    }

    // Update number
    if (number) number.textContent = pad2(index + 1);
  }

  function setProgressFill(t) {
    if (!fillEl) return;
    const clamped = Math.max(0, Math.min(1, t));
    fillEl.style.height = `${clamped * 100}%`;
  }

  // Build invisible scroll waypoints to provide the scroll track height
  const waypoints = steps.map((step, i) => {
    const w = document.createElement('div');
    w.className = 'waypoint';
    w.setAttribute('data-step', String(i));
    const next = step.nextSibling;
    if (next) leftCol.insertBefore(w, next); else leftCol.appendChild(w);
    return w;
  });

  // Add a tail spacer so the scroll can reach 100%
  const tail = document.createElement('div');
  tail.className = 'waypoint-tail';
  leftCol.appendChild(tail);

  // Progress-based activation: 0-33% -> 0, 33-66% -> 1, 66-100% -> 2
  function updateByScroll() {
    if (!leftCol) return;
    const firstWaypoint = waypoints[0];
    const start = (firstWaypoint?.getBoundingClientRect().top || leftCol.getBoundingClientRect().top) + window.scrollY;
    const total = waypoints.length * window.innerHeight; // 3 * 100vh
    const end = start + total;
    const y = window.scrollY;
    const t = Math.min(1, Math.max(0, (y - start) / Math.max(end - start, 1)));
    const index = Math.min(steps.length - 1, Math.floor(t * steps.length));
    setActive(index);
    setProgressFill(t);
  }

  // Click/keyboard to move focus
  steps.forEach((el, i) => {
    el.tabIndex = 0;
    el.addEventListener('click', () => {
      const firstWaypoint = waypoints[0];
      const start = (firstWaypoint?.getBoundingClientRect().top || leftCol.getBoundingClientRect().top) + window.scrollY;
      const segment = window.innerHeight; // since total = 3 * 100vh
      window.scrollTo({ top: start + i * segment, behavior: 'smooth' });
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const firstWaypoint = waypoints[0];
        const start = (firstWaypoint?.getBoundingClientRect().top || leftCol.getBoundingClientRect().top) + window.scrollY;
        const segment = window.innerHeight;
        const target = Math.min(i + 1, steps.length - 1);
        window.scrollTo({ top: start + target * segment, behavior: 'smooth' });
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const firstWaypoint = waypoints[0];
        const start = (firstWaypoint?.getBoundingClientRect().top || leftCol.getBoundingClientRect().top) + window.scrollY;
        const segment = window.innerHeight;
        const target = Math.max(i - 1, 0);
        window.scrollTo({ top: start + target * segment, behavior: 'smooth' });
      }
    });
  });

  // Scroll/resize handlers
  window.addEventListener('scroll', updateByScroll, { passive: true });
  window.addEventListener('resize', () => { updateByScroll(); });

  // Initial state
  steps.forEach((el, i) => el.classList.toggle('is-active', i === 0));
  setProgressFill(0);
  updateByScroll();

  // Tabs
  // Icon wall animation (Section 2)
  const wall = document.querySelector('#panel-section-2 .icons-wall');
  if (wall) {
    const cols = Array.from(wall.querySelectorAll('.icon-col'));
    const rafState = { last: performance.now() };

    function setupCol(col) {
      const dir = col.getAttribute('data-dir') || 'x'; // 'x' or 'y'
      const speed = Number(col.getAttribute('data-speed') || 50); // px/sec
      const icons = Array.from(col.querySelectorAll('.icon'));
      const gap = 34; // Increased from 28 to 34 (1.2x spacing)
      const size = 100; // Updated to match CSS icon size
      const span = (size + gap);

      // Create extra clones to fill space
      const needed = dir === 'x' ? Math.ceil(col.clientWidth / span) + 3 : Math.ceil(col.clientHeight / span) + 3;
      for (let i = 0; i < needed; i++) {
        const a = icons[i % icons.length].cloneNode(true);
        col.appendChild(a);
      }
      const items = Array.from(col.querySelectorAll('.icon'));
      items.forEach((el, i) => {
        if (dir === 'x') {
          el.style.left = `${(i - 1) * span}px`;
          el.style.top = `calc(50% - ${size/2}px)`;
        } else {
          el.style.top = `${(i - 1) * span}px`;
          el.style.left = `calc(50% - ${size/2}px)`;
        }
      });

      return { dir, speed, items, span, size, gap, el: col };
    }

    const models = cols.map(setupCol);

    function tick(now) {
      const dt = Math.min(64, now - rafState.last) / 1000; // sec
      rafState.last = now;
      models.forEach((m) => {
        const limit = m.dir === 'x' ? m.el.clientWidth : m.el.clientHeight;
        m.items.forEach((item) => {
          const curX = parseFloat(item.dataset.x || item.style.left || '0');
          const curY = parseFloat(item.dataset.y || item.style.top || '0');
          if (m.dir === 'x') {
            let x = (parseFloat(item.style.left) || 0) + (m.speed * dt);
            if (x > limit) x -= (m.items.length * m.span);
            item.style.left = `${x}px`;
          } else {
            let y = (parseFloat(item.style.top) || 0) + (m.speed * dt);
            if (m.speed > 0) {
              // Downward flow
              if (y > limit) y -= (m.items.length * m.span);
            } else {
              // Upward flow
              if (y < -m.span) y += (m.items.length * m.span);
            }
            item.style.top = `${y}px`;
          }
        });
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Content slider animation (Section 3) - Horizontal flow to the left
  const contentSliderRow = document.getElementById('contentSliderRow');
  if (contentSliderRow) {
    const slides = Array.from(contentSliderRow.querySelectorAll('.content-slide-card'));
    const speed = 38; // px/sec (flowing to the left) - Increased to 1.5x
    const gap = 20;
    const cardWidth = 504; // Match CSS width
    const span = cardWidth + gap;
    let rafState = { last: performance.now(), offset: 0 };

    // Clone slides for seamless loop
    slides.forEach((slide) => {
      const clone = slide.cloneNode(true);
      contentSliderRow.appendChild(clone);
    });

    const allSlides = Array.from(contentSliderRow.querySelectorAll('.content-slide-card'));
    const totalWidth = slides.length * span; // Use original slides count for loop

    function animateContentSlider(now) {
      const dt = Math.min(64, now - rafState.last) / 1000; // sec
      rafState.last = now;

      rafState.offset -= speed * dt;

      // Reset position when slides have moved one full cycle
      if (rafState.offset <= -totalWidth) {
        rafState.offset += totalWidth;
      }

      contentSliderRow.style.transform = `translateX(${rafState.offset}px)`;
      requestAnimationFrame(animateContentSlider);
    }

    requestAnimationFrame(animateContentSlider);
  }

  // Logos slideshow animation (Section 4) - Horizontal flow
  const logosRow = document.getElementById('logosRow');
  if (logosRow) {
    const logos = Array.from(logosRow.querySelectorAll('.logo-item'));
    const speed = 20; // px/sec (flowing to the left)
    const gap = 60;
    let rafState = { last: performance.now(), offset: 0 };

    // Calculate average logo width (approximate)
    const avgLogoWidth = 200; // Based on max-width in CSS
    const span = avgLogoWidth + gap;

    // Clone logos for seamless loop
    logos.forEach((logo) => {
      const clone = logo.cloneNode(true);
      logosRow.appendChild(clone);
    });

    const allLogos = Array.from(logosRow.querySelectorAll('.logo-item'));
    const totalWidth = logos.length * span; // Use original logos count for loop

    function animateLogos(now) {
      const dt = Math.min(64, now - rafState.last) / 1000; // sec
      rafState.last = now;

      rafState.offset -= speed * dt;

      // Reset position when logos have moved one full cycle
      if (rafState.offset <= -totalWidth) {
        rafState.offset += totalWidth;
      }

      logosRow.style.transform = `translateX(${rafState.offset}px)`;
      requestAnimationFrame(animateLogos);
    }

    requestAnimationFrame(animateLogos);
  }

})();


