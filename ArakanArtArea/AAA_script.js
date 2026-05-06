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
        if (rawName.includes(',')) groupName = rawName.split(',')[0].trim();
        if (groupName === '-' || groupName === '') groupName = 'အမည်မသိ';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(item);
        return acc;
    }, {});

    const sortedNames = Object.keys(groups).sort((a, b) => isAscending ? a.localeCompare(b) : b.localeCompare(a));

    const listElement = document.getElementById('artist-list-container');
    if(listElement) {
        listElement.innerHTML = sortedNames.map((name, index) => `
            <div class="artist-group-container">
                <div class="artist-header">
                    <div class="artist-info" onclick="showGroupDetail('${name.replace(/'/g, "\\'")}', '${key}')">
                        ${name}
                    </div>
                    
                    <div style="display: flex; align-items: center;">
                        <span class="count-badge">${groups[name].length}</span>
        
<div id="btn-${index}" class="expand-btn" onclick="toggleSongs('songs-${index}', 'btn-${index}')">
    ❯
</div>

                    </div>
                </div>
                
                <div id="songs-${index}" class="song-list">
                    ${groups[name].map(song => {
                        // JavaScript Object ကို HTML String ထဲထည့်ဖို့ သေချာ ပြောင်းလိုက်တာပါရှင်
                        const songData = JSON.stringify(song).replace(/"/g, '&quot;');
                        return `
                            <div class="song-list-item" onclick="openFullModal(${songData})" style="cursor:pointer;">
                                🎵 ${song.title}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>`).join('');
    }
}


// ကဒ် ကုဒ် စ
// ၁။ Card View ပြသခြင်း (၈ ခုပါသော မျက်နှာစာ)
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

loadData();
