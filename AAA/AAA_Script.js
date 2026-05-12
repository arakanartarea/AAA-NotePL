const sheetId = '1MnRxfu3BhlTnB6IlvtEfik2FfY-d22SOeaBTKAqfFCY';
const sheetName = 'AAAview';
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

let allData = [];
let currentSortKey = localStorage.getItem('preferredSort') || 'artist';
let isAscending = localStorage.getItem('isAscending') === 'false' ? false : true;
let countSortMode = localStorage.getItem('countSortMode') || 'none'; // 'none', 'desc', 'asc'

let declinedLogin = localStorage.getItem('declinedLogin') === 'true'; // အ‌ေကာင့် ငြင်းထားလား စစ်မယ်
let isUserLoggedIn = false; // လက်ရှိ login ဝင်ထားလား
let payload = null; // Google ကရတဲ့ အချက်အလက် သိမ်းဖို့

// မူလ code ကို ဒီလိုပြင်ပါ
let userEmail = localStorage.getItem('userEmail') || ""; 
let userName = localStorage.getItem('userName') || "";
let userPicture = localStorage.getItem('userPicture') || ""; // ပုံလေးပါ သိမ်းမယ်

let currentVoteSongId = "";
let listType = 'songs'; 
let listDisplayData = []; 

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
/* klw 
function handleSort(key) {
    currentSortKey = key;
    localStorage.setItem('preferredSort', key);
    updateToolbarUI(false, key);
    toggleSortMenu(false);

    const groups = allData.reduce((acc, item) => {
        let rawName = item[key] || 'အမည်မသိ';
        let groupName = rawName;
        if (typeof rawName === 'string' && rawName.includes(',')) {
            groupName = rawName.split(',')[0].trim();
        }
        if (groupName === '-' || groupName === '') groupName = 'အမည်မသိ';
        
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(item);
        return acc;
    }, {});

    const sortedNames = Object.keys(groups).sort((a, b) => isAscending ? a.localeCompare(b) : b.localeCompare(a));

    const listElement = document.getElementById('artist-list-container');
    if(listElement) {
        listElement.innerHTML = sortedNames.map((name, index) => {
            const groupDataEncoded = encodeURIComponent(JSON.stringify(groups[name]));
            return `
            <div class="artist-group-container">
                <div class="artist-header">
                    <div class="artist-info" onclick="renderCardView('${name.replace(/'/g, "\\'")}', '${groupDataEncoded}')">
                        ${name}
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span class="count-badge">${groups[name].length}</span>
                        <div id="btn-${index}" class="expand-btn" onclick="toggleSongs('songs-${index}', 'btn-${index}')">❯</div>
                    </div>
                </div>
                <div id="songs-${index}" class="song-list">
                    ${groups[name].map(song => `
                        <div class="song-list-item" onclick='openFullModal(${JSON.stringify(song).replace(/'/g, "&apos;")})'>
                            🎵 ${song.title}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('');
    }
} */
function handleSort(key) {
    currentSortKey = key;
    localStorage.setItem('preferredSort', key);
    updateToolbarUI(false, key);
    toggleSortMenu(false);

    // ခလုတ်စာသားများ မှန်အောင်ပြမယ်
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
        let groupName = rawName;
        if (typeof rawName === 'string' && rawName.includes(',')) {
            groupName = rawName.split(',')[0].trim();
        }
        if (groupName === '-' || groupName === '') groupName = 'အမည်မသိ';
        
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(item);
        return acc;
    }, {});

    let sortedNames = Object.keys(groups);

    // Sorting Logic: Count mode ဖွင့်ထားရင် count နဲ့စီမယ်၊ မဟုတ်ရင် အက္ခရာစဉ်နဲ့စီမယ်
    if (countSortMode === 'desc') {
        sortedNames.sort((a, b) => groups[b].length - groups[a].length);
    } else if (countSortMode === 'asc') {
        sortedNames.sort((a, b) => groups[a].length - groups[b].length);
    } else {
        sortedNames.sort((a, b) => isAscending ? a.localeCompare(b, 'my') : b.localeCompare(a, 'my'));
    }

    // ... ကျန်တဲ့ listElement.innerHTML ပိုင်းကတော့ အရင်အတိုင်းပဲမို့ မပြောင်းလဲပါနဲ့ ...
    const listElement = document.getElementById('artist-list-container');
    if(listElement) {
        listElement.innerHTML = sortedNames.map((name, index) => {
            const groupDataEncoded = encodeURIComponent(JSON.stringify(groups[name]));
            return `
            <div class="artist-group-container">
                <div class="artist-header">
                    <div class="artist-info" onclick="renderCardView('${name.replace(/'/g, "\\'")}', '${groupDataEncoded}')">
                        ${name}
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span class="count-badge">${groups[name].length}</span>
                        <div id="btn-${index}" class="expand-btn" onclick="toggleSongs('songs-${index}', 'btn-${index}')">❯</div>
                    </div>
                </div>
                <div id="songs-${index}" class="song-list">
                    ${groups[name].map(song => `
                        <div class="song-list-item" onclick='openFullModal(${JSON.stringify(song).replace(/'/g, "&apos;")})'>
                            🎵 ${song.title}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('');
    }
}

