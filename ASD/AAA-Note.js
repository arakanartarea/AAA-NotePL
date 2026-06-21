const firebaseConfig = {
        apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
        authDomain: "arakanartarea-note.firebaseapp.com",
        projectId: "arakanartarea-note",
        storageBucket: "arakanartarea-note.firebasestorage.app",
        messagingSenderId: "695659736666",
        
        appId: "1:695659736666:web:1e76494c0e6819609bf263",
        measurementId: "G-Y9Y5SK15M9"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// GLOBAL & SCREEN NAVIGATION
// ==========================================
let currentEditId = null;
let currentSearchText = ""; // Search စာသားသိမ်းဖို့
let debounceTimer = null; // Debounce အတွက်
let allWords = []; // Global မှာ ကြိုကြေညာထားပါ
// ၂။ ဂျာဗားစခရစ် အပေါ်ဆုံး (let တွေကြေညာတဲ့နေရာ) မှာ ဒါလေးထပ်တိုးပါ
let currentSortMode = 'time-new'; // အရင် 'alphabet' ကို 'time-new' ပြောင်း


const mainScreen = document.getElementById('main-screen');
const editScreen = document.getElementById('edit-screen');
const viewScreen = document.getElementById('view-screen');

function changeScreen(targetScreen) {
        mainScreen.classList.add('hidden');
        editScreen.classList.add('hidden');
        viewScreen.classList.add('hidden');
        targetScreen.classList.remove('hidden');
}

// SCREEN 1: MAIN SCREEN (Group -> SubGroup Accordion)//==============စ 
const expandableList = document.getElementById('expandable-list');
const newWordBtn = document.getElementById('new-word-btn');
//ရိုးအသစ် စ
newWordBtn.addEventListener('click', () => {
currentEditId = null; // ID ကို ဗလာပြန်လုပ်မယ်
document.querySelectorAll('.input-form input').forEach(input => input.value = ""); 
// စာရိုက်တဲ့အကွက်တွေ အကုန်ရှင်းမယ်
changeScreen(editScreen); });
// စီခြင်း ပုံစံ စ
document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSortMode = e.target.value;
    showWords(); // ပြောင်းရွေးတာနဲ့ ဒေတာတွေကို ပြန်စီမယ်
});
// ဝက်ဘ်စာမျက်နှာ ပြောင်း
document.getElementById('Screen-select').addEventListener('change', function() {
    if (this.value) {
       // window.open(this.value, '_blank'); // Tab အသစ်နဲ့ ဖွင့်ဖို့
         window.location.href = this.value; // လက်ရှိ Tab မှာပဲ ဖွင့်ဖို့ (ဒါကိုသုံးချင်ရင် အပေါ်စာကြောင်းကို ဖျက်ပါ)
    }
});


// ၂။ မူလ `onSnapshot(...) { ... }` အကြီးကြီးတစ်ခုလုံးကို ဖျက်ပြီး ဒါနဲ့ အစားထိုးပါ
onSnapshot(collection(db, "AAAnotes"), (snapshot) => {
  allWords = []; // allNotes ဆိုပြီးပြောင်းရင်ပိုကောင်းမယ်၊ ဒါပေမယ့်မပြောင်းလည်းရ
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.role !== 2) { // ဖျက်ထားတာ = role 2 မပြဘူး
      allWords.push({ id: doc.id, ...data });
    }
  });
  showWords();
});

