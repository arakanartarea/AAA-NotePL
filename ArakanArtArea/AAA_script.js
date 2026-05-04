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
    // ၁။ Back ခလုတ်နဲ့ Sort ခလုတ်ကို အဖွင့်အပိတ်လုပ်မယ်
    document.getElementById('backBtn').style.display = isDetailView ? 'flex' : 'none';
    document.getElementById('sortBtn').style.display = isDetailView ? 'none' : 'flex';
    
    // ၂။ Detail View ရောက်ရင် Search Box ကို ဖျောက်မယ်၊ အပြင်စာမျက်နှာမှာပဲ ပြန်ပြမယ်
    const searchBox = document.getElementById('search');
    if (searchBox) {
        searchBox.style.display = isDetailView ? 'none' : 'block';
    }

    // ၃။ အပြင်စာမျက်နှာမှာပဲ စီနည်းစာသားတွေကို Update လုပ်မယ်
    if (!isDetailView) {
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

    // ပြင်ရမည့်နေရာ- group-list အစား master-panel ထဲက element ဆီ ပို့ရမယ်
    // ငါတို့ HTML မှာ master-panel ထဲမှာ artist-list-container လို့ နာမည်ပေးထားရအောင်
    const listElement = document.getElementById('artist-list-container');
    if(listElement) {
        listElement.innerHTML = sortedNames.map((name, index) => `
            <div class="artist-group-container">
                <div class="artist-header">
                    <div class="artist-info" onclick="showGroupDetail('${name.replace(/'/g, "\\'")}', '${key}')">
                        ${name} (${groups[name].length})
                    </div>
                    <div id="btn-${index}" class="expand-btn" onclick="toggleSongs('songs-${index}', 'btn-${index}')">▼</div>
                </div>
                <div id="songs-${index}" class="song-list">
                    ${groups[name].map(song => `<div style="padding:10px; border-bottom:1px solid #eee;">${song.title}</div>`).join('')}
                </div>
            </div>`).join('');
    }
}

// ကဒ် ကုဒ် စ
// ၁။ Card View ပြသခြင်း (၈ ခုပါသော မျက်နှာစာ)
function showGroupDetail(name, key) {
    // updateToolbarUI(true); // Tablet မှာဆိုရင် ဒါကို ပိတ်ထားလို့ရတယ် (Search မဖျောက်ချင်ရင်)
    
    const songs = allData.filter(s => (s[key] || 'အမည်မသိ') === name);
    
    // ညာဘက်ခြမ်း Card တွေရဲ့ ခေါင်းစဉ်
    let html = `<h2 style="padding:10px; border-bottom: 2px solid var(--primary);">${name}</h2>`;
    html += `<div class="song-grid">`;
    
    html += songs.map((song, idx) => `
        <div class="artist-card">
            <div class="card-header"><p class="card-title">${song.title}</p></div>
            <div class="card-main-info">
                <div class="info-item">🎙️ ${song.artist}</div>
                <div class="info-item">✍️ ${song.writer}</div>
                <div class="info-item">💿 ${song.album}</div>
                <div class="info-item">📅 ${song.year || '-'}</div>
            </div>
            <div class="card-actions">
                <button class="btn-full" onclick="openFullModal(${JSON.stringify(song).replace(/"/g, '&quot;')})">အပြည့်အစုံ 👁️</button>
            </div>
        </div>
    `).join('');

    html += `</div>`;

    // ညာဘက်ခြမ်း (group-list) ထဲကို ထည့်မယ်
    document.getElementById('group-list').innerHTML = html;
    
    // Tablet/Mobile မှာဆိုရင် ကလစ်လိုက်တဲ့အခါ ညာဘက်ခြမ်းဆီ အလိုအလျောက် Scroll ဆင်းပေးမယ်
    if(window.innerWidth <= 768) {
        document.getElementById('group-list').scrollIntoView({ behavior: 'smooth' });
    }
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
    
    body.innerHTML = `
        <h2 style="color:var(--primary);">${song.title}</h2>
        <p><strong>တေးဆို:</strong> ${song.artist}</p>
        <hr>
        <div style="background:#f9f9f9; padding:15px; border-radius:10px; min-height:200px;">
            <h4>သီချင်းစာသား</h4>
            <p style="white-space: pre-line;">${song.lyrics || 'သီချင်းစာသား မရှိသေးပါ။'}</p>
        </div>
        <div style="margin-top:20px;">
            <h4>ဗီဒီယို</h4>
            <div style="width:100%; height:200px; background:#eee; display:flex; align-items:center; justify-content:center; border-radius:10px;">
                ${song.youtube ? 'YouTube Player Here' : 'ဗီဒီယို မရှိသေးပါ'}
            </div>
        </div>
        <button class="btn-full" style="width:100%; margin-top:20px;" onclick="alert('Voting System Coming Soon!')">ဒီသီချင်းကို Rating ပေးမယ် ⭐</button>
    `;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('fullModal').style.display = 'none';
}

// ကဒ်ကုဒ် ဆ
function toggleSongs(id, btnId) {
    const el = document.getElementById(id);
    const btn = document.getElementById(btnId);
    const isOpen = el.style.display === "block";
    el.style.display = isOpen ? "none" : "block";
    btn.classList.toggle('active', !isOpen);
    btn.innerText = isOpen ? "▼" : "▲";
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

function goBackToGroup() { 
    updateToolbarUI(false);
    const container = document.querySelector('.container');
    if(container) container.style.maxWidth = '1000px'; 
    handleSort(currentSortKey); }

function filterData() {
    const val = document.getElementById('search').value.toLowerCase();
    const filtered = allData.filter(i => i.title.toLowerCase().includes(val) || i.artist.toLowerCase().includes(val));
    document.getElementById('group-list').innerHTML = filtered.map(song => `<div style="padding:12px; border-bottom:1px solid #eee; background:white;"><strong>${song.title}</strong><br><small>${song.artist}</small></div>`).join('');
}

loadData();
