const sheetId = '1MnRxfu3BhlTnB6IlvtEfik2FfY-d22SOeaBTKAqfFCY';
const sheetName = 'AAAview';
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

let allData = [];
let currentSortKey = localStorage.getItem('preferredSort') || 'artist';
let isAscending = true;

function mapSheetRow(row) {
    const getValue = (index) => (row.c && row.c[index] && row.c[index].v) ? row.c[index].v : '';
    return {
        id: getValue(0), title: getValue(1), artist: getValue(2), writer: getValue(3),
        album: getValue(4), albumType: getValue(5), newOld: getValue(6), oc: getValue(7),
        tradition: getValue(8), year: getValue(11), language: getValue(13), remark: getValue(20)
    };
}

function updateToolbarUI(isDetailView, key = 'artist') {
    const isMobile = window.innerWidth <= 768; // Screen ဆိုဒ်ကို အရင်စစ်မယ်

    // ၁။ Back ခလုတ်
    // ဖုန်းဖြစ်ပြီး Detail View (Card View) ရောက်နေမှသာ ပြမယ်။ ကျန်ရင် (Tablet ရော List ရော) ဖျောက်ထားမယ်။
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.style.display = (isMobile && isDetailView) ? 'flex' : 'none';
    }

    // ၂။ Sort ခလုတ်
    // ဖုန်းဖြစ်ပြီး Detail View ရောက်နေရင် ဖျောက်မယ်။ Tablet မှာဆိုရင်တော့ အမြဲပြနေမယ်။
    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) {
        sortBtn.style.display = (isMobile && isDetailView) ? 'none' : 'flex';
    }
    
    // ၃။ Search Box
    // ဖုန်းဖြစ်ပြီး Detail View ရောက်နေရင် ဖျောက်မယ်။ Tablet မှာဆိုရင်တော့ အမြဲပြနေမယ်။
    const searchBox = document.getElementById('search');
    if (searchBox) {
        searchBox.style.display = (isMobile && isDetailView) ? 'none' : 'block';
    }

    // ၄။ Sort Label Update လုပ်တဲ့အပိုင်း
    // ဒါကတော့ ဘယ် Device ဖြစ်ဖြစ် Sort Key ပြောင်းရင် Label လိုက်ပြောင်းပေးရမယ်
    const labels = {
        'artist': 'တေးဆိုအလိုက်',
        'writer': 'တေးရွီးအလိုက်',
        'album': 'အယ်ဘမ်အလိုက်',
        'oc': 'O/C အလိုက်',
        'tradition': 'ရိုးရာအလိုက်'
    };
    const sortLabel = document.querySelector('#sortBtn span:last-child');
    if (sortLabel) {
        sortLabel.innerText = labels[key] || 'စီနည်း';
    }
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

