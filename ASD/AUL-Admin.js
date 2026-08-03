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

let currentEditId = null, unsubscribe = null;
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const editScreen = document.getElementById('edit-screen');
const viewScreen = document.getElementById('view-screen');
const headerProfile = document.getElementById('header-profile');
const tooltip = document.getElementById('profile-tooltip');
const menu = document.getElementById('profile-menu');

function changeScreen(t){ [mainScreen,editScreen,viewScreen].forEach(s=>s.classList.add('hidden')); t.classList.remove('hidden'); }

// Profile Icon Logic
function setGuestUI(){
    headerProfile.innerHTML = "👤";
    tooltip.textContent = "Login";
    document.getElementById('menu-name').textContent = "မဝင်ရသေးပါ";
    if(unsubscribe){ unsubscribe(); unsubscribe=null; }
    document.getElementById('expandable-list').innerHTML = "<p style='text-align:center;padding:40px;color:#888'>Login ဝင်မှ Data မြင်ရမည်</p>";
}
function setAdminUI(user, roleData){
    headerProfile.innerHTML = user.photoURL? `<img src="${user.photoURL}">` : "👤";
    tooltip.textContent = roleData.Name || user.displayName;
    document.getElementById('menu-name').textContent = `${roleData.Name} (${roleData.Role})`;
    loginScreen.style.display = "none";
    mainScreen.classList.remove('hidden');
}

// Long press tooltip
let pressTimer;
headerProfile.addEventListener('mouseenter', ()=>{ tooltip.style.display="block"; });
headerProfile.addEventListener('mouseleave', ()=>{ tooltip.style.display="none"; menu.style.display="none"; });
headerProfile.addEventListener('touchstart', ()=>{ pressTimer=setTimeout(()=>tooltip.style.display="block",500); });
headerProfile.addEventListener('touchend', ()=>{ clearTimeout(pressTimer); setTimeout(()=>tooltip.style.display="none",1500); });
headerProfile.addEventListener('click', ()=>{ menu.style.display = menu.style.display==="block"? "none" : "block"; });

