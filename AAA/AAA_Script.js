const sheetId = '1MnRxfu3BhlTnB6IlvtEfik2FfY-d22SOeaBTKAqfFCY';
const sheetName = 'AAAview';
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
const webAppUrl = "script.google.com/macros/s/AKfycbyfdSxVg23Trt9q0lEvYuMxQlPj3k9gTKbkfjHTpWYzPxRmctP1LDoST7fzzrIGtyuv/exec"; //20260528
//https://script.google.com/macros/s/AKfycbx_VC5KVWnsl9re3CciF0NBbc3qkD0dRpGEOnqTdAGN0EjVya9IdTBYhn-h9qKwLerS/exec"; //20260519
//https://script.google.com/macros/s/AKfycbyfdSxVg23Trt9q0lEvYuMxQlPj3k9gTKbkfjHTpWYzPxRmctP1LDoST7fzzrIGtyuv/exec
const CLIENT_ID = "750089996822-76hj5pfvrf8ui70eu6cimv0lb9lg6su3.apps.googleusercontent.com";
const userIcon = document.getElementById('userIcon');

let allData = [];
let currentSortKey = localStorage.getItem('preferredSort') || 'artist';
let isAscending = localStorage.getItem('isAscending') === 'false' ? false : true;
let countSortMode = localStorage.getItem('countSortMode') || 'none'; // 'none', 'desc', 'asc'

let currentVoteSongId = "";
let listType = 'songs'; 
let listDisplayData = []; 

let userSession = JSON.parse(localStorage.getItem('user_session')) || null;
let selectedVoteNum = null;
let currentTargetSong = null; // သီချင်း ID ပါ သိမ်းဖို့ object တစ်ခုလုံး ယူထားမယ်

function mapSheetRow(row) {
    const getValue = (index) => (row.c && row.c[index] && row.c[index].v) ? row.c[index].v : '';
    return {
        id: getValue(0),       title: getValue(1),    artist: getValue(2),    writer: getValue(3),
        album: getValue(4),    albumType: getValue(5), newOld: getValue(6),    oc: getValue(7),
        tradition: getValue(8), star: getValue(9),     voters: getValue(10),   year: getValue(11),
        studio: getValue(12),  language: getValue(13), harmony: getValue(14),  mixing: getValue(15),
        director: getValue(16), guitar: getValue(17),  gender: getValue(18),   karaoke: getValue(19), 
        remark: getValue(20),  s1: getValue(21),      s2: getValue(22),       s3: getValue(23),
        s4: getValue(24),      s5: getValue(25)
    };
}

function updateToolbarUI(isDetailView, key = 'artist') {
    const isMobile = window.innerWidth <= 768;

    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.style.display = (isMobile && isDetailView) ? 'flex' : 'none';

    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) sortBtn.style.display = (isMobile && isDetailView) ? 'none' : 'flex';
    
    const searchBox = document.getElementById('search');
    if (searchBox) searchBox.style.display = (isMobile && isDetailView) ? 'none' : 'block';

    const labels = {
        'artist': 'တေးဆိုအလိုက်',
        'writer': 'တေးရွီးအလိုက်',
        'album': 'အယ်ဘမ်အလိုက်',
        'oc': 'O/C အလိုက်',
        'tradition': 'ရိုးရာအလိုက်'
    };
    const sortLabel = document.querySelector('#sortBtn span:last-child');
    if (sortLabel) sortLabel.innerText = labels[key] || 'စီနည်း';
}

async function loadData() {
    const cached = localStorage.getItem('rakhineArchive');
    if (cached) {
        allData = JSON.parse(cached);
        handleSort(currentSortKey);
        document.getElementById('loading').style.display = 'none';
    }

    try {
        const res = await fetch(url);
        const text = await res.text();
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        allData = json.table.rows.map(mapSheetRow).filter(item => item.title && item.title !== '-');
        localStorage.setItem('rakhineArchive', JSON.stringify(allData));
        handleSort(currentSortKey);
        document.getElementById('loading').style.display = 'none';
    } catch (e) { console.error(e); }
}

// All Song Menu
function handleSort(key) {
    currentSortKey = key;
    localStorage.setItem('preferredSort', key);
    updateToolbarUI(false, key);
    toggleSortMenu(false);

    const orderBtn = document.getElementById('orderBtn');
    const countBtn = document.getElementById('countSortBtn');
    
    if (orderBtn) orderBtn.innerText = isAscending ? "🔡 က - အ" : "🔡 အ - က";
    
    if (countBtn) {
        if (countSortMode === 'desc') countBtn.innerText = "📈 အများဆုံးမှ အနည်း";
        else if (countSortMode === 'asc') countBtn.innerText = "📉 အနည်းဆုံးမှ အများ";
        else countBtn.innerText = "📊 အရေအတွက်အလိုက်";
    }

    const groups = allData.reduce((acc, item) => {
        let rawName = item[key] || 'အမည်မသိ';
        let groupName = (typeof rawName === 'string' && rawName.includes(',')) ? rawName.split(',')[0].trim() : rawName;
        if (groupName === '-' || groupName === '') groupName = 'အမည်မသိ';
        
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(item);
        return acc;
    }, {});

    let sortedNames = Object.keys(groups);

    if (countSortMode === 'desc') {
        sortedNames.sort((a, b) => groups[b].length - groups[a].length);
    } else if (countSortMode === 'asc') {
        sortedNames.sort((a, b) => groups[a].length - groups[b].length);
    } else {
        sortedNames.sort((a, b) => isAscending ? a.localeCompare(b, 'my') : b.localeCompare(a, 'my'));
    }

    const listElement = document.getElementById('artist-list-container');
    if(listElement) {
        listElement.innerHTML = sortedNames.map((name, index) => {
            // Child Items (သီချင်းများ) ကို Sort စီခြင်း
            let sortedSongs = [...groups[name]];
            if (countSortMode !== 'none') {
                sortedSongs.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'my'));
            } else {
                sortedSongs.sort((a, b) => isAscending 
                    ? (a.title || '').localeCompare(b.title || '', 'my') 
                    : (b.title || '').localeCompare(a.title || '', 'my')
                );
            }

            const groupDataEncoded = encodeURIComponent(JSON.stringify(groups[name]));
            const nameEncoded = encodeURIComponent(name);
            
            return `
            <div class="artist-group-container">
                <div class="artist-header">
                    <div class="artist-info" onclick="renderCardView(decodeURIComponent('${nameEncoded}'), '${groupDataEncoded}')">
                        ${name}
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span class="count-badge">${groups[name].length}</span>
                        <div id="btn-${index}" class="expand-btn" onclick="toggleSongs('songs-${index}', 'btn-${index}')">❯</div>
                    </div>
                </div>
                <div id="songs-${index}" class="song-list">
                    ${sortedSongs.map(song => {
                        const songEncoded = encodeURIComponent(JSON.stringify(song));
                        return `
                        <div class="song-list-item" onclick="openFullModal(JSON.parse(decodeURIComponent('${songEncoded}')))">
                            🎵 ${song.title}
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('');
    }
}

