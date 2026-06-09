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

// ==========================================
// FIREBASE SETUP (⚠️ မင်းရဲ့ Config ကုဒ်တွေ အစားထိုးပါ)
// ==========================================
/*
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

const mainScreen = document.getElementById('main-screen');
const editScreen = document.getElementById('edit-screen');
const viewScreen = document.getElementById('view-screen');

function changeScreen(targetScreen) {
    mainScreen.classList.add('hidden');
    editScreen.classList.add('hidden');
    viewScreen.classList.add('hidden');
    targetScreen.classList.remove('hidden');
}


// SCREEN 1: MAIN SCREEN (Group -> SubGroup Accordion)//==============စ showSubGroupContents(sortedWords, sgName, gName);
const expandableList = document.getElementById('expandable-list');
const newWordBtn = document.getElementById('new-word-btn');
newWordBtn.addEventListener('click', () => {
    currentEditId = null; // ID ကို ဗလာပြန်လုပ်မယ်
    document.querySelectorAll('.input-form input').forEach(input => input.value = ""); // စာရိုက်တဲ့အကွက်တွေ အကုန်ရှင်းမယ်
    changeScreen(editScreen);
});
onSnapshot(collection(db, "ArakaneseSpellingDict"), (snapshot) => {
    expandableList.innerHTML = "";
    
    if (snapshot.empty) {
        expandableList.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">ဝေါဟာရများ မရှိသေးပါ။ New Word ကိုနှိပ်ပြီး ထည့်ပါ...</p>`;
        return;
    }
    /*
        // ဒေတာများကို Group -> SubGroup အလိုက် စုစည်းခြင်း
        const groups = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            const gName = data.group || "အခြား";
            const sgName = data.subGroup || "အထွေထွေ";

            if (!groups[gName]) groups[gName] = {};
            if (!groups[gName][sgName]) groups[gName][sgName] = [];
            
            groups[gName][sgName].push(data);
        });
    */
    // ဒေတာများကို Group -> SubGroup အလိုက် စုစည်းခြင်း
    const groups = {};
    snapshot.forEach((doc) => {
        const data = doc.data();
        const gName = data.group || "အခြား";
        const sgName = data.subGroup || "အထွေထွေ";
        
        if (!groups[gName]) groups[gName] = {};
        if (!groups[gName][sgName]) groups[gName][sgName] = [];
        
        // ပြင်ရမယ့်နေရာက ဒီစာကြောင်းလေးပဲ (id ပါ တစ်ခါတည်းတွဲမှတ်သွားတာ)
        groups[gName][sgName].push({ id: doc.id, ...data });
    });
    
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
            
            // ၃။ Content (ဝေါဟာရစာလုံး) တွေကိုပါ Unicode အတိုင်း စီခြင်း (b.word, 'my' လို့ ပြင်ပါ)
            const sortedWords = groups[gName][sgName].sort((a, b) => (a.correct || '').localeCompare(b.correct || '', 'my'));
            
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
});
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
        
        let audioHtml = data.audioUrl ? `<button class="inline-play-btn" style="margin-left:10px; padding:3px 8px; background:#605639; color:#fff; border:none; cursor:pointer; border-radius:3px; font-size:12px;">🔊 အသံဖွင့်ရန်</button>` : '';
        
        wordCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="margin: 0; color: #605639; font-size: 18px;">${data.correct || '-'} 
          <span style="font-size: 13px; color: #777; font-weight: normal;">[${data.pos || ''}]</span>
        </h3>
        <button class="inline-edit-btn" style="padding: 4px 10px; background: #e6dbb3; color: #605639; border: 1px solid #605639; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✏️ Edit</button>
      </div>
      <p style="margin: 5px 0; font-size: 14px;"><strong>စာလုံးအမှား:</strong> ${data.wrong || '-'}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>ဥပမာစာကြောင်း:</strong> ${highlightWord(data.example, data.correct)}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>ရေးနည်း:</strong> ${data.spell || '-'}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>အသံထွက်:</strong> ${data.read || '-'} ${audioHtml}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>ကိုးကားကျမ်း:</strong> ${data.source || '-'}</p>
    `;
        
        if (data.audioUrl) {
            wordCard.querySelector('.inline-play-btn').addEventListener('click', () => {
                new Audio(data.audioUrl).play();
            });
        }
        
        // ✏️ Edit ခလုတ်နှိပ်ရင် Input ထဲပြန်ဖြည့်တဲ့ Logic - 10 ခုလုံးပြောင်း
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
            changeScreen(editScreen);
        });
        
        container.appendChild(wordCard);
    });
    
    document.getElementById('back-main-btn').addEventListener('click', () => changeScreen(mainScreen));
    changeScreen(viewScreen);
    // New in SubGroup ခလုတ်နှိပ်ရင်
document.getElementById('new-in-subgroup-btn').addEventListener('click', () => {
    currentEditId = null; // အသစ်မို့ ID မရှိ
    
    // Input တွေအကုန်ရှင်းပြီး group, subGroup ကိုဖြည့်
    document.querySelectorAll('.input-form input').forEach(input => input.value = "");
    document.getElementById('group').value = words[0]?.group || gName; // gName ကို showSubGroupContents ထဲ ထပ်ပို့ပေးရမယ်
    document.getElementById('subGroup').value = sgName;
    
    // Correct input ကို focus ချပေးလိုက်
    changeScreen(editScreen);
    setTimeout(() => document.getElementById('correct').focus(), 100);
});
}
// SCREEN 2: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================ဆ

// SCREEN 3: EDIT SCREEN (ဒေတာ သိမ်းဆည်းခြင်း/ ပြုပြင်ခြင်း )================စ
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveWordBtn = document.getElementById('save-word-btn');

cancelEditBtn.addEventListener('click', () => changeScreen(mainScreen));

// ဒေတာသိမ်း ခလုတ်
saveWordBtn.addEventListener('click', async () => {
    const wordData = {
        group: document.getElementById('group').value.trim(), // ၁။ ဗျည်း
        subGroup: document.getElementById('subGroup').value.trim(), // ၂။ ဗျည်း+သရ
        correct: document.getElementById('correct').value.trim(), // ၃။ စာလုံးအမှန်
        wrong: document.getElementById('wrong').value.trim(), // ၄။ စာလုံးအမှား
        pos: document.getElementById('pos').value.trim(), // ၅။ အမျိုးအစား
        example: document.getElementById('example').value.trim(), // ၆။ ဥပမာ
        spell: document.getElementById('spell').value.trim(), // ၇။ ရေးနည်း
        read: document.getElementById('read').value.trim(), // ၈။ အသံထွက်
        audioUrl: document.getElementById('audioUrl').value.trim(), // ၉။ အသံဖိုင်
        source: document.getElementById('source').value.trim() // ၁၀။ ကိုးကား
    };
    
    if (!wordData.group || !wordData.subGroup || !wordData.correct) {
        alert("အနည်းဆုံး ၁၊ ၂၊ ၃ အကွက်ကိုတော့ ဖြည့်ပေးပါဦး။");
        return;
    }
    
    try {
        if (currentEditId) {
            // ၁။ ဒေတာအဟောင်းကို Update
            await updateDoc(doc(db, "ArakaneseSpellingDict", currentEditId), wordData);
            alert('သတ်ပုံစာလုံး ပြင်ဆင်ပြီးပါပြီ။');
            currentEditId = null;
        } else {
            // ၂။ အသစ်ထည့်
            await addDoc(collection(db, "ArakaneseSpellingDict"), wordData);
            alert('သတ်ပုံစာလုံးအသစ် သိမ်းပြီးပါပြီ။');
        }
        
        document.querySelectorAll('.input-form input').forEach(input => input.value = "");
        changeScreen(mainScreen);
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