const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note",
  storageBucket: "arakanartarea-note.firebasestorage.app",
  messagingSenderId: "695659736666",
  appId: "1:695659736666:web:1e76494c0e6819609bf263"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// GLOBAL
let currentEditId = null;
let currentSearchText = "";
let debounceTimer = null;
let allWords = [];
let currentSortMode = 'time-new';
let unsubscribe = null;

const mainScreen = document.getElementById('main-screen');
const editScreen = document.getElementById('edit-screen');
const viewScreen = document.getElementById('view-screen');
const expandableList = document.getElementById('expandable-list');
const authBtn = document.getElementById('authBtn');
const newWordBtn = document.getElementById('new-word-btn');

function changeScreen(targetScreen) {
  mainScreen.classList.add('hidden');
  editScreen.classList.add('hidden');
  viewScreen.classList.add('hidden');
  targetScreen.classList.remove('hidden');
}

// ==== LOGIN + ADMIN CHECK (မင်းရဲ့ Compat ကုဒ်က Logic အတိုင်း) ====
authBtn.onclick = async () => {
  try {
    if (!auth.currentUser) await signInWithPopup(auth, provider);
    else {
      if (confirm("OK=ထွက်မယ်, Cancel=ပြောင်းမယ်")) await signOut(auth);
      else await signInWithPopup(auth, provider);
    }
  } catch (e) { alert(e.message); }
};

function startListening() {
  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(collection(db, "AAAnotes"), (snapshot) => {
    allWords = [];
    snapshot.forEach((d) => {
      if (d.data().role!== 2) allWords.push({ id: d.id,...d.data() });
    });
    showWords();
  }, (err) => {
    expandableList.innerHTML = `<p style="text-align:center;color:red;padding:20px;">Rule Error: ${err.message}</p>`;
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authBtn.innerText = "👤";
    expandableList.innerHTML = `<p style="text-align:center;padding:20px;">Login ဝင်ပါ</p>`;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    return;
  }
  // မင်းရဲ့ admin စစ်နည်း အတိုင်း
  const snap = await getDoc(doc(db, "admins", user.email.toLowerCase()));
  if (!snap.exists()) {
    authBtn.innerText = "🚫";
    expandableList.innerHTML = `<p style="text-align:center;padding:20px;">${user.email}<br>ခွင့်မရှိပါ</p>`;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    return;
  }
  authBtn.innerText = "✅";
  startListening();
});

// ==== မင်းရဲ့ UI ကုဒ် အကုန်အတိုင်း ပြန်ထည့် ====
newWordBtn.addEventListener('click', () => {
  currentEditId = null;
  document.getElementById('group').value = "";
  document.getElementById('subGroup').value = "";
  document.getElementById('content').value = "";
  changeScreen(editScreen);
});

document.getElementById('sort-select').addEventListener('change', (e) => {
  currentSortMode = e.target.value;
  showWords();
});

document.getElementById('Screen-select').addEventListener('change', function() {
  if (this.value) window.location.href = this.value;
});

function showWords() {
  expandableList.innerHTML = "";
  let filteredData = allWords.filter(note => {
    const s = currentSearchText.toLowerCase();
    return (note.group||"").toLowerCase().includes(s) || (note.subGroup||"").toLowerCase().includes(s) || (note.content||"").toLowerCase().includes(s);
  });
  if (filteredData.length === 0) {
    expandableList.innerHTML = `<p style="text-align:center;color:#888;padding-top:20px;">ရှာမတွေ့ပါ...</p>`; return;
  }
  filteredData.forEach(w=>{ w.group=w.group||"အခြား"; w.subGroup=w.subGroup||"အထွေထွေ"; });
  const groups={};
  filteredData.forEach(d=>{
    if(!groups[d.group]) groups[d.group]={};
    if(!groups[d.group][d.subGroup]) groups[d.group][d.subGroup]=[];
    groups[d.group][d.subGroup].push(d);
  });
  Object.keys(groups).forEach(gName=>{
    const groupWrapper=document.createElement('div'); groupWrapper.style.marginBottom="8px";
    const groupHeader=document.createElement('div');
    groupHeader.style.cssText="cursor:pointer;padding:12px;background:#e6dbb3;font-weight:bold;border-radius:4px;";
    groupHeader.innerText=`📁 ${gName}`;
    const subGroupContainer=document.createElement('div'); subGroupContainer.style.display="none"; subGroupContainer.style.paddingLeft="10px";
    Object.keys(groups[gName]).forEach(sgName=>{
      const subGroupHeader=document.createElement('div');
      subGroupHeader.style.cssText="padding:10px 15px;margin-top:5px;font-weight:bold;color:#444;cursor:pointer;background-color:#f1f1f1;border-radius:4px;border-bottom:1px dashed #ccc;";
      subGroupHeader.innerText=`📂 ${sgName}`;
      subGroupHeader.addEventListener('click',(e)=>{ e.stopPropagation(); showSubGroupContents(groups[gName][sgName],sgName,gName); });
      subGroupContainer.appendChild(subGroupHeader);
    });
    groupWrapper.appendChild(groupHeader); groupWrapper.appendChild(subGroupContainer);
    expandableList.appendChild(groupWrapper);
    groupHeader.addEventListener('click',()=>{
      const isOpen=subGroupContainer.style.display==="block";
      document.querySelectorAll('#expandable-list > div > div:nth-child(2)').forEach(el=>el.style.display="none");
      subGroupContainer.style.display=isOpen?"none":"block";
    });
  });
}