function handleSort(key) {
    currentSortKey = key;
    localStorage.setItem('preferredSort', key);
    updateToolbarUI(false, key);
    toggleSortMenu(false);

    const groups = allData.reduce((acc, item) => {
        let rawName = item[key] || 'အမည်မသိ';
        let groupName = rawName;
        // အဆိုတော် နာမည် တစ်ဦးထက်ပိုရင် ပထမဆုံး တစ်ယောက်ကိုပဲ Group Name ယူမယ်
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
            // ဒီနေရာမှာ JSON.stringify သုံးပြီး Group တစ်ခုလုံးရဲ့ ဒေတာကို တန်းပို့ဖို့ ပြင်လိုက်တယ်
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


// ကဒ် ကုဒ် စ
// ၁။ Card View ပြသခြင်း (၈ ခုပါသော မျက်နှာစာ)
/*
function showGroupDetail(name, key) {
    const songs = allData.filter(s => (s[key] || 'အမည်မသိ') === name);
    
    let html = `<h2 style="padding:10px; border-bottom: 2px solid var(--primary);">${name}</h2>`;
    html += `<div class="song-grid">`;
    
    html += songs.map((song, idx) => `
        <div class="artist-card">
            <div class="card-header">
                <p class="card-title">${song.title}</p>
            </div>
            
            <div class="card-main-info">
                <div class="info-item">🎙️ ${song.artist}</div>
                <div class="info-item">✍️ ${song.writer}</div>
                <div class="info-item">💿 ${song.album}</div>
                <div class="info-item">📅 ${song.year || '-'}</div>
                <div class="info-item">🎸 ${song.oc || '-'}</div>
                <div class="info-item">🌸 ${song.tradition || '-'}</div>
                <div class="info-item">🇲🇲 ${song.language || '-'}</div>
            </div>

            <div id="extra-${idx}" class="extra-details" style="display:none; padding:10px; background:#fdfdfd; border-top:1px dashed #ddd; font-size:11px;">
                <div>🆔 ID: ${song.id || '-'}</div>
                <div>📝 Remark: ${song.remark || '-'}</div>
            </div>

            <div class="card-rating">
                <div class="stars">⭐⭐⭐⭐⭐ <small style="color:gray;">(5.0)</small></div>
            </div>

            <div class="card-actions">
                <button class="btn-expand" onclick="toggleCardExtra('extra-${idx}')">အချက်အလက် ↓</button>
                <button class="btn-full" onclick="openFullModal(${JSON.stringify(song).replace(/"/g, '&quot;')})">အပြည့်အစုံ 👁️</button>
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
    
    // ဒီနေရာလေးမှာ key ထည့်ပေးလိုက်ပြီနော် ကိုကို
    updateToolbarUI(true, key);
}
*/
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
                <div class="info-item">💿 ${song.album}</div>
                <div class="info-item">🎸 ${song.oc || '-'}</div>
                <div class="info-item">🌸 ${song.tradition || '-'}</div>
            </div>
            <div id="extra-${idx}" class="extra-details" style="display:none; padding:10px; background:#f9f9f9; border-top:1px dashed #ddd; font-size:11px;">
                <div>🆔 ID: ${song.id || '-'}</div>
                <div>📝 Remark: ${song.remark || '-'}</div>
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


// ခလုတ်နှိပ်ရင် ပေါ်/ပျောက် လုပ်ပေးတဲ့ function
function toggleCardExtra(id) {
    const el = document.getElementById(id);
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}


function goBackToGroup() { 
    // ၁။ Mobile View Logic (ဖုန်းမှာ panel ပြန်ဖွင့်မယ်)
    if (window.innerWidth <= 768) {
        document.getElementById('master-panel').classList.remove('hidden-mobile');
        document.getElementById('group-list').classList.add('hidden-mobile');
    }
    
    // ၂။ Toolbar ပြန်ပြောင်းမယ် (currentSortKey ထည့်လိုက်လို့ စာသားမလွဲတော့ဘူးနော်)
    updateToolbarUI(false, currentSortKey); 
    
    window.scrollTo(0, 0);

    // ၃။ Tablet/PC အတွက် maxWidth ညှိမယ်
    const container = document.querySelector('.container');
    if(container) {
        container.style.maxWidth = (window.innerWidth > 768) ? '100%' : '1000px'; 
    }
    
    // ၄။ စာရင်းဟောင်းကို ပြန်ဆွဲဖို့ လိုအပ်ရင် (Optional)
    // handleSort(currentSortKey); 
}




// ၂။ Card Expand လုပ်ခြင်း
function toggleCardExtra(id) {
    const el = document.getElementById(id);
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}

// ၃။ Modal ဖွင့်ခြင်း (သီချင်းစာသားနှင့် YouTube)
function openFullModal(song) {
    const modal = document.getElementById('fullModal');
    const body = document.getElementById('modal-body');
    
    // Modal ပွင့်ရင် နောက်ကစာမျက်နှာ Scroll ပိတ်မယ်
    document.body.style.overflow = 'hidden';

    body.innerHTML = `
        <div class="close-modal" onclick="closeModal()">✕</div>
        
        <div class="detail-container">
            <div class="lyrics-section">
                <h1 style="font-size: 32px; margin-bottom: 10px;">${song.title}</h1>
                <div style="margin-bottom: 30px; color: #666;">
                    <span style="margin-right: 20px;">🎙️ တေးဆို: <strong>${song.artist}</strong></span>
                    <span>✍️ တေးရေး: <strong>${song.writer}</strong></span>
                </div>
                
                <div style="background: #fdfdfd; padding: 30px; border-radius: 20px; border: 1px solid #eee;">
                    <h3 style="margin-top:0; border-bottom: 2px solid var(--primary); display:inline-block;">သီချင်းစာသား</h3>
                    <p style="white-space: pre-line; line-height: 2; font-size: 17px; color: #333; margin-top: 20px;">
                        ${song.lyrics || 'သီချင်းစာသား မရှိသေးပါ။'}
                    </p>
                </div>
            </div>

            <div class="media-section">
                <div style="width:100%; aspect-ratio: 16/9; background:#000; border-radius: 20px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    ${song.youtube ? 
                        `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${song.youtube}" frameborder="0" allowfullscreen></iframe>` 
                        : '<div style="color:white; height:100%; display:flex; align-items:center; justify-content:center;">ဗီဒီယို မရှိသေးပါ</div>'}
                </div>
                
                <div style="margin-top: 30px; padding: 25px; background: var(--primary); color: white; border-radius: 20px;">
                    <h4>သီချင်းအချက်အလက်</h4>
                    <p>💿 အယ်ဘမ်: ${song.album || '-'}</p>
                    <p>📅 ခုနှစ်: ${song.year || '-'}</p>
                    <p>🎸 အမျိုးအစား: ${song.oc || '-'}</p>
                    <button style="width:100%; padding: 12px; margin-top: 15px; border-radius: 10px; border:none; background: #fff; color: var(--primary); font-weight: bold; cursor: pointer;">
                        Rating ပေးမယ် ⭐⭐⭐⭐⭐
                    </button>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('fullModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Scroll ပြန်ဖွင့်မယ်
}


// ကဒ်ကုဒ် ဆ

function toggleSongs(id, btnId) {
    const el = document.getElementById(id);
    const btn = document.getElementById(btnId);
    const isOpen = el.style.display === "block";
    
    el.style.display = isOpen ? "none" : "block";
    
    // Class တပ်လိုက်တာနဲ့ CSS က မျှားကို လှည့်ပေးမှာပါ
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
    document.getElementById('orderBtn').innerText = isAscending ? "🔡 က - အ" : "🔡 အ - က";
    handleSort(currentSortKey);
}
/* 
function goBackToGroup() { 
     // Phone မှာဆိုရင် ဘယ်ဘက်စာရင်းကို ပြန်ပြပြီး Card တွေကို ဖျောက်မယ်
    if (window.innerWidth <= 768) {
        document.getElementById('master-panel').classList.remove('hidden-mobile');
        document.getElementById('group-list').classList.add('hidden-mobile');
    }
    
    updateToolbarUI(false);
    window.scrollTo(0,0);
    const container = document.querySelector('.container');
    if(container) container.style.maxWidth = '1000px'; 
    handleSort(currentSortKey); }
*/
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
        clearSearch(); // စာမရှိရင် clearSearch ထဲက logic အတိုင်း master-panel ကို ပြန်ပြမယ်
    } else {
        // Search Result မှာ နှိပ်လိုက်ရင် openFullModal ကို တန်းသွားဖို့ ပြင်ထားပါတယ်
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

    // Phone မှာဆိုရင် ဘယ်ဘက်စာရင်း (Master Panel) ကို ပြန်ပြမယ်
    if (window.innerWidth <= 768) {
        document.getElementById('master-panel').classList.remove('hidden-mobile');
        document.getElementById('group-list').classList.add('hidden-mobile');
        updateToolbarUI(false, currentSortKey);
    }
    
    handleSort(currentSortKey); // မူလ အဆိုတော်စာရင်းကို ပြန်ဖော်မယ်
    window.scrollTo(0, 0);
}
function toggleSettings() {
    const menu = document.getElementById('settingsMenu');
    const overlay = document.getElementById('settingsOverlay');
    const isShowing = menu.classList.contains('show');

    if (isShowing) {
        menu.classList.remove('show');
        overlay.style.display = 'none';
    } else {
        // Sort Menu ပွင့်နေရင် ပိတ်လိုက်မယ်
        const sortMenu = document.getElementById('sortMenu');
        if(sortMenu) sortMenu.classList.remove('show');
        
        menu.classList.add('show');
        overlay.style.display = 'block';
    }
}
function toggleAddSubMenu() {
    const subMenu = document.getElementById('add-sub-menu');
    const arrow = document.getElementById('add-arrow');
    
    if (subMenu.style.display === "none") {
        subMenu.style.display = "block";
        arrow.style.transform = "rotate(90deg)"; // မျှားလေးကို အောက်စိုက်ခိုင်းမယ်
    } else {
        subMenu.style.display = "none";
        arrow.style.transform = "rotate(0deg)"; // မျှားလေးကို မူလအတိုင်း ပြန်ထားမယ်
    }
}

// Settings menu ကို ပိတ်လိုက်ရင် Sub-menu ကိုလည်း တစ်ခါတည်း ပြန်ပိတ်ထားမယ်
function toggleSettings() {
    const menu = document.getElementById('settingsMenu');
    const overlay = document.getElementById('settingsOverlay');
    const isShowing = menu.classList.contains('show');

    if (isShowing) {
        menu.classList.remove('show');
        overlay.style.display = 'none';
        // ပိတ်တဲ့အချိန်မှာ Sub-menu ကိုပါ ပြန်ဝှက်ထားမယ် (နောက်တစ်ခါဖွင့်ရင် ရှင်းနေအောင်)
        document.getElementById('add-sub-menu').style.display = "none";
        document.getElementById('add-arrow').style.transform = "rotate(0deg)";
    } else {
        menu.classList.add('show');
        overlay.style.display = 'block';
    }
}

loadData(); // ‌‌ေဒတာ စစ်
// အားလုံး စစ်ပြ စ
function showStats() {
    // ၁။ ဒေတာ တွက်ချက်မယ်
    const totalSongs = allData.length;
    
    // ထပ်နေတဲ့ နာမည်တွေကို ဖယ်ပြီး အဆိုတော် အရေအတွက် တွက်မယ်
    const artists = new Set(allData.map(s => s.artist).filter(a => a && a !== '-'));
    const totalArtists = artists.size;

    // အယ်ဘမ် အရေအတွက် တွက်မယ်
    const albums = new Set(allData.map(s => s.album).filter(a => a && a !== '-'));
    const totalAlbums = albums.size;

    // ခုနှစ် အပိုင်းအခြား (ဥပမာ ၁၉၉၀ - ၂၀၂၄)
    const years = allData.map(s => parseInt(s.year)).filter(y => !isNaN(y));
    const yearRange = years.length > 0 ? `${Math.min(...years)} - ${Math.max(...years)}` : "-";

    // ၂။ HTML မှာ ဒေတာတွေ သွားထည့်မယ်
    document.getElementById('stat-total-songs').innerText = totalSongs;
    document.getElementById('stat-total-artists').innerText = totalArtists;
    document.getElementById('stat-total-albums').innerText = totalAlbums;
    document.getElementById('stat-total-years').innerText = yearRange;

    // ၃။ Modal ကို ဖွင့်မယ်
    document.getElementById('statsModal').classList.add('show');
    document.getElementById('statsOverlay').style.display = 'block';
}

function closeStats() {
    document.getElementById('statsModal').classList.remove('show');
    document.getElementById('statsOverlay').style.display = 'none';
}

// ၁။ အဆိုတော် အရေအတွက်ကို နှိပ်ရင် အဆိုတော်စာရင်းဆီ ပြန်ပို့ပေးမယ့် function
// ၁။ အဆိုတော်များကို နှိပ်ရင် အဆိုတော်စာရင်းချည်းပဲ သီးသန့် Modal နဲ့ပြမယ်
let listType = 'songs'; // လက်ရှိ ဘာကြည့်နေလဲ မှတ်ထားဖို့
let listDisplayData = []; // လက်ရှိ စာရင်းထဲမှာ ရှိနေတဲ့ ဒေတာ

function showFullList(type) {
    listType = type;
    const content = document.getElementById('list-content');
    const title = document.getElementById('list-title');
    
    // ခလုတ်တွေကို အရောင်ပြောင်းမယ်
    document.querySelectorAll('.m-tool-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + type);
    if(activeBtn) activeBtn.classList.add('active');

    // --- ဒီအပိုင်းက ကိုကို အသစ်တိုးချင်တဲ့ နေရာ ---
    const config = {
        'songs':   { key: 'title',  label: 'သီချင်းများ' },
        'artists': { key: 'artist', label: 'အဆိုတော်များ' },
        'writers': { key: 'writer', label: 'တေးရေးများ' },
        'albums':  { key: 'album',  label: 'အယ်ဘမ်များ' },
        'studios': { key: 'studio', label: 'စတူဒီယိုများ' } // <--- ဒီလိုမျိုး တစ်ကြောင်းချင်း တိုးသွားရုံပဲ!
    };

    const current = config[type] || config['songs'];
    title.innerText = current.label + " စာရင်း";

        if (type === 'songs') {
        listDisplayData = [...allData];
    } else {
        // ၁။ ဒေတာအားလုံးထဲကနေ သက်ဆိုင်ရာ Key (ဥပမာ artist) တွေကို အကုန်ယူမယ်
        let allNames = [];
        
        allData.forEach(s => {
            const value = s[current.key];
            if (value && value !== '-') {
                // ၂။ ပုဒ်ဖြတ်ပုဒ်ရပ် ( , ) ပါရင် ခွဲထုတ်မယ်
                // ဥပမာ - "ဝင်းကိုခိုင်, ညှာစိမ်းခိုင်" ကို ["ဝင်းကိုခိုင်", "ညှာစိမ်းခိုင်"] ဖြစ်သွားစေမယ်
                const separatedNames = value.split(',').map(name => name.trim());
                allNames.push(...separatedNames);
            }
        });

        // ၃။ ခွဲထုတ်ပြီးသား နာမည်တွေထဲကမှ အမည်တူတာတွေကို ဖယ်ထုတ်မယ် (Unique ဖြစ်အောင်လုပ်မယ်)
        listDisplayData = [...new Set(allNames)].sort((a, b) => a.localeCompare(b, 'my'));
    }

    renderList();
    document.getElementById('fullListModal').style.display = 'block';
}


// စာရင်းကို Sort လုပ်မည့် function
function sortListData(dir) {
    if (dir === 'AZ') {
        listDisplayData.sort((a, b) => {
            let valA = typeof a === 'string' ? a : a.title;
            let valB = typeof b === 'string' ? b : b.title;
            return valA.localeCompare(valB, 'my'); // မြန်မာစာရော အင်္ဂလိပ်စာရော စီမယ်
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

// စာရင်းကို မျက်နှာပြင်ပေါ် ထုတ်ပြမည့် function
function renderList() {
    const content = document.getElementById('list-content');
    content.innerHTML = listDisplayData.map(item => {
        if (typeof item === 'string') {
            // အဆိုတော် သို့မဟုတ် တေးရေး စာရင်း
            return `
                <div class="simple-list-item">
                    <span>${item}</span>
                    <button class="btn-view-small" onclick="filterBySelectedType('${listType === 'artists' ? 'artist' : 'writer'}', '${item.replace(/'/g, "\\'")}')">ကြည့်မည်</button>
                </div>`;
        } else {
            // သီချင်းစာရင်း
            return `
                <div class="simple-list-item">
                    <div style="flex:1;"><strong>${item.title}</strong><br><small>${item.artist}</small></div>
                    <button class="btn-view-small" onclick='openFullModal(${JSON.stringify(item).replace(/'/g, "&apos;")})'>ဖွင့်ကြည့်</button>
                </div>`;
        }
    }).join('');
}


// ဒီ Function လေးကိုလည်း Stats ထဲက ခလုတ်တွေမှာ ပြောင်းပေးပါ ကိုကို
function goToArtistList() { showFullList('artists'); closeStats(); }
function showAllSongsFromStats() { showFullList('songs'); closeStats(); }

// Modal ပိတ်တဲ့ function
function closeFullList() {
    document.getElementById('fullListModal').style.display = 'none';
}

// အဆိုတော်တစ်ယောက်ကို ရွေးလိုက်ရင် သူ့သီချင်းတွေကို Card View မှာ သွားပြပေးမယ့် function
function filterByArtist(name) {
    closeFullList();
    handleSort('artist'); // Sort ကို အဆိုတော်အလိုက် ပြောင်းမယ်
    renderCardView(name, encodeURIComponent(JSON.stringify(allData.filter(s => s.artist === name))));
}


// အားလုံး စစ်ပြ ဆ