function renderCardView(name, encodedData) {
    const songs = JSON.parse(decodeURIComponent(encodedData));
    
    let html = `<h2 style="padding:10px; border-bottom: 2px solid var(--primary);">${name}</h2>`;
    html += `<div class="song-grid">`;
    
    html += songs.map((song, idx) => {
        const songEncoded = encodeURIComponent(JSON.stringify(song)); // 💡 Editor အတွက် ရော HTML အတွက်ပါ အန္တရာယ်ကင်းဆုံး ပုံစံဖြစ်သည်
        return `
        <div class="artist-card">
            <div class="card-header"><p class="card-title">${song.title || '-'}</p></div>
            
            <div class="card-main-info">
                <div class="info-item">🎙️- ${song.artist || '-'}</div>
                <div class="info-item">✍️ - ${song.writer || '-'}</div>
                <div class="info-item">💿  - ${song.album || '-'}</div>
                <div class="info-item">🆔 - ${song.id || '-'}</div>
                
                <div class="info-item rating-click" onclick="openVoteModal('${song.id}')" style="cursor:pointer; color:var(--primary);">
                    <div>✨${song.star || '❌'}</div>
                    <div style="font-size:10px;">(${song.voters || 0} votes)</div>
                </div>
            </div>
            
            <div id="extra-${idx}" class="extra-details" style="display:none; padding:10px; background:var(--card); border-top:1px dashed var(--border); font-size:12px;">
                <div style="margin-bottom:6px;">📀 : <span style="color:var(--primary); font-weight:bold;">${song.albumType || '-'}</span></div>
                <div style="margin-bottom:6px;">🎸 : <span style="color:var(--primary); font-weight:bold;">${song.oc || '-'}</span></div>
                <div style="margin-bottom:6px;">🆕 : <span style="color:var(--primary); font-weight:bold;">${song.newOld || '-'}</span></div>
                <div style="margin-bottom:6px;">🌸 : <span style="color:var(--primary); font-weight:bold;">${song.tradition || '-'}</span></div>
            </div>
            
            <div class="card-actions">
                <button class="btn-expand" onclick="toggleCardExtra('extra-${idx}')">အချက်အလက် ↓</button>
                <button class="btn-full" onclick="openFullModal(JSON.parse(decodeURIComponent('${songEncoded}')))">အပြည့်အစုံ 👁️</button>
            </div>
        </div>`;
    }).join('');

    html += `</div>`;

    const detailPanel = document.getElementById('group-list');
    detailPanel.innerHTML = html;
    
    if (window.innerWidth <= 768) {
        document.getElementById('master-panel').classList.add('hidden-mobile');
        detailPanel.classList.remove('hidden-mobile');
        window.scrollTo(0, 0);
    }
    updateToolbarUI(true, currentSortKey);
}

function toggleCardExtra(id) {
    const el = document.getElementById(id);
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}

function goBackToGroup() { 
    if (window.innerWidth <= 768) {
        document.getElementById('master-panel').classList.remove('hidden-mobile');
        document.getElementById('group-list').classList.add('hidden-mobile');
    }
    updateToolbarUI(false, currentSortKey); 
    window.scrollTo(0, 0);

    const container = document.querySelector('.container');
    if(container) {
        container.style.maxWidth = (window.innerWidth > 768) ? '100%' : '1000px'; 
    }
}