// ၃။ အပေါ်က onSnapshot ကုဒ်အဆုံးရဲ့အောက်မှာ ဒီ showWords() အသစ်ကို ထပ်ထည့်ပေးပါ
function showWords() {
  expandableList.innerHTML = "";
  
  let filteredData = allWords.filter(note => {
    const search = currentSearchText.toLowerCase();
    return (
      (note.group || "").toLowerCase().includes(search) ||
      (note.subGroup || "").toLowerCase().includes(search) ||
      (note.content || "").toLowerCase().includes(search)
    );
  });
  
  if (filteredData.length === 0) {
    expandableList.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">ရှာမတွေ့ပါ...</p>`;
    return;
  }
  
  // Group/SubGroup မရှိရင် default ပေး
  filteredData.forEach(w => {
    w.group = w.group || "အခြား";
    w.subGroup = w.subGroup || "အထွေထွေ";
  });
  
  // Group ဖွဲ့မယ်
  const groups = {};
  filteredData.forEach((data) => {
    const gName = data.group;
    const sgName = data.subGroup;
    if (!groups[gName]) groups[gName] = {};
    if (!groups[gName][sgName]) groups[gName][sgName] = [];
    groups[gName][sgName].push(data);
  });
  
  // Group စီမယ်
  let sortedGroups = Object.keys(groups);
  
  if (currentSortMode === 'time-new') {
    // Group ထဲက အသစ်ဆုံး updateTime နဲ့စီ
    sortedGroups.sort((a, b) => {
      const timeA = Math.max(...Object.values(groups[a]).flat().map(n => new Date(n.updateTime || 0).getTime()));
      const timeB = Math.max(...Object.values(groups[b]).flat().map(n => new Date(n.updateTime || 0).getTime()));
      return timeB - timeA;
    });
  }
  else if (currentSortMode === 'time-old') {
    // Group ထဲက အဟောင်းဆုံး updateTime နဲ့စီ
    sortedGroups.sort((a, b) => {
      const timeA = Math.min(...Object.values(groups[a]).flat().map(n => new Date(n.updateTime || 0).getTime()));
      const timeB = Math.min(...Object.values(groups[b]).flat().map(n => new Date(n.updateTime || 0).getTime()));
      return timeA - timeB;
    });
  }
  else if (currentSortMode === 'az') {
    sortedGroups.sort((a, b) => a.localeCompare(b, 'my'));
  }
  else if (currentSortMode === 'za') {
    sortedGroups.sort((a, b) => b.localeCompare(a, 'my'));
  }
  
  sortedGroups.forEach((gName) => {
    const groupWrapper = document.createElement('div');
    groupWrapper.className = "group-wrapper";
    groupWrapper.style.marginBottom = "8px";
    
    const groupHeader = document.createElement('div');
    groupHeader.className = "group-header";
    groupHeader.style.cssText = "cursor: pointer; padding: 12px; background: #e6dbb3; font-weight: bold; border-radius: 4px;";
    groupHeader.innerText = `📁 ${gName}`;
    groupWrapper.appendChild(groupHeader);
    
    const subGroupContainer = document.createElement('div');
    subGroupContainer.className = "subgroup-container-box";
    subGroupContainer.style.display = "none";
    subGroupContainer.style.paddingLeft = "10px";
    
    // SubGroup စီမယ်
    let sortedSubGroups = Object.keys(groups[gName]);
    
    if (currentSortMode === 'time-new') {
      sortedSubGroups.sort((a, b) => {
        const timeA = Math.max(...groups[gName][a].map(n => new Date(n.updateTime || 0).getTime()));
        const timeB = Math.max(...groups[gName][b].map(n => new Date(n.updateTime || 0).getTime()));
        return timeB - timeA;
      });
    }
    else if (currentSortMode === 'time-old') {
      sortedSubGroups.sort((a, b) => {
        const timeA = Math.min(...groups[gName][a].map(n => new Date(n.updateTime || 0).getTime()));
        const timeB = Math.min(...groups[gName][b].map(n => new Date(n.updateTime || 0).getTime()));
        return timeA - timeB;
      });
    }
    else if (currentSortMode === 'az') {
      sortedSubGroups.sort((a, b) => a.localeCompare(b, 'my'));
    }
    else if (currentSortMode === 'za') {
      sortedSubGroups.sort((a, b) => b.localeCompare(a, 'my'));
    }
    
    sortedSubGroups.forEach((sgName) => {
      const subGroupHeader = document.createElement('div');
      subGroupHeader.style.cssText = "padding: 10px 15px; margin-top: 5px; font-weight: bold; color: #444; cursor: pointer; background-color: #f1f1f1; border-radius: 4px; border-bottom: 1px dashed #ccc;";
      subGroupHeader.innerText = `📂 ${sgName}`;
      subGroupContainer.appendChild(subGroupHeader);
      
      subGroupHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        showSubGroupContents(groups[gName][sgName], sgName, gName);
      });
    });
    
    groupWrapper.appendChild(subGroupContainer);
    expandableList.appendChild(groupWrapper);
    
    groupHeader.addEventListener('click', () => {
      const isCurrentOpen = subGroupContainer.style.display === "block";
      document.querySelectorAll('.subgroup-container-box').forEach(el => el.style.display = "none");
      subGroupContainer.style.display = isCurrentOpen ? "none" : "block";
    });
  });
}
// Search စ
const searchBox = document.getElementById('searchBox');
const clearBtn = document.getElementById('clearSearchBtn');