document.getElementById('admin-login-btn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('menu-logout').onclick = async ()=>{ await signOut(auth); menu.style.display="none"; };
document.getElementById('menu-switch').onclick = async ()=>{ await signOut(auth); signInWithPopup(auth, provider); menu.style.display="none"; };
document.getElementById('new-word-btn').onclick = ()=>{ currentEditId=null; document.querySelectorAll('.input-form input').forEach(i=>i.value=""); changeScreen(editScreen); };
document.getElementById('cancel-edit-btn').onclick = ()=>changeScreen(mainScreen);
document.getElementById('Screen-select').onchange = function(){ if(this.value) location.href=this.value; };

function loadAllUsers(){
    if(unsubscribe) unsubscribe();
    unsubscribe = onSnapshot(collection(db, "AllUserList"), (snapshot) => {
        const list = document.getElementById('expandable-list'); list.innerHTML="";
        const groups={};
        snapshot.forEach(d=>{ const data=d.data(); const g=(data.Time||"").substring(0,4)||"အခြား"; const s=(data.Time||"").substring(5,7)||"အထွေထွေ"; if(!groups[g])groups[g]={}; if(!groups[g][s])groups[g][s]=[]; groups[g][s].push({id:d.id,...data}); });
        Object.keys(groups).sort((a,b)=>b.localeCompare(a)).forEach(gName=>{
            const wrap=document.createElement('div'); const h=document.createElement('div'); h.style.cssText="cursor:pointer;padding:12px;background:#e6dbb3;font-weight:bold;border-radius:4px;margin-bottom:6px"; h.textContent=`📅 ${gName}`; const box=document.createElement('div'); box.style.display="none"; box.style.paddingLeft="10px";
            Object.keys(groups[gName]).sort((a,b)=>b.localeCompare(a)).forEach(sg=>{ const sh=document.createElement('div'); sh.style.cssText="padding:10px;margin-top:5px;background:#f1f1f1;cursor:pointer"; sh.textContent=`📂 ${sg} လ - ${groups[gName][sg].length} ဦး`; sh.onclick=e=>{e.stopPropagation(); showSubGroupContents(groups[gName][sg].sort((a,b)=>b.AID.localeCompare(a.AID)), sg);}; box.appendChild(sh); });
            h.onclick=()=>{ const o=box.style.display==="block"; document.querySelectorAll('#expandable-list > div > div:nth-child(2)').forEach(el=>el.style.display="none"); box.style.display=o?"none":"block"; };
            wrap.append(h,box); list.appendChild(wrap);
        });
    });
}

onAuthStateChanged(auth, async (user)=>{
    if(!user){ loginScreen.style.display="flex"; mainScreen.classList.add('hidden'); setGuestUI(); return; }
    const snap = await getDoc(doc(db,"AllUserList",user.uid));
    if(!snap.exists() || snap.data().Role!=="Admin"){ loginScreen.style.display="flex"; loginScreen.innerHTML=`<h2>Admin မဟုတ်ပါ - ${user.email}</h2><button onclick="signOut(auth)">ထွက်မယ်</button>`; setGuestUI(); return; }
    setAdminUI(user, snap.data());
    loadAllUsers();
});

// Edit / Save / View (မင်းဟာအတိုင်း အလုပ်လုပ်တယ်)
const aidInput=document.getElementById('subGroup'), aidError=document.getElementById('aid-error'), checkAidBtn=document.getElementById('check-aid-btn'); let isAidValid=false;
async function checkAid(){ const n=aidInput.value.trim(); const f=`A-${n}`; if(!/^\d+$/.test(n)||n.length!==7){aidError.textContent="7 လုံးထည့်";aidError.style.display="block";isAidValid=false;return;} const q=query(collection(db,"AllUserList"),where("AID","==",f)); const s=await getDocs(q); const d=s.docs.some(x=>x.id!==currentEditId); aidError.textContent=d?f+" ရှိပြီးသား":f+" ရတယ် ✓"; aidError.style.color=d?"red":"green"; aidError.style.display="block"; isAidValid=!d; }
aidInput?.addEventListener('input',()=>{aidInput.value=aidInput.value.replace(/\D/g,''); checkAid();}); checkAidBtn?.addEventListener('click',checkAid);
document.getElementById('save-word-btn').onclick=async()=>{ const data={ AID:`A-${document.getElementById('subGroup').value.trim()}`, GID:document.getElementById('pos').value.trim(), Name:document.getElementById('definition').value.trim(), Acc:document.getElementById('example').value.trim(), Time:document.getElementById('english').value.trim(), Role:document.getElementById('pronounce').value.trim(), Year:new Date().getFullYear().toString(), Month:(new Date().getMonth()+1).toString().padStart(2,'0') }; try{ if(currentEditId) await updateDoc(doc(db,"AllUserList",currentEditId),data); else await addDoc(collection(db,"AllUserList"),data); changeScreen(mainScreen);}catch(e){alert(e.message);} };
function showSubGroupContents(words, sgName){ viewScreen.innerHTML=`<div style="text-align:center;padding:15px;background:#e6dbb3;font-weight:bold;">📅 ${sgName} - ${words.length} ဦး</div><div id="view-contents-container" style="padding:15px;"></div><div style="text-align:center;padding:10px;"><button id="back-main-btn">⬅️ Back</button></div>`; const c=document.getElementById('view-contents-container'); words.forEach(d=>{ const div=document.createElement('div'); div.style.cssText="padding:15px;margin-bottom:10px;background:#fff;border-left:5px solid #605639"; div.innerHTML=`<h3>${d.AID} - ${d.Name}</h3><p>${d.Acc} - ${d.Role}</p><button class="inline-edit">Edit</button>`; div.querySelector('.inline-edit').onclick=()=>{ currentEditId=d.id; document.getElementById('subGroup').value=(d.AID||"").replace('A-',''); document.getElementById('pos').value=d.GID||""; document.getElementById('definition').value=d.Name||""; document.getElementById('example').value=d.Acc||""; document.getElementById('english').value=d.Time||""; document.getElementById('pronounce').value=d.Role||""; isAidValid=true; changeScreen(editScreen); }; c.appendChild(div); }); document.getElementById('back-main-btn').onclick=()=>changeScreen(mainScreen); changeScreen(viewScreen); }