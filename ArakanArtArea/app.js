// 0: Global Data & Init
const JSON_URL = 'https://raw.githubusercontent.com/arakanartarea/AAA-NotePL/main/ArakanArtArea/arakan-songs-chord.json';
let allSongs = [];
let currentSong = null;
let currentGroupList = [];
let currentIndex = 0;
let currentCapo = 0;
let fontSize = 1.1;
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 0A: DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  loadSongs();
  bindGlobalEvents();
});

// 0B: Load JSON
async function loadSongs() {
  try {
    const res = await fetch(JSON_URL);
    allSongs = await res.json();
    document.getElementById('loading').style.display = 'none';
    renderScreen1();
  } catch (e) {
    document.getElementById('loading').textContent = 'Error: ' + e.message;
  }
}

// 0C: Global Events
function bindGlobalEvents() {
  // Toolbar
  document.querySelectorAll('.toolbar button').forEach(btn => {
    btn.onclick = () => handleToolbar(btn.dataset.action);
  });
  // Search
  document.getElementById('search').oninput = renderScreen1;
  document.getElementById('search-clear').onclick = () => {
    document.getElementById('search').value = '';
    renderScreen1();
  };
  // FAB
  document.getElementById('btn-back').onclick = showScreen1;
  document.getElementById('btn-tool').onclick = toggleToolModal;
  // Tool Modal
  document.querySelectorAll('.tool-content button').forEach(btn => {
    btn.onclick = () => handleTool(btn.dataset.action);
  });
  // Close modal on outside click
  document.getElementById('tool-modal').onclick = (e) => {
    if (e.target.id === 'tool-modal') toggleToolModal();
  };
}

// 0D: Toolbar Actions
function handleToolbar(action) {
  if (action === 'search-toggle') {
    const w = document.getElementById('search-wrap');
    w.style.display = w.style.display === 'none' ? 'flex' : 'none';
  }
  if (action === 'show-fav') renderScreen1('fav');
}

// 1: Screen 1 Logic
function renderScreen1(filter = '') {
  const search = document.getElementById('search').value.toLowerCase();
  const container = document.getElementById('song-container');
  let filtered = allSongs.filter(s =>
    s.title.toLowerCase().includes(search) ||
    s.singer.toLowerCase().includes(search) ||
    s.composer.toLowerCase().includes(search)
  );
  if (filter === 'fav') {
    const favs = JSON.parse(localStorage.getItem('favs') || '[]');
    filtered = filtered.filter(s => favs.includes(s.id));
  }
  const groups = {};
  filtered.forEach(s => {
    if (!groups[s.singer]) groups[s.singer] = [];
    groups[s.singer].push(s);
  });
  container.innerHTML = '';
  Object.keys(groups).sort().forEach(singer => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'singer-group';
    groupDiv.innerHTML = `
      <div class="singer-header" onclick="toggleGroup(this)">${singer} (${groups[singer].length})</div>
      <div class="song-list">
        ${groups[singer].map(s => `
          <div class="song-item" onclick="openSong(${s.id})">
            <div>
              <div class="song-title">${s.title}</div>
              <div class="song-composer">တေးရေး: ${s.composer}</div>
            </div>
            <button class="fav-btn" onclick="toggleFav(event, ${s.id})">${isFav(s.id)? '❤️' : '🤍'}</button>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(groupDiv);
  });
}

function toggleGroup(header) {
  const list = header.nextElementSibling;
  document.querySelectorAll('.song-list').forEach(l => {
    if (l !== list) l.style.display = 'none';
  });
  list.style.display = list.style.display === 'block' ? 'none' : 'block';
}

function isFav(id) {
  const favs = JSON.parse(localStorage.getItem('favs') || '[]');
  return favs.includes(id);
}