function showSubGroupContents(notes,sgName,gName){
  viewScreen.innerHTML=`<div style="text-align:center;padding:15px;background:#e6dbb3;font-weight:bold;font-size:18px;border-bottom:1px solid #ccc;">📖 ${gName} / ${sgName} (${notes.length} ခု)</div><div id="view-contents-container" style="padding:15px;padding-bottom:80px;overflow-y:auto;max-height:calc(100vh - 120px);"></div><div style="position:fixed;bottom:0;left:0;width:100%;padding:12px;background:#e6dbb3;text-align:center;display:flex;gap:10px;justify-content:center;"><button id="back-main-btn" style="flex:1;padding:10px;background:#605639;color:white;border:none;border-radius:4px;font-weight:bold;">⬅️ Back</button><button id="new-in-subgroup-btn" style="flex:1;padding:10px;background:#2d6a4f;color:white;border:none;border-radius:4px;font-weight:bold;">➕ New</button></div>`;
  const container=document.getElementById('view-contents-container');
  notes.forEach(data=>{
    const noteCard=document.createElement('div');
    noteCard.style.cssText="padding:15px;margin-bottom:15px;border-left:5px solid #605639;background:#ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.08);border-radius:0 4px 4px 0;";
    noteCard.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;"><p style="margin:0;color:#605639;font-size:16px;white-space:pre-wrap;flex:1;">${data.content||'-'}</p><div style="display:flex;gap:6px;margin-left:10px;"><button class="inline-copy-btn" style="padding:4px 10px;background:#e6dbb3;border:1px solid #605639;border-radius:4px;cursor:pointer;">📋</button><button class="inline-edit-btn" style="padding:4px 10px;background:#e6dbb3;border:1px solid #605639;border-radius:4px;cursor:pointer;">✏️</button></div></div><p style="margin:3px 0;font-size:12px;color:#888;text-align:right;">${new Date(data.updateTime).toLocaleString('my-MM')}</p>`;
    noteCard.querySelector('.inline-copy-btn').addEventListener('click',async()=>{ await navigator.clipboard.writeText(data.content||''); });
    noteCard.querySelector('.inline-edit-btn').addEventListener('click',()=>{ currentEditId=data.id; document.getElementById('group').value=data.group||""; document.getElementById('subGroup').value=data.subGroup||""; document.getElementById('content').value=data.content||""; changeScreen(editScreen); });
    container.appendChild(noteCard);
  });
  document.getElementById('back-main-btn').addEventListener('click',()=>changeScreen(mainScreen));
  document.getElementById('new-in-subgroup-btn').addEventListener('click',()=>{ currentEditId=null; document.getElementById('group').value=gName; document.getElementById('subGroup').value=sgName; document.getElementById('content').value=""; changeScreen(editScreen); });
  changeScreen(viewScreen);
}

// Search + Save + Toolbar - မင်းဟာအတိုင်း
const searchBox=document.getElementById('searchBox'); const clearBtn=document.getElementById('clearSearchBtn');
searchBox.addEventListener('input',()=>{ clearTimeout(debounceTimer); debounceTimer=setTimeout(()=>{ currentSearchText=searchBox.value; clearBtn.style.display=currentSearchText?'block':'none'; showWords(); },300); });
clearBtn.addEventListener('click',()=>{ searchBox.value=""; currentSearchText=""; clearBtn.style.display='none'; showWords(); });
document.getElementById('cancel-edit-btn').addEventListener('click',()=>changeScreen(mainScreen));
document.getElementById('save-word-btn').addEventListener('click',async()=>{
  const noteData={ group:document.getElementById('group').value.trim()||"အခြား", subGroup:document.getElementById('subGroup').value.trim()||"အထွေထွေ", content:document.getElementById('content').value.trim(), role:1, updateTime:new Date().toISOString() };
  if(!noteData.content){ alert("မှတ်စုထဲစာဖြည့်ဦး"); return; }
  try{ if(currentEditId) await updateDoc(doc(db,"AAAnotes",currentEditId),noteData); else await addDoc(collection(db,"AAAnotes"),noteData); changeScreen(mainScreen); }catch(e){ alert('မရဘူး'); }
});

function printLog(msg, isError = false) {
  const logBox = document.getElementById('log-box');
  const time = new Date().toLocaleTimeString(); // အချိန် ရယူခြင်း
  const color = isError ? '#ff4d4d' : '#00ff66'; // Error ဆို အနီရောင်၊ ပုံမှန်ဆို အစိမ်းရောင်

  // Box ထဲသို့ စာတန်းအသစ် ထပ်ပေါင်းထည့်ခြင်း
  logBox.innerHTML += `<div style="color:${color};">[${time}] ${msg}</div>`;
  
  // စာသစ်လာတိုင်း Box ရဲ့ အောက်ဆုံးကို အလိုအလျောက် Scroll ဆွဲပေးခြင်း
  logBox.scrollTop = logBox.scrollHeight; 
}
