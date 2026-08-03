// TODO: မင်းရဲ့ firebaseConfig ကို ဒီမှာထည့်
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// persistence logic keep=yes/no
const keep = new URLSearchParams(location.search).get('keep');
if(keep === 'yes'){
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
} else {
  auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
}
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

let allWords = [];
let currentUser = null;
let sortMode = localStorage.getItem('sortMode') || 'A';
let currentView = { group:null, subGroup:null };
let editId = null;
let searchTimer = null;
let isFavFilter = false;

const $ = id => document.getElementById(id);

// Day Night
if(localStorage.getItem('night') === '1') document.body.classList.add('night');
$('dayNightBtn').onclick = ()=>{
  document.body.classList.toggle('night');
  localStorage.setItem('night', document.body.classList.contains('night')?'1':'0');
};

// Toast Confirm
function showToast(msg){
  const t = $('toast');
  t.innerText = msg;
  t.style.display = 'block';
  setTimeout(()=> t.style.display='none', 2000);
}
function showConfirm(msg, yesCb){
  $('confirmText').innerText = msg;
  $('confirmBox').classList.remove('hidden');
  $('confirmYes').onclick = ()=>{ $('confirmBox').classList.add('hidden'); yesCb(); };
  $('confirmNo').onclick = ()=> $('confirmBox').classList.add('hidden');
}

// Auth
$('bigLoginBtn').onclick = ()=> auth.signInWithPopup(provider);

auth.onAuthStateChanged(user=>{
  currentUser = user;
  if(user){
    $('bigLoginWrap').classList.add('hidden');
    $('smallProfile').innerText = user.email + ' Login ပြီး';
    checkAdmin(user.email.toLowerCase());
    listenNotes();
  } else {
    $('bigLoginWrap').classList.remove('hidden');
    $('smallProfile').innerText = '';
  }
});

function checkAdmin(email){
  db.collection('admins').doc(email).onSnapshot(doc=>{
    if(doc.exists) console.log('admin ok');
  });
}

// Real-time list - NO get()
function listenNotes(){
  db.collection('AAAnotes').onSnapshot(snap=>{
    allWords = [];
    snap.forEach(d=>{
      let data = d.data();
      data.id = d.id;
      allWords.push(data);
    });
    showWords();
    if($('trashScreen').classList.contains('hidden')===false) showTrash();
  });
}

// MAIN LIST with count
function showWords(){
  const cont = $('mainContent');
  cont.innerHTML = '';
  let list = allWords.filter(n=> n.role!= 2);
  if(isFavFilter) list = list.filter(n=> n.fav);

  // sort A-အ fix
  if(sortMode==='A') list.sort((a,b)=> a.content.localeCompare(b.content,'my',{numeric:true}));
  if(sortMode==='Z') list.sort((a,b)=> b.content.localeCompare(a.content,'my',{numeric:true}));
  if(sortMode==='Old') list.sort((a,b)=> new Date(a.updateTime) - new Date(b.updateTime));
  if(sortMode==='New') list.sort((a,b)=> new Date(b.updateTime) - new Date(a.updateTime));

  // search
  const q = $('searchBox').value.toLowerCase();
  if(q) list = list.filter(n=> n.content.toLowerCase().includes(q) || n.group.toLowerCase().includes(q));

  // group count
  const groups = {};
  list.forEach(n=>{
    if(!groups[n.group]) groups[n.group] = {};
    if(!groups[n.group][n.subGroup]) groups[n.group][n.subGroup] = 0;
    groups[n.group][n.subGroup]++;
  });

  for(let gName in groups){
    let subCount = Object.keys(groups[gName]).length;
    let div = document.createElement('div');
    div.className = 'group-item';
    let left = document.createElement('span');
    left.innerText = gName;
    let right = document.createElement('span');
    right.innerText = subCount + ' ခု';
    div.appendChild(left); div.appendChild(right);
    div.onclick = ()=> openView(gName, null);
    cont.appendChild(div);
  }
}

function openView(group, subGroup){
  currentView = {group, subGroup};
  $('mainScreen').classList.add('hidden');
  $('viewScreen').classList.remove('hidden');
  showViewList();
}

function showViewList(){
  const cont = $('viewContent');
  cont.innerHTML = '';
  let list = allWords.filter(n=> n.role!=2 && n.group===currentView.group);
  if(currentView.subGroup) list = list.filter(n=> n.subGroup===currentView.subGroup);

  if(!currentView.subGroup){
    // show subGroups with count
    const map = {};
    list.forEach(n=> map[n.subGroup] = (map[n.subGroup]||0)+1);
    for(let sg in map){
      let div = document.createElement('div');
      div.className = 'group-item';
      let l = document.createElement('span'); l.innerText = sg;
      let r = document.createElement('span'); r.innerText = map[sg]+' ခု';
      div.appendChild(l); div.appendChild(r);
      div.onclick = ()=>{ currentView.subGroup=sg; showViewList(); };
      cont.appendChild(div);
    }
  } else {
    list.forEach(note=>{
      let card = document.createElement('div'); card.className='note-card';
      let p = document.createElement('p'); p.innerText = note.content;
      card.appendChild(p);
      let actions = document.createElement('div'); actions.className='card-actions';
      let b1 = document.createElement('button'); b1.className='tool-btn'; b1.innerText = note.fav?'💖':'🤍';
      b1.onclick = ()=> db.collection('AAAnotes').doc(note.id).update({fav:!note.fav});
      let b2 = document.createElement('button'); b2.className='tool-btn'; b2.innerText='📋';
      b2.onclick = ()=>{ navigator.clipboard.writeText(note.content); showToast('Copy ပြီးပြီ'); };
      let b3 = document.createElement('button'); b3.className='tool-btn'; b3.innerText='✏️';
      b3.onclick = ()=> openEdit(note);
      let b4 = document.createElement('button'); b4.className='tool-btn'; b4.innerText='🗑️';
      b4.onclick = ()=> showConfirm('ဖျက်မှာလား?', ()=> {
        db.collection('AAAnotes').doc(note.id).update({role:2});
        showToast('အမှိုက်ပုံးထဲ ပို့ပြီး');
      });
      actions.append(b1,b2,b3,b4);
      card.appendChild(actions);
      cont.appendChild(card);
    });
  }
}

