/* music-player.js
   Shared player logic for Niori / Nebby / Cookie music pages.
   Each page sets:  window.MUSIC_CONFIG = { tracks, sessionKey, barIcon }
   before this script runs.
*/

(function() {

  /* ── require config ── */
  const cfg = window.MUSIC_CONFIG;
  if (!cfg) { console.warn('music-player.js: no MUSIC_CONFIG found'); return; }

  const TRACKS      = cfg.tracks;
  const SESSION_KEY = cfg.sessionKey;
  const BAR_ICON    = cfg.barIcon || '♪';

  /* ── elements ── */
  const audio       = document.getElementById('main-audio');
  const barProgress = document.getElementById('bar-progress');
  const plProgress  = document.getElementById('pl-progress');
  const barNow      = document.getElementById('bar-now');
  const plNow       = document.getElementById('pl-now');
  const barPP       = document.getElementById('bar-playpause');
  const plPP        = document.getElementById('pl-playpause');
  const barVol      = document.getElementById('bar-vol');
  const plTime      = document.getElementById('pl-time');
  const musicBar    = document.getElementById('music-bar');

  if (!audio || !musicBar) return;

  let currentIdx = -1;

  /* ── volume ── */
  const savedVol = parseFloat(sessionStorage.getItem(SESSION_KEY + '_vol') || '0.5');
  audio.volume = savedVol;
  if (barVol) barVol.value = savedVol;
  if (barVol) barVol.addEventListener('input', () => {
    audio.volume = barVol.value;
    sessionStorage.setItem(SESSION_KEY + '_vol', barVol.value);
  });

  /* ── playlist builder ── */
  function buildPlaylist() {
    const container = document.getElementById('playlist-tracks');
    if (!container) return;
    container.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'pl-track' + (i === currentIdx ? ' active' : '');
      div.id = 'pl-track-' + i;
      div.innerHTML =
        '<span class="pl-track-icon">' + (i === currentIdx ? '▶' : '♪') + '</span>' +
        '<div class="pl-track-info">' +
          '<span class="pl-track-name">' + t.name + '</span>' +
          '<span class="pl-track-sub">'  + t.sub  + '</span>' +
        '</div>' +
        '<span class="pl-track-arrow">' + (i === currentIdx ? '▶' : '') + '</span>';
      div.addEventListener('click', () => window.playTrack(i));
      container.appendChild(div);
    });
  }

  /* ── play a track by index ── */
  window.playTrack = function(idx) {
    const track = TRACKS[idx];
    if (track.src) {
      audio.src = track.src;
      audio.play().catch(() => {});
    }
    setActiveTrack(idx);
  };

  /* ── mark a track as active without necessarily playing ── */
  function setActiveTrack(idx) {
    // un-highlight old card
    if (currentIdx >= 0) {
      const oldCard = document.getElementById('card-' + currentIdx);
      if (oldCard) {
        oldCard.classList.remove('playing');
        const ob = oldCard.querySelector('.track-play-btn');
        if (ob) ob.textContent = '▶ Play';
      }
    }

    currentIdx = idx;
    const track = TRACKS[idx];

    // highlight new card
    const newCard = document.getElementById('card-' + idx);
    if (newCard) {
      newCard.classList.add('playing');
      const nb = newCard.querySelector('.track-play-btn');
      if (nb) nb.textContent = '⏸ Playing';
    }

    // update bar label
    const label = BAR_ICON + ' ' + track.name + ' — ' + track.sub;
    if (barNow) barNow.textContent = label;
    if (plNow)  plNow.textContent  = track.name + ' — ' + track.sub;

    sessionStorage.setItem(SESSION_KEY + '_track', idx);
    buildPlaylist();
  }

  /* ── bar controls ── */
  window.barToggle = function() {
    if (currentIdx < 0) { window.playTrack(0); return; }
    if (audio.paused) { audio.play().catch(() => {}); }
    else              { audio.pause(); }
  };

  window.barPrev = function() {
    window.playTrack(currentIdx <= 0 ? TRACKS.length - 1 : currentIdx - 1);
  };

  window.barNext = function() {
    window.playTrack((currentIdx + 1) % TRACKS.length);
  };

  window.barSeek = function(e) {
    if (!audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  };

  /* ── playlist modal ── */
  window.openPlaylist = function() {
    buildPlaylist();
    const overlay = document.getElementById('playlist-overlay');
    if (overlay) overlay.classList.add('open');
  };

  window.closePlaylist = function() {
    const overlay = document.getElementById('playlist-overlay');
    if (overlay) overlay.classList.remove('open');
  };

  window.closePlaylistOutside = function(e) {
    const overlay = document.getElementById('playlist-overlay');
    if (e.target === overlay) closePlaylist();
  };

  /* ── time formatter ── */
  function fmt(s) {
    const m = Math.floor(s / 60);
    return m + ':' + Math.floor(s % 60).toString().padStart(2, '0');
  }

  /* ── audio events ── */
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration * 100) + '%';
    if (barProgress) barProgress.style.width = pct;
    if (plProgress)  plProgress.style.width  = pct;
    if (plTime)      plTime.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener('play', () => {
    if (barPP) barPP.textContent = '⏸';
    if (plPP)  plPP.textContent  = '⏸';
    musicBar.classList.add('playing');
    const btn = document.querySelector('#card-' + currentIdx + ' .track-play-btn');
    if (btn) btn.textContent = '⏸ Playing';
    sessionStorage.setItem(SESSION_KEY + '_playing', 'true');
    sessionStorage.setItem(SESSION_KEY + '_track', currentIdx);
  });

  audio.addEventListener('pause', () => {
    if (barPP) barPP.textContent = '▶';
    if (plPP)  plPP.textContent  = '▶';
    musicBar.classList.remove('playing');
    const btn = document.querySelector('#card-' + currentIdx + ' .track-play-btn');
    if (btn) btn.textContent = '▶ Play';
    sessionStorage.setItem(SESSION_KEY + '_playing', 'false');
  });

  audio.addEventListener('ended', () => barNext());

  /* ── restore session state ── */
  const wasPlaying = sessionStorage.getItem(SESSION_KEY + '_playing') === 'true';
  const savedIdx   = parseInt(sessionStorage.getItem(SESSION_KEY + '_track') || '-1');

  if (savedIdx >= 0 && savedIdx < TRACKS.length) {
    setActiveTrack(savedIdx);
    if (wasPlaying && TRACKS[savedIdx].src) {
      audio.src = TRACKS[savedIdx].src;
      audio.play().catch(() => {});
    }
  }

  buildPlaylist();

})();

/* ── mobile menu ── */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

/* ── lightbox ── */
function openLightbox(src) {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  if (lb && img) { img.src = src; lb.classList.add('open'); }
}
function closeLightbox() {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  if (lb && img) { lb.classList.remove('open'); img.src = ''; }
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});