function renderCardView(name, encodedData) {
    const songs = JSON.parse(decodeURIComponent(encodedData));
    
    let html = `<h2 style="padding:10px; border-bottom: 2px solid var(--primary);">${name}</h2>`;
    html += `<div class="song-grid">`;
    
    html += songs.map((song, idx) => `
    <div class="artist-card">
        <div class="card-header"><p class="card-title">${song.title}</p></div>
        <div class="card-main-info">
            <div class="info-item">🎙️ ${song.artist}</div>
            <div class="info-item">✍️ ${song.writer}</div>
            <div class="info-item rating-click" onclick="openMainRatingModal('${song.id}')" style="cursor:pointer; color:var(--primary);">
                <div>${song.star || '❌'}</div>
                <div style="font-size:10px;">(${song.voters || 0} votes)</div>
            </div>
            <div class="info-item">💿 ${song.album}</div>
            <div class="info-item">🎸 ${song.oc || '-'}</div>
        </div>
        
        <div id="extra-${idx}" class="extra-details" style="display:none; padding:10px; background:#f9f9f9; border-top:1px dashed #ddd; font-size:11px;">
            <div>🆔 ID: ${song.id || '-'}</div>
            <div>🌸 Tradition: ${song.tradition || '-'}</div>
            <div>📝 Remark: ${song.remark || '-'}</div>
            <div>📅 Year: ${song.year || '-'}</div>
        </div>
        
        <div class="card-actions">
            <button class="btn-expand" onclick="toggleCardExtra('extra-${idx}')">အချက်အလက် ↓</button>
            <button class="btn-full" onclick='openFullModal(${JSON.stringify(song).replace(/'/g, "&apos;")})'>အပြည့်အစုံ 👁️</button>
        </div>
    </div>
    `).join('');

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

    body.innerHTML = `
        <div class="close-modal" onclick="closeModal()">✕</div>
        
        <div class="new-detail-grid">
            <div class="info-section">
                <h1 class="song-main-title">${song.title}</h1>
                <div class="full-info-list">
                    <p>🎙️ <strong>တေးဆို:</strong> ${song.artist}</p>
                    <p>✍️ <strong>တေးရေး:</strong> ${song.writer}</p>
                    <p>💿 <strong>အယ်ဘမ်:</strong> ${song.album || '-'}</p>
                    <p>📅 <strong>ခုနှစ်:</strong> ${song.year || '-'}</p>
                    <p>🎸 <strong>အမျိုးအစား:</strong> ${song.oc || '-'}</p>
                </div>
                <button class="vote-btn" onclick="openMainRatingModal('${song.id}')">
                    Rating ပေးမယ် ⭐⭐⭐⭐⭐
                </button>
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
                    ${song.youtube ? 
                        `<iframe src="https://www.youtube.com/embed/${song.youtube}" frameborder="0" allowfullscreen></iframe>` 
                        : '<div class="no-video">ဗီဒီယို မရှိသေးပါ</div>'}
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}


function closeModal() {
    document.getElementById('fullModal').style.display = 'none';
    document.body.style.overflow = 'auto'; 
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
/*
function toggleSortOrder() {
    isAscending = !isAscending;
    document.getElementById('orderBtn').innerText = isAscending ? "🔡 က - အ" : "🔡 အ - က";
    handleSort(currentSortKey);
}
*/
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

    const filtered = allData.filter(i => 
        (i.title && i.title.toLowerCase().includes(val)) || 
        (i.artist && i.artist.toLowerCase().includes(val))
    );

    if (val === "") {
        clearSearch(); 
    } else {
        document.getElementById('group-list').innerHTML = filtered.map(song => `
            <div class="song-list-item" 
                 onclick='openFullModal(${JSON.stringify(song).replace(/"/g, '&quot;')})'
                 style="padding:12px; border-bottom:1px solid #eee; background:white; cursor:pointer;">
                <strong>🎵 ${song.title}</strong><br>
                <small style="color:#666; margin-left:20px;">${song.artist}</small>
            </div>
        `).join('');
        
        if (window.innerWidth <= 768) {
            document.getElementById('master-panel').classList.add('hidden-mobile');
            document.getElementById('group-list').classList.remove('hidden-mobile');
            updateToolbarUI(true, currentSortKey);
        }
    }
}

function clearSearch() {
    const searchInput = document.getElementById('search');
    searchInput.value = "";
    document.getElementById('clearSearch').style.display = 'none';

    if (window.innerWidth <= 768) {
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
            return `
                <div class="simple-list-item">
                    <span>${item}</span>
                    <button class="btn-view-small" onclick="filterByArtist('${item.replace(/'/g, "\\'")}')">ကြည့်မည်</button>
                </div>`;
        } else {
            return `
                <div class="simple-list-item">
                    <div style="flex:1;"><strong>${item.title}</strong><br><small>${item.artist}</small></div>
                    <button class="btn-view-small" onclick='openFullModal(${JSON.stringify(item).replace(/'/g, "&apos;")})'>ဖွင့်ကြည့်</button>
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
/*
// Google Auth & Voting System
window.onload = function () {
    google.accounts.id.initialize({
        client_id: "750089996822-76hj5pfvrf8ui70eu6cimv0lb9lg6su3.apps.googleusercontent.com", 
        callback: handleCredentialResponse
    });
};
*/
window.onload = function () {
    // ၁။ UI ပိုင်းကို အမြန်ဆုံးပြမယ်
    applyTheme();
    updateAuthUI();

    // ၂။ Google Login ကို Initialize လုပ်မယ်
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "750089996822-76hj5pfvrf8ui70eu6cimv0lb9lg6su3.apps.googleusercontent.com", 
            callback: handleCredentialResponse,
            auto_select: false
        });
    }

    // ၃။ ဒေတာတွေကို ဆွဲမယ်
    loadData();

    // ၄။ အကောင့်မရှိရင် Modal ပြမယ်
    if (!userEmail && !declinedLogin) {
        setTimeout(showLoginModal, 3000); // ၃ စက္ကန့် စောင့်မယ်
    }
};

