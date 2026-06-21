/* 
const firebaseConfig = {
    apiKey: "AIzaSyC7N9_TNTp_aThC_olEDyMcEo2pAhOFEGI",
    authDomain: "arakanese-dictionary.firebaseapp.com",
    projectId: "arakanese-dictionary",
    storageBucket: "arakanese-dictionary.firebasestorage.app",
    messagingSenderId: "955711906003",
    appId: "1:955711906003:web:6d9b60bd4cdaa8a8953426"
};
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// ==========================================
// GLOBAL & SCREEN NAVIGATION
// ==========================================
let currentEditId = null;
let currentSearchText = ""; // Search စာသားသိမ်းဖို့
let debounceTimer = null; // Debounce အတွက်
let allWords = []; // Global မှာ ကြိုကြေညာထားပါ
// ၂။ ဂျာဗားစခရစ် အပေါ်ဆုံး (let တွေကြေညာတဲ့နေရာ) မှာ ဒါလေးထပ်တိုးပါ
let currentSortMode = "alphabet"; 


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

/* onSnapshot(collection(db, "ArakaneseSpellingDictInbox"), (snapshot) => {
expandableList.innerHTML = "";
if (snapshot.empty) {
expandableList.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">ဝေါဟာရများ မရှိသေးပါ။ New Word ကိုနှိပ်ပြီး ထည့်ပါ...</p>`;
return;   }

// ဒေတာများကို Group -> SubGroup အလိုက် စုစည်းခြင်း
const groups = {};
snapshot.forEach((doc) => {
const data = doc.data();
const gName = data.group || "အခြား";
const sgName = data.subGroup || "အထွေထွေ";
                
if (!groups[gName]) groups[gName] = {};
if (!groups[gName][sgName]) groups[gName][sgName] = [];
//  (id ပါ တစ်ခါတည်းတွဲမှတ်သွားတာ)
groups[gName][sgName].push({ id: doc.id, ...data });    });
        
// ၁။ Group ခေါင်းစဉ်တွေကို Unicode (က-အ) အတိုင်း စီခြင်း (b, 'my' လို့ ပြင်ပါ) 
const sortedGroups = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'my'));
sortedGroups.forEach((gName) => {
const groupWrapper = document.createElement('div');
groupWrapper.className = "group-wrapper";
groupWrapper.style.marginBottom = "8px";
                
// ဗျည်းအုပ်စု ခေါင်းစဉ် (Group)
const groupHeader = document.createElement('div');
groupHeader.className = "group-header";
groupHeader.style.cssText = "cursor: pointer; padding: 12px; background: #e6dbb3; font-weight: bold; border-radius: 4px;";
groupHeader.innerText = `📁 ဗျည်းအုပ်စု - [ ${gName} ]`;
groupWrapper.appendChild(groupHeader);
                
                // အုပ်စုခွဲများသိမ်းမယ့် Container (အစမှာ ဝှက်ထားမည်)
                const subGroupContainer = document.createElement('div');
                subGroupContainer.className = "subgroup-container-box";
                subGroupContainer.style.display = "none";
                subGroupContainer.style.paddingLeft = "10px";
                
                // ၂။ SubGroup ခေါင်းစဉ်တွေကို Unicode အတိုင်း ထပ်စီခြင်း (b, 'my' လို့ ပြင်ပါ)
                const sortedSubGroups = Object.keys(groups[gName]).sort((a, b) => a.localeCompare(b, 'my'));
                
                sortedSubGroups.forEach((sgName) => {
                        // အုပ်စုခွဲ ခေါင်းစဉ် (SubGroup)
                        const subGroupHeader = document.createElement('div');
                        subGroupHeader.style.cssText = "padding: 10px 15px; margin-top: 5px; font-weight: bold; color: #444; cursor: pointer; background-color: #f1f1f1; border-radius: 4px; border-bottom: 1px dashed #ccc;";
                        subGroupHeader.innerText = `📂 အုပ်စုခွဲ - ${sgName}`;
                        subGroupContainer.appendChild(subGroupHeader);
                        
// ၃။ Content တွေကို Status + Unicode အတိုင်း စီခြင်း
const sortedWords = groups[gName][sgName].sort((a, b) => {
        // အဆင့် 1: Status အရစီ - စောင့်ဆဲ အရင်
        const statusOrder = { 'စောင့်ဆဲ': 1, 'အတည်ပြု': 2, 'ပယ်ချ': 3 };
        const statusA = statusOrder[a.status] || 1;
        const statusB = statusOrder[b.status] || 1;
        if (statusA !== statusB) return statusA - statusB;
        
        // အဆင့် 2: စာလုံးအမှန်အရစီ
        return (a.correct || '').localeCompare(b.correct || '', 'my');
});
                        
                        // အုပ်စုခွဲ (Sub) ကို နှိပ်လိုက်ရင် Expan စာမျက်နှာကိုဖျောက်ပြီး View Screen မှာ Content အကုန်စုပြမယ့်အပိုင်း
                        subGroupHeader.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showSubGroupContents(sortedWords, sgName, gName);
                        });
                });
                
                groupWrapper.appendChild(subGroupContainer);
                expandableList.appendChild(groupWrapper);
                
                // ဗျည်းအုပ်စုကို နှိပ်ရင် အုပ်စုခွဲများ ပွင့်/ပိတ် လုပ်မယ့် Accordion Logic
                groupHeader.addEventListener('click', () => {
                        const isCurrentOpen = subGroupContainer.style.display === "block";
                        document.querySelectorAll('.subgroup-container-box').forEach(el => el.style.display = "none");
                        subGroupContainer.style.display = isCurrentOpen ? "none" : "block";
                });
        });
});*/
// ၂။ မူလ `onSnapshot(...) { ... }` အကြီးကြီးတစ်ခုလုံးကို ဖျက်ပြီး ဒါနဲ့ အစားထိုးပါ
onSnapshot(collection(db, "ArakaneseSpellingDictInbox"), (snapshot) => {
        allWords = [];
        snapshot.forEach((doc) => {
                allWords.push({ id: doc.id, ...doc.data() });
        });
        showWords(); 
});
// ၃။ အပေါ်က onSnapshot ကုဒ်အဆုံးရဲ့အောက်မှာ ဒီ showWords() အသစ်ကို ထပ်ထည့်ပေးပါ
function showWords() {
        expandableList.innerHTML = "";
        
        const filteredData = allWords.filter(word => 
                (word.correct || "").includes(currentSearchText) || 
                (word.wrong || "").includes(currentSearchText)
        /* ထပ်တိုးရှာနိုင်ရန်const filteredData = allWords.filter(word => 
        (word.correct || "").includes(currentSearchText) || 
        (word.wrong || "").includes(currentSearchText) ||
        (word.spell || "").includes(currentSearchText) || // ရေးနည်းရှာရန်
        (word.note || "").includes(currentSearchText)     // မှတ်ချက်ရှာရန် ); */
        );

        if (filteredData.length === 0) {
                expandableList.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">ရှာမတွေ့ပါ...</p>`;
                return;
        }

        // ၃။ `showWords()` ထဲက `filteredData.forEach` အပိုင်းကို ဒါနဲ့ အစားထိုးလိုက်ပါ
const groups = {};
filteredData.forEach((data) => {
    let gName, sgName;
    
    if (currentSortMode === 'alphabet') {
        gName = data.group || "အခြား";
        sgName = data.subGroup || "အထွေထွေ";
    } else if (currentSortMode === 'pos') {
        gName = data.pos || "အခြား (အမျိုးအစားမရှိ)";
        sgName = data.group || "အထွေထွေ"; 
    } else if (currentSortMode === 'semantic') {
        gName = data.semanticType || "အခြား (အမျိုးအမည်မရှိ)";
        sgName = data.pos || "အထွေထွေ"; 
    }

    if (!groups[gName]) groups[gName] = {};
    if (!groups[gName][sgName]) groups[gName][sgName] = [];
    groups[gName][sgName].push(data);
});

        const sortedGroups = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'my'));
        sortedGroups.forEach((gName) => {
                const groupWrapper = document.createElement('div');
                groupWrapper.className = "group-wrapper";
                groupWrapper.style.marginBottom = "8px";
                        
                const groupHeader = document.createElement('div');
                groupHeader.className = "group-header";
                groupHeader.style.cssText = "cursor: pointer; padding: 12px; background: #e6dbb3; font-weight: bold; border-radius: 4px;";
                groupHeader.innerText = ` ${gName} `;
                groupWrapper.appendChild(groupHeader);
                        
                const subGroupContainer = document.createElement('div');
                subGroupContainer.className = "subgroup-container-box";
                subGroupContainer.style.display = "none";
                subGroupContainer.style.paddingLeft = "10px";
                        
                const sortedSubGroups = Object.keys(groups[gName]).sort((a, b) => a.localeCompare(b, 'my'));
                        
                sortedSubGroups.forEach((sgName) => {
                        const subGroupHeader = document.createElement('div');
                        subGroupHeader.style.cssText = "padding: 10px 15px; margin-top: 5px; font-weight: bold; color: #444; cursor: pointer; background-color: #f1f1f1; border-radius: 4px; border-bottom: 1px dashed #ccc;";
                        subGroupHeader.innerText = ` ${sgName}`;
                        subGroupContainer.appendChild(subGroupHeader);
                                
                        const sortedWords = groups[gName][sgName].sort((a, b) => {
                                const statusOrder = { 'စောင့်ဆဲ': 1, 'အတည်ပြု': 2, 'ပယ်ချ': 3 };
                                const statusA = statusOrder[a.status] || 1;
                                const statusB = statusOrder[b.status] || 1;
                                if (statusA !== statusB) return statusA - statusB;
                                return (a.correct || '').localeCompare(b.correct || '', 'my');
                        });
                                
                        subGroupHeader.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showSubGroupContents(sortedWords, sgName, gName);
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
// 1 : Search စ
const searchBox = document.getElementById('searchBox');
const clearBtn = document.getElementById('clearSearchBtn');
// စာရိုက်တိုင်း Debounce နဲ့ search
searchBox.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
                currentSearchText = searchBox.value;
                clearBtn.style.display = currentSearchText ? 'block' : 'none';
                showWords(); // filter နဲ့ပြန်ပြမယ်
        }, 300);
});
// ✖ ခလုတ်နှိပ်ရင်
clearBtn.addEventListener('click', () => {
        searchBox.value = "";
        currentSearchText = "";
        clearBtn.style.display = 'none';
        showWords(); // မူလစာရင်းပြန်ပြမယ်
});
// 1 : Search ဆ

