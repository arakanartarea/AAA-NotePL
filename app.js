// GitHub Config
const ENCRYPTED_TOKEN = 'U2FsdGVkX1+aBu/9CfKvC0HwY8HpVc/UntKfHi4k3ONGo/hSuRH25sYbbIk7GSg8Pg/MhiTAwjx+q140fYsaXw=='; 
const USER = 'arakanartarea';
const REPO = 'AAA-NotePL';
const FILE = 'KLWnote.json';
// ‌ေဒတာ‌ေသာ့ထည့်ရန် 
const ENCRYPTED_VAULT = "U2FsdGVkX1/5P5jgTEJGVUuU0QRUQYDkqvxBXCeB3bhUKuCTtH7Fl4rYnsGXSiqy";
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


// 1: saveToLocal
// 2: unlockApp
// 3:fetchCloudData
// 4: renderApp
// 5:renderGroupUI
// 6:saveNote
// 7:editNote
// 8:handleTrashAction
// 9:restoreNote
//10:pushToGitHub

//11:syncCloud
//12:processSync
//13:toggleGroup
//14:execCmd
//15:showEditor
//16:hideEditor
//17:resetEditorFields
//18:updateSuggestions
//19:toggleFavorite
//20:toggleMenu

//21clearSearch
//22showTrash
//23showActive
//24saveToHistory
//25undoCustom
//26redoCustom
//27toggleMenu
//28changeSort
//29toggleEditMode
//30toggleEditMode

//31obfuscatePass
//32updateHintPlaceholder
//33
//34
//35
//36
//37
//38
//39
//40

// 1. Local Storage Logic (ဒေတာမြဲစေရန် အဓိကအပိုင်း)
function saveToLocal() {
    try {
        localStorage.setItem('AAA_Notes_Backup', JSON.stringify(notesData));
        console.log("Saved to device memory.");
    } catch (e) {
        console.error("Local save failed", e);
    }
}


// 2. Unlock App & Load Data 
async function unlockApp() {
    masterKey = document.getElementById('master-pass').value;
    try {
        // --- ၁။ Vault ကို အရင်ဖြည်မယ် ---
        const vaultBytes = CryptoJS.AES.decrypt(ENCRYPTED_VAULT, masterKey);
        const vaultData = vaultBytes.toString(CryptoJS.enc.Utf8);
        activeKeys = JSON.parse(vaultData); // အောင်မြင်ရင် activeKeys.MyNote ကို ရပြီ

        // --- ၂။ GitHub Token ကို ဖြည်မယ် ---
        const bytes = CryptoJS.AES.decrypt(ENCRYPTED_TOKEN, masterKey);
        realToken = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!realToken.startsWith('ghp_')) throw new Error();

        // ၃။ Cloud ကဒေတာကို ဆွဲယူမယ် (ဒီမှာ activeKeys.MyNote ကို သုံးပြီး ဖြည်ပါလိမ့်မယ်)
        await fetchCloudData(); 

        // ၄။ App Screen ကို ဖွင့်မယ်
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        
        renderApp();
    } catch (e) { 
        alert("Wrong Password!"); 
    }
}