// Toolbar events
$('btnFav').onclick = ()=>{
  if(allWords.filter(n=>n.fav && n.role!=2).length===0){
    showToast('Fav မရှိသေးပါ'); return;
  }
  isFavFilter =!isFavFilter;
  showWords();
  showToast(isFavFilter?'Fav ပဲ ပြမယ်':'အကုန်ပြမယ်');
};
$('btnSort').onclick = ()=>{
  const modes = ['A','Z','Old','New'];
  let idx = modes.indexOf(sortMode);
  sortMode = modes[(idx+1)%4];
  localStorage.setItem('sortMode', sortMode);
  showWords();
  showToast('Sort: '+sortMode);
};
$('btnSearch').onclick = ()=>{
  $('searchWrap').classList.toggle('hidden');
  if(!$('searchWrap').classList.contains('hidden')) $('searchBox').focus();
};
$('searchBox').oninput = ()=>{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(showWords,300);
};
$('btnNew').onclick = ()=> openEdit(null);
$('viewNew').onclick = ()=> openEdit({group:currentView.group, subGroup:currentView.subGroup});
$('viewBack').onclick = ()=>{
  if(currentView.subGroup){ currentView.subGroup=null; showViewList(); }
  else { $('viewScreen').classList.add('hidden'); $('mainScreen').classList.remove('hidden'); }
};

$('btnSettings').onclick = ()=> $('settingsBox').classList.remove('hidden');
$('closeSettings').onclick = ()=> $('settingsBox').classList.add('hidden');
$('btnMore').onclick = ()=> $('moreBox').classList.remove('hidden');
$('closeMore').onclick = ()=> $('moreBox').classList.add('hidden');

// Edit
function openEdit(note){
  $('mainScreen').classList.add('hidden');
  $('viewScreen').classList.add('hidden');
  $('editScreen').classList.remove('hidden');
  if(note && note.id){ editId=note.id; $('editGroup').value=note.group; $('editSubGroup').value=note.subGroup; $('editText').value=note.content; }
  else { editId=null; $('editGroup').value= note?note.group:''; $('editSubGroup').value= note?note.subGroup:''; $('editText').value=''; }
}
$('btnCancel').onclick = ()=>{ $('editScreen').classList.add('hidden'); $('mainScreen').classList.remove('hidden'); };
$('btnSave').onclick = ()=>{
  const data = {
    group: $('editGroup').value.trim(),
    subGroup: $('editSubGroup').value.trim(),
    content: $('editText').value.trim(),
    fav: false,
    role: 1,
    updateTime: new Date().toISOString()
  };
  if(!data.content){ showToast('Content အလွတ်ပါ'); return; }
  if(editId) db.collection('AAAnotes').doc(editId).update(data);
  else db.collection('AAAnotes').add(data);
  $('editScreen').classList.add('hidden'); $('mainScreen').classList.remove('hidden');
  showToast('Save ပြီးပြီ');
};

// Trash
$('trashBtn').onclick = ()=>{
  $('settingsBox').classList.add('hidden');
  $('mainScreen').classList.add('hidden');
  $('trashScreen').classList.remove('hidden');
  showTrash();
};
$('trashBack').onclick = ()=>{ $('trashScreen').classList.add('hidden'); $('mainScreen').classList.remove('hidden'); };
function showTrash(){
  const cont = $('trashContent'); cont.innerHTML='';
  allWords.filter(n=> n.role==2).forEach(note=>{
    let card = document.createElement('div'); card.className='note-card';
    let p = document.createElement('p'); p.innerText = note.content; card.appendChild(p);
    let actions = document.createElement('div'); actions.className='card-actions';
    let b1 = document.createElement('button'); b1.className='tool-btn'; b1.innerText='📋'; b1.onclick=()=>{navigator.clipboard.writeText(note.content); showToast('Copy ပြီးပြီ');};
    let b2 = document.createElement('button'); b2.className='tool-btn'; b2.innerText='✏️'; b2.onclick=()=>openEdit(note);
    let b3 = document.createElement('button'); b3.className='tool-btn'; b3.innerText='💖'; b3.onclick=()=>db.collection('AAAnotes').doc(note.id).update({fav:!note.fav});
    let b4 = document.createElement('button'); b4.className='tool-btn primary'; b4.innerText='♻️ Restore';
    b4.onclick=()=> db.collection('AAAnotes').doc(note.id).update({role:1}).then(()=>showToast('ပြန်ဆယ်ပြီး'));
    actions.append(b1,b2,b3,b4); card.appendChild(actions); cont.appendChild(card);
  });
}