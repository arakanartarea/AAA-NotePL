const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note",
  storageBucket: "arakanartarea-note.firebasestorage.app",
  messagingSenderId: "695659736666",
  appId: "1:695659736666:web:1e76494c0e6819609bf263"
};

let db=null, auth=null, editingDocId=null;
let isAdminUser=false, currentUser=null;
let allUsersData=[];

function formatAID(n){ if(n==null) return "-"; return `A-${String(n).padStart(7,'0')}`; }

function initFirebase(){
  if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  db=firebase.firestore(); auth=firebase.auth();

  auth.onAuthStateChanged(async (user)=>{
    currentUser=user;
    if(!user){ isAdminUser=false; updateAuthUI(); renderAccordion({}); return; }
    try{
      const email=user.email.toLowerCase();
      const adminDoc=await db.collection('admins').doc(email).get();
      isAdminUser=adminDoc.exists; // <-- admins coll ပဲ စစ်တာ Main
    }catch(e){ isAdminUser=false; }
    updateAuthUI();
    fetchUsers();
  });
}

function updateAuthUI(){
  const badge=document.getElementById('status-badge');
  const loginBtn=document.getElementById('btn-login');
  if(badge){
    if(isAdminUser && currentUser){
      badge.textContent=`Admin: ${currentUser.displayName||currentUser.email.split('@')[0]}`;
      badge.style.background='#16a34a'; badge.style.color='#fff';
    }else{
      badge.textContent=currentUser?`Viewer: ${currentUser.email.split('@')[0]}`:'Viewer - Admin Only';
      badge.style.background='#eab308'; badge.style.color='#000';
    }
  }
  if(loginBtn){
    const icon=loginBtn.querySelector('.material-symbols-rounded');
    if(icon) icon.textContent=currentUser?'logout':'login';
  }
  document.querySelectorAll('.item-actions').forEach(el=>{
    el.style.display=isAdminUser?'flex':'none';
  });
}

function handleAuthClick(){
  if(currentUser){
    document.getElementById('auth-modal-email').textContent=currentUser.email;
    document.getElementById('auth-modal').classList.remove('hidden');
  }else{
    const p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:'select_account'});
    auth.signInWithPopup(p);
  }
}
function closeAuthModal(){ document.getElementById('auth-modal')?.classList.add('hidden'); }
function doLogout(){ closeAuthModal(); auth.signOut(); }
function doSwitch(){ closeAuthModal(); auth.signOut().then(()=>setTimeout(()=>{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});auth.signInWithPopup(p);},400)); }

(function setupAuthOnce(){
  document.getElementById('btn-auth-cancel')?.addEventListener('click', closeAuthModal);
  document.getElementById('btn-auth-logout')?.addEventListener('click', doLogout);
  document.getElementById('btn-auth-switch')?.addEventListener('click', doSwitch);
  document.getElementById('auth-modal')?.addEventListener('click', e=>{ if(e.target.id==='auth-modal') closeAuthModal(); });
})();

function switchView(id){
  document.querySelectorAll('.view-section').forEach(el=>el.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.getElementById('main-header').style.display = id==='list-view'?'flex':'none';
  document.getElementById('list-fab-container').style.display = id==='list-view'?'flex':'none';
}

function fetchUsers(){
  if(!isAdminUser){
    document.getElementById('accordion-container').innerHTML='<p style="color:var(--muted);text-align:center;margin-top:40px">Admin မဟုတ်ပါ - users မပြပါ<br>Admin email နဲ့ login ဝင်ပါ</p>';
    return;
  }
  db.collection('users').orderBy('AID').onSnapshot(snap=>{
    allUsersData=[]; snap.forEach(d=>{ let data=d.data(); data._uid=d.id; allUsersData.push(data); });
    filterUsers();
  });
}

function filterUsers(){
  const q=(document.getElementById('search-input')?.value||'').toLowerCase().trim();
  const filtered=allUsersData.filter(u=>{
    if(!q) return true;
    return (u.displayName||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || formatAID(u.AID).toLowerCase().includes(q);
  });
  const grouped={};
  filtered.forEach(u=>{
    const roleKey = (u.role||'viewer')==='admin'? '👑 Admin' : '👤 Users';
    if(!grouped[roleKey]) grouped[roleKey]=[];
    grouped[roleKey].push(u);
  });
  renderAccordion(grouped);
}

function renderAccordion(grouped){
  const c=document.getElementById('accordion-container'); c.innerHTML='';
  if(!isAdminUser) return;
  if(Object.keys(grouped).length===0){ c.innerHTML='<p style="color:var(--muted)">users မရှိသေးပါ</p>'; return; }
  for(const [gName, users] of Object.entries(grouped)){
    const acc=document.createElement('div'); acc.className='accordion';
    const header=document.createElement('div'); header.className='accordion-header';
    header.innerHTML=`<span>🎤 ${gName} (${users.length})</span><span>▼</span>`;
    header.onclick=()=>acc.classList.toggle('open');
    const content=document.createElement('div'); content.className='accordion-content';
    content.innerHTML=users.map(u=>{
      const avatar = u.photoURL? `<img src="${u.photoURL}" referrerpolicy="no-referrer" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName||'A')}'" class="user-avatar">` : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName||'A')}" class="user-avatar">`;
      return `<div class="song-item">
        <div style="display:flex;gap:10px;align-items:center">
          ${avatar}
          <span class="song-title-click">${u.displayName||'No Name'}<span class="aid-badge">${formatAID(u.AID)}</span><span class="role-badge ${u.role==='admin'?'admin':''}">${u.role||'viewer'}</span><br><small style="color:var(--muted)">${u.email||''} | Login: ${u.loginCount||1}</small></span>
        </div>
        <div class="item-actions" style="display:${isAdminUser?'flex':'none'}">
          <button class="icon-btn" onclick="editUser('${u._uid}')">📝</button>
          <button class="icon-btn" onclick="deleteUser('${u._uid}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
    acc.appendChild(header); acc.appendChild(content); c.appendChild(acc);
  }
}

function editUser(uid){
  if(!isAdminUser) return;
  db.collection('users').doc(uid).get().then(doc=>{
    if(!doc.exists) return;
    const u=doc.data(); editingDocId=uid;
    document.getElementById('form-title').textContent=`${formatAID(u.AID)} ပြင်ရန်`;
    document.getElementById('inp-aid').value=formatAID(u.AID);
    document.getElementById('inp-uid').value=uid;
    document.getElementById('inp-name').value=u.displayName||'';
    document.getElementById('inp-email').value=u.email||'';
    document.getElementById('inp-role').value=u.role||'viewer';
    document.getElementById('inp-count').value=u.loginCount||1;
    document.getElementById('inp-device').value=u.device||'';
    switchView('input-view');
  });
}
function saveUser(){
  if(!isAdminUser ||!editingDocId) return;
  const payload={ displayName: document.getElementById('inp-name').value.trim(), role: document.getElementById('inp-role').value };
  db.collection('users').doc(editingDocId).update(payload).then(()=>switchView('list-view')).catch(e=>alert(e.message));
}
function deleteUser(uid){
  if(!isAdminUser) return;
  if(confirm('ဖျက်မလား '+uid+'?')) db.collection('users').doc(uid).delete();
}
function toggleListFabMenu(){ const m=document.getElementById('list-fab-menu'); m.style.display=m.style.display==='flex'?'none':'flex'; }
function toggleTheme(){ let d=document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', d?'dark':'light'); }
if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark-mode');

window.onload=()=>{ initFirebase(); switchView('list-view'); };