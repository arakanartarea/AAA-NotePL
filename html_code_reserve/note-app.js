// 1900

// REPLACE WITH YOUR EXISTING CONFIG
const firebaseConfig = { apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U", authDomain: "arakanartarea-note.firebaseapp.com", projectId: "arakanartarea-note" };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


let allWords = [];
let currentView = { group:null, subGroup:null };
let isFavMode = false;
let isTrashMode = false;
let sortMode = localStorage.getItem('sortMode') || 'new';
let nightMode = localStorage.getItem('nightMode') === '1';
let searchText = '';
let searchTimer = null;
let currentEditId = null;
let undoStack = [], redoStack = [];
let expandedGroup = null; // ဘယ် Group ပွင့်နေလဲမှတ်တာ

if(nightMode) document.body.classList.add('night');
document.getElementById('sortLabel').innerText = sortMode;

function getPersistence(){
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('keep') === 'no'? firebase.auth.Auth.Persistence.SESSION : firebase.auth.Auth.Persistence.LOCAL;
}
auth.setPersistence(getPersistence());
auth.onAuthStateChanged(async (user)=>{
  const bigLogin = document.getElementById('bigLoginScreen');
  const app = document.getElementById('app');
  if(!user){ bigLogin.classList.remove('hidden'); app.classList.add('hidden'); return; }
  const email = user.email.toLowerCase();
  const adminDoc = await db.collection('admins').doc(email).get();
  if(!adminDoc.exists){ document.getElementById('bigLoginMsg').innerText = 'No permission: '+email; auth.signOut(); return; }
  document.getElementById('userEmailText').innerText = email;
  bigLogin.classList.add('hidden'); app.classList.remove('hidden');
  startSnapshot();
});

//login
function doLogin(){
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  auth.signInWithPopup(provider);
}
document.getElementById('bigLoginBtn').onclick = doLogin;

function startSnapshot(){
  db.collection('AAAnotes').onSnapshot(snap=>{
    allWords = [];
    snap.forEach(d=>{ allWords.push({id:d.id,...d.data()}); });
    showWords();
    const trashCount = allWords.filter(n=>n.role===2).length;
    document.getElementById('trashCount').innerText = trashCount? '('+trashCount+')' : '';
  });
}

function showWords(){
  if(isTrashMode) { showTrash(); return; }
  const mainDiv = document.getElementById('mainList');
  const viewDiv = document.getElementById('viewList');
  if(currentView.group){
    mainDiv.classList.add('hidden'); viewDiv.classList.remove('hidden');
    document.getElementById('toolbarMain').classList.add('hidden');
    document.getElementById('toolbarView').classList.remove('hidden');
    showViewList(); return;
  }
  mainDiv.classList.remove('hidden'); viewDiv.classList.add('hidden');
  document.getElementById('toolbarMain').classList.remove('hidden');
  document.getElementById('toolbarView').classList.add('hidden');

  let filtered = allWords.filter(n=>n.role!==2);
  if(isFavMode) filtered = filtered.filter(n=>n.fav);
  if(searchText) filtered = filtered.filter(n=> (n.group+n.subGroup+n.content).toLowerCase().includes(searchText.toLowerCase()));
  if(sortMode==='new') filtered.sort((a,b)=> (b.updateTime||'').localeCompare(a.updateTime||''));
  if(sortMode==='old') filtered.sort((a,b)=> (a.updateTime||'').localeCompare(b.updateTime||''));
  if(sortMode==='a-z') filtered.sort((a,b)=> a.content.localeCompare(b.content,'my',{numeric:true}));
  if(sortMode==='z-a') filtered.sort((a,b)=> b.content.localeCompare(a.content,'my',{numeric:true}));

      const groups = {};
  filtered.forEach(n => {
    if (!groups[n.group]) groups[n.group] = {};
    if (!groups[n.group][n.subGroup]) groups[n.group][n.subGroup] = [];
    groups[n.group][n.subGroup].push(n);
  });
  let groupKeys = Object.keys(groups);
  if (sortMode === 'a-z') groupKeys.sort((a, b) => a.localeCompare(b, 'my', { numeric: true }));
  if (sortMode === 'z-a') groupKeys.sort((a, b) => b.localeCompare(a, 'my', { numeric: true }));
  // new/old က group ကို မစီဘူး, content အထဲမှာပဲ စီမယ်
  let html = '';
  groupKeys.forEach(g => {
    
    const subCount = Object.keys(groups[g]).length;
    const isOpen = expandedGroup === g;
    html += `<div class="group-item" onclick="toggleGroup('${esc(g)}')"><span>${isOpen?'📂':'📁'} ${escHtml(g)}</span><span class="count-badge">${subCount}</span></div>`;
    if (isOpen) {
      Object.keys(groups[g]).sort().forEach(sg => {
        const cnt = groups[g][sg].length;
        html += `<div class="subgroup-item" onclick="openSub('${esc(g)}','${esc(sg)}')"><span>📂 ${escHtml(sg)}</span><span class="count-badge">${cnt}</span></div>`;
      });
    }
  });
  if(!html) html='<p style="text-align:center; padding:20px;">ဘာမှမရှိသေးပါ</p>';
  mainDiv.innerHTML=html;
}
//content view
function showViewList(){
  const viewDiv = document.getElementById('viewList');
  let filtered = allWords.filter(n=>n.role!==2 && n.group===currentView.group && n.subGroup===currentView.subGroup);
  if(isFavMode) filtered = filtered.filter(n=>n.fav);
  if(searchText) filtered = filtered.filter(n=> n.content.toLowerCase().includes(searchText.toLowerCase()));
    if (sortMode === 'new') filtered.sort((a, b) => (b.updateTime || '').localeCompare(a.updateTime || ''));
  if (sortMode === 'old') filtered.sort((a, b) => (a.updateTime || '').localeCompare(b.updateTime || ''));
  if (sortMode === 'a-z') filtered.sort((a, b) => a.content.localeCompare(b.content, 'my', { numeric: true }));
  if (sortMode === 'z-a') filtered.sort((a, b) => b.content.localeCompare(a.content, 'my', { numeric: true }));
  
  let html = `<div style="padding:8px; font-weight:bold;">${escHtml(currentView.group)} / ${escHtml(currentView.subGroup)} (${filtered.length})</div>`;
  filtered.forEach(n=>{
    html+=`<div class="note-card"><p>${escHtml(n.content)}</p><div class="card-actions"><button class="tool-btn" onclick="toggleFav('${n.id}',${n.fav})">${n.fav?'⭐':'☆'}</button><button class="tool-btn" onclick="copyText('${n.id}')">📋</button><button class="tool-btn" onclick="editNote('${n.id}')">✏️</button><button class="tool-btn" onclick="askDelete('${n.id}')">🗑️</button></div></div>`;
  });
  if(filtered.length===0) html+='<p style="text-align:center;">ဘာမှမရှိပါ</p>';
  viewDiv.innerHTML=html;
}
//Trash View
function showTrash(){
  const mainDiv = document.getElementById('mainList');
  const trashDiv = document.getElementById('trashList');
  const viewDiv = document.getElementById('viewList');
  mainDiv.classList.add('hidden'); viewDiv.classList.add('hidden'); trashDiv.classList.remove('hidden');
  let filtered = allWords.filter(n=>n.role===2);
  let html = `<div style="padding:8px; font-weight:bold;">🗑️ အမှိုက်ပုံး (${filtered.length}) <button onclick="goBackMain()">Back</button></div>`;
  filtered.forEach(n=>{
    html+=`<div class="note-card"><p>${escHtml(n.content)}</p><div class="card-actions"><button class="tool-btn" onclick="copyText('${n.id}')">📋</button><button class="tool-btn" onclick="editNote('${n.id}')">✏️</button><button class="tool-btn" onclick="toggleFav('${n.id}',${n.fav})">${n.fav?'⭐':'☆'}</button><button class="tool-btn" onclick="restoreNote('${n.id}')">♻️</button></div></div>`;
  });
  trashDiv.innerHTML=html;
}

function toggleGroup(g){
  if(expandedGroup === g) expandedGroup = null;
  else expandedGroup = g;
  showWords();
}

function openGroup(g){ toggleGroup(g); }

function openSub(g,sg){ currentView.group=g; currentView.subGroup=sg; showWords(); }

function goBackMain() {
  if (isTrashMode) {
    isTrashMode = false;
    document.getElementById('trashList').classList.add('hidden');
    document.getElementById('mainList').classList.remove('hidden');
    document.getElementById('toolbarMain').classList.remove('hidden');
    document.getElementById('toolbarView').classList.add('hidden');
  }
  currentView.group = null;
  currentView.subGroup = null;
  isFavMode = false;
  showWords();
}

function toggleFavMode(){
  isFavMode = !isFavMode;
  isTrashMode = false;
  currentView.group=null; currentView.subGroup=null;
  const icon = document.getElementById('favIcon');
  const label = document.getElementById('favLabel');
  if(isFavMode){ icon.innerText='🏠'; label.innerText='Home'; }
  else { icon.innerText='⭐'; label.innerText='Fav'; }
  showWords();
}

function cycleSort(){ openSort(); }

function openSort(){ 
document.getElementById('sortModal').classList.remove('hidden'); }

function closeSort(){ 
document.getElementById('sortModal').classList.add('hidden'); }

function setSortMode(mode){
  sortMode=mode; localStorage.setItem('sortMode',sortMode);
  document.getElementById('sortLabel').innerText=mode;
  document.querySelectorAll('[id^="sort-"]').forEach(b=> b.style.background='var(--bg)');
  const active = document.getElementById('sort-'+mode);
  if(active) active.style.background='var(--card)';
  closeSort(); showWords();
}

function toggleSearch(){ 
  const bar=document.getElementById('searchBar'); bar.classList.toggle('hidden'); if(!bar.classList.contains('hidden')){ 
document.getElementById('searchInput').focus(); } else { searchText=''; 
document.getElementById('searchInput').value=''; showWords(); } }
document.getElementById('searchInput').addEventListener('input', (e)=>{ clearTimeout(searchTimer); searchTimer=setTimeout(()=>{ searchText=e.target.value; showWords(); },300); });
/*
function toggleNight(){ 
document.body.classList.toggle('night'); localStorage.setItem('nightMode', 
document.body.classList.contains('night')?'1':'0'); showToast(
document.body.classList.contains('night')?'Night':'Day'); }
document.getElementById('nightIcon').innerText = document.body.classList.contains('night') ? '☀️' : '🌙';
document.getElementById('nightLabel').innerText = document.body.classList.contains('night') ? 'Day' : 'Night';
*/
// --- Theme Logic ---
let themeMode = localStorage.getItem('themeMode') || 'auto';

function applyTheme(){
  let finalTheme = themeMode;
  if(themeMode === 'auto'){
    finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', finalTheme);
  
  // DropUp ခလုတ်မှာ လက်ရှိမုဒ်ပြမယ်
  const iconEl = document.getElementById('currentThemeIcon');
  const labelEl = document.getElementById('currentThemeLabel');
  if(iconEl && labelEl){
    if(themeMode === 'light'){ iconEl.textContent='☀️'; labelEl.textContent='Day'; }
    else if(themeMode === 'dark'){ iconEl.textContent='🌙'; labelEl.textContent='Night'; }
    else { iconEl.textContent='🔄'; labelEl.textContent='Auto'; }
  }
  // Menu ထဲမှာ active ပြမယ်
  document.querySelectorAll('.dropup-item[data-mode]').forEach(b=>{
    b.classList.toggle('active', b.dataset.mode === themeMode);
  });
}

function toggleThemeDropup(){
  document.getElementById('themeDropupWrapper').classList.toggle('open');
  document.getElementById('themeDropupMenu').classList.toggle('hidden');
}
function closeThemeDropup(){
  document.getElementById('themeDropupWrapper').classList.remove('open');
  document.getElementById('themeDropupMenu').classList.add('hidden');
}
function selectThemeMode(mode){
  themeMode = mode;
  localStorage.setItem('themeMode', mode);
  applyTheme();
  // မင်းပြောတဲ့အတိုင်း ၂ခုလုံးပိတ်
  closeThemeDropup();
  closeSettings();
}

// အပြင်နှိပ်ရင် ပိတ်
document.addEventListener('click', (e)=>{
  const wrapper = document.getElementById('themeDropupWrapper');
  if(wrapper && !wrapper.contains(e.target)){
    closeThemeDropup();
  }
});
// System theme ပြောင်းရင် Auto က လိုက်ပြောင်း
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
  if(themeMode === 'auto') applyTheme();
});

