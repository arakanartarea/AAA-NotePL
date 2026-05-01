// GitHub Config
const ENCRYPTED_TOKEN = 'U2FsdGVkX1+aBu/9CfKvC0HwY8HpVc/UntKfHi4k3ONGo/hSuRH25sYbbIk7GSg8Pg/MhiTAwjx+q140fYsaXw=='; 
const USER = 'arakanartarea';
const REPO = 'AAA-NotePL';
const FILE = 'KLWnote.json';
// ‌ေဒတာ‌ေသာ့ထည့်ရန် 
const ENCRYPTED_VAULT = "U2FsdGVkX18uAg/wL2zss+lmic3eqoODxIBTj31p0VNHJ2ixh87IT9FRCHT+vxa0";
let activeKeys = {}; // ဒါက သော့ဖွင့်ပြီးရင် memory ထဲ ခေတ္တသိမ်းထားမယ့်နေရာ

const PASS_LIST_FILE = 'pass_list.json'; // ဒါလေး အသစ်ထည့်ပါ

let notesData = []; 
let masterKey = "";
let realToken = "";
let fileSHA = "";
let editId = null;

// History System
let historyStack = [];
let redoStack = [];
let typingTimer;

let currentIsFavorite = false; 
let currentMode = "active"; 

//sort ‌ေရွး ...
let currentSort = "newest"; // Default
let isEditMode = false; // View-edit Mode
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━★★★━━━━━━━━━━━━━━━━━━━━━━━━━━━━//
// Group 1: Access System (အဝင်/အထွက်)

// 1A:  Unlock App & Load Data 
async function unlockApp() {
    masterKey = document.getElementById('master-pass').value;
    try {
        // ၁။ Vault & Token ကို အရင်ဖြည်မယ်
        const vaultBytes = CryptoJS.AES.decrypt(ENCRYPTED_VAULT, masterKey);
        activeKeys = JSON.parse(vaultBytes.toString(CryptoJS.enc.Utf8));

        const bytes = CryptoJS.AES.decrypt(ENCRYPTED_TOKEN, masterKey);
        realToken = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!realToken.startsWith('ghp_')) throw new Error();

        // ၂။ ဖုန်းထဲမှာ အရင်ရှိနေတဲ့ Local ဒေတာကို Load လုပ်မယ်
        const localData = localStorage.getItem('AAA_Notes_Backup');
        if (localData) {
            notesData = JSON.parse(localData);
        }

        // ၃။ UI ကို အရင်ဖွင့်ပြလိုက်မယ်
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        renderApp();

        // ၄။ နောက်ကွယ်ကနေ Cloud ဒေတာကို ဆွဲယူပြီး ညှိမယ် (Auto Sync)
        await fetchCloudData(); 

    } catch (e) { 
        alert("Password မှားယွင်းနေပါသည်။"); 
    }
}

