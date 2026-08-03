import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC7N9_TNTp_aThC_olEDyMcEo2pAhOFEGI",
    authDomain: "arakanese-dictionary.firebaseapp.com",
    projectId: "arakanese-dictionary",
    storageBucket: "arakanese-dictionary.firebasestorage.app",
    messagingSenderId: "955711906003",
    appId: "1:955711906003:web:6d9b60bd4cdaa8a8953426"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Elements
let currentEditId = null;
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const editScreen = document.getElementById('edit-screen');
const viewScreen = document.getElementById('view-screen');
const expandableList = document.getElementById('expandable-list');

function changeScreen(target) {
    [mainScreen, editScreen, viewScreen].forEach(s => s.classList.add('hidden'));
    target.classList.remove('hidden');
}

// Login btns
document.getElementById('admin-login-btn').addEventListener('click', () => signInWithPopup(auth, provider));
document.getElementById('login-btn')?.addEventListener('click', () => signInWithPopup(auth, provider));
document.getElementById('logout-btn')?.addEventListener('click', () => signOut(auth));
document.getElementById('Screen-select')?.addEventListener('change', function(){ if(this.value) location.href=this.value; });
document.getElementById('new-word-btn')?.addEventListener('click', () => {
    currentEditId=null;
    document.querySelectorAll('.input-form input').forEach(i=>i.value="");
    changeScreen(editScreen);
});

function loadAllUsers(){
 onSnapshot(collection(db, "AllUserList"), (snapshot) => {
    expandableList.innerHTML = "";
    const groups = {};
    snapshot.forEach((doc) => {
        const data = doc.data();
        const gName = (data.Time||"").substring(0,4) || "အခြား";
        const sgName = (data.Time||"").substring(5,7) || "အထွေထွေ";
        if (!groups[gName]) groups[gName] = {};
        if (!groups[gName][sgName]) groups[gName][sgName] = [];
        groups[gName][sgName].push({ id: doc.id,...data });
    });
    Object.keys(groups).sort((a,b)=>b.localeCompare(a)).forEach((gName) => {
        const groupWrapper = document.createElement('div');
        const groupHeader = document.createElement('div');
        groupHeader.style.cssText = "cursor:pointer; padding:12px; background:#e6dbb3; font-weight:bold; border-radius:4px; margin-bottom:8px;";
        groupHeader.innerText = `📅 ${gName} ခုနှစ်`;
        const subGroupContainer = document.createElement('div');
        subGroupContainer.style.display = "none";
        subGroupContainer.style.paddingLeft = "10px";
        Object.keys(groups[gName]).sort((a,b)=>b.localeCompare(a)).forEach((sgName) => {
            const subHeader = document.createElement('div');
            subHeader.style.cssText = "padding:10px; margin-top:5px; background:#f1f1f1; cursor:pointer;";
            subHeader.innerText = `📂 ${sgName} လ - ${groups[gName][sgName].length} ဦး`;
            const sortedWords = groups[gName][sgName].sort((a,b)=>b.AID.localeCompare(a.AID));
            subHeader.addEventListener('click', (e) => { e.stopPropagation(); showSubGroupContents(sortedWords, sgName); });
            subGroupContainer.appendChild(subHeader);
        });
        groupHeader.addEventListener('click', () => {
            const isOpen = subGroupContainer.style.display === "block";
            document.querySelectorAll('.subgroup-container-box').forEach(el => el.style.display = "none");
            subGroupContainer.style.display = isOpen? "none" : "block";
        });
        groupWrapper.append(groupHeader, subGroupContainer);
        expandableList.appendChild(groupWrapper);
    });
 });
}

// AUTH - တစ်နေရာတည်းပဲ ထားတယ်
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    loginScreen.style.display = "block";
    mainScreen.classList.add('hidden');
    return;
  }
  document.getElementById('user-email') && (document.getElementById('user-email').textContent = user.email);
  const snap = await getDoc(doc(db, "AllUserList", user.uid));
  if (!snap.exists() || snap.data().Role!== "Admin") {
    loginScreen.innerHTML = `<h2 style='text-align:center'>Admin မဟုတ်ပါ - ${user.email}</h2>`;
    loginScreen.style.display = "block";
    mainScreen.classList.add('hidden');
    return;
  }
  loginScreen.style.display = "none";
  mainScreen.classList.remove('hidden');
  loadAllUsers();
});