// စဖွင့်ချင်း run
applyTheme();

function openSettings(){ document.getElementById('settingsModal').classList.remove('hidden'); }
function closeSettings(){ document.getElementById('settingsModal').classList.add('hidden'); }
function openMore(){ document.getElementById('moreModal').classList.remove('hidden'); }
function closeMore(){ document.getElementById('moreModal').classList.add('hidden'); }

function openTrash(){
  closeSettings();
  isTrashMode = !isTrashMode;
  isFavMode = false;
  document.getElementById('favIcon').innerText='⭐';
  document.getElementById('favLabel').innerText='Fav';
  const tIcon = document.getElementById('trashIcon');
  const tLabel = document.getElementById('trashLabel');
  if(isTrashMode){ tIcon.innerText='🏠'; tLabel.innerText='ပင်မ'; }
  else { tIcon.innerText='🗑️'; tLabel.innerText='အမှိုက်ပုံး'; }
  showWords();
}

function newNote(){ currentEditId=null; 
document.getElementById('editGroup').value=currentView.group||''; 
document.getElementById('editSubGroup').value=currentView.subGroup||''; 
document.getElementById('editContent').value=''; showEdit(); }

function newNoteInCurrent(){ currentEditId=null; 
document.getElementById('editGroup').value=currentView.group||''; 
document.getElementById('editSubGroup').value=currentView.subGroup||''; 
document.getElementById('editContent').value=''; showEdit(); }