function openFullModal(song) {
    const modal = document.getElementById('fullModal');
    const body = document.getElementById('modal-body');
    document.body.style.overflow = 'hidden';
    
    // 🎥 YouTube Embed URL ထုတ်တာ - function တစ်ခုတည်းပဲသုံး
    const embedUrl = getYouTubeEmbedUrl(song.karaoke);
    
    body.innerHTML = `
    <div class="close-modal" onclick="closeModal()">✕</div>
    <div class="new-detail-grid">
      <div class="info-section">
        <h1 class="song-main-title">${song.title || '-'}</h1>
        <div class="full-info-list" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
          <p>🎙️ <strong>တေးဆို:</strong> ${song.artist || '-'}</p>
          <p>✍️ <strong>တေးရေး:</strong> ${song.writer || '-'}</p>
          <p>💿 <strong>အယ်ဘမ်:</strong> ${song.album || '-'}</p>
          <p>📀 <strong>အယ်ဘမ်အမျိုးအစား:</strong> ${song.albumType || '-'}</p>
          <p>📅 <strong>ခုနှစ်:</strong> ${song.year || '-'}</p>
          <p>🎸 <strong>သီချင်းအမျိုးအစား:</strong> ${song.oc || '-'}</p>
          <p>🆕 <strong>အသစ်/ပြန်ဆို:</strong> ${song.newOld || '-'}</p>
          <p>🌸 <strong>သီချင်းမုဒ်:</strong> ${song.tradition || '-'}</p>
          <p>🆔 <strong>သီချင်း ID:</strong> ${song.id || '-'}</p>
          <p>⭐ <strong>Rating:</strong> ${song.star || '❌'} (${song.voters || 0} votes)</p>
          <hr style="border:none; border-top:1px dashed var(--border); margin:10px 0;">
          <p>🏢 <strong>Studio:</strong> ${song.studio || '-'}</p>
          <p>🗣️ <strong>ဘာသာစကား:</strong> ${song.language || '-'}</p>
          <p>🎼 <strong>Harmony:</strong> ${song.harmony || '-'}</p>
          <p>🎛️ <strong>Mixing:</strong> ${song.mixing || '-'}</p>
          <p>🎬 <strong>Director:</strong> ${song.director || '-'}</p>
          <p>🎸 <strong>Lead Guitar:</strong> ${song.guitar || '-'}</p>
          <p>🚻 <strong>ကျား/မ:</strong> ${song.gender || '-'}</p>
          <p>📝 <strong>မှတ်ချက်:</strong> ${song.remark || '-'}</p>
        </div>
        <button class="vote-btn" onclick="openVoteModal('${song.id}')" style="margin-top:15px;"> Rating ပေးမယ် ⭐⭐⭐⭐⭐ </button>
      </div>
      <div class="lyrics-section-new">
        <h3 class="section-title">သီချင်းစာသား</h3>
        <div class="lyrics-box">
          ${song.lyrics || 'သီချင်းစာသား မရှိသေးပါ။'}
        </div>
      </div>
      <div class="video-section-new">
        <h3 class="section-title">သီချင်းဗီဒီယို</h3>
        <div class="video-container">
          ${embedUrl
           ? `<iframe width="100%" height="315" src="${embedUrl}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`
            : '<div class="no-video" style="padding:40px; text-align:center; color:var(--text-sub);">📺 ဗီဒီယို မရှိသေးပါ</div>'
          }
        </div>
      </div>

    </div>
  `;
modal.style.display = 'block';
}

// Modal ကို ပိတ်မည့် Function နှင့် ဗီဒီယို/အသံ ရပ်တန့်စေခြင်း
function closeModal() {
    const modal = document.getElementById('fullModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // မူလ Scroll ပြန်ဖွင့်ရန်

        // 🛑 ဗီဒီယို အသံဆက်မထွက်အောင် ရှင်းထုတ်ပစ်မည့်အပိုင်း
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.innerHTML = ''; // iframe ကို ဖယ်ရှားလိုက်ခြင်းဖြင့် အသံရပ်သွားပါမည်
        }
    }
}

// youtube link embedUrl
function getYouTubeEmbedUrl(input) {
    if (!input) return null;
    let url = String(input).trim();
    let videoId = "";

    try {
        if (url.includes("youtu.be/")) {
            // shorts သို့မဟုတ် shared link ပုံစံများအတွက် (ဥပမာ - https://youtu.be/abc123xyz45)
            let parts = url.split("youtu.be/");
            if (parts[1]) videoId = parts[1].split(/[?#]/)[0];
        } else if (url.includes("v/") || url.includes("embed/")) {
            // embed link ပုံစံများအတွက်
            let parts = url.split(/embed\/|v\//);
            if (parts[1]) videoId = parts[1].split(/[?#]/)[0];
        } else if (url.includes("shorts/")) {
            // shorts link ပုံစံများအတွက်
            let parts = url.split("shorts/");
            if (parts[1]) videoId = parts[1].split(/[?#]/)[0];
        } else if (url.includes("watch?v=")) {
            // standard link ပုံစံများအတွက် (ဥပမာ - watch?v=abc123xyz45)
            let parts = url.split("watch?v=");
            if (parts[1]) videoId = parts[1].split("&")[0];
        } else if (url.includes("?v=")) {
            let parts = url.split("?v=");
            if (parts[1]) videoId = parts[1].split("&")[0];
        } else if (url.includes("&v=")) {
            let parts = url.split("&v=");
            if (parts[1]) videoId = parts[1].split("&")[0];
        }

        // ဗီဒီယို ID က စာလုံးရေ ၁၁ လုံး ရှိရပါမယ်
        if (videoId && videoId.length === 11) {
            return "https://www.youtube.com/embed/" + videoId;
        }
    } catch (e) {
        console.error(e);
    }

    return null;
}

function toggleSongs(id, btnId) {
    const el = document.getElementById(id);
    const btn = document.getElementById(btnId);
    const isOpen = el.style.display === "block";
    
    el.style.display = isOpen ? "none" : "block";
    btn.classList.toggle('active', !isOpen);
}

function toggleSortMenu(show) {
    const menu = document.getElementById('sortMenu');
    const overlay = document.getElementById('overlay');
    const isShowing = show !== undefined ? show : !menu.classList.contains('show');
    menu.classList.toggle('show', isShowing);
    overlay.style.display = isShowing ? 'block' : 'none';
}

function toggleSortOrder() {
    isAscending = !isAscending;
    localStorage.setItem('isAscending', isAscending); // အခြေအနေကို မှတ်ထားမယ်
    
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        orderBtn.innerText = isAscending ? "🔡 က - အ" : "🔡 အ - က";
    }
    handleSort(currentSortKey);
}

function filterData() {
    
    const searchInput = document.getElementById('search');
    const clearBtn = document.getElementById('clearSearch');
    const val = searchInput.value.toLowerCase();
    
    clearBtn.style.display = (val.length > 0) ? 'block' : 'none';

    if (val === "") {
        clearSearch(); 
    } else {
        const filtered = allData.filter(i =>
            (i.title && i.title.toLowerCase().includes(val)) || 
            (i.artist && i.artist.toLowerCase().includes(val)) ||
            (i.writer && i.writer.toLowerCase().includes(val))
        );
                document.getElementById('group-list').innerHTML = filtered.map(song => `
            <div class="song-list-item" 
                 onclick='openFullModal(${JSON.stringify(song).replace(/"/g, '&quot;')})'
                 style="padding:12px; border-bottom:1px solid var(--border, #eee); background:var(--card); color:var(--text); cursor:pointer;">
                <strong>🎵 ${song.title}</strong><br>
                <small style="opacity: 0.7; margin-left:20px;">ဆို: ${song.artist || '-'} | ရေး: ${song.writer || '-'}</small>
            </div>
        `).join('');
        if (window.innerWidth <= 768) {
            // Expan Group List ပါတဲ့ container ကိုပဲ ဖျောက်ပြီး Search ရလဒ်ကို အစားထိုးပြမယ်
            const artistContainer = document.getElementById('artist-list-container');
            if (artistContainer) artistContainer.style.setProperty('display', 'none', 'important');
            
            document.getElementById('group-list').classList.remove('hidden-mobile');
            updateToolbarUI(false, currentSortKey); // true ပေးရင် search box ပျောက်လို့ false ပဲထိန်းထားမယ်
        }}} 
        
function clearSearch() {
    const searchInput = document.getElementById('search');
    searchInput.value = "";
    document.getElementById('clearSearch').style.display = 'none';

    if (window.innerWidth <= 768) {
        // ရှာတာပိတ်လိုက်ရင် Expan Group List ကို ပုံမှန်အတိုင်း ပြန်ဖော်မယ်
        const artistContainer = document.getElementById('artist-list-container');
        if (artistContainer) artistContainer.style.setProperty('display', 'block', 'important');

        document.getElementById('master-panel').classList.remove('hidden-mobile');
        document.getElementById('group-list').classList.add('hidden-mobile');
        updateToolbarUI(false, currentSortKey);
    }
    
    handleSort(currentSortKey); 
    window.scrollTo(0, 0);
}

function toggleAddSubMenu() {
    const subMenu = document.getElementById('add-sub-menu');
    const arrow = document.getElementById('add-arrow');
    
    if (subMenu.style.display === "none") {
        subMenu.style.display = "block";
        arrow.style.transform = "rotate(90deg)"; 
    } else {
        subMenu.style.display = "none";
        arrow.style.transform = "rotate(0deg)"; 
    }
}

function toggleSettings() {
    const menu = document.getElementById('settingsMenu');
    const overlay = document.getElementById('settingsOverlay');
    const isShowing = menu.classList.contains('show');

    if (isShowing) {
        menu.classList.remove('show');
        overlay.style.display = 'none';
        
        const subMenu = document.getElementById('add-sub-menu');
        const arrow = document.getElementById('add-arrow');
        if(subMenu) subMenu.style.display = "none";
        if(arrow) arrow.style.transform = "rotate(0deg)";
    } else {
        const sortMenu = document.getElementById('sortMenu');
        if(sortMenu) sortMenu.classList.remove('show');
        
        menu.classList.add('show');
        overlay.style.display = 'block';
    }
}

function showStats() {
    const totalSongs = allData.length;
    const artists = new Set(allData.map(s => s.artist).filter(a => a && a !== '-'));
    const totalArtists = artists.size;
    const albums = new Set(allData.map(s => s.album).filter(a => a && a !== '-'));
    const totalAlbums = albums.size;

    const years = allData.map(s => parseInt(s.year)).filter(y => !isNaN(y));
    const yearRange = years.length > 0 ? `${Math.min(...years)} - ${Math.max(...years)}` : "-";

    document.getElementById('stat-total-songs').innerText = totalSongs;
    document.getElementById('stat-total-artists').innerText = totalArtists;
    document.getElementById('stat-total-albums').innerText = totalAlbums;
    document.getElementById('stat-total-years').innerText = yearRange;

    document.getElementById('statsModal').classList.add('show');
    document.getElementById('statsOverlay').style.display = 'block';
}

function closeStats() {
    document.getElementById('statsModal').classList.remove('show');
    document.getElementById('statsOverlay').style.display = 'none';
}

function showFullList(type) {
    listType = type;
    const title = document.getElementById('list-title');
    
    document.querySelectorAll('.m-tool-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + type);
    if(activeBtn) activeBtn.classList.add('active');

    const config = {
        'songs':   { key: 'title',  label: 'သီချင်းများ' },
        'artists': { key: 'artist', label: 'အဆိုတော်များ' },
        'writers': { key: 'writer', label: 'တေးရေးများ' },
        'albums':  { key: 'album',  label: 'အယ်ဘမ်များ' },
        'studios': { key: 'studio', label: 'စတူဒီယိုများ' },
        'genres':  { key: 'oc',     label: 'အမျိုးအစား' }
    };

    const current = config[type] || config['songs'];
    title.innerText = current.label + " စာရင်း";

    if (type === 'songs') {
        listDisplayData = [...allData];
    } else {
        let allNames = [];
        allData.forEach(s => {
            const value = s[current.key];
            if (value && value !== '-') {
                const separatedNames = value.split(',').map(name => name.trim());
                allNames.push(...separatedNames);
            }
        });
        listDisplayData = [...new Set(allNames)].sort((a, b) => a.localeCompare(b, 'my'));
    }

    renderList();
    document.getElementById('fullListModal').style.display = 'block';
}

function sortListData(dir) {
    if (dir === 'AZ') {
        listDisplayData.sort((a, b) => {
            let valA = typeof a === 'string' ? a : a.title;
            let valB = typeof b === 'string' ? b : b.title;
            return valA.localeCompare(valB, 'my'); 
        });
    } else {
        listDisplayData.sort((a, b) => {
            let valA = typeof a === 'string' ? a : a.title;
            let valB = typeof b === 'string' ? b : b.title;
            return valB.localeCompare(valA, 'my');
        });
    }
    renderList();
}

function toggleCountSort() {
    // Mode ကို တစ်လှည့်စီ ပြောင်းမယ်: none -> desc -> asc -> none
    if (countSortMode === 'none') countSortMode = 'desc';
    else if (countSortMode === 'desc') countSortMode = 'asc';
    else countSortMode = 'none';

    localStorage.setItem('countSortMode', countSortMode);
    handleSort(currentSortKey);
}

// ၁။ Theme ပြောင်းလဲခြင်းနှင့် Local Storage သိမ်းခြင်း
function changeTheme(theme) {
    localStorage.setItem('userTheme', theme);
    applyTheme();
}

// ၂။ လက်တွေ့ Theme ကို အပလီကေးရှင်းမှာ သက်ရောက်စေခြင်း
function applyTheme() {
    const savedTheme = localStorage.getItem('userTheme') || 'system';
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.value = savedTheme;

    let targetTheme = savedTheme;

    // စက်ရဲ့ Settings အတိုင်းကြည့်ခြင်း
    if (savedTheme === 'system') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        targetTheme = isDarkMode ? 'dark' : 'light';
    }

    if (targetTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
}

// ၃။ စက်ရဲ့ System Setting ပြောင်းသွားရင် ချက်ချင်းလိုက်ပြောင်းပေးဖို့ (Listener)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('userTheme') === 'system') {
        applyTheme();
    }
});

function renderList() {
    const content = document.getElementById('list-content');
    content.innerHTML = listDisplayData.map(item => {
        if (typeof item === 'string') {
            const itemEncoded = encodeURIComponent(item); // 💡 Editor မျက်စိမလည်အောင် ပြင်ဆင်ခြင်း
            return `
                <div class="simple-list-item">
                    <span>${item}</span>
                    <button class="btn-view-small" onclick="filterByArtist(decodeURIComponent('${itemEncoded}'))">ကြည့်မည်</button>
                </div>`;
        } else {
            const itemObjEncoded = encodeURIComponent(JSON.stringify(item)); // 💡 လုံခြုံသောစနစ်သို့ ပြောင်းလဲခြင်း
            return `
                <div class="simple-list-item">
                    <div style="flex:1;"><strong>${item.title}</strong><br><small>${item.artist}</small></div>
                    <button class="btn-view-small" onclick="openFullModal(JSON.parse(decodeURIComponent('${itemObjEncoded}')))">ဖွင့်ကြည့်</button>
                </div>`;
        }
    }).join('');
}

function goToArtistList() { showFullList('artists'); closeStats(); }

function showAllSongsFromStats() { showFullList('songs'); closeStats(); }

function showAllData() { showFullList('songs'); closeStats(); }

function closeFullList() {
    document.getElementById('fullListModal').style.display = 'none';
}

function filterByArtist(name) {
    closeFullList();
    handleSort('artist'); 
    renderCardView(name, encodeURIComponent(JSON.stringify(allData.filter(s => s.artist && s.artist.includes(name)))));
}

applyTheme(); // Theme အရင်စစ်မယ်
loadData();   // ပြီးမှ ဒေတာဆွဲမယ်


// Vote Modal ဖွင့်တဲ့ function (ဟိုဘက်က ခလုတ်မှာ ဒါနဲ့ အစားထိုးမယ်)
/*...
function openMainRatingModal(songId) {
    // ၁။ ID ကို String ပြောင်းပြီး သီချင်းဒေတာကို အရင်ရှာဖွေသိမ်းဆည်းမည်
    currentTargetSong = allData.find(s => String(s.id) === String(songId));
    
    if (!currentTargetSong) {
        alert("သီချင်းဒေတာ ရှာမတွေ့ပါ။ ID: " + songId);
        return;
    }

    // ၂။ အကောင့်ဝင်ထားခြင်း ရှိမရှိ စစ်ဆေးမည်
    if (!userSession) {
        document.getElementById('newLoginModal').style.display = 'flex';
        initGoogleLogin();
        return;
    }

    // ၃။ အကောင့်ရှိပါက Vote Modal ကို ဖွင့်မည်
    document.getElementById('voteSongTitle').innerText = currentTargetSong.title;
    document.getElementById('newVoteModal').style.display = 'flex';
    renderVoteButtons();
}
*/

function closeNewVoteModal() {
    document.getElementById('newVoteModal').style.display = 'none';
    selectedVoteNum = null;
    document.getElementById('voteReason').value = "";
} 

function closeLoginModal() {
    document.getElementById('newLoginModal').style.display = 'none';
}
 

 
 // Login စ -------------------------------Login စ-----------------------
// Deploy 1 URL - User အချက်အလက်များ သိမ်းရန်
const webAppUrl_User = "https://script.google.com/macros/s/AKfycbxZX5WMzYexz2RJPFU3AeCNXdYZMjsCfk7cu282wBHqH2UwofQ93zN_DsSQRd2Bed81/exec"; // ဒီနေရာမှာ Deploy 1 လင့်ခ် ထည့်ပါ

// Nav Profile အကောင့်ဝင်ရန် နှိပ်သည့်အခါ
function promptGoogleLogin() {
    if (userSession) {
        document.getElementById('profileModalImg').src = userSession.picture;
        document.getElementById('profileModalName').innerText = userSession.name;
        document.getElementById('profileModalEmail').innerText = userSession.email;
        document.getElementById('profileModal').style.display = 'flex';
    } else {
        document.getElementById('newLoginModal').style.display = 'flex';
        initGoogleLogin();
    }
}

function initGoogleLogin() {
    if (typeof google === 'undefined') return;
    google.accounts.id.initialize({
        client_id: CLIENT_ID, // သင့် Client ID
        callback: handleLoginResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("googleBtnContainer"),
        { theme: "outline", size: "large", width: "250" }
    );
}

async function handleLoginResponse(response) {
    console.log("၁။ Google ဆီကနေ Response စတင် လက်ခံရရှိပါပြီ။");

    try {
        let base64Url = response.credential.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        let payload = JSON.parse(jsonPayload);
        
        console.log("၂။ User အချက်အလက်များကို ခွဲထုတ်လို့ အောင်မြင်ပါပြီ။ Email:", payload.email);

        userSession = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };

        localStorage.setItem('user_session', JSON.stringify(userSession));
        
        console.log("၃။ UI ကို စတင်ပြောင်းလဲပါမည်။");
        updateUserUI();
        
        console.log("၄။ Login Modal ကို ပိတ်ပါမည်။");
        document.getElementById('newLoginModal').style.display = 'none';

        console.log("၅။ Sheet သို့ ဒေတာသွင်းရန် saveUserToSheet ကို ခေါ်ပါတော့မည်။");
        await saveUserToSheet(userSession);

    } catch (error) {
        console.error("🚨 လမ်းတစ်ဝက်တွင် Error တက်သွားပါသည်:", error);
    }
}

async function saveUserToSheet(user) {
    console.log("အသုံးပြုနေတဲ့ Web App URL ကတော့:", webAppUrl_User);
    const userData = {
        action: "save_user",
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userImage: user.picture,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };

    try {
        await fetch(webAppUrl_User, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(userData)
        });
        console.log("User data sent to Deploy 1");
    } catch (error) {
        console.error("Save Error:", error);
    }
}

function updateUserUI() {
    const uIcon = document.getElementById('userIcon');
    if (userSession && userSession.picture) {
        uIcon.innerHTML = `<img src="${userSession.picture}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
    } else {
        uIcon.innerHTML = `<span id="userInitial">👤</span>`;
    }
}