// 1B: ဒေတာသိမ်းပြီး စိတ်ချစွာ လော့အော့နိုင်ရန်
async function safeLogout() {
    try {
        const statusMsg = document.getElementById('search-input');
        if(statusMsg) statusMsg.placeholder = "Saving to Cloud (Logging out)...";
        
        // Logout မထွက်ခင် နောက်ဆုံးအဆင့်အနေနဲ့ Cloud ပေါ် ဒေတာတင်မယ်
        await pushToGitHub(FILE, notesData, "Auto Sync on Logout");
        
        // အောင်မြင်ရင် App ကို Restart ချ (Login Screen ပြန်ရောက်သွားမယ်)
        location.reload();
    } catch (e) {
        console.error("Logout Sync Error:", e);
        // အကယ်၍ အင်တာနက်မရှိလို့ Sync မရရင် User ကို မေးမယ်
        if(confirm("Cloud ကို ဒေတာတင်လို့မရပါ။ Logout ထွက်မှာ သေချာလား?")) {
            location.reload();
        } else {
            // မထွက်တော့ဘူးဆိုရင် placeholder ကို မူလအတိုင်း ပြန်ထားမယ်
            const statusMsg = document.getElementById('search-input');
            if(statusMsg) statusMsg.placeholder = "ရှာဖွေရန်...";
        }
    }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━★★★━━━━━━━━━━━━━━━━━━━━━━━━━━━━//

// Group 2: Data & Sync Engine (ဒေတာစနစ်)

// 2A: Local Storage Logic (ဒေတာကို ယာယီ ထိန်းသိမ်းပေးနိုင်ရန်)
function saveToLocal() {
    try {
        localStorage.setItem('AAA_Notes_Backup', JSON.stringify(notesData));
        console.log("Saved to device memory.");
    } catch (e) {
        console.error("Local save failed", e);
    }
}

// 2B: Fetch Data from Cloud & Decrypt
async function fetchCloudData() {
    try {
        // GitHub ကနေ JSON ဖိုင်ကို အရင်ဆွဲယူမယ် (SHA ပါ တစ်ခါတည်း ရအောင်လို့ပါ)
        const res = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${FILE}?t=${Date.now()}`, {
            headers: { 'Authorization': `token ${realToken}` }
        });

        if (res.ok) {
            const data = await res.json();
            fileSHA = data.sha; // ဒီ SHA က အဟောင်းကို ဖျက်ဖို့အတွက် မဖြစ်မနေ လိုအပ်ပါတယ်
            const encryptedStr = decodeURIComponent(escape(atob(data.content)));

            try {
                // ၁။ လက်ရှိ activeKeys ထဲက သော့ (သော့အသစ် ဖြစ်နိုင်သည်) နဲ့ ဖြည်ကြည့်မယ်
                // activeKeys.MyNote နေရာမှာ သင်ပေးထားတဲ့ သော့နာမည် တူဖို့ပဲ လိုပါတယ်
                const keyName = Object.keys(activeKeys)[0]; // ပထမဆုံးသော့ကို ယူသုံးမယ် (နာမည်မတူလည်း ရအောင်)
                const bytes = CryptoJS.AES.decrypt(encryptedStr, activeKeys[keyName]);
                const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
                
                if (!decryptedData) throw new Error("Key Mismatch");

                const remoteData = JSON.parse(decryptedData);
                await processSync(remoteData);

            } catch (decryptErr) {
                // ၂။ ဒီနေရာက ဒေတာသော့ အသစ်ဖြစ်နေတဲ့ အခြေအနေပဲ
                console.warn("သော့အသစ် ဖြစ်နေသဖြင့် Cloud ဒေတာကို ဖတ်မရပါ။");

                // Local မှာ ဒေတာ ရှိ/မရှိ စစ်မယ်
                const localRaw = localStorage.getItem('AAA_Notes_Backup');
                const localData = localRaw ? JSON.parse(localRaw) : [];

                if (localData.length > 0) {
                    // Local မှာ ဒေတာရှိရင် အသစ်လဲမလား မေးမယ်
                    if (confirm("ဒေတာသော့အသစ် ဖြစ်နေပါသည်။ Local ဒေတာများကို သော့အသစ်ဖြင့် Cloud ပေါ်သို့ အတင်းသိမ်းမလား? (Cloud ပေါ်ရှိ အဟောင်းများ ပျက်သွားပါမည်)")) {
                        
                        notesData = localData; 
                        // pushToGitHub ကို Force Update လုပ်ခိုင်းမယ်
                        await pushToGitHub(FILE, notesData, "Key Changed: Forced Local Update", fileSHA);
                        
                        alert("အောင်မြင်စွာ အစားထိုးပြီးပါပြီ။");
                        renderApp();
                    }
                } else {
                    // Local မှာ ဒေတာမရှိရင် ဘာမှမလုပ်ဘူး (ခိုးသူဆိုရင်လည်း ဘာမှလုပ်မရတော့ဘူး)
                    alert("⚠️ သော့အသစ်ဖြစ်နေသော်လည်း ဖုန်းထဲတွင် ဒေတာမရှိသဖြင့် Cloud ကို အစားထိုး၍မရပါ။");
                }
            }
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}


// 2C: pushToGitHub (Cloud ပေါ် ဒေတာ တင်ရန်)
async function pushToGitHub(fileName, contentObject, commitMsg, forceSHA = null) {
    // Force Sync ဖြစ်နေရင် ပေးလိုက်တဲ့ SHA ကို ယူမယ်၊ မဟုတ်ရင် လက်ရှိသိထားတဲ့ SHA ကို သုံးမယ်
    let targetSHA = forceSHA || fileSHA;

    const jsonStr = JSON.stringify(contentObject);
    
    // activeKeys ထဲမှာ ရှိတဲ့ ပထမဆုံးသော့နဲ့ Encrypt လုပ်မယ်
    const keyName = Object.keys(activeKeys)[0];
    const encryptedStr = CryptoJS.AES.encrypt(jsonStr, activeKeys[keyName]).toString();
    
    // UTF-8 စနစ်အတွက် Base64 ပြောင်းလဲမှု
    const base64Content = btoa(unescape(encodeURIComponent(encryptedStr)));

    const putRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${fileName}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `token ${realToken}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            message: commitMsg, 
            content: base64Content, 
            sha: targetSHA || undefined 
        })
    });

    if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || "Update Failed");
    }
    
    const result = await putRes.json();
    fileSHA = result.content.sha; // Update ပြီးသွားရင် SHA အသစ်ကို သိမ်းမယ်
    return result;
}