// 3. Fetch Data from Cloud
async function fetchCloudData() {
    try {
        // URL အဆုံးမှာ timestamp ထည့်ပြီး cache ကိုကျော်မယ်
const res = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${FILE}?t=${Date.now()}`, {
    headers: { 'Authorization': `token ${realToken}` }
});

        if (res.ok) {
            const data = await res.json();
            fileSHA = data.sha;
            const content = decodeURIComponent(escape(atob(data.content)));
            const remoteData = JSON.parse(content);

            // ဒီနေရာမှာ အစားမထိုးတော့ဘဲ processSync ကို ပို့လိုက်မယ်
            if (remoteData && Array.isArray(remoteData)) {
                await processSync(remoteData); 
                alert("✅ Sync ပြီးပါပြီ။");
            }
        }
    } catch (e) {
        console.error("Sync Error:", e);
    }
}


// 4/a. Render App UI
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

// 5 data စီနည်း.....
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

// 6 Save & Edit Logic
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
        updatedAt: Date.now() // Sync လုပ်ဖို့အတွက် အချိန်မှတ်တမ်း တိုးလိုက်တာပါ
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

// 7 စာ တည်းဖြတ် ...
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
    // ----------------------------------------------

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


// 8 Trash & Restore Logic
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


// 9 ‌‌back ဆုတ် 
function restoreNote() {
    const idx = notesData.findIndex(x => x.id.toString() === editId.toString());
    if(idx !== -1) {
        notesData[idx].status = "active";
        saveToLocal();
        renderApp();
        hideEditor();
    }
}
// 10 
async function pushToGitHub(fileName, contentObject, commitMsg) {
    const getRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${fileName}`, {
        headers: { 'Authorization': `token ${realToken}` }
    });
    
    let currentSHA = "";
    if (getRes.ok) {
        const fileData = await getRes.json();
        currentSHA = fileData.sha;
    }

    // --- ဒီအပိုင်းကို ပြင်လိုက်ပါ ---
    // ၁။ ဒေတာကို JSON စာသားပြောင်းတယ်
    const jsonStr = JSON.stringify(contentObject);
    const encryptedStr = CryptoJS.AES.encrypt(jsonStr, activeKeys.MyNote).toString();
    // ၃။ ဖျက်ပြီးသား စာသားကိုမှ Base64 ပြောင်းမယ်
    const base64Content = btoa(unescape(encodeURIComponent(encryptedStr)));
    // --------------------------

    const putRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${fileName}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${realToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg, content: base64Content, sha: currentSHA || undefined })
    });

    if (!putRes.ok) throw new Error(`${fileName} ပို့လို့မရပါ`);
    return await putRes.json();
}