function signOut() {
    localStorage.removeItem('user_session');
    userSession = null;
    updateUserUI();
    document.getElementById('profileModal').style.display = 'none';
}

function switchAccount() {
    signOut();
    document.getElementById('newLoginModal').style.display = 'flex';
    initGoogleLogin();
}

window.addEventListener('DOMContentLoaded', () => {
    if (userSession) updateUserUI();updateSheetUserId();
});

 // Login ဆ------------------------------Login ဆ -----------------------
 
 // acc name for id  search
 
 async function updateSheetUserId() {
    // ၁။ Local Storage မှာ အကောင့်ဝင်ထားတာ ရှိ/မရှိ အရင်စစ်မယ်
    const session = JSON.parse(localStorage.getItem('user_session'));
    if (!session || !session.email) {
        console.log("အကောင့်ဝင်ထားခြင်း မရှိသေးပါ။");
        return null;
    }

    try {
        // ၂။ AAA_User_List Tab ကနေ ဒေတာဆွဲမယ်
        const userListUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=AAA_User_List`;
        const res = await fetch(userListUrl);
        const text = await res.text();
        const jsonData = JSON.parse(text.substring(47).slice(0, -2));
        const rows = jsonData.table.rows;

        const localEmail = session.email.toLowerCase().trim();
        let rawId = null;

        // ၃။ Email ချင်း တိုက်စစ်မယ် (Column C သည် index 2 ဖြစ်သည်)
        for (let row of rows) {
            if (row.c && row.c[2] && row.c[2].v) {
                const sheetEmail = row.c[2].v.toString().toLowerCase().trim();
                if (sheetEmail === localEmail) {
                    rawId = row.c[0].v.toString(); // Column A က ID ကိုယူမယ်
                    break;
                }
            }
        }

        // ၄။ အိုင်ဒီတွေ့ရင် ၇ လုံးပြည့်အောင် သုညဖြည့်ပြီး Local မှာ သိမ်းမယ်
        if (rawId) {
            const paddedId = rawId.padStart(7, '0'); // 💡 ဂဏန်း ၇ လုံးပြည့်အောင် ထိပ်က သုညဖြည့်တဲ့အပိုင်း
            
            session.sheetUserId = paddedId; // Object ထဲ ထည့်သိမ်းမယ်
            localStorage.setItem('user_session', JSON.stringify(session)); // Local Storage ကို Update လုပ်မယ်
            userSession = session; // Global Variable ကိုပါ Update လုပ်မယ်
            
            console.log("ID ၇ လုံးအပြည့်ဖြင့် သိမ်းဆည်းပြီးပါပြီ - " + paddedId);
            return paddedId;
        }
        
        console.log("Sheet ထဲတွင် ဒီအကောင့်၏ ID ကို မတွေ့သေးပါ။");
        return null;

    } catch (error) {
        console.error("User ID စစ်ဆေးရာတွင် Error တက်သွားပါသည်:", error);
        return null;
    }
}

 // acc id 
 
 
// Vote UI စ ---------------------------------------------------------------

// ၃။ အမှတ်တစ်ခုခုကို နှိပ်လိုက်သည့်အခါ အရောင်ပြောင်းလဲခြင်း နှင့် မှတ်သားခြင်း
/*
function selectVoteNumber(num) {
    selectedVoteNum = num;

    // ခလုတ်အားလုံးကို ပုံမှန်အရောင် ပြန်ပြောင်းမည်
    for (let i = 0; i <= 9; i++) {
        const btn = document.getElementById(`vbtn-${i}`);
        if (btn) {
            btn.style.background = "var(--card)";
            btn.style.color = "var(--text)";
            btn.style.borderColor = "var(--border, #ccc)";
        }
    }

    // နှိပ်လိုက်သည့် ခလုတ်ကို ကာလာ Highlight ပြုလုပ်မည်
    const selectedBtn = document.getElementById(`vbtn-${num}`);
    if (selectedBtn) {
        selectedBtn.style.background = "var(--primary)";
        selectedBtn.style.color = "#fff";
        selectedBtn.style.borderColor = "var(--primary)";
    }

    // အမှတ်အလိုက် အောက်က Hint စာသားကို ပြောင်းလဲပေးမည်
    updateVoteHint(num);
}
*/
// ၄။ စနစ်သစ် Vote Modal ပြန်ပိတ်ခြင်း Function
/*
function closeNewVoteModal() {
    document.getElementById('newVoteModal').style.display = 'none';
    selectedVoteNum = null;
    document.getElementById('voteNote').value = "";
}
*/
// ၅။ အမှတ်အလိုက် အရောင်နှင့် Hint စာသားများ ပြောင်းလဲခြင်း
/*
function updateVoteHint(num) {
    const hintBox = document.getElementById('voteHintBox');
    if (!hintBox) return;
    
    hintBox.style.display = 'block';
    
    if (num >= 7) { // 9, 8, 7 (အနီရောင်လိုင်း)
        hintBox.style.background = '#ffebee'; hintBox.style.color = '#c62828'; hintBox.style.border = '1px solid #ffbde2';
        hintBox.innerText = "⚠️ သတိပြုရန်: လူမျိုးတစ်မျိုးစာ ရာစုနှစ်ချီ တည်တံ့မည့် ဂန္တဝင်မြောက် အနုပညာစစ်စစ် ဖြစ်ပါကမှ သေချာစွာ ဆုံးဖြတ်ပြီး ဘုတ်ပေးရန် တိုက်တွန်းပါသည်။";
    } else if (num >= 3) { // 6, 5, 4, 3 (အဝါရောင်လိုင်း)
        hintBox.style.background = '#fffde7'; hintBox.style.color = '#f57f17'; hintBox.style.border = '1px solid #fff59d';
        hintBox.innerText = "🎵 ဝေဖန်ပိုင်းခြားရန်: တေးသီချင်း၏ ကီး၊ ပုံလာ၊ စာသားနှင့် အဆိုတော်၏ ဖန်တီးမှု စံနှုန်းအပေါ် မူတည်၍ မျှတစွာ ရွေးချယ်ပေးပါ။";
    } else { // 2, 1, 0 (အစိမ်းရောင်လိုင်း)
        hintBox.style.background = '#e8f5e9'; hintBox.style.color = '#2e7d32'; hintBox.style.border = '1px solid #a5d6a7';
        hintBox.innerText = "🌱 အားပေးဝေဖန်ရန်: တက်သစ်စ ဝါသနာရှင်များ၏ ဖန်တီးမှုအပေါ် နားဆင်သူကောင်း တစ်ယောက်အနေဖြင့် ပြုပြင်ပြောင်းလဲစေလိုသော စိတ်ဖြင့် သုံးသပ်ပေးပါ။";
    }
}

// ၆။ စာလုံးရေ (၇၀) အတွက် Listener ထည့်သွင်းခြင်း
document.addEventListener("DOMContentLoaded", () => {
    const noteInput = document.getElementById('voteNote');
    if(noteInput) {
        noteInput.addEventListener('input', function() {
            const countEl = document.getElementById('noteCharCount');
            if(countEl) countEl.innerText = this.value.length;
        });
    }
});*/

// Vote UI ဆ ---------------------------------------------------------------


// Send Vote Rating စ ------------------------------------------------------

// Send Vote Rating ဆ ------------------------------------------------------
// SVR စ
// ၁။ Vote Modal ဖွင့်ခြင်း (Overlay ပါ တစ်ခါတည်း ဖွင့်ရန်)
// ဗုဒ်ပေးသည့် Logic အသစ်
function openVoteModal(songId) {
    currentTargetSong = allData.find(s => String(s.id) === String(songId));
    if (!currentTargetSong) return alert("⚠️ သီချင်းဒေတာ ရှာမတွေ့ပါ။");
    if (!userSession) {
        document.getElementById('newLoginModal').style.display = 'flex';
        if (typeof initGoogleLogin === 'function') { initGoogleLogin(); }
        return;
    }
    currentVoteSongId = songId;
    document.getElementById('voteTitle').innerText = `${currentTargetSong.title} အား အဆင့်သတ်မှတ်ရန်`;
    document.getElementById('voteSelect').value = "";
    document.getElementById('voteNote').value = "";
    document.getElementById('noteCharCount').innerText = "0";
    document.getElementById('voteOverlay').style.display = 'block';
    document.getElementById('newVoteModal').style.display = 'flex';
}

function closeVoteModal() {
    document.getElementById('newVoteModal').style.display = 'none';
    document.getElementById('voteOverlay').style.display = 'none';
}

async function submitVoteProcess() {
    if (!navigator.onLine) {
        alert("⚠️ Internet မရှိပါ");
        return;
    }
    
    if (!userSession || !userSession.email) {
        alert("🔒 Login ဝင်ပါ");
        return;
    }
    
    const voteSelectEl = document.getElementById("voteSelect");
    if (!voteSelectEl || voteSelectEl.value === "") {
        alert("⚠️ Vote ရွေးပါ");
        return;
    }
    
    const voteNum = Number(voteSelectEl.value);
    const voteNote = document.getElementById("voteNote")?.value.trim() || "";
    
    const submitBtn = document.querySelector(
        "#newVoteModal button[onclick='submitVoteProcess()']"
    );
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "ခေတ္တစောင့်ပါ...";
    }
    
    try {
        // ၁။ Local Storage မှာ ID ရှိပြီးသားလား စစ်မယ်
        let foundUserId = userSession.sheetUserId;

        if (!foundUserId) {
            console.log("Local တွင် ID မရှိသေးသဖြင့် Sheet သို့ လှမ်းဆွဲနေပါသည်...");
            foundUserId = await updateSheetUserId(); 
        }
        
        if (!foundUserId) {
            alert("❌ ဆာဗာတွင် သင်၏ အကောင့် ID မတွေ့သေးပါ။ ခေတ္တစောင့်ပြီး ပြန်ကြိုးစားပေးပါဗျာ။");
            return;
        }
        
        foundUserId = foundUserId.padStart(7, "0");
        
        // ၂။ ဗုတ်ဒေတာ ထုတ်ပိုးခြင်း
        const payload = {
            action: "submitVote",
            userId: foundUserId,
            songId: String(currentVoteSongId),
            voteNumber: voteNum,
            voteNote: voteNote,
            voteTime: new Date().toISOString()
        };
        
        console.log("Vote Payload =", payload);
        
        // 💡 [FIXED] - Login တုန်းက အောင်မြင်ခဲ့တဲ့ webAppUrl_User နာမည်ကိုပဲ ပြောင်းသုံးထားပြီး
        // mode: "no-cors" ကိုပါ ကွက်တိ ထည့်သွင်းပေးလိုက်ပါပြီ။
        await fetch(webAppUrl, {
            method: "POST",
            mode: "no-cors", 
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });
        
        console.log("Vote Data ဆာဗာသို့ ပို့ပြီးပါပြီ။");
        
        alert("🎉 Vote အောင်မြင်ပါသည်");
        closeVoteModal();
        
    } catch (err) {
        console.error("Vote Error =", err);
        alert("❌ Server ချိတ်ဆက်မှု Error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "ဘုတ်ပေးမည် 🗳️";
        }
    }
}


// SVR ဆ

// font စ - ----------------------------------------------------------------------------
const fontMenuBtn = document.getElementById('fontMenuBtn');
const fontModal = document.getElementById('fontModal');
const fontOverlay = document.getElementById('fontOverlay');

// ဖောင့် List Popup ဖွင့်ရန်
if (fontMenuBtn) {
    fontMenuBtn.addEventListener('click', () => {
        fontModal.style.display = 'block';
        fontOverlay.style.display = 'block';
    });
}

// Popup ပြန်ပိတ်ရန်
if (fontOverlay) {
    fontOverlay.addEventListener('click', () => {
        fontModal.style.display = 'none';
        fontOverlay.style.display = 'none';
    });
}

// ဝက်ဘ်ဆိုက်တစ်ခုလုံး ဖောင့်ပြောင်းပေးပြီး Local Storage တွင် သိမ်းမည့် အဓိက Function
function changeGlobalFont(fontName, element) {
    // ၁။ Dynamic Style ထည့်သွင်းခြင်း
    let fontStyle = document.getElementById('global-font-style');
    if (!fontStyle) {
        fontStyle = document.createElement('style');
        fontStyle.id = 'global-font-style';
        document.head.appendChild(fontStyle);
    }
    // !important ပါဝင်၍ တစ်ဝက်ဘ်ဆိုက်လုံး ဇွတ်ပြောင်းလဲမည်
    fontStyle.innerHTML = `body, body *:not(.font-item):not(.font-item *) { font-family: '${fontName}' !important; }`;

    
    // ၂။ Local Storage တွင် ဒေတာသိမ်းခြင်း (ဒါထည့်မှ အမြဲမှတ်မိမှာဗျ)
    localStorage.setItem('aaaUserFont', fontName);

    // ၃။ Active Item အား အရောင်ပြောင်းလဲခြင်း
    const items = document.querySelectorAll('.font-item');
    items.forEach(item => item.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    } else {
        const activeItem = document.querySelector(`.font-item[data-font="${fontName}"]`);
        if (activeItem) activeItem.classList.add('active');
    }
    
    // ၄။ မိုဒယ်လ် ပိတ်ခြင်း
    setTimeout(() => {
        if(fontModal) fontModal.style.display = 'none';
        if(fontOverlay) fontOverlay.style.display = 'none';
    }, 200);
}

// ၅။ Webpage စဖွင့်ဖွင့်ချင်း (သို့မဟုတ် Update ဖြစ်တိုင်း) Local Storage မှ ဖောင့်ဟောင်းကို ဆွဲထုတ်ပြီး တန်းသုံးပေးခြင်း
function applySavedFont() {
    const savedFont = localStorage.getItem('aaaUserFont');
    if (savedFont) {
        changeGlobalFont(savedFont, null);
    }
}

// စာမျက်နှာစပွင့်ချိန်မှာ တစ်ခါ အလုပ်လုပ်ခိုင်းခြင်း
document.addEventListener("DOMContentLoaded", applySavedFont);
//
applySavedFont();

// font ဆ