// 2D: processSync (ဒေတာ နှစ်ဖက် ညှိနှိုင်းရန်)
async function processSync(remoteData) {
    let localModified = false;

    remoteData.forEach(remoteNote => {
        // id တူတာကို ရှာမယ်
        const localIdx = notesData.findIndex(n => n.id.toString() === remoteNote.id.toString());

        if (localIdx === -1) {
            // Local မှာ မရှိသေးတဲ့ Note အသစ်ဆိုရင် ထည့်မယ်
            notesData.push(remoteNote);
            localModified = true;
        } else {
            // နှစ်ဖက်လုံး ရှိနေရင် updatedAt (အချိန်) ကို ကြည့်ပြီး ပိုသစ်တာကိုပဲ ယူမယ်
            const remoteTime = remoteNote.updatedAt || 0;
            const localTime = notesData[localIdx].updatedAt || 0;

            if (remoteTime > localTime) {
                notesData[localIdx] = remoteNote;
                localModified = true;
            }
        }
    });

    // ဒေတာ အပြောင်းအလဲ ရှိမှသာ UI ကို ပြန်ဆွဲပြီး ဖုန်းထဲ သိမ်းမယ်
    if (localModified) {
        saveToLocal();
        renderApp();
    }
    
    // နောက်ဆုံးအဆင့်- Local မှာ ပိုသစ်တာတွေ ရှိနေရင် Cloud ကို ပြန်တင်ပေးမယ်
    try {
        await pushToGitHub(FILE, notesData, "Auto Merge Sync");
    } catch(e) {
        console.log("Cloud Update Pending (Offline)");
    }
}