// SCREEN 1: MAIN SCREEN (Group -> SubGroup Accordion)//==============ဆ


// SCREEN 2: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================စ
function highlightWord(sentence, word) {
        if (!sentence || !word) return sentence || '-';
        const regex = new RegExp(`(^|\\s|[.,;:!?၊။"']|\\()${escapeRegExp(word)}(?=\\s|[.,;:!?၊။"']|\\)|$)`, 'g');
        return sentence.replace(regex, `$1<b>${word}</b>`);
}
function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function showSubGroupContents(words, sgName, gName) {
        viewScreen.innerHTML = `
    <div style="text-align:center; padding:15px; background:#e6dbb3; font-weight:bold; font-size:18px; border-bottom:1px solid #ccc;">
      📖 အုပ်စုခွဲ - ${sgName} (${words.length} ခု)
    </div>
    <div id="view-contents-container" style="padding: 15px; padding-bottom: 80px; overflow-y: auto; max-height: calc(100vh - 120px);"></div>
    <div style="position: fixed; bottom: 0; left: 0; width: 100%; padding: 12px; background: #e6dbb3; text-align: center; box-shadow: 0 -2px 5px rgba(0,0,0,0.1); display: flex; gap: 10px; justify-content: center;">
      <button id="back-main-btn" style="flex:1; padding: 10px 25px; background: #605639; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">⬅️ Back</button>
      <button id="new-in-subgroup-btn" style="flex:1; padding: 10px 25px; background: #2d6a4f; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">➕ New in ${sgName}</button>
    </div>
  `;
        
        const container = document.getElementById('view-contents-container');
        
        words.forEach(data => {
                const wordCard = document.createElement('div');
                wordCard.style.cssText = "padding: 15px; margin-bottom: 15px; border-left: 5px solid #605639; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.08); border-radius: 0 4px 4px 0; position: relative;";
                
                // Status Badge အရောင်
                const statusColor = data.status === 'အတည်ပြု' ? '#4CAF50' : data.status === 'ပယ်ချ' ? '#f44336' : '#FF9800';
                
                let audioHtml = data.audioUrl ? `<button class="inline-play-btn" style="margin-left:10px; padding:3px 8px; background:#605639; color:#fff; border:none; cursor:pointer; border-radius:3px; font-size:12px;">🔊 အသံဖွင့်ရန်</button>` : '';
                
                wordCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="margin: 0; color: #605639; font-size: 18px;">
          ${data.correct || '-'}
          <span style="font-size: 13px; color: #777; font-weight: normal;">[${data.pos || ''}]</span>
        </h3>
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="padding:2px 10px; border-radius:12px; font-size:12px; background:${statusColor}; color:white;">
            ${data.status || 'စောင့်ဆဲ'}
          </span>
          <button class="inline-edit-btn" style="padding: 4px 10px; background: #e6dbb3; color: #605639; border: 1px solid #605639; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✏️ Edit</button>
        </div>
      </div>
      ${data.semanticType? `<p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>အမျိုးအမည်:</strong> ${data.semanticType}</p>` : ''}
      
      <p style="margin: 5px 0; font-size: 14px;"><strong>စာလုံးအမှား:</strong> ${data.wrong || '-'}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>ဥပမာ:</strong> ${highlightWord(data.example, data.correct)}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>ရေးနည်း:</strong> ${data.spell || '-'}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>အသံထွက်:</strong> ${data.read || '-'} ${audioHtml}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>ကိုးကား:</strong> ${data.source || '-'}</p>
      <hr style="margin:10px 0; border:none; border-top:1px dashed #ddd;">
      <p style="margin: 3px 0; font-size: 12px; color: #888;"><strong>တင်သွင်းသူ:</strong> ${data.submitterId || '-'} | <strong>ချိန်:</strong> ${data.submitTime || '-'}</p>
      <p style="margin: 3px 0; font-size: 12px; color: #888;"><strong>အတည်ပြုသူ:</strong> ${data.reviewerId || '-'} | <strong>ချိန်:</strong> ${data.reviewTime || '-'}</p>
      <p style="margin: 3px 0; font-size: 12px; color: #888;"><strong>မှတ်ချက်:</strong> ${data.note || '-'}</p>
    `;
                
                if (data.audioUrl) {
                        wordCard.querySelector('.inline-play-btn').addEventListener('click', () => {
                                new Audio(data.audioUrl).play();
                        });
                }
                
                // ✏️ Edit ခလုတ်နှိပ်ရင် Input 16 ခုလုံးပြန်ဖြည့်
                wordCard.querySelector('.inline-edit-btn').addEventListener('click', () => {
                        currentEditId = data.id;
                        document.getElementById('group').value = data.group || "";
                        document.getElementById('subGroup').value = data.subGroup || "";
                        document.getElementById('correct').value = data.correct || "";
                        document.getElementById('wrong').value = data.wrong || "";
                        document.getElementById('pos').value = data.pos || "";
                        document.getElementById('example').value = data.example || "";
                        document.getElementById('spell').value = data.spell || "";
                        document.getElementById('read').value = data.read || "";
                        document.getElementById('audioUrl').value = data.audioUrl || "";
                        document.getElementById('source').value = data.source || "";
                        document.getElementById('semanticType').value = data.semanticType || "";
                        // အသစ်တိုး 6 ခု
                        document.getElementById('submitterId').value = data.submitterId || "";
                        document.getElementById('submitTime').value = data.submitTime || "";
                        document.getElementById('status').value = data.status || "စောင့်ဆဲ";
                        document.getElementById('reviewerId').value = data.reviewerId || "";
                        document.getElementById('reviewTime').value = data.reviewTime || "";
                        document.getElementById('note').value = data.note || "";
                        
                        changeScreen(editScreen);
                });
                
                container.appendChild(wordCard);
        });
        
        document.getElementById('back-main-btn').addEventListener('click', () => changeScreen(mainScreen));
        changeScreen(viewScreen);
        
        document.getElementById('new-in-subgroup-btn').addEventListener('click', () => {
                currentEditId = null;
                document.querySelectorAll('.input-form input,.input-form select').forEach(input => input.value = "");
                document.getElementById('group').value = words[0]?.group || gName;
                document.getElementById('subGroup').value = sgName;
                document.getElementById('status').value = "စောင့်ဆဲ";
                changeScreen(editScreen);
                setTimeout(() => document.getElementById('correct').focus(), 100);
        });
}
// SCREEN 2: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================ဆ


// SCREEN 3: EDIT SCREEN (ဒေတာ သိမ်းဆည်းခြင်း/ ပြုပြင်ခြင်း )================စ
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveWordBtn = document.getElementById('save-word-btn');

cancelEditBtn.addEventListener('click', () => changeScreen(mainScreen));

// Screen 3-Bဒေတာသိမ်း ခလုတ်
saveWordBtn.addEventListener('click', async () => {
                        const wordData = {
                                group: document.getElementById('group').value.trim(),
                                subGroup: document.getElementById('subGroup').value.trim(),
                                correct: document.getElementById('correct').value.trim(),
                                wrong: document.getElementById('wrong').value.trim(),
                                pos: document.getElementById('pos').value.trim(),
                                example: document.getElementById('example').value.trim(),
                                spell: document.getElementById('spell').value.trim(),
                                read: document.getElementById('read').value.trim(),
                                audioUrl: document.getElementById('audioUrl').value.trim(),
                                source: document.getElementById('source').value.trim(),
                                semanticType: document.getElementById('semanticType').value,
                                submitterId: document.getElementById('submitterId').value.trim(),
                                submitTime: new Date().toISOString(),
                                status: document.getElementById('status').value,
                                reviewerId: document.getElementById('reviewerId').value.trim(),
                                reviewTime: document.getElementById('reviewTime').value.trim(),
                                note: document.getElementById('note').value.trim()
                        };
                        
                        if (!wordData.group || !wordData.subGroup || !wordData.correct) {
                                alert("အနည်းဆုံး ၁၊ ၂၊ ၃ အကွက်ကိုတော့ ဖြည့်ပေးပါဦး။");
                                return;
                        }
                        
                        try {
                                let isEdit = false;
                                if (currentEditId) {
                                        await updateDoc(doc(db, "ArakaneseSpellingDictInbox", currentEditId), wordData);
                                        isEdit = true;
                                } else {
                                        await addDoc(collection(db, "ArakaneseSpellingDictInbox"), wordData);
                                        }
                                        
                                        // Modal ပြမယ်
                                        document.getElementById('successMsg').textContent = isEdit ?
                                                'သတ်ပုံစာလုံး ပြင်ဆင်ပြီးပါပြီ။' :
                                                'သတ်ပုံစာလုံးအသစ် သိမ်းပြီးပါပြီ။';
                                        document.getElementById('successModal').style.display = 'flex';
                                        
                                        // OK ခလုတ်: Main ပြန်မယ်
                                        document.getElementById('btnOk').onclick = function() {
                                                document.getElementById('successModal').style.display = 'none';
                                                currentEditId = null;
                                                document.querySelectorAll('.input-form input, .input-form select').forEach(input => input.value = "");
                                                document.getElementById('status').value = "စောင့်ဆဲ";
                                                document.getElementById('submitterId').value = "A-0000001"; // မင်းအိုင်ဒီ 7 လုံးနဲ့လဲ
                                                changeScreen(mainScreen);
                                        }
                                        
                                        // New ခလုတ်: Form မှာပဲနေမယ်
                                        // New ခလုတ်: Form မှာပဲနေမယ် - group/subgroup ကျန်ခဲ့မယ်
document.getElementById('btnNew').onclick = function() {
        document.getElementById('successModal').style.display = 'none';
        currentEditId = null;
        
        // group နဲ့ subGroup ကို သိမ်းထား
        const keepGroup = document.getElementById('group').value;
        const keepSubGroup = document.getElementById('subGroup').value;
        
        // ကျန်တာအားလုံး Clear
        document.querySelectorAll('.input-form input, .input-form select').forEach(input => {
                if (input.id !== 'group' && input.id !== 'subGroup') {
                        input.value = "";
                }
        });
        
        // group, subGroup ပြန်ဖြည့်
        document.getElementById('group').value = keepGroup;
        document.getElementById('subGroup').value = keepSubGroup;
        
        document.getElementById('status').value = "စောင့်ဆဲ";
        document.getElementById('submitterId').value = "A-0000001"; // မင်းအိုင်ဒီ
        
        document.getElementById('correct').focus(); // correct ကိုတန်းရောက်
}
                                        
                                } catch (error) {
                                        console.error("Error: ", error);
                                        alert('ဒေတာသိမ်းလို့မရပါ၊ Firebase Rules ကို စစ်ပေးပါ။');
                                }
                        });
// အသံဖိုင်လင့်ကို Clipboard ထဲကနေ Paste ချပေးမယ့် Function
document.getElementById('paste-audio-btn').addEventListener('click', async () => {
        try {
                const text = await navigator.clipboard.readText();
                document.getElementById('audioUrl').value = text;
        } catch (err) {
                alert('Clipboard ထဲကစာကို ဖတ်လို့မရပါဘူး။ Browser က Permission တောင်းရင် Allow ပေးလိုက်ပါ။');
        }
});
// SCREEN 3: EDIT SCREEN (ဒေတာ သိမ်းဆည်းခြင်း/ ပြုပြင်ခြင်း )================ဆ

// Screen 4 ViewUserList စ ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 

// Screen 4 ViewUserList ဆ ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 