import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note",
  storageBucket: "arakanartarea-note.firebasestorage.app",
  messagingSenderId: "695659736666",
  appId: "1:695659736666:web:1e76494c0e6819609bf263"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

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
const groupInput = document.getElementById('group');
const subGroupInput = document.getElementById('subGroup');
const contentArea = document.getElementById('content');

function changeScreen(targetScreen) {
  [mainScreen, editScreen, viewScreen].forEach(s => s && s.classList.add('hidden'));
  targetScreen && targetScreen.classList.remove('hidden');
}

// START LISTENING
function startListening() {
  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(collection(db, "AAAnotes"),
    (snapshot) => {
      allWords = [];
      snapshot.forEach(d => {
        const data = d.data();
        if (data.role!== 2) allWords.push({ id: d.id,...data });
      });
      showWords();
    },
    (err) => {
      expandableList.innerHTML = `<p style="text-align:center;color:red;padding:20px;">Rule Error: ${err.message}<br>admins ထဲ ${auth.currentUser?.email} ရှိ/မရှိ စစ်ပါ</p>`;
    }
  );
}

async function checkIsAdmin(email) {
  if (!email) return false;
  try {
    const snap = await getDoc(doc(db, "admins", email.toLowerCase()));
    return snap.exists();
  } catch { return false; }
}

// AUTH CLICK - POPUP + REDIRECT BOTH SUPPORT
authBtn.onclick = async () => {
  try {
    if (!auth.currentUser) {
      await signInWithPopup(auth, provider);
    } else {
      if (confirm("OK=ထွက်မယ်, Cancel=အကောင့်ပြောင်းမယ်")) await signOut(auth);
      else await signInWithPopup(auth, provider);
    }
  } catch (e) {
    try { await signInWithRedirect(auth, provider); }
    catch (err) { alert("Login Error: " + e.message); }
  }
};

// REDIRECT RESULT (Android Chrome အတွက်)
getRedirectResult(auth).catch(()=>{});

// AUTH STATE
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authBtn.innerText = "👤";
    expandableList.innerHTML = `<p style="text-align:center;padding:20px;">Login ဝင်ပါ</p>`;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    return;
  }
  authBtn.innerText = "⏳";
  const isAdmin = await checkIsAdmin(user.email);
  if (!isAdmin) {
    authBtn.innerText = "🚫";
    expandableList.innerHTML = `<p style="text-align:center;padding:20px;">${user.email}<br>ခွင့်မရှိပါ - admins ထဲမရှိပါ</p>`;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    return;
  }
  authBtn.innerText = "✅";
  startListening();
});

// UI EVENTS
document.getElementById('new-word-btn')?.addEventListener('click', () => {
  currentEditId = null;
  groupInput.value = ""; subGroupInput.value = ""; contentArea.value = "";
  changeScreen(editScreen);
});
document.getElementById('sort-select')?.addEventListener('change', (e) => {
  currentSortMode = e.target.value; showWords();
});
document.getElementById('Screen-select')?.addEventListener('change', function() {
  if (this.value) window.location.href = this.value;
});
document.getElementById('cancel-edit-btn')?.addEventListener('click', () => changeScreen(mainScreen));

document.getElementById('save-word-btn')?.addEventListener('click', async () => {
  const noteData = {
    group: groupInput.value.trim() || "အခြား",
    subGroup: subGroupInput.value.trim() || "အထွေထွေ",
    content: contentArea.value.trim(),
    role: 1,
    updateTime: new Date().toISOString()
  };
  if (!noteData.content) { alert("မှတ်စုထဲစာဖြည့်ဦး"); return; }
  try {
    if (currentEditId) await updateDoc(doc(db, "AAAnotes", currentEditId), noteData);
    else await addDoc(collection(db, "AAAnotes"), noteData);
    currentEditId = null;
    groupInput.value = ""; subGroupInput.value = ""; contentArea.value = "";
    changeScreen(mainScreen);
  } catch (e) { alert("Save Fail: " + e.message); }
});