function showEdit(){ 
document.getElementById('contentArea').querySelectorAll('#mainList,#viewList,#trashList').forEach(el=>el.classList.add('hidden')); 
document.getElementById('editScreen').classList.remove('hidden'); 
document.getElementById('toolbarMain').classList.add('hidden'); document.getElementById('toolbarView').classList.add('hidden'); 
document.getElementById('toolbarEdit').classList.remove('hidden'); }

function cancelEdit(){ 
document.getElementById('editScreen').classList.add('hidden'); 
document.getElementById('toolbarEdit').classList.add('hidden'); if(isTrashMode){ 
document.getElementById('trashList').classList.remove('hidden'); } else if(currentView.group){
document.getElementById('viewList').classList.remove('hidden'); 
document.getElementById('toolbarView').classList.remove('hidden'); } else { 
document.getElementById('mainList').classList.remove('hidden'); 
document.getElementById('toolbarMain').classList.remove('hidden'); } }

async function saveNote(){ const g=
document.getElementById('editGroup').value.trim(); const sg=
document.getElementById('editSubGroup').value.trim(); const c=
document.getElementById('editContent').value.trim(); if(!g||!sg||!c){ showToast('အကုန်ဖြည့်ပါ'); return; } const data={group:g, subGroup:sg, content:c, updateTime:new Date().toISOString(), role:1}; if(currentEditId){ await db.collection('AAAnotes').doc(currentEditId).update(data); showToast('ပြင်ပြီး'); } else { data.fav=false; await db.collection('AAAnotes').add(data); showToast('သိမ်းပြီး'); } cancelEdit(); }