// စာရိုက်တိုင်း 300ms စောင့်ပြီး ရှာမယ်
searchBox.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentSearchText = searchBox.value;
    clearBtn.style.display = currentSearchText ? 'block' : 'none';
    showWords(); // ရှာပြီးပြန်ပြ
  }, 300);
});

// ✖ ခလုတ်နှိပ်ရင် Clear
clearBtn.addEventListener('click', () => {
  searchBox.value = "";
  currentSearchText = "";
  clearBtn.style.display = 'none';
  showWords();
});
// Search ဆ

// SCREEN 1: MAIN SCREEN (Group -> SubGroup Accordion)//==============ဆ


// SCREEN 2: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================စ
// SCREEN 2: VIEW SCREEN - မှတ်စုတွေပြမယ်
function showSubGroupContents(notes, sgName, gName) {
  viewScreen.innerHTML = `
    <div style="text-align:center; padding:15px; background:#e6dbb3; font-weight:bold; font-size:18px; border-bottom:1px solid #ccc;">
      📖 ${gName} / ${sgName} (${notes.length} ခု)
    </div>
    <div id="view-contents-container" style="padding: 15px; padding-bottom: 80px; overflow-y: auto; max-height: calc(100vh - 120px);"></div>
    <div style="position: fixed; bottom: 0; left: 0; width: 100%; padding: 12px; background: #e6dbb3; text-align: center; box-shadow: 0 -2px 5px rgba(0,0,0,0.1); display: flex; gap: 10px; justify-content: center;">
      <button id="back-main-btn" style="flex:1; padding: 10px 25px; background: #605639; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">⬅️ Back</button>
      <button id="new-in-subgroup-btn" style="flex:1; padding: 10px 25px; background: #2d6a4f; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">➕ New</button>
    </div>
  `;
  
  const container = document.getElementById('view-contents-container');
  
  notes.forEach(data => {
    const noteCard = document.createElement('div');
    noteCard.style.cssText = "padding: 15px; margin-bottom: 15px; border-left: 5px solid #605639; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.08); border-radius: 0 4px 4px 0;";
    
    // Role 3 = Fav ဆို ကြယ်ပြမယ်
    const favIcon = data.role === 3 ? '⭐ ' : '';
    
    noteCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <p style="margin: 0; color: #605639; font-size: 16px; white-space: pre-wrap; flex:1;">${favIcon}${data.content || '-'}</p>
        <button class="inline-edit-btn" style="padding: 4px 10px; background: #e6dbb3; color: #605639; border: 1px solid #605639; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; margin-left:10px;">✏️</button>
      </div>
      <p style="margin: 3px 0; font-size: 12px; color: #888; text-align:right;">
        ${new Date(data.updateTime).toLocaleString('my-MM')}
      </p>
    `;
    
    // ✏️ Edit ခလုတ်နှိပ်ရင်
    noteCard.querySelector('.inline-edit-btn').addEventListener('click', () => {
      currentEditId = data.id;
      document.getElementById('group').value = data.group || "";
      document.getElementById('subGroup').value = data.subGroup || "";
      document.getElementById('content').value = data.content || "";
      resetUndoStack(data.content || ""); // ဒီစာကြောင်းထည့်
      changeScreen(editScreen);
    });
    
    container.appendChild(noteCard);
  });
  
  document.getElementById('back-main-btn').addEventListener('click', () => changeScreen(mainScreen));
  
  document.getElementById('new-in-subgroup-btn').addEventListener('click', () => {
    currentEditId = null;
    document.querySelectorAll('.input-form input, .input-form textarea').forEach(input => input.value = "");
    document.getElementById('group').value = gName;
    document.getElementById('subGroup').value = sgName;
    changeScreen(editScreen);
    setTimeout(() => document.getElementById('content').focus(), 100);
  });
  
  changeScreen(viewScreen);
}

// highlightWord နဲ့ escapeRegExp function 2 ခု လုံးဝဖျက်ပစ်လို့ရပြီ။ မလိုတော့ဘူး။
// SCREEN 2: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================ဆ



// SCREEN 3: EDIT SCREEN ================စ
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveWordBtn = document.getElementById('save-word-btn');
const contentArea = document.getElementById('content');

let undoStack = [];
let redoStack = [];

cancelEditBtn.addEventListener('click', () => changeScreen(mainScreen));

saveWordBtn.addEventListener('click', async () => {
  const noteData = {
    group: document.getElementById('group').value.trim() || "အခြား",
    subGroup: document.getElementById('subGroup').value.trim() || "အထွေထွေ",
    content: contentArea.value.trim(),
    role: 1,
    updateTime: new Date().toISOString()
  };
  
  if (!noteData.content) {
    alert("မှတ်စုထဲစာဖြည့်ဦး");
    return;
  }
  
  try {
    if (currentEditId) {
      await updateDoc(doc(db, "AAAnotes", currentEditId), noteData);
    } else {
      await addDoc(collection(db, "AAAnotes"), noteData);
    }
    currentEditId = null;
    document.getElementById('group').value = "";
    document.getElementById('subGroup').value = "";
    contentArea.value = "";
    changeScreen(mainScreen);
  } catch (error) {
    alert('မရဘူး');
  }
});

// Undo: space ရိုက်ပြီးမှမှတ်၊ တစ်လုံးစီမမှတ်တော့ဘူး
contentArea.addEventListener('keyup', (e) => {
  if (e.key === ' ' || e.key === 'Enter' || e.key === '၊' || e.key === '။') {
    if (undoStack[undoStack.length - 1] !== contentArea.value) {
      undoStack.push(contentArea.value);
      if (undoStack.length > 100) undoStack.shift();
      redoStack = [];
    }
  }
});

// Toolbar
document.getElementById('editor-toolbar').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn || !btn.dataset.cmd) return;
  
  e.preventDefault();
  contentArea.focus();
  const cmd = btn.dataset.cmd;
  const start = contentArea.selectionStart;
  const end = contentArea.selectionEnd;
  
  if (cmd === 'undo') {
    if (undoStack.length > 1) {
      redoStack.push(undoStack.pop());
      contentArea.value = undoStack[undoStack.length - 1] || '';
      contentArea.setSelectionRange(0, 0);
    }
  }
  if (cmd === 'redo') {
    if (redoStack.length > 0) {
      const val = redoStack.pop();
      undoStack.push(val);
      contentArea.value = val;
      contentArea.setSelectionRange(0, 0);
    }
  }
  if (cmd === 'copy') {
    await navigator.clipboard.writeText(contentArea.value.substring(start, end) || contentArea.value);
  }
  if (cmd === 'paste') {
    try {
      const text = await navigator.clipboard.readText();
      contentArea.value = contentArea.value.slice(0, start) + text + contentArea.value.slice(end);
      contentArea.setSelectionRange(start + text.length, start + text.length);
    } catch {}
  }
  if (cmd === 'selectAll') contentArea.select();
  if (cmd === 'left') contentArea.setSelectionRange(Math.max(0, start - 1), Math.max(0, start - 1));
  if (cmd === 'right') contentArea.setSelectionRange(start + 1, start + 1);
  if (cmd === 'up') {
    const lines = contentArea.value.substr(0, start).split('\n');
    const currentLine = lines.length - 1;
    const currentCol = lines[currentLine].length;
    if (currentLine > 0) {
      const newPos = lines.slice(0, currentLine - 1).join('\n').length + Math.min(currentCol, lines[currentLine - 1].length) + 1;
      contentArea.setSelectionRange(newPos, newPos);
    }
  }
  if (cmd === 'down') {
    const lines = contentArea.value.split('\n');
    const beforeCursor = contentArea.value.substr(0, start).split('\n');
    const currentLine = beforeCursor.length - 1;
    const currentCol = beforeCursor[currentLine].length;
    if (currentLine < lines.length - 1) {
      const newPos = lines.slice(0, currentLine + 1).join('\n').length + Math.min(currentCol, lines[currentLine + 1].length) + 1;
      contentArea.setSelectionRange(newPos, newPos);
    }
  }
});

function resetUndoStack(text) {
  undoStack = [text || ''];
  redoStack = [];
}
// SCREEN 3: EDIT SCREEN ================ဆ

// Screen 4 ViewUserList စ ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 

// Screen 4 ViewUserList ဆ ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 