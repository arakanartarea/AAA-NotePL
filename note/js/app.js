// 1240
const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});

// --- Auto Login Logic ---
const urlParams = new URLSearchParams(location.search);
if(urlParams.get('keep') === 'yes'){ localStorage.setItem('keepLogin','yes'); alert('ဒီဖုန်းမှာ အမြဲ Login မှတ်ထားပြီ'); history.replaceState(null,'',location.pathname); }
if(urlParams.get('keep') === 'no'){ localStorage.removeItem('keepLogin'); alert('Auto login ပိတ်ပြီ'); history.replaceState(null,'',location.pathname); }
const keepLogin = localStorage.getItem('keepLogin') === 'yes';
auth.setPersistence(keepLogin? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.NONE);

let allWords=[], unsubscribe=null, currentSearchText="", currentEditId=null, sortMode="new", isFavMode=false;
const list=document.getElementById('expandable-list');
const authBtn=document.getElementById('authBtn');
const authIcon=document.getElementById('authIcon');
const authImg=document.getElementById('authImg');
const authMenu=document.getElementById('authMenu');
const authMenuBackdrop=document.getElementById('authMenuBackdrop');
const authMenuUser=document.getElementById('authMenuUser');
const mainScreen=document.getElementById('main-screen');
const viewScreen=document.getElementById('view-screen');
const editScreen=document.getElementById('edit-screen');

function changeScreen(s){ [mainScreen,viewScreen,editScreen].forEach(x=>x.classList.add('hidden')); s.classList.remove('hidden'); }
function showAuthMenu(show){ authMenu.classList.toggle('show',show); authMenuBackdrop.classList.toggle('show',show); }

authBtn.onclick=()=>{ if(auth.currentUser){ authMenuUser.innerText=auth.currentUser.email; showAuthMenu(true); } else { auth.signInWithPopup(provider).catch(e=>alert(e.message)); } };
authMenuBackdrop.onclick=()=>showAuthMenu(false);
document.getElementById('logoutBtn').onclick=async()=>{ showAuthMenu(false); await auth.signOut(); };
document.getElementById('switchAccountBtn').onclick=async()=>{ showAuthMenu(false); await auth.signOut(); auth.signInWithPopup(provider).catch(e=>alert(e.message)); };

auth.onAuthStateChanged(async (user)=>{
 if(!user){
   authIcon.style.display="block"; authImg.style.display="none"; authBtn.classList.remove('has-img');
   authIcon.innerText="👤"; authBtn.style.background="#e3f2fd"; authBtn.style.color="#1976d2";
   list.innerHTML="<div style='padding:30px;text-align:center;color:#666;'>🔒 Login ဝင်ပြီးမှ ကြည့်လို့ရမယ်<br><button onclick='document.getElementById(\"authBtn\").click()' style='padding:10px 20px;background:#2d6a4f;color:white;border:none;border-radius:20px;'>ဝင်မယ်</button></div>";
   if(unsubscribe)unsubscribe(); return;
 }
 if(user.photoURL){ authImg.src=user.photoURL; authImg.style.display="block"; authIcon.style.display="none"; authBtn.classList.add('has-img'); }
 else { authIcon.style.display="block"; authIcon.innerText=user.email[0].toUpperCase(); authImg.style.display="none"; authBtn.classList.remove('has-img'); }
 const docSnap=await db.collection("admins").doc(user.email.toLowerCase()).get();
 if(!docSnap.exists){ authIcon.style.display="block"; authImg.style.display="none"; authIcon.innerText="🚫"; list.innerHTML=user.email+" ခွင့်မရှိ"; return; }
 if(unsubscribe)unsubscribe();
 unsubscribe=db.collection("AAAnotes").onSnapshot(snap=>{
  allWords=[]; snap.forEach(d=>{ if(d.data().role!==2) allWords.push({id:d.id,...d.data()}); });
  showWords();
  // View ဖွင့်ထားရင် fav icon update
  const vc=document.getElementById('vc'); if(vc &&!viewScreen.classList.contains('hidden')){ /* re-render ကို showWords ကပဲ လုပ်မှာ */ }
 }, err=>{ list.innerHTML="Rule Error: "+err.message; });
});

function showWords(){
 list.innerHTML="";
 let filtered = isFavMode? allWords.filter(n=>n.fav) : [...allWords];
 filtered = filtered.filter(n=>(n.group+n.subGroup+n.content).toLowerCase().includes(currentSearchText.toLowerCase()));
 filtered.forEach(w=>{ w.group=w.group||"အခြား"; w.subGroup=w.subGroup||"အထွေထွေ"; });
 if(sortMode==="a-အ") filtered.sort((a,b)=>a.content.localeCompare(b.content));
 if(sortMode==="z-က") filtered.sort((a,b)=>b.content.localeCompare(a.content));
 if(sortMode==="old") filtered.sort((a,b)=>new Date(a.updateTime||0)-new Date(b.updateTime||0));
 if(sortMode==="new") filtered.sort((a,b)=>new Date(b.updateTime||0)-new Date(a.updateTime||0));
 const groups={};
 filtered.forEach(d=>{ if(!groups[d.group])groups[d.group]={}; if(!groups[d.group][d.subGroup])groups[d.group][d.subGroup]=[]; groups[d.group][d.subGroup].push(d); });
 Object.keys(groups).forEach(gName=>{
  const wrap=document.createElement('div'); wrap.style.marginBottom="8px";
  const header=document.createElement('div'); header.className="group-header"; header.innerText="📁 "+gName;
  const subCon=document.createElement('div'); subCon.className="subgroup-container";
  Object.keys(groups[gName]).forEach(sg=>{
   const sgH=document.createElement('div'); sgH.className="subgroup-header"; sgH.innerText="📂 "+sg;
   sgH.onclick=()=> showSubGroupContents(groups[gName][sg],sg,gName);
   subCon.appendChild(sgH);
  });
  header.onclick=()=>{ subCon.classList.toggle('open'); };
  wrap.appendChild(header); wrap.appendChild(subCon); list.appendChild(wrap);
 });
}