function showLoginModal() {
    document.getElementById('loginOverlay').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('loginOverlay').style.display = 'none';
    declinedLogin = true;
    localStorage.setItem('declinedLogin', 'true'); // ငြင်းလိုက်ပြီဖြစ်လို့ မှတ်ထားမယ်
}
// အကောင့်ဝင်ဖို့ prompt ခေါ်ခြင်း
function promptGoogleLogin() {
    try {
        if (typeof google !== 'undefined') {
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed()) {
                    console.warn("Prompt not displayed:", notification.getNotDisplayedReason());
                }
            });
        } else {
            console.error("Google library not loaded yet.");
        }
    } catch (err) {
        console.error("Login Error:", err);
    }
}

function handleCredentialResponse(response) {
    payload = JSON.parse(atob(response.credential.split('.')[1]));
    userEmail = payload.email;
    userName = payload.name;
    let userPic = payload.picture;
    
    // Local Storage ထဲမှာ အချက်အလက် သိမ်းမယ်
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('userName', userName);
    localStorage.setItem('userPicture', userPic);
    localStorage.setItem('declinedLogin', 'false');
    
    declinedLogin = false;
    updateAuthUI();
}

function updateAuthUI() {
    const userIconArea = document.getElementById('userIcon');
    if (!userIconArea) return;

    // Local storage မှာ ရှိနေရင် ပုံပြမယ်
    const savedPic = localStorage.getItem('userPicture');

    if (userEmail && savedPic) {
        userIconArea.innerHTML = `<img src="${savedPic}" alt="User" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
        userIconArea.innerHTML = `<span style="font-size: 18px;">👤</span>`;
    }
}


function confirmLogin() {
    // Modal ကို အရင်ပိတ်မယ်
    document.getElementById('loginOverlay').style.display = 'none';
    
    // ပြီးမှ Google Login Prompt ကို ခေါ်မယ်
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // အကြောင်းအမျိုးမျိုးကြောင့် Prompt မတက်ရင် standard button ကို ခေါ်လို့ရအောင်
            console.log("Prompt not displayed, trying alternative...");
        }
    });
}


/*
function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    userEmail = payload.email;
    userName = payload.name;
    updateAuthUI();
}
*/

/*
function handleCredentialResponse(response) {
    // payload ကို global variable ထဲ ထည့်လိုက်မယ်
    payload = JSON.parse(atob(response.credential.split('.')[1]));
    userEmail = payload.email;
    userName = payload.name;
    
    localStorage.setItem('declinedLogin', 'false');
    declinedLogin = false;
    
    updateAuthUI(); // UI ကို update လုပ်မယ်
}
*/

/*
function updateAuthUI() {
    const userIconArea = document.getElementById('userIcon');
    if (!userIconArea) return;

    if (userEmail && payload && payload.picture) {
        userIconArea.innerHTML = `<img src="${payload.picture}" alt="User" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
        userIconArea.innerHTML = `<span style="font-size: 18px;">👤</span>`;
    }
}
*/
/*
function updateAuthUI() {
    const infoDiv = document.getElementById('userInfoDisplay');
    const loginBtn = document.getElementById('google_login_btn');
    if (userEmail) {
        infoDiv.innerHTML = `👤 ${userName} <br> <span style="font-size:12px; color:#666;">📧 ${userEmail}</span>`;
        infoDiv.style.display = "block";
        loginBtn.style.display = "none";
    } else {
        infoDiv.style.display = "none";
        loginBtn.style.display = "flex";
        google.accounts.id.renderButton(loginBtn, { theme: "outline", size: "large", width: 250 });
    }
}
*/
/*
function updateAuthUI() {
    const userIconArea = document.getElementById('userIcon');
    
    if (userEmail && payload) { // payload က handleCredentialResponse ကရတဲ့ data
        // အကောင့်ဝင်ထားရင် ပုံလေးပြမယ်
        userIconArea.innerHTML = `<img src="${payload.picture}" alt="User">`;
        isUserLoggedIn = true;
    } else {
        // အကောင့်မဝင်ရသေးရင် icon ပဲပြမယ်
        userIconArea.innerHTML = `<span style="font-size: 18px;">👤</span>`;
        isUserLoggedIn = false;
    }
}
*/
/*
// အကောင့်ဝင်ဖို့ တောင်းဆိုတဲ့ function
function promptGoogleLogin() {
    // Google ရဲ့ Standard Login ခလုတ်ကို ရှာပြီး အလုပ်လုပ်ခိုင်းတာ
    const loginBtn = document.querySelector('.g_id_signin div[role="button"]');
    if (loginBtn) {
        loginBtn.click();
    } else {
        // ခလုတ်ရှာမတွေ့ရင် (ဥပမာ-စာမျက်နှာမပွင့်သေးရင်) Google Login Prompt ကို တိုက်ရိုက်ခေါ်မယ်
        google.accounts.id.prompt();
    }
}
*/
// User က Login မဝင်ဘဲ ပိတ်လိုက်တဲ့အခါ ဒါမှမဟုတ် ငြင်းလိုက်တဲ့အခါ
function handleLoginDecline() {
    declinedLogin = true;
    localStorage.setItem('declinedLogin', 'true');
    console.log("User declined login. Won't ask again automatically.");
}