// 11 Sync Logic
// 11 Sync Logic အားလုံးကို စုစည်းထားသော တစ်ခုတည်းသော Function
// အရှင်းဆုံး Sync Logic (ဘာသော့မှ မပါ၊ ဒေတာကို ဒီအတိုင်း သိမ်းမည်)
// ၁၁။ Sync Logic (Local အခြေပြု Cloud အား အစားထိုးခြင်း)
async function syncCloud() {
    try {
        const statusMsg = document.getElementById('search-input');
        if (statusMsg) statusMsg.placeholder = "Syncing (Local to Cloud)...";

        // ၁။ Cloud ပေါ်က ဖိုင်ရဲ့ လက်ရှိ SHA ကို အရင်ယူရပါမယ် (Update လုပ်ဖို့ SHA လိုအပ်လို့ပါ)
        const getRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${FILE}`, {
            headers: { 'Authorization': `token ${realToken}` }
        });

        // ၂။ Local က NotesData ကိုပဲ Cloud ပေါ် တိုက်ရိုက်တင်လိုက်ပါမယ်
        // ဒီနည်းက Local မှာ အစ်ကိုဖျက်ထားရင် Cloud မှာပါ ပျောက်သွားမှာဖြစ်ပြီး၊ 
        // Local မှာ အသစ်တိုးရင် Cloud မှာလည်း အသစ်တိုးသွားမှာပါ
        await pushToGitHub(FILE, notesData, "Sync from Device (Mirror Update)");
        
        // Local မှာလည်း အမြဲ သိမ်းထားမယ်
        saveToLocal();
        renderApp();
        
        if (statusMsg) statusMsg.placeholder = "ရှာဖွေရန်...";
        alert("✅ Sync အောင်မြင်ပါတယ်။ Cloud ထဲကဒေတာတွေ Local အတိုင်း ဖြစ်သွားပါပြီ။");

    } catch (e) {
        console.error("Sync Error:", e);
        alert("❌ Sync လုပ်လို့မရပါ။ အင်တာနက် သို့မဟုတ် GitHub Settings ကို စစ်ဆေးပါ။");
    }
}


// 12 Pass UI ထဲက 'Sync စတင်မည်' ကို နှိပ်ရင် အလုပ်လုပ်မည့် Function
// processSync ထဲမှာ ဒါကို ပြင်ပါ


//13 Utility Functions
function toggleGroup(el) {
    const parent = el.parentElement;
    const isActive = parent.classList.contains('active');
    document.querySelectorAll('.group-item').forEach(i => i.classList.remove('active'));
    if (!isActive) parent.classList.add('active');
}
//14
function execCmd(cmd, val = null) { document.execCommand(cmd, false, val); saveToHistory(); }

function handleSearch() { const val = document.getElementById('search-input').value; renderApp(val); if (val.length > 0) document.querySelectorAll('.group-item').forEach(i => i.classList.add('active')); }

// 15 
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
document.getElementById('edit-mode-btn').innerText = "📄";
    
}
//16
function hideEditor() { 
    document.getElementById('editor-container').style.display = 'none'; }
//17
function resetEditorFields() { 
    document.getElementById('group-input').value = ""; document.getElementById('title-input').value = ""; document.getElementById('rich-editor').innerHTML = ""; }
//18
function updateSuggestions(names) { 
    document.getElementById('group-suggestions').innerHTML = names.map(n => `<option value="${n}">`).join(''); }
//19
function toggleFavorite() { 
    currentIsFavorite = !currentIsFavorite; document.getElementById('fav-btn').innerText = currentIsFavorite ? "💖" : "🤍"; }

//20
function toggleMenu(e) { if(e) e.stopPropagation(); const m = document.getElementById('dropdown-menu'); m.style.display = (m.style.display === 'block') ? 'none' : 'block'; }

//21
function clearSearch() { 
    document.getElementById('search-input').value = ""; renderApp(); }
//22
function showTrash() { 
    currentMode = "trash"; document.getElementById('main-action-btn').innerText = "🔙"; document.getElementById('main-action-btn').onclick = showActive; document.getElementById('menu-trash-btn').innerText = "🏠 Main Page"; document.getElementById('menu-trash-btn').onclick = showActive; renderApp(); }

//23
function showActive() { 
    currentMode = "active"; document.getElementById('main-action-btn').innerText = "➕"; document.getElementById('main-action-btn').onclick = showEditor; document.getElementById('menu-trash-btn').innerText = "🗑️ Recycle Bin"; document.getElementById('menu-trash-btn').onclick = showTrash; renderApp(); }

// Undo/Redo & History
document.getElementById('rich-editor').oninput = function() { clearTimeout(typingTimer); typingTimer = setTimeout(() => saveToHistory(), 500); };

//24
function saveToHistory() { 
    const c = document.getElementById('rich-editor').innerHTML; if (historyStack.length === 0 || historyStack[historyStack.length - 1] !== c) { historyStack.push(c); if (historyStack.length > 50) historyStack.shift(); redoStack = []; } }

//25
function undoCustom() { 
    if (historyStack.length > 1) { redoStack.push(historyStack.pop()); document.getElementById('rich-editor').innerHTML = historyStack[historyStack.length - 1]; } }

//26
function redoCustom() { 
    if (redoStack.length > 0) { const n = redoStack.pop(); historyStack.push(n); document.getElementById('rich-editor').innerHTML = n; } }

document.addEventListener('click', (e) => { const m = document.getElementById('dropdown-menu'); if (!e.target.closest('.menu-dropdown') && m.style.display === 'block') m.style.display = 'none'; });

//27 sub menu
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
// Menu အပြင်ဘက်ကို နှိပ်ရင် Menu ပြန်ပိတ်သွားအောင် လုပ်တဲ့အပိုင်း
document.addEventListener('click', (e) => {
    const m = document.getElementById('dropdown-menu');
    if (!m) return;
    
    // Menu အပြင်ဘက်ကို နှိပ်မှသာ ပိတ်မယ်
    // select box ကို နှိပ်တာဆိုရင် မပိတ်ဘူး
    if (!e.target.closest('.menu-dropdown') && m.style.display === 'block') {
        m.style.display = 'none';
    }
});

//28 sort ‌‌ေရွး ...
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

//29 View - Edit Mode icon ပြောင်းတဲ့ function
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('edit-mode-btn');
    
    if (isEditMode) {
        // Edit လုပ်နေတဲ့အချိန်မှာ "စာရွက်" ပုံပြမယ်
        editBtn.innerText = "📄";
        console.log("Edit Mode ON");
    } else {
        // View Mode မှာ "ခဲတံ" ပုံပြမယ်
        editBtn.innerText = "📝";
        console.log("Edit Mode OFF");
    }
}

//30 View - Edit Mode ပြောင်းတဲ့ function
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

//31 ၁။ စာသားညှပ်ပြီး ဝှက်မယ့် စက်ယန္တရား (အစ်ကို့ Logic အတိုင်း)
// Cloud က ဒေတာတွေကို Local ထဲ အကုန်ပြန်ဆွဲထည့်မည့် Function
async function fetchFromCloud() {
    if (!confirm("Cloud ပေါ်က ဒေတာတွေကို ဖုန်းထဲ ပြန်ယူမလား?")) return;

    try {
        const res = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${FILE}`, {
            headers: { 'Authorization': `token ${realToken}` }
        });

        if (res.ok) {
            const data = await res.json();
            const content = decodeURIComponent(escape(atob(data.content)));

            // --- ဒီအပိုင်းကို ပြင်လိုက်ပါ ---
            // Cloud ကစာသားကို MyNote သော့ (602020) နဲ့ အရင်ဖြည်မယ်
            const bytes = CryptoJS.AES.decrypt(content, activeKeys.MyNote);
            const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
            const remoteData = JSON.parse(decryptedStr); 
            // --------------------------

            if (remoteData && remoteData.length > 0) {
                notesData = remoteData;
                saveToLocal();
                renderApp();
                alert("✅ ဒေတာတွေ ပြန်ရောက်ပါပြီ။");
            } else {
                alert("⚠️ ဒေတာ မရှိသေးပါ။");
            }
        } else {
            alert("❌ ချိတ်ဆက်လို့မရပါ။");
        }
    } catch (e) {
        alert("❌ Error: " + e.message);
    }
    toggleMenu();
}


