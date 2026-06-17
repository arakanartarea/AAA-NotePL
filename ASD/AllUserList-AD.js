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

onSnapshot(collection(db, "AllUserList"), (snapshot) => {
    expandableList.innerHTML = "";
    if (snapshot.empty) {
        expandableList.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">ဝေါဟာရများ မရှိသေးပါ။ New Word ကိုနှိပ်ပြီး ထည့်ပါ...</p>`;
        return;
    }
    
    const groups = {};
    snapshot.forEach((doc) => {
        const data = doc.data();
        const timeStr = data.Time || "";
        const gName = timeStr.substring(0, 4) || "အခြား"; // "2026"
        const sgName = timeStr.substring(5, 7) || "အထွေထွေ"; // "06"
        
        if (!groups[gName]) groups[gName] = {};
        if (!groups[gName][sgName]) groups[gName][sgName] = [];
        groups[gName][sgName].push({ id: doc.id, ...data });
    });
    
    // ၁။ Group = နှစ်: အသစ်ဆုံး 2026 အပေါ်ဆုံး
    const sortedGroups = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    sortedGroups.forEach((gName) => {
        const groupWrapper = document.createElement('div');
        groupWrapper.className = "group-wrapper";
        groupWrapper.style.marginBottom = "8px";
        
        const groupHeader = document.createElement('div');
        groupHeader.className = "group-header";
        groupHeader.style.cssText = "cursor: pointer; padding: 12px; background: #e6dbb3; font-weight: bold; border-radius: 4px;";
        groupHeader.innerText = `📅 ${gName} ခုနှစ်`;
        groupWrapper.appendChild(groupHeader);
        
        const subGroupContainer = document.createElement('div');
        subGroupContainer.className = "subgroup-container-box";
        subGroupContainer.style.display = "none";
        subGroupContainer.style.paddingLeft = "10px";
        
        // ၂။ SubGroup = လ: 12 လအပေါ်ဆုံး၊ 01 လအောက်ဆုံး
        const sortedSubGroups = Object.keys(groups[gName]).sort((a, b) => b.localeCompare(a));
        
        sortedSubGroups.forEach((sgName) => {
            const subGroupHeader = document.createElement('div');
            subGroupHeader.style.cssText = "padding: 10px 15px; margin-top: 5px; font-weight: bold; color: #444; cursor: pointer; background-color: #f1f1f1; border-radius: 4px; border-bottom: 1px dashed #ccc;";
            subGroupHeader.innerText = `📂 ${sgName} လ - ${groups[gName][sgName].length} ဦး`;
            subGroupContainer.appendChild(subGroupHeader);
            
            // ၃။ User တွေကို AID နဲ့ 9-0 စီချင်ရင်လည်း ဒီလိုပြောင်း
            const sortedWords = groups[gName][sgName].sort((a, b) => b.AID.localeCompare(a.AID));
            
            subGroupHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                showSubGroupContents(sortedWords, sgName);
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
});
// SCREEN 1: MAIN SCREEN (Group -> SubGroup Accordion)//==============ဆ



// SCREEN 3: EDIT SCREEN (ဒေတာ သိမ်းဆည်းခြင်း/ ပြုပြင်ခြင်း )================စ

// 3-A ဒေတာထည့်နေစဉ် စစ်ဆေးခြင်း စ
// AID စစ်တဲ့ Function
const aidInput = document.getElementById('subGroup');
const aidError = document.getElementById('aid-error');
const checkAidBtn = document.getElementById('check-aid-btn');

let isAidValid = false;

async function checkAid() {
    const num = aidInput.value.trim();
    const fullAid = `A-${num}`;
    
    // ၁။ ဂဏန်းပဲလား စစ်
    if (!/^\d+$/.test(num)) {
        aidError.textContent = "ဂဏန်းပဲထည့်ပါ";
        aidError.style.display = "block";
        aidError.style.color = "red";
        aidInput.style.borderColor = "red";
        isAidValid = false;
        return;
    }
    
    // ၂။ 7 လုံးတိတိလား စစ်
    if (num.length !== 7) {
        aidError.textContent = "ဂဏန်း 7 လုံးတိတိထည့်ပါ";
        aidError.style.display = "block";
        aidError.style.color = "red";
        aidInput.style.borderColor = "red";
        isAidValid = false;
        return;
    }
    
    // ၃။ 0000000 မရဘူး စစ်
    if (num === "0000000") {
        aidError.textContent = "A-0000000 သုံးလို့မရပါ";
        aidError.style.display = "block";
        aidError.style.color = "red";
        aidInput.style.borderColor = "red";
        isAidValid = false;
        return;
    }
    
    // ၄။ Firebase ထဲရှိပြီးသားလား စစ်
    const q = query(collection(db, "AllUserList"), where("AID", "==", fullAid));
    const snapshot = await getDocs(q);
    
    // Edit လုပ်နေတာဆိုရင် ကိုယ့် ID ကိုယ်ပြန်စစ်မိတာမျိုးမဖြစ်အောင်
    const isDuplicate = snapshot.docs.some(doc => doc.id !== currentEditId);
    
    if (isDuplicate) {
        aidError.textContent = `${fullAid} က ရှိပြီးသား ID ပါ`;
        aidError.style.display = "block";
        aidError.style.color = "red";
        aidInput.style.borderColor = "red";
        isAidValid = false;
    } else {
        aidError.textContent = `${fullAid} က သုံးလို့ရပါတယ် ✓`;
        aidError.style.color = "green";
        aidError.style.display = "block";
        aidInput.style.borderColor = "green";
        isAidValid = true;
    }
}
// ရိုက်တိုင်းစစ်
aidInput.addEventListener('input', () => {
    // ဂဏန်းမဟုတ်တာတွေအလိုလိုဖျက်
    aidInput.value = aidInput.value.replace(/\D/g, '');
    checkAid();
});

// စစ် ခလုတ်နှိပ်ရင်လည်းစစ်
checkAidBtn.addEventListener('click', checkAid);

//3-A ဒေတာထည့်နေစဉ် =================== စစ်ဆေးခြင်း ဆ

const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveWordBtn = document.getElementById('save-word-btn');
cancelEditBtn.addEventListener('click', () => changeScreen(mainScreen));
//ဒေတာသိမ်း ခလုတ်  စ
saveWordBtn.addEventListener('click', async () => {
    const userData = {
    Year: new Date().getFullYear().toString(),
    Month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    AID: `A-${document.getElementById('subGroup').value.trim()}`, // ဒီလိုပြောင်း
    GID: document.getElementById('pos').value.trim(),
    Name: document.getElementById('definition').value.trim(),
    Acc: document.getElementById('example').value.trim(),
    Time: document.getElementById('english').value.trim(),
    Role: document.getElementById('pronounce').value.trim(),
    createdAt: new Date()
};
    if (!userData.AID || !userData.Name || !userData.Acc) {
    alert("အနည်းဆုံး AID, Name, Acc ကိုတော့ ဖြည့်ပေးပါဦး");
    return;
    if (!isAidValid && !currentEditId) {
    alert("AID မမှန်သေးပါ။ အနီရောင်ပြနေတာကိုပြင်ပါ");
    return;
}
}

    try {
        if (currentEditId) {
            // ၁။ ဒေတာအဟောင်းကို မူလနေရာမှာပဲ အစားထိုးပြင်ဆင်ခြင်း (Update)
            await updateDoc(doc(db, "AllUserList", currentEditId), userData);

            alert('ဝေါဟာရကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။');
            currentEditId = null; // ပြင်ပြီးရင် ID ကို ဗလာပြန်လုပ်မယ်
        } else {
            // ၂။ ID မရှိရင် အသစ်ထည့်ခြင်း (Add New)
            await addDoc(collection(db, "AllUserList"), userData);
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
// SCREEN 3: EDIT SCREEN (ဒေတာ သိမ်းဆည်းခြင်း/ ပြုပြင်ခြင်း )================ဆ



// SCREEN 2: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================စ
function showSubGroupContents(words, sgName) {
    viewScreen.innerHTML = `
        <div style="text-align:center; padding:15px; background:#e6dbb3; font-weight:bold; font-size:18px; border-bottom:1px solid #ccc;">
          📅 ${sgName} လ - ${words.length} ဦး
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

        // အဟောင်း wordCard.innerHTML အကုန်ဖျက်ပြီး ဒါနဲ့အစားထိုး
wordCard.innerHTML = `
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
    <h3 style="margin: 0; color: #605639; font-size: 18px;">${data.AID} - ${data.Name}</h3>
    <button class="inline-edit-btn" style="padding: 4px 10px; background: #e6dbb3; color: #605639; border: 1px solid #605639; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✏️ Edit</button>
</div>
<p style="margin: 5px 0; font-size: 14px;"><strong>GID:</strong> ${data.GID || '-'}</p>
<p style="margin: 5px 0; font-size: 14px;"><strong>Account:</strong> ${data.Acc || '-'}</p>
<p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${data.Time || '-'}</p>
<p style="margin: 5px 0; font-size: 14px;"><strong>Role:</strong> ${data.Role || '-'}</p>
`;

        // အသံဖွင့်Logic
        if (data.audioUrl) {
            wordCard.querySelector('.inline-play-btn').addEventListener('click', () => {
                new Audio(data.audioUrl).play();
            });
        }

        // ✏️ Edit ခလုတ်နှိပ်ရင် မူလစာတွေကို Input ထဲလှမ်းထည့်ပြီး Edit Screen ဖွင့်မယ့် Logic
        // ✏️ Edit ခလုတ်နှိပ်ရင် မူလစာတွေကို Input ထဲလှမ်းထည့်ပြီး Edit Screen ဖွင့်မယ့် Logic
wordCard.querySelector('.inline-edit-btn').addEventListener('click', () => {
    currentEditId = data.id; // ပြင်မယ့် Document ID ကို မှတ်လိုက်ပြီ
    
    // ၁။ Input တွေထဲဒေတာထည့်
    document.getElementById('subGroup').value = (data.AID || "").replace('A-', "");
    document.getElementById('pos').value = data.GID || "";
    document.getElementById('definition').value = data.Name || "";
    document.getElementById('example').value = data.Acc || "";
    document.getElementById('english').value = data.Time || "";
    document.getElementById('pronounce').value = data.Role || "";
    
    // ၂။ AID ကို Valid အဖြစ်သတ်မှတ်ပြီး အစိမ်းပြမယ်
    isAidValid = true;
    aidError.textContent = `${data.AID} က လက်ရှိ ID ပါ ✓`;
    aidError.style.color = "green";
    aidError.style.display = "block";
    aidInput.style.borderColor = "green";
    
    // ၃။ Screen ပြောင်း
    changeScreen(editScreen);
});

container.appendChild(wordCard);
    });

    document.getElementById('back-main-btn').addEventListener('click', () => changeScreen(mainScreen));
    changeScreen(viewScreen);
}
// SCREEN 2: VIEW SCREEN (မူလ Expan ကိုဖျောက်ပြီး Content အကုန်လုံး စုပြုံပြသခြင်း) ================ဆ