// 2E: Manual Sync (ခလုတ်နှိပ်ပြီး ဒေတာ အတင်းဆွဲယူရန်)
async function manualSync() {
    const statusMsg = document.getElementById('search-input');
    
    try {
        if(statusMsg) statusMsg.placeholder = "🔄 Cloud မှ ဒေတာယူနေသည်...";
        
        // Cloud ကဒေတာကို လှမ်းယူမယ်
        await fetchCloudData(); 
        
        if(statusMsg) statusMsg.placeholder = "✅ Sync ပြီးပါပြီ";
        
        // ၂ စက္ကန့်ကြာရင် မူလစာသား ပြန်ပြောင်းမယ်
        setTimeout(() => {
            if(statusMsg) statusMsg.placeholder = "ရှာဖွေရန်...";
        }, 2000);
        
    } catch (e) {
        if(statusMsg) statusMsg.placeholder = "❌ Sync Error ဖြစ်သွားသည်";
        alert("အင်တာနက် သို့မဟုတ် GitHub Token ကို စစ်ဆေးပါ");
    }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━★★★━━━━━━━━━━━━━━━━━━━━━━━━━━━━//

//Group 3: App Navigation & Main UI (ပင်မစာမျက်နှာနှင့် ပင်မ ခလုတ်များ)

// 3A: renderApp (ပင်မ UI ဆွဲရန်)
function renderApp(filter = "") {
    const listArea = document.getElementById('note-list');
    listArea.innerHTML = "";
    
    // ၁။ လက်ရှိ mode အလိုက် Note များကို အရင်ဖတ်မယ်
    let targetNotes = notesData.filter(n => n.status === currentMode);

    // ၂။ Note တစ်ခုချင်းစီကို အချိန် နဲ့ အက္ခရာအရ စီမယ်
        // (renderApp function ထဲက sorting logic သီးသန့်)
    
    // ၁။ Note တစ်ခုချင်းစီကို စီမယ်
    if (currentSort === "az") {
        targetNotes.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === "za") {
        targetNotes.sort((a, b) => b.title.localeCompare(a.title));
    } else if (currentSort === "newest") {
        targetNotes.sort((a, b) => b.id - a.id); // အသစ်ဆုံး အပေါ်ရောက်မယ်
    } else if (currentSort === "oldest") {
        targetNotes.sort((a, b) => a.id - b.id); // အဟောင်းဆုံး အပေါ်ရောက်မယ်
    }

    const groups = {};
    targetNotes.forEach(n => {
        if (!groups[n.group]) groups[n.group] = [];
        groups[n.group].push(n);
    });

    // ၂။ Group တွေကို စီမယ် (ဒါမှ group a, b, z တွေ နေရာပြောင်းမှာပါ)
    let groupNames = Object.keys(groups);

    if (currentSort === "most") {
        groupNames.sort((a, b) => groups[b].length - groups[a].length);
    } else if (currentSort === "least") {
        groupNames.sort((a, b) => groups[a].length - groups[b].length);
    } else if (currentSort === "az") {
        groupNames.sort((a, b) => a.localeCompare(b));
    } else if (currentSort === "za") {
        groupNames.sort((a, b) => b.localeCompare(a));
    } else {
        groupNames.sort();
    }


    // Suggestion List ကို update လုပ်မယ်
    updateSuggestions(groupNames);

    // ၅။ UI မှာ ထုတ်ပြမယ် (Favorites ကို အရင်ပြမယ်)
    if (currentMode === "active") {
        const favoriteNotes = targetNotes.filter(n => n.isFavorite);
        if (favoriteNotes.length > 0) {
            renderGroupUI("💖 Favorites", favoriteNotes, filter, listArea);
        }
    }

    // ကျန်တဲ့ Group များကို တစ်ခုချင်းစီ ဆွဲထုတ်ပြမယ်
    groupNames.forEach(name => {
        renderGroupUI(name, groups[name], filter, listArea);
    });

    // ဒေတာမရှိရင် ပြမည့်စာသား
    if (targetNotes.length === 0 && currentMode === "trash") {
        listArea.innerHTML = "<div style='text-align:center; padding:50px; color:#888;'>အမှိုက်ပုံးထဲမှာ ဘာမှမရှိပါ။</div>";
    }
}

// 3B: renderGroupUI (မှတ်စု အုပ်စုများ ပြရန်)
function renderGroupUI(name, notes, filter, container) {
    const groupNotes = notes.filter(n => 
        n.title.toLowerCase().includes(filter.toLowerCase()) ||
        n.content.toLowerCase().includes(filter.toLowerCase())
    );

    if (groupNotes.length === 0) return;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-item'; 
    if (filter.length > 0) groupDiv.classList.add('active');

    let icon = (name === "💖 Favorites") ? "" : (currentMode === "trash" ? "🗑️ " : "📂 ");

    groupDiv.innerHTML = `
        <div class="group-header" onclick="toggleGroup(this)">
            <span>${icon}${name} (${groupNotes.length})</span>
            <span>▼</span>
        </div>
        <div class="child-list">
            ${groupNotes.map(n => `
                <div class="note-card" onclick="editNote('${n.id}')">
                    <div style="flex:1;">
                        <b>${n.title}</b>
                        <small style="color:#888; font-size:12px;">${n.date || ''}</small>
                    </div>
                    <span style="color:#ccc;">〉</span>
                </div>
            `).join('')}
        </div>
    `;
    container.appendChild(groupDiv);
}

// 3C: toggleGroup (Group ခေါင်းစဉ် ဖွင့်/ပိတ်)
function toggleGroup(el) {
    const parent = el.parentElement;
    const isActive = parent.classList.contains('active');
    document.querySelectorAll('.group-item').forEach(i => i.classList.remove('active'));
    if (!isActive) parent.classList.add('active');
}

// 3D: handleSearch / clearSearch (စာရှာစနစ်)
// 3D- 1: ရှာဖွေစာသား
function handleSearch() { const val = document.getElementById('search-input').value; renderApp(val); if (val.length > 0) document.querySelectorAll('.group-item').forEach(i => i.classList.add('active')); }

// 3D- 2: ရှာဖွေစာသားရှင်းရန်
function clearSearch() { 
    document.getElementById('search-input').value = ""; renderApp(); }

// 3E: showTrash / showActive (ပင်မမှ အမှိုက်ပုံး/အမှိုက်ပုံးမှ ပင်မ ခလုတ်ပြောင်းရန် )
function showTrash() { 
    currentMode = "trash"; document.getElementById('main-action-btn').innerText = "🔙"; document.getElementById('main-action-btn').onclick = showActive; document.getElementById('menu-trash-btn').innerText = "🏠 Main Page"; document.getElementById('menu-trash-btn').onclick = showActive; renderApp(); }

function showActive() { 
    currentMode = "active"; document.getElementById('main-action-btn').innerText = "➕"; document.getElementById('main-action-btn').onclick = showEditor; document.getElementById('menu-trash-btn').innerText = "🗑️ Recycle Bin"; document.getElementById('menu-trash-btn').onclick = showTrash; renderApp(); }

// Undo/Redo & History
document.getElementById('rich-editor').oninput = function() { clearTimeout(typingTimer); typingTimer = setTimeout(() => saveToHistory(), 500); };


// 3F: toggleMenu (ပင်မ မီနူး ဖွင့်/ပိတ်)
//Sub Menu 
function toggleMenu(e) {
    if (e) e.stopPropagation();
    const m = document.getElementById('dropdown-menu');
    
    // အကယ်၍ select box ကို နှိပ်တာဆိုရင် ဘာမှမလုပ်ဘဲ ပြန်ထွက်မယ်
    if (e && e.target.tagName === 'SELECT') return;

    if (m.style.display === 'block') {
        m.style.display = 'none';
    } else {
        m.style.display = 'block';
    }
}
// Menu အပြင်ဘက်ကို နှိပ်ရင် ပင်မMenu ပြန်ပိတ်သွားအောင် လုပ်တဲ့အပိုင်း
document.addEventListener('click', (e) => {
    const m = document.getElementById('dropdown-menu');
    if (!m) return;
    
    // Menu အပြင်ဘက်ကို နှိပ်မှသာ ပိတ်မယ်
    // select box ကို နှိပ်တာဆိုရင် မပိတ်ဘူး
    if (!e.target.closest('.menu-dropdown') && m.style.display === 'block') {
        m.style.display = 'none';
    }
});

// 3G: ​changeSort (စာရင်းစီပြမှုပုံစံ ပြောင်းရန်)
function changeSort(val) {
    currentSort = val;
    console.log("Sorting mode:", val);
    
    // UI ကို ပြန်ဆွဲဖို့ Render ခေါ်မယ် (Filter ရှိရင် ထည့်ပေးမယ်)
    const searchVal = document.getElementById('search-input') ? document.getElementById('search-input').value : "";
    renderApp(searchVal);
    
    // ရွေးပြီးရင် Menu ကို အလိုအလျောက် ပြန်ပိတ်မယ်
    const m = document.getElementById('dropdown-menu');
    if(m) m.style.display = 'none';
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━★★★━━━━━━━━━━━━━━━━━━━━━━━━━━━━//

// Group 4: Editor Toolbar System (စာရေးသည့်နေရာမှ ခလုတ်များ)
// 4A: execCmd (Bold, Italic စသည့် Format များ ပြုလုပ်ရန်)
function execCmd(cmd, val = null) { document.execCommand(cmd, false, val); saveToHistory(); }

// 4B: toggleMobileGroup (ဖုန်းတွင် Toolbar ခလုတ်များ စုပြရန်)
function toggleMobileGroup(el) {
    // ၁။ ဖုန်းဟုတ်မဟုတ် အရင်စစ်မယ် (Screen အကျယ် 768 အောက်ဆိုမှ အလုပ်လုပ်မယ်)
    if (window.innerWidth >= 768) return;

    // ၂။ လက်ရှိနှိပ်လိုက်တဲ့ အုပ်စု ပွင့်နေသလား စစ်မယ်
    const isActive = el.classList.contains('mobile-active');

    // ၃။ တခြားပွင့်နေတဲ့ အုပ်စုတွေအကုန် အရင်ပိတ်မယ်
    document.querySelectorAll('.toolbar-group').forEach(group => {
        group.classList.remove('mobile-active');
    });

    // ၄။ မူလက ပိတ်နေတာဆိုရင် အခုနှိပ်တဲ့ဟာကို ဖွင့်မယ်
    if (!isActive) {
        el.classList.add('mobile-active');
    }
}
// Toolbar အပြင်ဘက်ကို နှိပ်ရင် အလိုအလျောက် ပြန်ပိတ်သွားအောင် လုပ်မယ်
document.addEventListener('click', (e) => {
    if (!e.target.closest('.toolbar-group')) {
        document.querySelectorAll('.toolbar-group').forEach(group => {
            group.classList.remove('mobile-active');
        });
    }
});

// 4C: saveToHistory (Undo လုပ်နိုင်ရန် အချက်အလက် မှတ်ရန်)
function saveToHistory() { 
    const c = document.getElementById('rich-editor').innerHTML; if (historyStack.length === 0 || historyStack[historyStack.length - 1] !== c) { historyStack.push(c); if (historyStack.length > 50) historyStack.shift(); redoStack = []; } }


// 4D: undoCustom / redoCustom (ရှေ့တိုး နောက်ဆုတ် လုပ်ရန်)
// Undo
function undoCustom() { 
    if (historyStack.length > 1) { redoStack.push(historyStack.pop()); document.getElementById('rich-editor').innerHTML = historyStack[historyStack.length - 1]; } }

// Redo
function redoCustom() { 
    if (redoStack.length > 0) { const n = redoStack.pop(); historyStack.push(n); document.getElementById('rich-editor').innerHTML = n; } }
document.addEventListener('click', (e) => { const m = document.getElementById('dropdown-menu'); if (!e.target.closest('.menu-dropdown') && m.style.display === 'block') m.style.display = 'none'; });


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━★★★━━━━━━━━━━━━━━━━━━━━━━━━━━━━//

// Group 5: Note Actions (မှတ်စု စီမံခန့်ခွဲမှု)

// 5A: showEditor / hideEditor (စာရေးကွက် ဖွင့်/ပိတ်)
//စာရေးမုဒ်ဖွင့် 
function showEditor() { 
    editId = null; 
    currentIsFavorite = false; 
    resetEditorFields(); 
    // အသစ်ဆောက်ရင် "New Note" လို့ ပြန်ပြောင်းခိုင်းတာ
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.innerText = "New Note"; 
    document.getElementById('fav-btn').innerHTML = "🤍"; 
    document.getElementById('editor-container').style.display = 'flex'; 
    // Edit mode on
     // New Note ဆိုရင် Edit Mode တန်းဝင်မယ်
    isEditMode = false; // toggle ခေါ်ရင် true ဖြစ်သွားအောင် false အရင်ထားတာပါ
    toggleEditMode();
document.getElementById('edit-mode-btn').innerText = "📄";}
//စာရေးကွက်ပိတ်
function hideEditor() { 
    document.getElementById('editor-container').style.display = 'none'; }

// 5B: toggleEditMode (View/Edit Mode ပြောင်းရန်)
// View - Edit Mode ပြောင်းတဲ့ function
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('edit-mode-btn');
    const editor = document.getElementById('rich-editor'); // မှတ်စုရေးတဲ့နေရာ
    const titleInput = document.getElementById('title-input'); // ခေါင်းစဉ်
    const groupInput = document.getElementById('group-input'); // Group
    const toolbar = document.querySelector('.toolbar'); // Toolbar

    if (isEditMode) {
        // --- Edit Mode ON ---
        editBtn.innerText = "📄";
        editor.contentEditable = "true"; // စာရိုက်လို့ရအောင် ဖွင့်မယ်
        titleInput.readOnly = false;
        groupInput.readOnly = false;
        toolbar.classList.remove('hidden'); // Toolbar ပြမယ်
    } else {
        // --- View Mode (Edit Mode OFF) ---
        editBtn.innerText = "📝";
        editor.contentEditable = "false"; // စာရိုက်လို့မရအောင် ပိတ်မယ်
        titleInput.readOnly = true;
        groupInput.readOnly = true;
        toolbar.classList.add('hidden'); // Toolbar ဖျောက်မယ်
        
        // Keyboard ပြန်ဆင်းသွားအောင် Focus ဖြုတ်မယ်
        editor.blur();
        titleInput.blur();
    }}

// 5C: saveNote (မှတ်စု သိမ်းရန်)
function saveNote() {
    const group = document.getElementById('group-input').value;
    const title = document.getElementById('title-input').value;
    const content = document.getElementById('rich-editor').innerHTML;

    if (!group || !title) return alert("Group and Title required!");

    const newNote = {
        id: editId ? editId.toString() : Date.now().toString(),
        group, title, content,
        status: "active",
        isFavorite: currentIsFavorite,
        date: new Date().toLocaleString(),
        updatedAt: Date.now() // Smart Sync အတွက် အချိန်မှတ်တမ်း
    };
    if (editId) {
        const idx = notesData.findIndex(n => n.id.toString() === editId.toString());
        if (idx !== -1) notesData[idx] = newNote;
    } else {
        notesData.unshift(newNote);
    }
    saveToLocal();
    renderApp();
    hideEditor();
}

// 5D: editNote (မှတ်စု ပြန်ဖွင့်ရန်)
function editNote(id) {
    const n = notesData.find(x => x.id.toString() === id.toString());
    if (!n) return;

    editId = id;
    document.getElementById('group-input').value = n.group;
    document.getElementById('title-input').value = n.title;
    document.getElementById('rich-editor').innerHTML = n.content;

    // --- အချိန်ကို ထုတ်ယူပြီး Modal Title မှာ ပြမည့်အပိုင်း ---
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle && n.date) {
        // "4/26/2026, 11:20:15 PM" ထဲက "11:20:15 PM" ကိုပဲ ယူမယ်
        const timeStr = n.date.split(', ')[1] || n.date;
        modalTitle.innerText = timeStr;
    }
    const favBtn = document.getElementById('fav-btn');
    if (n.status === "trash") {
        favBtn.innerHTML = "🔄"; 
        favBtn.onclick = restoreNote; 
    } else {
        currentIsFavorite = n.isFavorite || false;
        favBtn.innerHTML = currentIsFavorite ? "💖" : "🤍";
        favBtn.onclick = toggleFavorite;
    }
    document.getElementById('trash-btn').onclick = handleTrashAction;
    document.getElementById('editor-container').style.display = 'flex';
    // View Mode အနေနဲ့ အစပျိုးမယ်
    isEditMode = true; // toggle ခေါ်ရင် false ဖြစ်သွားအောင် true အရင်ထားတာပါ
    toggleEditMode(); 
document.getElementById('edit-mode-btn').innerText = "📝";
}