// ကျန် checkAid, save, view ကုဒ်တွေ မင်းဟာအတိုင်း ဒီအောက်မှာ ဆက်ထား...
const aidInput = document.getElementById('subGroup');
const aidError = document.getElementById('aid-error');
const checkAidBtn = document.getElementById('check-aid-btn');
let isAidValid = false;
async function checkAid(){
    const num = aidInput.value.trim();
    const fullAid = `A-${num}`;
    if (!/^\d+$/.test(num) || num.length!==7 || num==="0000000"){
        aidError.textContent="ဂဏန်း 7 လုံးတိတိ"; aidError.style.display="block"; aidError.style.color="red"; isAidValid=false; return;
    }
    const q = query(collection(db, "AllUserList"), where("AID","==",fullAid));
    const snapshot = await getDocs(q);
    const dup = snapshot.docs.some(d=>d.id!==currentEditId);
    if(dup){ aidError.textContent=fullAid+" ရှိပြီးသား"; aidError.style.color="red"; isAidValid=false; }
    else{ aidError.textContent=fullAid+" ရတယ် ✓"; aidError.style.color="green"; isAidValid=true; }
    aidError.style.display="block";
}
aidInput?.addEventListener('input', ()=>{ aidInput.value=aidInput.value.replace(/\D/g,''); checkAid(); });
checkAidBtn?.addEventListener('click', checkAid);

const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveWordBtn = document.getElementById('save-word-btn');
cancelEditBtn?.addEventListener('click', () => changeScreen(mainScreen));
saveWordBtn?.addEventListener('click', async () => {
    const userData = {
        AID: `A-${document.getElementById('subGroup').value.trim()}`,
        GID: document.getElementById('pos').value.trim(),
        Name: document.getElementById('definition').value.trim(),
        Acc: document.getElementById('example').value.trim(),
        Time: document.getElementById('english').value.trim(),
        Role: document.getElementById('pronounce').value.trim(),
        Year: new Date().getFullYear().toString(),
        Month: (new Date().getMonth()+1).toString().padStart(2,'0'),
        createdAt: new Date()
    };
    try{
        if(currentEditId) await updateDoc(doc(db,"AllUserList",currentEditId), userData);
        else await addDoc(collection(db,"AllUserList"), userData);
        changeScreen(mainScreen);
    }catch(e){ alert(e.message); }
});

function showSubGroupContents(words, sgName){
    viewScreen.innerHTML = `<div style="text-align:center; padding:15px; background:#e6dbb3; font-weight:bold;">📅 ${sgName} လ - ${words.length} ဦး</div><div id="view-contents-container" style="padding:15px;"></div><button id="back-main-btn">Back</button>`;
    const container = document.getElementById('view-contents-container');
    words.forEach(data => {
        const div = document.createElement('div');
        div.style.cssText="padding:15px; margin-bottom:15px; border-left:5px solid #605639; background:#fff;";
        div.innerHTML = `<h3>${data.AID} - ${data.Name}</h3><p>Acc: ${data.Acc}</p><p>Role: ${data.Role}</p><button class="inline-edit-btn">Edit</button>`;
        div.querySelector('.inline-edit-btn').addEventListener('click', () => {
            currentEditId = data.id;
            document.getElementById('subGroup').value = (data.AID||"").replace('A-','');
            document.getElementById('pos').value = data.GID||"";
            document.getElementById('definition').value = data.Name||"";
            document.getElementById('example').value = data.Acc||"";
            document.getElementById('english').value = data.Time||"";
            document.getElementById('pronounce').value = data.Role||"";
            isAidValid=true;
            changeScreen(editScreen);
        });
        container.appendChild(div);
    });
    document.getElementById('back-main-btn').addEventListener('click', () => changeScreen(mainScreen));
    changeScreen(viewScreen);
}