function toggleFav(e, id) {
  e.stopPropagation();
  let favs = JSON.parse(localStorage.getItem('favs') || '[]');
  if (favs.includes(id)) favs = favs.filter(f => f !== id);
  else favs.push(id);
  localStorage.setItem('favs', JSON.stringify(favs));
  renderScreen1();
  if (currentSong && currentSong.id === id) updateFavButton();
}

// 2: Screen 2 Logic
function openSong(id) {
  currentSong = allSongs.find(s => s.id === id);
  const singer = currentSong.singer;
  currentGroupList = allSongs.filter(s => s.singer === singer);
  currentIndex = currentGroupList.findIndex(s => s.id === id);
  currentCapo = 0;
  showScreen2();
}

function showScreen2() {
  document.getElementById('screen1').style.display = 'none';
  document.getElementById('screen2').style.display = 'block';
  document.getElementById('toolbar').style.display = 'none';
  renderSong();
}

function showScreen1() {
  document.getElementById('screen2').style.display = 'none';
  document.getElementById('screen1').style.display = 'block';
  document.getElementById('toolbar').style.display = 'flex';
}

function renderSong() {
  document.getElementById('song-title').textContent = currentSong.title;
  document.getElementById('song-meta').textContent = `${currentSong.singer} | ${currentSong.composer}`;
  document.getElementById('info-key').textContent = currentSong.key;
  document.getElementById('info-bpm').textContent = currentSong.bpm;
  document.getElementById('info-rhythm').textContent = currentSong.rhythm || '-';
  const content = document.getElementById('song-content');
  content.innerHTML = '';
  currentSong.sections.forEach(sec => {
    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = sec.name;
    content.appendChild(label);
    sec.lines.forEach(line => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'line';
      let html = '';
      let lastPos = 0;
      const regex = /\[([A-G][#b]?)(\d+)\]/g;
      let match;
      while ((match = regex.exec(line.raw)) !== null) {
        html += line.raw.substring(lastPos, match.index);
        html += `<span class="chord" data-chord="${match[1]}">${match[1]}</span>`;
        lastPos = match.index + match[0].length;
      }
      html += line.raw.substring(lastPos);
      lineDiv.innerHTML = html.replace(/\[([A-G][#b]?)(\d+)\]/g, '');
      content.appendChild(lineDiv);
    });
  });
  applyCapo();
  updateFavButton();
}

function toggleToolModal() {
  const m = document.getElementById('tool-modal');
  m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

function handleTool(action) {
  if (action === 'close') return toggleToolModal();
  if (action === 'prev') navigateSong(-1);
  if (action === 'next') navigateSong(1);
  if (action === 'capo-up') transpose(1);
  if (action === 'capo-down') transpose(-1);
  if (action === 'font-up') changeFont(1);
  if (action === 'font-down') changeFont(-1);
  if (action === 'info-toggle') {
    const b = document.getElementById('info-box');
    b.style.display = b.style.display === 'none' ? 'block' : 'none';
  }
  if (action === 'fav-toggle') toggleFav({ stopPropagation: () => {} }, currentSong.id);
}

function navigateSong(dir) {
  currentIndex += dir;
  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= currentGroupList.length) currentIndex = currentGroupList.length - 1;
  currentSong = currentGroupList[currentIndex];
  currentCapo = 0;
  renderSong();
}

function transpose(step) {
  currentCapo += step;
  applyCapo();
}

function applyCapo() {
  document.querySelectorAll('.chord').forEach(el => {
    const original = el.dataset.chord;
    const idx = NOTES.indexOf(original);
    if (idx === -1) return;
    const newIdx = (idx + currentCapo + 12) % 12;
    el.textContent = NOTES[newIdx];
  });
}

function changeFont(dir) {
  fontSize += dir * 0.1;
  document.body.style.fontSize = fontSize + 'rem';
}

function updateFavButton() {
  const btn = document.querySelector('[data-action="fav-toggle"]');
  if (btn) btn.textContent = isFav(currentSong.id) ? '💔 Unfav' : '❤️ Fav';
}