// SEARCH
const searchBox = document.getElementById('searchBox');
const clearBtn = document.getElementById('clearSearchBtn');
searchBox?.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentSearchText = searchBox.value;
    if (clearBtn) clearBtn.style.display = currentSearchText? 'block' : 'none';
    showWords();
  }, 300);
});
clearBtn?.addEventListener('click', () => {
  searchBox.value = ""; currentSearchText = "";
  clearBtn.style.display = 'none'; showWords();
});

// SHOW WORDS
function showWords() {
  if (!expandableList) return;
  expandableList.innerHTML = "";
  let filteredData = allWords.filter(note => {
    const search = currentSearchText.toLowerCase();
    return (note.group||"").toLowerCase().includes(search) || (note.subGroup||"").toLowerCase().includes(search) || (note.content||"").toLowerCase().includes(search);
  });
  if (filteredData.length === 0) {
    expandableList.innerHTML = `<p style="text-align:center;color:#888;padding-top:20px;">ရှာမတွေ့ပါ...</p>`; return;
  }
  filteredData.forEach(w => { w.group = w.group || "အခြား"; w.subGroup = w.subGroup || "အထွေထွေ"; });
  const groups = {};
  filteredData.forEach(data => {
    if (!groups[data.group]) groups[data.group] = {};
    if (!groups[data.group][data.subGroup]) groups[data.group][data.subGroup] = [];
    groups[data.group][data.subGroup].push(data);
  });
  let sortedGroups = Object.keys(groups);
  if (currentSortMode === 'time-new') sortedGroups.sort((a,b)=> Math.max(...Object.values(groups[b]).flat().map(n=>new Date(n.updateTime||0).getTime())) - Math.max(...Object.values(groups[a]).flat().map(n=>new Date(n.updateTime||0).getTime())));
  else if (currentSortMode === 'time-old') sortedGroups.sort((a,b)=> Math.min(...Object.values(groups[a]).flat().map(n=>new Date(n.updateTime||0).getTime())) - Math.min(...Object.values(groups[b]).flat().map(n=>new Date(n.updateTime||0).getTime())));
  else if (currentSortMode === 'az') sortedGroups.sort((a,b)=>a.localeCompare(b,'my'));
  else if (currentSortMode === 'za') sortedGroups.sort((a,b)=>b.localeCompare(a,'my'));

  sortedGroups.forEach(gName => {
    const groupWrapper = document.createElement('div');
    groupWrapper.style.marginBottom = "8px";
    const groupHeader = document.createElement('div');
    groupHeader.style.cssText = "cursor:pointer;padding:12px;background:#e6dbb3;font-weight:bold;border-radius:4px;";
    groupHeader.innerText = `📁 ${gName}`;
    groupWrapper.appendChild(groupHeader);
    const subGroupContainer = document.createElement('div');
    subGroupContainer.style.display = "none";
    subGroupContainer.style.paddingLeft = "10px";
    let sortedSubGroups = Object.keys(groups[gName]);
    if (currentSortMode === 'time-new') sortedSubGroups.sort((a,b)=> Math.max(...groups[gName][b].map(n=>new Date(n.updateTime||0).getTime())) - Math.max(...groups[gName][a].map(n=>new Date(n.updateTime||0).getTime())));
    else if (currentSortMode === 'time-old') sortedSubGroups.sort((a,b)=> Math.min(...groups[gName][a].map(n=>new Date(n.updateTime||0).getTime())) - Math.min(...groups[gName][b].map(n=>new Date(n.updateTime||0).getTime())));
    else if (currentSortMode === 'az') sortedSubGroups.sort((a,b)=>a.localeCompare(b,'my'));
    else if (currentSortMode === 'za') sortedSubGroups.sort((a,b)=>b.localeCompare(a,'my'));
    sortedSubGroups.forEach(sgName => {
      const subGroupHeader = document.createElement('div');
      subGroupHeader.style.cssText = "padding:10px 15px;margin-top:5px;font-weight:bold;color:#444;cursor:pointer;background:#f1f1f1;border-radius:4px;border-bottom:1px dashed #ccc;";
      subGroupHeader.innerText = `📂 ${sgName}`;
      subGroupHeader.addEventListener('click', (e) => { e.stopPropagation(); showSubGroupContents(groups[gName][sgName], sgName, gName); });
      subGroupContainer.appendChild(subGroupHeader);
    });
    groupWrapper.appendChild(subGroupContainer);
    expandableList.appendChild(groupWrapper);
    groupHeader.addEventListener('click', () => {
      const isOpen = subGroupContainer.style.display === "block";
      document.querySelectorAll('#expandable-list > div > div:nth-child(2)').forEach(el => el.style.display = "none");
      subGroupContainer.style.display = isOpen? "none" : "block";
    });
  });
}