function editNote(id){ const n=allWords.find(x=>x.id===id); if(!n) return; currentEditId=id;
document.getElementById('editGroup').value=n.group; 
document.getElementById('editSubGroup').value=n.subGroup; 
document.getElementById('editContent').value=n.content; undoStack=[n.content]; redoStack=[]; showEdit(); }

function toggleFav(id,cur){ db.collection('AAAnotes').doc(id).update({fav:!cur}); showToast(!cur?'Fav ထည့်ပြီး':'Fav ဖြုတ်ပြီး'); }

function copyText(id){ const n=allWords.find(x=>x.id===id); if(!n) return; navigator.clipboard.writeText(n.content); showToast('ကူးပြီးပြီ'); }

function askDelete(id){ showConfirm('အမှိုက်ပုံးထဲ ပို့မှာလား?', ()=>{ db.collection('AAAnotes').doc(id).update({role:2, updateTime:new Date().toISOString()}); showToast('အမှိုက်ပုံးထဲ ပို့ပြီး'); closeConfirm(); }); }

function restoreNote(id){ db.collection('AAAnotes').doc(id).update({role:1, updateTime:new Date().toISOString()}); showToast('ပြန်ဆယ်ပြီး'); }
function showToast(msg){ const t=document.getElementById('toast'); t.innerText=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),2000); }
function showConfirm(msg, yesFn){ document.getElementById('confirmText').innerText=msg; document.getElementById('confirmModal').classList.remove('hidden'); document.getElementById('confirmYes').onclick=yesFn; }
function closeConfirm(){ document.getElementById('confirmModal').classList.add('hidden'); }
function esc(s){ return s.replace(/'/g,"\\'"); }
function escHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function insertAtCursor(t){ const el=document.getElementById('editContent'); const start=el.selectionStart; const end=el.selectionEnd; el.value=el.value.substring(0,start)+t+el.value.substring(end); el.selectionStart=el.selectionEnd=start+t.length; el.focus(); }
function doUndo(){ const el=document.getElementById('editContent'); if(undoStack.length>0){ redoStack.push(el.value); el.value=undoStack.pop()||''; } }
function doRedo(){ const el=document.getElementById('editContent'); if(redoStack.length>0){ undoStack.push(el.value); el.value=redoStack.pop(); } }
document.getElementById('editContent').addEventListener('input', (e)=>{ undoStack.push(e.target.value); if(undoStack.length>50) undoStack.shift(); });