// 5E: handleTrashAction (ဖျက်ရန်/အမှိုက်ပုံးပို့ရန်)
function handleTrashAction() {
    if (!editId) return;
    const idx = notesData.findIndex(x => x.id.toString() === editId.toString());
    if (idx === -1) return;

    if (notesData[idx].status === "trash") {
        if (confirm("ထာဝရဖျက်မလား?")) {
            notesData.splice(idx, 1);
            saveToLocal();
            renderApp();
            hideEditor();
        }
    } else {
        if (confirm("အမှိုက်ပုံးထဲ ထည့်မလား?")) {
            notesData[idx].status = "trash";
            notesData[idx].isFavorite = false;
            // --- ဒီတစ်ကြောင်းပဲ ထပ်ဖြည့်လိုက်တာပါ ---
            notesData[idx].updatedAt = Date.now(); 
            // ------------------------------------
            saveToLocal();
            renderApp();
            hideEditor();
        }
    }
}

// 5F: restoreNote (အမှိုက်ပုံးစာပြန်လည် အသုံးပြုရန်)
function restoreNote() {
    const idx = notesData.findIndex(x => x.id.toString() === editId.toString());
    if(idx !== -1) {
        notesData[idx].status = "active";
        saveToLocal();
        renderApp();
        hideEditor();
    }
}