function showSubGroupContents(notes, sgName, gName) {
  viewScreen.innerHTML = `
    <div style="text-align:center;padding:15px;background:#e6dbb3;font-weight:bold;font-size:18px;border-bottom:1px solid #ccc;">📖 ${gName} / ${sgName} (${notes.length} ခု)</div>
    <div id="view-contents-container" style="padding:15px;padding-bottom:80px;overflow-y:auto;max-height:calc(100vh - 120px);"></div>
    <div style="position:fixed;bottom:0;left:0;width:100%;padding:12px;background:#e6dbb3;text-align:center;display:flex;gap:10px;justify-content:center;">
      <button id="back-main-btn" style="flex:1;padding:10px;background:#605639;color:white;border:none;border-radius:4px;font-weight:bold;">⬅️ Back</button>
      <button id="new-in-subgroup-btn" style="flex:1;padding:10px;background:#2d6a4f;color:white;border:none;border-radius:4px;font-weight:bold;">➕ New</button>
    </div>`;
  const container = document.getElementById('view-contents-container');
  notes.forEach(data => {
    const noteCard = document.createElement('div');
    noteCard.style.cssText = "padding:15px;margin-bottom:15px;border-left:5px solid #605639;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,0.08);border-radius:0 4px 4px 0;";
    noteCard.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;"><p style="margin:0;color:#605639;font-size:16px;white-space:pre-wrap;flex:1;">${data.content||'-'}</p><div style="display:flex;gap:6px;margin-left:10px;"><button class="inline-copy-btn" style="padding:4px 10px;background:#e6dbb3;border:1px solid #605639;border-radius:4px;cursor:pointer;">📋</button><button class="inline-edit-btn" style="padding:4px 10px;background:#e6dbb3;border:1px solid #605639;border-radius:4px;cursor:pointer;">✏️</button></div></div><p style="margin:3px 0;font-size:12px;color:#888;text-align:right;">${new Date(data.updateTime).toLocaleString('my-MM')}</p>`;
    noteCard.querySelector('.inline-copy-btn').addEventListener('click', async () => {
      await navigator.clipboard.writeText(data.content||'');
    });
    noteCard.querySelector('.inline-edit-btn').addEventListener('click', () => {
      currentEditId = data.id;
      groupInput.value = data.group||""; subGroupInput.value = data.subGroup||""; contentArea.value = data.content||"";
      changeScreen(editScreen);
    });
    container.appendChild(noteCard);
  });
  document.getElementById('back-main-btn').addEventListener('click', () => changeScreen(mainScreen));
  document.getElementById('new-in-subgroup-btn').addEventListener('click', () => {
    currentEditId = null; groupInput.value = gName; subGroupInput.value = sgName; contentArea.value = "";
    changeScreen(editScreen); setTimeout(()=>contentArea.focus(),100);
  });
  changeScreen(viewScreen);
}