function openMainRatingModal(id) {
    const targetSong = allData.find(s => s.id == id);
    if (!targetSong) return;

    currentVoteSongId = id; 
    
    document.getElementById('mainRatingModal').style.display = 'flex';
    document.getElementById('starDetailSection').style.display = 'block';
    document.getElementById('voteFormSection').style.display = 'none';
    
    document.getElementById('ratingSongTitle').innerText = "🎵 " + targetSong.title;
    document.getElementById('starCounts').innerHTML = `
        <div>⭐ (1): <b>${targetSong.s1 || 0}</b></div>
        <div>⭐⭐ (2): <b>${targetSong.s2 || 0}</b></div>
        <div>⭐⭐⭐ (3): <b>${targetSong.s3 || 0}</b></div>
        <div>⭐⭐⭐⭐ (4): <b>${targetSong.s4 || 0}</b></div>
        <div>⭐⭐⭐⭐⭐ (5): <b>${targetSong.s5 || 0}</b></div>
    `;
}
/*
function switchToVoteForm() {
    document.getElementById('starDetailSection').style.display = 'none';
    document.getElementById('voteFormSection').style.display = 'block';
    updateAuthUI(); 
}
*/
function switchToVoteForm() {
    if (!userEmail) {
        alert("Vote ပေးရန်အတွက် အကောင့်ဝင်ပေးဖို့ လိုအပ်ပါတယ်ခင်ဗျာ။");
        promptGoogleLogin();
        return; // အကောင့်မရှိရင် ရှေ့ဆက်မသွားဘူး
    }
    document.getElementById('starDetailSection').style.display = 'none';
    document.getElementById('voteFormSection').style.display = 'block';
}

function closeRatingModal() {
    document.getElementById('mainRatingModal').style.display = 'none';
    document.getElementById('voteRateSelect').value = "";
    document.getElementById('voteComment').value = "";
}

function submitFinalVote() {
    if (!userEmail) return alert("မေးလ်အရင်ဝင်ပေးပါ");
    const rate = document.getElementById('voteRateSelect').value;
    if (rate === "") return alert("ရမှတ်တစ်ခုခု အရင်ရွေးပေးပါ");
    
    const comment = document.getElementById('voteComment').value;
    const payload = JSON.stringify({ id: currentVoteSongId, rate: rate, email: userEmail, userName: userName, content: comment });
    
    fetch("", { method: "POST", mode: "no-cors", body: payload })
    .then(() => {
        alert("ဘုတ်ပေးခြင်း အောင်မြင်ပါပြီ။");
        closeRatingModal();
    });
}
/*
applyTheme(); // Theme အရင်စစ်မယ်

loadData();   // ပြီးမှ ဒေတာဆွဲမယ်

*/