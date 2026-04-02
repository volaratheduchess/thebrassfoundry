/* shared.js — Niori site */

/* ===== FOG LAYER ===== */
(function() {
  const canvas = document.getElementById('fog-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const puffs = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 12; i++) {
    puffs.push({
      x: Math.random() * 1.4 - 0.2,
      y: 0.5 + Math.random() * 0.6,
      r: 160 + Math.random() * 200,
      vx: (Math.random() - 0.5) * 0.00015,
      alpha: 0.03 + Math.random() * 0.05,
    });
  }

  function drawFog() {
    ctx.clearRect(0, 0, W, H);
    puffs.forEach(p => {
      p.x += p.vx;
      if (p.x > 1.3) p.x = -0.3;
      if (p.x < -0.3) p.x = 1.3;
      const grd = ctx.createRadialGradient(
        p.x * W, p.y * H, 0,
        p.x * W, p.y * H, p.r
      );
      grd.addColorStop(0, `rgba(100,160,100,${p.alpha})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    });
    requestAnimationFrame(drawFog);
  }
  drawFog();
})();

/* ===== FIREFLIES ===== */
(function() {
  const canvas = document.getElementById('firefly-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const flies = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#39ff14','#00ffee','#80ff40','#c8ff80'];

  for (let i = 0; i < 55; i++) {
    flies.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
      speed: 0.012 + Math.random() * 0.02,
    });
  }

  function drawFlies() {
    ctx.clearRect(0, 0, W, H);
    const t = Date.now() * 0.001;
    flies.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;
      if (f.x < -10) f.x = W + 10;
      if (f.x > W + 10) f.x = -10;
      if (f.y < -10) f.y = H + 10;
      if (f.y > H + 10) f.y = -10;
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * f.speed * 60 + f.phase));
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = f.color;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    requestAnimationFrame(drawFlies);
  }
  drawFlies();
})();

/* ===== MURK CAMEO ===== */
(function() {
  const cameo = document.getElementById('murk-cameo');
  if (!cameo) return;

  const messages = [
    "☕ I'm not grumpy. I'm calibrated.",
    "🐊 The swamp is warm. You're not invited.",
    "☕ Do not approach before coffee.",
    "🐊 The hat stays on. Always.",
    "☕ This is my third coffee. Don't.",
    "🐊 Hat: tilted left. Proceed with caution.",
    "☕ I tolerate this website. Occasionally.",
    "🐊 The muck is warm. The company is weirder.",
    "☕ Black. Strong. No commentary.",
  ];

  function showCameo() {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    cameo.querySelector('span').textContent = msg;
    cameo.classList.add('visible');
    setTimeout(() => cameo.classList.remove('visible'), 4500);
  }

  setTimeout(() => {
    showCameo();
    setInterval(showCameo, Math.random() * 40000 + 40000);
  }, 8000);
})();

/* ===== AMBIENT MUSIC PLAYER ===== */
(function() {
  const STORAGE_KEY = 'niori_music';
  const TRACK_URL   = 'https://suno.com/s/FBBdTN7pmbXzgMCd';

  // We use a hidden iframe approach for cross-page "sync"
  // by storing play state in sessionStorage
  const bar     = document.getElementById('music-bar');
  const btn     = document.getElementById('music-btn');
  const label   = document.getElementById('music-label');
  const volSldr = document.getElementById('music-vol');
  const audio   = document.getElementById('ambient-audio');

  if (!bar || !audio) return;

  // restore volume
  const savedVol = parseFloat(sessionStorage.getItem('niori_vol') || '0.4');
  audio.volume = savedVol;
  if (volSldr) volSldr.value = savedVol;

  // restore play state
  const wasPlaying = sessionStorage.getItem('niori_playing') === 'true';
  if (wasPlaying) {
    audio.play().then(() => {
      bar.classList.add('playing');
      btn.textContent = '⏸ Pause';
    }).catch(() => {});
  }

  window.toggleAmbient = function() {
    if (audio.paused) {
      audio.play();
      bar.classList.add('playing');
      btn.textContent = '⏸ Pause';
      sessionStorage.setItem('niori_playing', 'true');
    } else {
      audio.pause();
      bar.classList.remove('playing');
      btn.textContent = '▶ Play Ambience';
      sessionStorage.setItem('niori_playing', 'false');
    }
  };

  if (volSldr) {
    volSldr.addEventListener('input', () => {
      audio.volume = volSldr.value;
      sessionStorage.setItem('niori_vol', volSldr.value);
    });
  }

  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    audio.play();
  });
})();

/* ===== MOBILE MENU ===== */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

/* ===== LIGHTBOX ===== */
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add('open');
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  if (!lb || !img) return;
  lb.classList.remove('open');
  img.src = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});