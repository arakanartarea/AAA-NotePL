const firebaseConfig = {
 apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
 authDomain: "arakanartarea-note.firebaseapp.com",
 projectId: "arakanartarea-note"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const img = document.getElementById('profileImg');
const nameEl = document.getElementById('profileName');
const emailEl = document.getElementById('profileEmail');
const loginBtn = document.getElementById('loginBtn');
const loginText = document.getElementById('loginText');
const msg = document.getElementById('msg');

// loginScreen / mainScreen / toolbar
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const toolbar = document.getElementById('bottomToolbar');

function getPersistence(){
 const p = new URLSearchParams(location.search).get('keep');
 return p === 'no'
  ? firebase.auth.Auth.Persistence.SESSION
  : firebase.auth.Auth.Persistence.LOCAL;
}
auth.setPersistence(getPersistence());

async function doLogin(){
 msg.textContent = 'Opening...';
 const provider = new firebase.auth.GoogleAuthProvider();
 provider.setCustomParameters({prompt:'select_account'});
 try{
  await auth.signInWithPopup(provider);
 }catch(e){
  msg.textContent = e.message;
 }
}

async function doLogout(){
 await auth.signOut();
}
loginBtn.onclick = () => {
 if(auth.currentUser) doLogout();
 else doLogin();
};
auth.onAuthStateChanged(async (user)=>{
 if(!user){
  img.classList.add('hidden');
  img.src = '';
  nameEl.textContent = 'Not Login';
  emailEl.textContent = '';
  loginText.textContent = 'Login';
  return;
 }
 const email = user.email.toLowerCase();
 try{
  const doc = await db.collection('admins').doc(email).get();
  if(!doc.exists){
   msg.textContent = 'No permission: '+email;
   auth.signOut(); return;
  }
 }catch(e){
  msg.textContent = e.message; return;
 }
 img.src = user.photoURL || '';
 if(user.photoURL) img.classList.remove('hidden');
 nameEl.textContent = user.displayName || 'User';
 emailEl.textContent = email;
 loginText.textContent = 'Logout';
 msg.textContent = 'Logged in - remembered';
});

//GC
 /* ===== GC ===== debug */
 function startSnapshot() {
  db.collection('AAAnotes').onSnapshot(snap => {
   allWords = [];
   snap.forEach(d => {
    allWords.push({ id: d.id, ...d.data() });
   });
   console.log('allWords', allWords.length, allWords);
   showMS(); // MS ကို ခေါ်
  }, err => {
   console.log('snapshot error', err);
  });
 }

// MainS
//MS List
 /* ===== MS ===== */
 let expandedGroup = null;
 function showMS() {
  const mainDiv =
   document.getElementById('mainList');
  let filtered = allWords.filter(n => n.role !== 2);
  if (isFavMode) {
   filtered = filtered.filter(n => n.fav);
  }
  if (searchText) {
   filtered = filtered.filter(n =>
    (n.group + n.subGroup + n.content)
    .toLowerCase().includes(searchText.toLowerCase())
   );
  }
  
  const groups = {};
  filtered.forEach(n => {
   if (!groups[n.group]) groups[n.group] = {};
   if (!groups[n.group][n.subGroup])
    groups[n.group][n.subGroup] = [];
   groups[n.group][n.subGroup].push(n);
  });
  
  let gKeys = Object.keys(groups);
  let html = '';
  gKeys.forEach(g => {
   const subCount =
    Object.keys(groups[g]).length;
   const totalCount =
    Object.values(groups[g])
    .reduce((a, b) => a + b.length, 0);
   const isOpen = expandedGroup === g;
   
   html += `<div class="group-item"
    onclick="toggleGroup('${esc(g)}')">
    <span>${isOpen?'📂':'📁'} ${escHtml(g)}</span>
    <span class="count-badge">${totalCount}</span>
    </div>`;
   
   if (isOpen) {
    Object.keys(groups[g]).sort().forEach(sg => {
     const cnt = groups[g][sg].length;
     html += `<div class="subgroup-item"
      onclick="openSub('${esc(g)}','${esc(sg)}')">
      <span>📂 ${escHtml(sg)}</span>
      <span class="count-badge">${cnt}</span>
      </div>`;
    });
   }
  });
  if (!html) html = '<p style="text-align:center;padding:20px">မရှိသေးပါ</p>';
  mainDiv.innerHTML = html;
 }
 function toggleGroup(g) {
  if (expandedGroup === g) expandedGroup = null;
  else expandedGroup = g;
  showMS();
 }
 function openSub(g, sg) {
  currentView.group = g;
  currentView.subGroup = sg;
  // ViewS မပြသေးဘူး၊ နောက်မှပြ
  console.log('open', g, sg);
 }
 

// keyboard အပေါ်တက်ရန်
function fixToolbar() {
 if (!window.visualViewport) return;
 const vv = window.visualViewport;
 const diff = window.innerHeight - vv.height - vv.offsetTop;
 toolbar.style.transform = `translateY(${-diff}px)`;
}
if (window.visualViewport) {
 visualViewport.addEventListener('resize', fixToolbar);
 visualViewport.addEventListener('scroll', fixToolbar);
}

// auth state
auth.onAuthStateChanged(async (user) => {
 if (!user) {
  loginScreen.classList.remove('hidden');
  mainScreen.classList.add('hidden');
  toolbar.classList.add('hidden');
  return;
 }
 const email = user.email.toLowerCase();
 const doc = await db.collection('admins').doc(email).get();
 if (!doc.exists) {
  alert('No permission');
  auth.signOut();
  return;
 }
 // Login အောင်ပြီ -> Main ပြ
 loginScreen.classList.add('hidden');
 mainScreen.classList.remove('hidden');
 toolbar.classList.remove('hidden');
});