const firebaseConfig = { 
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U", 
  authDomain: "arakanartarea-note.firebaseapp.com", 
  projectId: "arakanartarea-note" 
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let allNotes = [];
let isAdmin = false;
let editingDocId = null;
let currentViewNote = null;

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

auth.onAuthStateChanged(async (user)=>{
  const bigLogin = document.getElementById('bigLoginScreen');
  const app = document.getElementById('app');
  const msg = document.getElementById('bigLoginMsg');
  const badge = document.getElementById('status-badge');
  
  if(!user){
    bigLogin.classList.remove('hidden');
    app.classList.add('hidden');
    badge.innerText = 'Login';
    msg.innerText = '';
    return;
  }
  
  // user ရှိပြီ - admin ဟုတ်/မဟုတ် စစ်
  try{
    const email = user.email.toLowerCase();
    const adminDoc = await db.collection('admins').doc(email).get();
    
    if(!adminDoc.exists){
      msg.innerText = 'No permission: '+email+' - admins ထဲမှာ မရှိဘူး';
      console.log('Admin doc not found for', email);
      // 2 sec နေမှ signOut မယ် - မဟုတ်ရင် loop ဖြစ်တယ်
      setTimeout(()=> auth.signOut(), 2000);
      return;
    }
    
    // Admin မှန်ပြီ
    isAdmin = true;
    bigLogin.classList.add('hidden');
    app.classList.remove('hidden');
    badge.innerText = 'Admin: '+email;
    document.getElementById('user-email').innerText = email;
    msg.innerText = '';
    startSnapshot();
    
  }catch(e){
    console.error('Admin check error:', e);
    msg.innerText = 'Error: '+e.message+' (Firestore Rule စစ်ပါ)';
  }
});

function doLogin(){ 
  const p=new firebase.auth.GoogleAuthProvider(); 
  p.setCustomParameters({prompt:'select_account'}); 
  auth.signInWithPopup(p).catch(e=>{
    document.getElementById('bigLoginMsg').innerText = 'Login error: '+e.message;
    console.error(e);
  }); 
}
function doLogout(){ auth.signOut(); }

function startSnapshot(){
  db.collection('AAAnotes').onSnapshot(snap=>{
    allNotes = [];
    snap.forEach(d=> allNotes.push({id:d.id,...d.data()}));
    console.log('Notes loaded:', allNotes.length);
    renderAccordion();
  }, err=>{
    console.error('Snapshot error:', err);
    document.getElementById('accordion-container').innerHTML = `<p style="color:red;padding:20px;">Firestore Error: ${err.message}<br>Rule ကို auth != null ပေးထားလား စစ်ပါ</p>`;
  });
}

// ကျန်တဲ့ function တွေက အရင်အတိုင်းပဲ
function filterNotes(){ renderAccordion(); }
function renderAccordion(){
  const q = (document.getElementById('search-input').value||'').toLowerCase().trim();
  let filtered = allNotes.filter(n=> n.role!==2);
  if(q) filtered = filtered.filter(n=> (n.group+n.subGroup+n.content).toLowerCase().includes(q));
  const groups = {};
  filtered.forEach(n=>{ if(!groups[n.group]) groups[n.group]=[]; groups[n.group].push(n); });
  let html = '';
  Object.keys(groups).sort().forEach(g=>{
    const notes = groups[g];
    html += `<div class="accordion"><div class="accordion-header" onclick="this.parentElement.classList.toggle('open')"><span>📁 ${escHtml(g)} (${notes.length})</span><span>▼</span></div><div class="accordion-content">`;
    notes.forEach(n=>{
      html += `<div class="song-item" onclick="viewNote('${n.id}')"><span class="song-title-click">📝 ${escHtml(n.subGroup)}</span><div class="item-actions"><button class="icon-btn" onclick="event.stopPropagation();editNote('${n.id}')">📝</button><button class="icon-btn" onclick="event.stopPropagation();deleteNote('${n.id}')">🗑️</button></div></div>`;
    });
    html += `</div></div>`;
  });
  if(!html) html='<p style="text-align:center;padding:20px;">ဘာမှမရှိသေးပါ / Search မတွေ့ပါ</p>';
  document.getElementById('accordion-container').innerHTML = html;
  const load = document.getElementById('loading-overlay');
  if(load) load.style.display='none';
}
function viewNote(id){
  const n = allNotes.find(x=>x.id===id); if(!n) return;
  currentViewNote = n;
  document.getElementById('view-title').innerText = n.group;
  document.getElementById('view-writer').innerText = n.subGroup;
  document.getElementById('view-singer').innerText = n.updateTime ? new Date(n.updateTime).toLocaleString() : '';
  document.getElementById('dynamic-verses').innerHTML = `<div class="verse"><div class="section-label">NOTE</div><div class="verse-content"><pre class="resizable-text" style="white-space:pre-wrap;">${escHtml(n.content)}</pre></div></div>`;
  switchView('player-view');
}
function openCreateForm(){
  if(!isAdmin) return alert('Admin only');
  editingDocId = null;
  document.getElementById('inp-group').value = '';
  document.getElementById('inp-subgroup').value = '';
  document.getElementById('inp-content').value = '';
  switchView('input-view');
}
function editNote(id){
  const n = allNotes.find(x=>x.id===id); if(!n) return;
  editingDocId = id;
  document.getElementById('inp-group').value = n.group;
  document.getElementById('inp-subgroup').value = n.subGroup;
  document.getElementById('inp-content').value = n.content;
  switchView('input-view');
}
function editCurrentNote(){ if(currentViewNote) editNote(currentViewNote.id); }
async function saveNote(){
  const g=document.getElementById('inp-group').value.trim();
  const sg=document.getElementById('inp-subgroup').value.trim();
  const c=document.getElementById('inp-content').value.trim();
  if(!g||!sg||!c) return alert('အကုန်ဖြည့်ပါ');
  const data={group:g, subGroup:sg, content:c, updateTime:new Date().toISOString(), role:1};
  try{
    if(editingDocId) await db.collection('AAAnotes').doc(editingDocId).update(data);
    else { data.fav=false; await db.collection('AAAnotes').add(data); }
    switchView('list-view');
  }catch(e){ alert('Save error: '+e.message); }
}
async function deleteNote(id){ if(!confirm('ဖျက်မှာလား?')) return; await db.collection('AAAnotes').doc(id).delete(); }
function switchView(v){ document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active')); document.getElementById(v).classList.add('active'); }
function toggleListFab(){ document.getElementById('fab-menu').classList.toggle('show'); }
function togglePlayerFab(){ const m=document.getElementById('fab-menu-player'); if(m) m.classList.toggle('show'); }
function toggleAuthModal(){ document.getElementById('auth-modal').classList.toggle('hidden'); }
function openFontModal(){ document.getElementById('fontModal').classList.remove('hidden'); document.getElementById('fontOverlay').classList.remove('hidden'); }
function closeFontModal(){ document.getElementById('fontModal').classList.add('hidden'); document.getElementById('fontOverlay').classList.add('hidden'); }
function escHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }