const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note",
  storageBucket: "arakanartarea-note.firebasestorage.app",
  messagingSenderId: "695659736666",
  appId: "1:695659736666:web:1e76494c0e6819609bf263"
};
let db, auth, editingDocId=null, detailDocId=null, isAdmin=false, currentUser=null, allUsers=[];

function formatAID(n){return n==null?"-":`A-${String(n).padStart(7,'0')}`;}
function toDateStr(ts){
  if(!ts) return "";
  try{
    if(ts.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  }catch(e){return String(ts);}
}

function init(){
  if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  db=firebase.firestore(); auth=firebase.auth();
  auth.onAuthStateChanged(async u=>{
    currentUser=u;
    if(!u){isAdmin=false; updateUI(); render([]); return;}
    try{
      const doc=await db.collection('admins').doc(u.email.toLowerCase()).get();
      isAdmin=doc.exists;
    }catch(e){isAdmin=false;}
    updateUI();
    fetchUsers();
  });
}
function updateUI(){
  const b=document.getElementById('status-badge');
  if(b){
    b.textContent = isAdmin? `Admin: ${currentUser?.displayName||''}` : (currentUser? 'Viewer - No Access' : 'Viewer');
    b.style.background = isAdmin?'#16a34a':'#eab308'; b.style.color = isAdmin?'#fff':'#000';
  }
  const icon=document.querySelector('#btn-login .material-symbols-rounded');
  if(icon) icon.textContent=currentUser?'logout':'login';
}
function handleAuthClick(){
  if(currentUser){document.getElementById('auth-modal-email').textContent=currentUser.email;document.getElementById('auth-modal').classList.remove('hidden');}
  else{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});auth.signInWithPopup(p);}
}
function closeAuth(){document.getElementById('auth-modal')?.classList.add('hidden');}
document.getElementById('btn-auth-cancel')?.addEventListener('click',closeAuth);
document.getElementById('btn-auth-logout')?.addEventListener('click',()=>{closeAuth();auth.signOut();});
document.getElementById('btn-auth-switch')?.addEventListener('click',()=>{closeAuth();auth.signOut().then(()=>{setTimeout(()=>{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});auth.signInWithPopup(p);},300);});});
document.getElementById('auth-modal')?.addEventListener('click',e=>{if(e.target.id==='auth-modal') closeAuth();});