//32 processSync
async function processSync(remoteData) {
    let localModified = false;

    remoteData.forEach(remoteNote => {
        const localIdx = notesData.findIndex(n => n.id.toString() === remoteNote.id.toString());

        if (localIdx === -1) {
            // Cloud မှာပဲရှိတဲ့ Note အသစ်ဆိုရင် Local ထဲထည့်
            notesData.push(remoteNote);
            localModified = true;
        } else {
            // နှစ်ဖက်လုံးရှိရင် updatedAt နဲ့ တိုက်စစ်
            const remoteTime = remoteNote.updatedAt || 0;
            const localTime = notesData[localIdx].updatedAt || 0;

            if (remoteTime > localTime) {
                notesData[localIdx] = remoteNote;
                localModified = true;
            }
        }
    });

    if (localModified) {
        saveToLocal();
        renderApp();
    }
    
    // Local က ပိုသစ်တာတွေပါ Cloud ပေါ်ရောက်သွားအောင် ပြန်တင်မယ်
    await pushToGitHub();
}
// 33 
function openVaultManager() {
    document.getElementById('vaultModal').style.display = 'block';
}
// 34 
function closeVaultManager() {
    document.getElementById('vaultModal').style.display = 'none';
}
// 35 
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
// 36 
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
// 37 
function copyVaultCode() {
    const res = document.getElementById('mResult');
    res.select();
    navigator.clipboard.writeText(res.value);
    alert("Copied!");
}

//38 Toolbar အုပ်စုများကို ဖုန်းမှာ ပွင့်/ပိတ် လုပ်ပေးမည့် Function
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

// 1: saveToLocal
// 2: unlockApp
// 3:fetchCloudData
// 4: renderApp
// 5:renderGroupUI
// 6:saveNote
// 7:editNote
// 8:handleTrashAction
// 9:restoreNote
//10:pushToGitHub

//11:syncCloud
//12:processSync
//13:toggleGroup
//14:execCmd
//15:showEditor
//16:hideEditor
//17:resetEditorFields
//18:updateSuggestions
//19:toggleFavorite
//20:toggleMenu

//21clearSearch
//22showTrash
//23showActive
//24saveToHistory
//25undoCustom
//26redoCustom
//27toggleMenu
//28changeSort
//29toggleEditMode
//30toggleEditMode

//31 fetchFromCloud
//32 processSync

// keyထုတ် စ
//33 openVaultManager
//34 closeVaultManager
//35 addMRow
//36 doGenerateVault
//37 copyVaultCode
//keyထုတ်ဆ

//38 toggleMobileGroup
//39 
//40 
