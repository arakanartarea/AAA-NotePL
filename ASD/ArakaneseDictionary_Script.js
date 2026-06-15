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


// SCREEN 1: MAIN SCREEN (Group -> SubGroup Accordion)//==============စ
const expandableList = document.getElementById('expandable-list');
const newWordBtn = document.getElementById('new-word-btn');
newWordBtn.addEventListener('click', () => {
    currentEditId = null; // ID ကို ဗလာပြန်လုပ်မယ်
    document.querySelectorAll('.input-form input').forEach(input => input.value = ""); // စာရိုက်တဲ့အကွက်တွေ အကုန်ရှင်းမယ်
    changeScreen(editScreen);
});
// ဝက်ဘ်စာမျက်နှာ ပြောင်း
document.getElementById('Screen-select').addEventListener('change', function() {
    if (this.value) {
       // window.open(this.value, '_blank'); // Tab အသစ်နဲ့ ဖွင့်ဖို့
         window.location.href = this.value; // လက်ရှိ Tab မှာပဲ ဖွင့်ဖို့ (ဒါကိုသုံးချင်ရင် အပေါ်စာကြောင်းကို ဖျက်ပါ)
    }
});

onSnapshot(collection(db, "words"), (snapshot) => {
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
            const sortedWords = groups[gName][sgName].sort((a, b) => a.word.localeCompare(b.word, 'my'));

            // အုပ်စုခွဲ (Sub) ကို နှိပ်လိုက်ရင် Expan စာမျက်နှာကိုဖျောက်ပြီး View Screen မှာ Content အကုန်စုပြမယ့်အပိုင်း
            subGroupHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                showSubGroupContents(sortedWords, sgName);
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


// SCREEN 3: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================စ
// ဝေါဟာရကို ဥပမာစာကြောင်းထဲမှာ Bold လုပ်ပေးတဲ့ Function စ
function highlightWord(sentence, word) {
    if (!sentence || !word) return sentence || '-';
    
    // မြန်မာစာအတွက် Word Boundary ကိုယ်တိုင်လုပ်
    // စကားလုံးရှေ့နောက်မှာ Space, ပုဒ်ဖြတ်, စာကြောင်းအစ/အဆုံး ရှိမှပဲ Bold လုပ်
    const regex = new RegExp(`(^|\\s|[.,;:!?၊။"']|\\()${escapeRegExp(word)}(?=\\s|[.,;:!?၊။"']|\\)|$)`, 'g');
    return sentence.replace(regex, `$1<b>${word}</b>`);
}
// Regex ထဲမှာ အထူးစာလုံးပါရင် Error မတက်အောင်
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// ဝေါဟာရကို ဥပမာစာကြောင်းထဲမှာ Bold လုပ်ပေးတဲ့ Function ဆ

function showSubGroupContents(words, sgName) {
    viewScreen.innerHTML = `
        <div style="text-align:center; padding:15px; background:#e6dbb3; font-weight:bold; font-size:18px; border-bottom:1px solid #ccc;">
            📖 အုပ်စုခွဲ - ${sgName} (${words.length} ခု)
        </div>
        <div id="view-contents-container" style="padding: 15px; padding-bottom: 80px; overflow-y: auto; max-height: calc(100vh - 120px);"></div>
        <div style="position: fixed; bottom: 0; left: 0; width: 100%; padding: 12px; background: #e6dbb3; text-align: center; box-shadow: 0 -2px 5px rgba(0,0,0,0.1);">
            <button id="back-main-btn" style="padding: 10px 25px; background: #605639; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">⬅️ Back to List</button>
        </div>
    `;

    const container = document.getElementById('view-contents-container');

    words.forEach(data => {
        const wordCard = document.createElement('div');
        wordCard.style.cssText = "padding: 15px; margin-bottom: 15px; border-left: 5px solid #605639; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.08); border-radius: 0 4px 4px 0; position: relative;";
        
        let audioHtml = data.audioUrl ? `<button class="inline-play-btn" style="margin-left:10px; padding:3px 8px; background:#605639; color:#fff; border:none; cursor:pointer; border-radius:3px; font-size:12px;">🔊 အသံဖွင့်ရန်</button>` : '';

        wordCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h3 style="margin: 0; color: #605639; font-size: 18px;">${data.word} <span style="font-size: 13px; color: #777; font-weight: normal;">[${data.pos || ''}]</span></h3>
                <button class="inline-edit-btn" style="padding: 4px 10px; background: #e6dbb3; color: #605639; border: 1px solid #605639; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✏️ Edit</button>
            </div>
            <p style="margin: 5px 0; font-size: 14px;"><strong>အဓိပ္ပာယ်ရှင်းလင်းချက်:</strong> ${data.definition || '-'}</p>
<p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>ဥပမာစာကြောင်း:</strong> ${highlightWord(data.example, data.subGroup)}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>အင်္ဂလိပ်ဘာသာပြန်:</strong> ${data.english || '-'}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #444;"><strong>အသံထွက်စာသား:</strong> ${data.pronounce || '-'} ${audioHtml}</p>
        `;

        // အသံဖွင့်Logic
        if (data.audioUrl) {
            wordCard.querySelector('.inline-play-btn').addEventListener('click', () => {
                new Audio(data.audioUrl).play();
            });
        }

        // ✏️ Edit ခလုတ်နှိပ်ရင် မူလစာတွေကို Input ထဲလှမ်းထည့်ပြီး Edit Screen ဖွင့်မယ့် Logic
        wordCard.querySelector('.inline-edit-btn').addEventListener('click', () => {
            currentEditId = data.id; // ပြင်မယ့် Document ID ကို မှတ်လိုက်ပြီ
            
            document.getElementById('word').value = data.group || "";
            document.getElementById('group').value = data.subGroup || "";
            document.getElementById('subGroup').value = data.word || "";
            document.getElementById('pos').value = data.pos || "";
            document.getElementById('definition').value = data.definition || "";
            document.getElementById('example').value = data.example || "";
            document.getElementById('english').value = data.english || "";
            document.getElementById('pronounce').value = data.pronounce || "";
            document.getElementById('audioUrl').value = data.audioUrl || "";

            changeScreen(editScreen);
        });

        container.appendChild(wordCard);
    });

    document.getElementById('back-main-btn').addEventListener('click', () => changeScreen(mainScreen));
    changeScreen(viewScreen);
}
// SCREEN 3: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================ဆ


// SCREEN 2: EDIT SCREEN (ဒေတာ သိမ်းဆည်းခြင်း/ ပြုပြင်ခြင်း )================စ

const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveWordBtn = document.getElementById('save-word-btn');

cancelEditBtn.addEventListener('click', () => changeScreen(mainScreen));
//ဒေတာသိမ်း ခလုတ် 
saveWordBtn.addEventListener('click', async () => {
    const wordData = {
        group: document.getElementById('word').value.trim(),       
        subGroup: document.getElementById('group').value.trim(),    
        word: document.getElementById('subGroup').value.trim(),     
        pos: document.getElementById('pos').value.trim(),          
        definition: document.getElementById('definition').value.trim(), 
        example: document.getElementById('example').value.trim(),   
        english: document.getElementById('english').value.trim(),   
        pronounce: document.getElementById('pronounce').value.trim(), 
        audioUrl: document.getElementById('audioUrl').value.trim(),  
        createdAt: new Date()
    };

    if (!wordData.group || !wordData.subGroup || !wordData.word) {
        alert("အနည်းဆုံး အကွက် (၁၊ ၂၊ ၃) ကိုတော့ ဖြည့်ပေးပါဦးဗျာ။");
        return;
    }

    try {
        if (currentEditId) {
            // ၁။ ဒေတာအဟောင်းကို မူလနေရာမှာပဲ အစားထိုးပြင်ဆင်ခြင်း (Update)
            await updateDoc(doc(db, "words", currentEditId), wordData);
            alert('ဝေါဟာရကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။');
            currentEditId = null; // ပြင်ပြီးရင် ID ကို ဗလာပြန်လုပ်မယ်
        } else {
            // ၂။ ID မရှိရင် အသစ်ထည့်ခြင်း (Add New)
            await addDoc(collection(db, "words"), wordData);
            alert('ဝေါဟာရအသစ်ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။');
        }

        // ပြီးရင် Input တွေကို ဗလာချပြီး Main Screen ပြန်သွားမယ်
        document.querySelectorAll('.input-form input').forEach(input => input.value = "");
        changeScreen(mainScreen);
    } catch (error) {
        console.error("Error: ", error);
        alert('ဒေတာသိမ်းလို့မရပါ၊ Firebase Rules ကို စစ်ပေးပါ။');
    }
});

// အသံဖိုင်လင့်ကို Clipboard ထဲကနေ တိုက်ရိုက် Paste ချပေးမယ့် Function
document.getElementById('paste-audio-btn').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('audioUrl').value = text;
    } catch (err) {
        alert('Clipboard ထဲကစာကို ဖတ်လို့မရပါဘူး။ Browser က Permission တောင်းရင် Allow ပေးလိုက်ပါဦးဗျာ။');
    }
});
// SCREEN 2: EDIT SCREEN (ဒေတာ သိမ်းဆည်းခြင်း/ ပြုပြင်ခြင်း )================ဆ


// Screen 4 ViewUserList စ ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 

// Screen 4 ViewUserList ဆ ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 