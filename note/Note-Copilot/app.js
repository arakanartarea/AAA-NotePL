// Firebase config (keep existing)
const firebaseConfig = { /* your config here */ };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let user=null;
let allWords=[];
let sortMode=localStorage.getItem('sortMode')||'A';
let searchTimer=null;

// Auth
function login(){
  const provider=new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  auth.signInWithPopup(provider);
}
auth.onAuthStateChanged(u=>{
  user=u;
  document.getElementById('loginScreen').style.display=u?'none':'flex';
  if(u) listenNotes();
});

// Listen notes
function listenNotes(){
  db.collection("AAAnotes").onSnapshot(snap=>{
    allWords=[];
    snap.forEach(doc=>{
      let d=doc.data();
      d.id=doc.id;
      if(d.role!=2) allWords.push(d);
    });
    showWords();
  });
}

// Show words
function showWords(){
  let list=document.getElementById('content');
  list.innerHTML='';
  let q=document.getElementById('searchInput').value||'';
  let filtered=allWords.filter(n=>n.content.includes(q));
  if(sortMode==='A') filtered.sort((a,b)=>a.content.localeCompare(b.content,'my',{numeric:true}));
  if(sortMode==='Z') filtered.sort((a,b)=>b.content.localeCompare(a.content,'my',{numeric:true}));
  if(sortMode==='Old') filtered.sort((a,b)=>a.updateTime.localeCompare(b.updateTime));
  if(sortMode==='New') filtered.sort((a,b)=>b.updateTime.localeCompare(a.updateTime));
  filtered.forEach(n=>{
    let card=document.createElement('div');
    card.className='note-card';
    let p=document.createElement('p');
    p.textContent=n.content;
    card.appendChild(p);
    let actions=document.createElement('div');
    actions.className='card-actions';
    actions.innerHTML=`
      <button onclick="toggleFav('${n.id}',${n.fav})">⭐</button>
      <button onclick="copyNote('${n.content}')">📋</button>
      <button onclick="editNote('${n.id}')">✏️</button>
      <button onclick="deleteNote('${n.id}')">🗑️</button>`;
    card.appendChild(actions);
    list.appendChild(card);
  });
}

// Fav
function showFav(){
  let favs=allWords.filter(n=>n.fav && n.role!=2);
  if(favs.length==0){showToast("Fav မရှိသေးပါ");return;}
  let list=document.getElementById('content');
  list.innerHTML='';
  favs.forEach(n=>{
    let card=document.createElement('div');
    card.className='note-card';
    let p=document.createElement('p');
    p.textContent=n.content;
    card.appendChild(p);
    list.appendChild(card);
  });
}

// Sort
function toggleSort(){
  let modes=['A','Z','Old','New'];
  let idx=modes.indexOf(sortMode);
  sortMode=modes[(idx+1)%modes.length];
  localStorage.setItem('sortMode',sortMode);
  showWords();
}

// Search
function toggleSearch(){
  let box=document.getElementById('searchBox');
  box.style.display=box.style.display==='none'?'block':'none';
  if(box.style.display==='block') document.getElementById('searchInput').focus();
}
document.getElementById('searchInput').addEventListener('input',()=>{
  clearTimeout(searchTimer);
  searchTimer=setTimeout(showWords,300);
});

// New
function newNote(){
  let c=prompt("စာထည့်ပါ");
  if(!c)return;
  db.collection("AAAnotes").add({
    group:"default",subGroup:"default",content:c,fav:false,
    updateTime:new Date().toISOString(),role:1
  });
}

// Actions
function toggleFav(id,f){
  db.collection("AAAnotes").doc(id).update({fav:!f});
}
function copyNote(txt){
  navigator.clipboard.writeText(txt);
  showToast("Copy ပြီး");
}
function editNote(id){
  let c=prompt("Edit");
  if(!c)return;
  db.collection("AAAnotes").doc(id).update({content:c,updateTime:new Date().toISOString()});
}
function deleteNote(id){
  showConfirm("ဖျက်မှာလား?",()=>db.collection("AAAnotes").doc(id).update({role:2}));
}

// Toast
function showToast(msg){
  let t=document.getElementById('toast');
  t.text