// 5G: toggleFavorite (အကြိုက်ဆုံး မှတ်ရန်)
function toggleFavorite() { 
    currentIsFavorite = !currentIsFavorite; document.getElementById('fav-btn').innerText = currentIsFavorite ? "💖" : "🤍"; }

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━★★★━━━━━━━━━━━━━━━━━━━━━━━━━━━━//

// Group 6: Utilities (အထွေထွေ အထောက်အကူပြု)
// 6A: updateSuggestions (Group အသစ်ခေါ်တိုင်း နာမည် အကြံပြုရန်)
function updateSuggestions(names) { 
    document.getElementById('group-suggestions').innerHTML = names.map(n => `<option value="${n}">`).join(''); }

// 6B: resetEditorFields (စာရေးကွက်များ ရှင်းလင်းရန်)
function resetEditorFields() { 
    document.getElementById('group-input').value = ""; document.getElementById('title-input').value = ""; document.getElementById('rich-editor').innerHTML = ""; }

// စာသားများကို သော့ဖျက်သည့်နေရာ
// 6C: openVaultManager / closeVaultManager (Key ထုတ်သည့် နေရာ)
function openVaultManager() {
    document.getElementById('vaultModal').style.display = 'block';
}
function closeVaultManager() {
    document.getElementById('vaultModal').style.display = 'none';
}