function showSubGroupContents(notes,sg,gName){
 viewScreen.innerHTML=`<div class="view-header">📖 ${gName}/${sg} (${notes.length})</div><div id="vc" class="view-content"></div><div class="view-bottom"><button id="back-main-btn">⬅️</button><button id="new-in-subgroup-btn">➕</button></div>`;
 const c=document.getElementById('vc');
 notes.forEach(d=>{
  const live = allWords.find(x=>x.id===d.id) || d;
  const div=document.createElement('div'); div.className="note-card";
  div.innerHTML=`<p style="white-space:pre-wrap;margin:0;">${live.content}</p>
  <div style="text-align:right;margin-top:8px;display:flex;gap:6px;justify-content:flex-end;">
    <button class="favBtn" style="padding:4px 10px;">${live.fav? '⭐' : '☆'}</button>
    <button class="copyBtn" style="padding:4px 10px;">📋</button>
    <button class="eBtn" style="padding:4px 10px;">✏️</button>
  </div>`;
  div.querySelector('.eBtn').onclick=()=>{ currentEditId=live.id; document.getElementById('group').value=live.group; document.getElementById('subGroup').value=live.subGroup; document.getElementById('content').value=live.content; changeScreen(editScreen); };
  div.querySelector('.copyBtn').onclick=async()=>{ try{ await navigator.clipboard.writeText(live.content); div.querySelector('.copyBtn').innerText="✅"; setTimeout(()=>div.querySelector('.copyBtn').innerText="📋",1500); }catch{ alert("Copy မရ"); } };
  div.querySelector('.favBtn').onclick=async(e)=>{
    const btn=e.target;
    const newFav=!live.fav;
    btn.innerText = newFav? '⭐' : '☆'; // ချက်ချင်းပြောင်းမယ်
    live.fav=newFav;
    await db.collection("AAAnotes").doc(live.id).update({fav:newFav});
  };
  c.appendChild(div);
 });
 document.getElementById('back-main-btn').onclick=()=>changeScreen(mainScreen);
 document.getElementById('new-in-subgroup-btn').onclick=()=>{ currentEditId=null; document.getElementById('group').value=gName; document.getElementById('subGroup').value=sg; document.getElementById('content').value=""; changeScreen(editScreen); };
 changeScreen(viewScreen);
}

document.getElementById('searchBox').oninput=(e)=>{ currentSearchText=e.target.value; document.getElementById('clearSearchBtn').style.display=currentSearchText?'block':'none'; showWords(); };
document.getElementById('clearSearchBtn').onclick=()=>{ document.getElementById('searchBox').value=""; currentSearchText=""; document.getElementById('clearSearchBtn').style.display='none'; showWords(); };
document.getElementById('new-word-btn').onclick=()=>{ currentEditId=null; document.getElementById('group').value=""; document.getElementById('subGroup').value=""; document.getElementById('content').value=""; changeScreen(editScreen); };
document.getElementById('cancel-edit-btn').onclick=()=>changeScreen(mainScreen);
document.getElementById('save-word-btn').onclick=async()=>{
 const data={ group:document.getElementById('group').value.trim()||"အခြား", subGroup:document.getElementById('subGroup').value.trim()||"အထွေထွေ", content:document.getElementById('content').value.trim(), role:1, updateTime:new Date().toISOString() };
 if(!data.content)return alert("စာဖြည့်ပါ");
 if(currentEditId) await db.collection("AAAnotes").doc(currentEditId).update(data);
 else await db.collection("AAAnotes").add(data);
 changeScreen(mainScreen);
};

// Toolbar
const topSearchBar=document.getElementById('topSearchBar');
const toggleSearchBtn=document.getElementById('toggleSearchBtn');
const searchBoxEl=document.getElementById('searchBox');
if(toggleSearchBtn){ toggleSearchBtn.onclick=()=>{ const h=topSearchBar.classList.contains('hidden'); if(h){ topSearchBar.classList.remove('hidden'); setTimeout(()=>searchBoxEl.focus(),100);} else { topSearchBar.classList.add('hidden'); searchBoxEl.value=""; currentSearchText=""; showWords(); } }; }
const sortBtn=document.getElementById('sortBtn');
if(sortBtn){ sortBtn.onclick=()=>{ const ex=document.getElementById('sortPopup'); if(ex){ex.remove();return;} const pop=document.createElement('div'); pop.id='sortPopup'; pop.style.cssText='position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:white;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:200;display:flex;flex-direction:column;overflow:hidden;'; pop.innerHTML=`<button data-s="a-အ" style="padding:12px 20px;border:none;border-bottom:1px solid #eee;">A - အ</button><button data-s="z-က" style="padding:12px 20px;border:none;border-bottom:1px solid #eee;">Z - က</button><button data-s="old" style="padding:12px 20px;border:none;border-bottom:1px solid #eee;">Old time</button><button data-s="new" style="padding:12px 20px;border:none;">New time</button>`; pop.querySelectorAll('button').forEach(b=>{ b.onclick=()=>{ sortMode=b.dataset.s; showWords(); pop.remove(); }; }); document.body.appendChild(pop); }; }
const favBtnMain=document.getElementById('favBtn');
if(favBtnMain){
  favBtnMain.onclick=()=>{
    isFavMode=!isFavMode;
    favBtnMain.innerText = isFavMode? '🏠' : '⭐';
    showWords();
  };
}