function switchView(id){
  document.querySelectorAll('.view-section').forEach(el=>el.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.getElementById('main-header').style.display = id==='list-view'?'flex':'none';
  document.getElementById('list-fab-container').style.display = id==='list-view'?'flex':'none';
}
function toggleListFabMenu(){const m=document.getElementById('list-fab-menu');m.style.display=m.style.display==='flex'?'none':'flex';}
function toggleTheme(){let d=document.body.classList.toggle('dark-mode');localStorage.setItem('theme',d?'dark':'light');}
if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark-mode');

function fetchUsers(){
  if(!isAdmin){document.getElementById('accordion-container').innerHTML='<p style="text-align:center;margin-top:40px;color:var(--muted)">Admin only - admins collection မှာ email မရှိပါ</p>';return;}
  db.collection('users').orderBy('AID').onSnapshot(snap=>{
    allUsers=[]; snap.forEach(doc=>{let d=doc.data(); d._uid=doc.id; allUsers.push(d);});
    filterUsers();
  });
}
function filterUsers(){
  const q=(document.getElementById('search-input')?.value||'').toLowerCase().trim();
  const filtered=allUsers.filter(u=>!q || (u.displayName||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || formatAID(u.AID).toLowerCase().includes(q));
  // Group by role: admin/editor/viewer/ban
  const grouped={};
  filtered.forEach(u=>{
    let k=u.role||'viewer';
    let label={admin:'👑 Admin', editor:'✏️ Editor', viewer:'👤 Viewer', ban:'⛔ Ban'}[k]||k;
    if(!grouped[label]) grouped[label]=[];
    grouped[label].push(u);
  });
  render(grouped);
}
function render(grouped){
  const c=document.getElementById('accordion-container'); c.innerHTML='';
  if(Object.keys(grouped).length===0){c.innerHTML='<p style="color:var(--muted)">users မရှိ</p>';return;}
  Object.keys(grouped).sort().forEach(gName=>{
    const users=grouped[gName];
    const acc=document.createElement('div'); acc.className='accordion open';
    const h=document.createElement('div'); h.className='accordion-header';
    h.innerHTML=`<span>🎤 ${gName} (${users.length})</span><span>▼</span>`;
    h.onclick=()=>acc.classList.toggle('open');
    const content=document.createElement('div'); content.className='accordion-content';
    content.innerHTML=users.map(u=>{
      const av=u.photoURL?`<img src="${u.photoURL}" referrerpolicy="no-referrer" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName||'A')}'" class="user-avatar">`:`<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName||'A')}" class="user-avatar">`;
      return `<div class="song-item">
        <div style="display:flex;gap:10px;align-items:center;cursor:pointer" onclick="openDetail('${u._uid}')">
          ${av}
          <span class="song-title-click">${u.displayName||'No Name'}<span class="aid-badge">${formatAID(u.AID)}</span><span class="role-badge ${u.role}">${u.role||'viewer'}</span><br><small style="color:var(--muted)">${u.email||''} | Login: ${u.loginCount||1} | Last: ${toDateStr(u.lastLogin)}</small></span>
        </div>
        <div class="item-actions" style="display:${isAdmin?'flex':'none'}">
          <button class="icon-btn" onclick="editUser('${u._uid}')">📝</button>
          <button class="icon-btn" onclick="deleteUser('${u._uid}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
    acc.appendChild(h); acc.appendChild(content); c.appendChild(acc);
  });
}

// Detail view - LVE player view လိုမျိုး
function openDetail(uid){
  const u=allUsers.find(x=>x._uid===uid); if(!u) return;
  detailDocId=uid;
  document.getElementById('d-photo').src=u.photoURL||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName||'A')}`;
  document.getElementById('d-photo').referrerPolicy='no-referrer';
  document.getElementById('d-name').textContent=u.displayName||'-';
  document.getElementById('d-email').textContent=u.email||'';
  document.getElementById('d-aid').innerHTML=`<span class="aid-badge">${formatAID(u.AID)}</span> <span class="role-badge ${u.role}">${u.role}</span>`;
  document.getElementById('d-aid2').value=formatAID(u.AID)+` (raw ${u.AID})`;
  document.getElementById('d-uid').value=u._uid;
  document.getElementById('d-display').value=u.displayName||'';
  document.getElementById('d-email2').value=u.email||'';
  document.getElementById('d-role').value=u.role||'viewer';
  document.getElementById('d-count').value=u.loginCount||1;
  document.getElementById('d-device').value=u.device||'';
  document.getElementById('d-photoURL').value=u.photoURL||'';
  document.getElementById('d-first').value=toDateStr(u.firstLogin);
  document.getElementById('d-last').value=toDateStr(u.lastLogin);
  document.getElementById('d-created').value=toDateStr(u.createdAt);
  document.getElementById('d-uid2').value=u.uid||'';
  // history dropdown
  const hb=document.getElementById('history-box');
  const hist=u.loginHistory||[];
  hb.innerHTML = hist.length? `<div style="font-weight:700;margin-bottom:8px">Login History (${hist.length})</div>`+hist.slice().reverse().map((h,i)=>`<div style="font-size:12px;padding:4px 0;border-bottom:1px solid #222">${i+1}. ${h}</div>`).join('') : 'History မရှိ';
  hb.classList.remove('open');
  switchView('detail-view');
}
function toggleHistory(){document.getElementById('history-box').classList.toggle('open');}
function saveRoleFromDetail(){
  if(!isAdmin||!detailDocId) return;
  const role=document.getElementById('d-role').value;
  db.collection('users').doc(detailDocId).update({role}).then(()=>{alert('Role '+role+' saved'); switchView('list-view');});
}
function deleteCurrent(){ if(!detailDocId) return; if(confirm('Delete?')) db.collection('users').doc(detailDocId).delete().then(()=>switchView('list-view')); }

function editUser(uid){
  const u=allUsers.find(x=>x._uid===uid); if(!u) return;
  editingDocId=uid;
  document.getElementById('form-title').textContent=`${formatAID(u.AID)} - ${u.displayName} ပြင်`;
  document.getElementById('inp-name').value=u.displayName||'';
  document.getElementById('inp-role').value=u.role||'viewer';
  switchView('input-view');
}
function saveUser(){
  if(!isAdmin||!editingDocId) return;
  const payload={displayName: document.getElementById('inp-name').value.trim(), role: document.getElementById('inp-role').value};
  db.collection('users').doc(editingDocId).update(payload).then(()=>switchView('list-view'));
}
function deleteUser(uid){ if(!isAdmin) return; if(confirm('Delete '+uid+'?')) db.collection('users').doc(uid).delete(); }

init();