// 6D:doGenerateVault / copyVaultCode (Key စနစ်)
// သော့ဖျက်ရန်
function doGenerateVault() {
    const master = document.getElementById('mPass').value;
    if(!master) return alert("Master Pass ထည့်ပါ");

    const names = document.querySelectorAll('.m-key-name');
    const values = document.querySelectorAll('.m-key-val');
    let keysObj = {};
    names.forEach((el, index) => {
        if(el.value.trim() !== "") keysObj[el.value.trim()] = values[index].value;
    });

    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(keysObj), master).toString();
    document.getElementById('mResult').value = encrypted;
}
// သော့စာသား ကူးရန်
function copyVaultCode() {
    const res = document.getElementById('mResult');
    res.select();
    navigator.clipboard.writeText(res.value);
    alert("Copied!");
}

// 6E: addMRow (Key ထည့်ရန် Row အသစ်တိုးရန်)
function addMRow() {
    const container = document.getElementById('mKeysContainer');
    const row = document.createElement('div');
    row.className = 'm-key-row';
    row.style = "display:flex; gap:5px; margin-bottom:10px;";
    row.innerHTML = `<input type="text" class="m-key-name" placeholder="နာမည်" style="flex:1; padding:8px;">
                     <input type="text" class="m-key-val" placeholder="သော့" style="flex:1; padding:8px;">
                     <button onclick="this.parentElement.remove()" style="background:red; color:white; border:none; border-radius:4px;">❌</button>`;
    container.appendChild(row);
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━★★★━━━━━━━━━━━━━━━━━━━━━━━━━━━━//
