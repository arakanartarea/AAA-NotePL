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
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const adminEmail = "zawmyo@gmail.com"; // <-- မင်းမေးလ်
let unsubscribe = null;

getRedirectResult(auth).then(r=>{if(r) console.log("login ok")}).catch(e=>alert(e.message));

let currentEditId=null, currentSearchText="", debounceTimer=null, allWords=[], currentSortMode='time-new';
const mainScreen=document.getElementById('main-screen'), editScreen=document.getElementById('edit-screen'), viewScreen=document.getElementById('view-screen');
function changeScreen(t){mainScreen.classList.add('hidden');editScreen.classList.add('hidden');viewScreen.classList.add('hidden');t.classList.remove('hidden');}
const expandableList=document.getElementById('expandable-list'), newWordBtn=document.getElementById('new-word-btn');
newWordBtn.addEventListener('click',()=>{currentEditId=null;document.querySelectorAll('.input-form input').forEach(i=>i.value="");changeScreen(editScreen);});
document.getElementById('sort-select').addEventListener('change',e=>{currentSortMode=e.target.value;showWords();});
document.getElementById('Screen-select').addEventListener('change',function(){if(this.value) window.location.href=this.value;});

function startListening(){
  if(unsubscribe) unsubscribe();
  unsubscribe=onSnapshot(collection(db,"AAAnotes"),snapshot=>{
    allWords=[]; snapshot.forEach(d=>{const data=d.data(); if(data.role!==2) allWords.push({id:d.id,...data})}); showWords();
  });
}
const authBtn=document.getElementById('authBtn');
authBtn.onclick=()=>{if(!auth.currentUser) signInWithRedirect(auth,provider); else {if(confirm("ထွက်မလား?")) signOut(auth); else signInWithRedirect(auth,provider);}};
onAuthStateChanged(auth,user=>{
  if(!user){authBtn.innerText="👤"; expandableList.innerHTML="<p style='text-align:center;padding:30px'>Login ဝင်ပါ</p>"; if(unsubscribe)unsubscribe(); return;}
  if(user.email!==adminEmail){authBtn.innerText="🚫"; expandableList.innerHTML=`<p style='text-align:center;padding:30px'>${user.email}<br>ခွင့်မရှိ</p>`; if(unsubscribe)unsubscribe(); return;}
  authBtn.innerText="✅"; startListening();
});

function showWords(){
  expandableList.innerHTML=""; let filteredData=allWords.filter(n=>{const s=currentSearchText.toLowerCase(); return (n.group||"").toLowerCase().includes(s)||(n.subGroup||"").toLowerCase().includes(s)||(n.content||"").toLowerCase().includes(s);});
  if(filteredData.length===0){expandableList.innerHTML="<p style='text-align:center;color:#888;padding-top:20px'>ရှာမတွေ့ပါ...</p>"; return;}
  filteredData.forEach(w=>{w.group=w.group||"အခြား"; w.subGroup=w.subGroup||"အထွေထွေ";});
  const groups={}; filteredData.forEach(data=>{const g=data.group, sg=data.subGroup; if(!groups[g]) groups[g]={}; if(!groups[g][sg]) groups[g][sg]=[]; groups[g][sg].push(data);});
  let sortedGroups=Object.keys(groups);
  if(currentSortMode==='time-new') sortedGroups.sort((a,b)=>{const timeA=Math.max(...Object.values(groups[a]).flat().map(n=>new Date(n.updateTime||0).getTime())); const timeB=Math.max(...Object.values(groups[b]).flat().map(n=>new Date(n.updateTime||0).getTime())); return timeB-timeA;});
  else if(currentSortMode==='time-old') sortedGroups.sort((a,b)=>{const timeA=Math.min(...Object.values(groups[a]).flat().map(n=>new Date(n.updateTime||0).getTime())); const timeB=Math.min(...Object.values(groups[b]).flat().map(n=>new Date(n.updateTime||0).getTime())); return timeA-timeB;});
  else if(currentSortMode==='az') sortedGroups.sort((a,b)=>a.localeCompare(b,'my')); else if(currentSortMode==='za') sortedGroups.sort((a,b)=>b.localeCompare(a,'my'));
  sortedGroups.forEach(gName=>{
    const groupWrapper=document.createElement('div'); groupWrapper.className="group-wrapper"; groupWrapper.style.marginBottom="8px";
    const groupHeader=document.createElement('div'); groupHeader.className="group-header"; groupHeader.style.cssText="cursor:pointer;padding:12px;background:#e6dbb3;font-weight:bold;border-radius:4px;"; groupHeader.innerText=`📁 ${gName}`; groupWrapper.appendChild(groupHeader);
    const subGroupContainer=document.createElement('div'); subGroupContainer.className="subgroup-container-box"; subGroupContainer.style.display="none"; subGroupContainer.style.paddingLeft="10px";
    let sortedSubGroups=Object.keys(groups[gName]);
    if(currentSortMode==='time-new') sortedSubGroups.sort((a,b)=>{const timeA=Math.max(...groups[gName][a].map(n=>new Date(n.updateTime||0).getTime())); const timeB=Math.max(...groups[gName][b].map(n=>new Date(n.updateTime||0).getTime())); return timeB-timeA;});
    else if(currentSortMode==='time-old') sortedSubGroups.sort((a,b)=>{const timeA=Math.min(...groups[gName][a].map(n=>new Date(n.updateTime||0).getTime())); const timeB=Math.min(...groups[gName][b].map(n=>new Date(n.updateTime||0).getTime())); return timeA-timeB;});
    else if(currentSortMode==='az') sortedSubGroups.sort((a,b)=>a.localeCompare(b,'my')); else if(currentSortMode==='za') sortedSubGroups.sort((a,b)=>b.localeCompare(a,'my'));
    sortedSubGroups.forEach(sgName=>{const subGroupHeader=document.createElement('div'); subGroupHeader.style.cssText="padding:10px 15px;margin-top:5px;font-weight:bold;color:#444;cursor:pointer;background:#f1f1f1;border-radius:4px;border-bottom:1px dashed #ccc;"; subGroupHeader.innerText=`📂 ${sgName}`; subGroupContainer.appendChild(subGroupHeader); subGroupHeader.addEventListener('click',e=>{e.stopPropagation(); showSubGroupContents(groups[gName][sgName],sgName,gName);});});
    groupWrapper.appendChild(subGroupContainer); expandableList.appendChild(groupWrapper);
    groupHeader.addEventListener('click',()=>{const isCurrentOpen=subGroupContainer.style.display==="block"; document.querySelectorAll('.subgroup-container-box').forEach(el=>el.style.display="none"); subGroupContainer.style.display=isCurrentOpen?"none":"block";});
  });
}
const searchBox=document.getElementById('searchBox'), clearBtn=document.getElementById('clearSearchBtn');
searchBox.addEventListener('input',()=>{clearTimeout(debounceTimer); debounceTimer=setTimeout(()=>{currentSearchText=searchBox.value; clearBtn.style.display=currentSearchText?'block':'none'; showWords();},300);});
clearBtn.addEventListener('click',()=>{searchBox.value=""; currentSearchText=""; clearBtn.style.display='none'; showWords();});
function showSubGroupContents(notes,sgName,gName){
  viewScreen.innerHTML=`<div style="text-align:center;padding:15px;background:#e6dbb3;font-weight:bold;font-size:18px;border-bottom:1px solid #ccc;">📖 ${gName} / ${sgName} (${notes.length} ခု)</div><div id="view-contents-container" style="padding:15px;padding-bottom:80px;overflow-y:auto;max-height:calc(100vh - 120px);"></div><div style="position:fixed;bottom:0;left:0;width:100%;padding:12px;background:#e6dbb3;text-align:center;box-shadow:0 -2px 5px rgba(0,0,0,0.1);display:flex;gap:10px;justify-content:center;"><button id="back-main-btn" style="flex:1;padding:10px 25px;background:#605639;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">⬅️ Back</button><button id="new-in-subgroup-btn" style="flex:1;padding:10px 25px;background:#2d6a4f;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">➕ New</button></div>`;
  const container=document.getElementById('view-contents-container');
  notes.forEach(data=>{
    const noteCard=document.createElement('div'); noteCard.style.cssText="padding:15px;margin-bottom:15px;border-left:5px solid #605639;background:#ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.08);border-radius:0 4px 4px 0;";
    const favIcon=data.role===3?'⭐ ':''; noteCard.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;"><p style="margin:0;color:#605639;font-size:16px;white-space:pre-wrap;flex:1;">${favIcon}${data.content||'-'}</p><div style="display:flex;gap:6px;margin-left:10px;"><button class="inline-copy-btn" style="padding:4px 10px;background:#e6dbb3;color:#605639;border:1px solid #605639;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">📋</button><button class="inline-edit-btn" style="padding:4px 10px;background:#e6dbb3;color:#605639;border:1px solid #605639;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">✏️</button></div></div><p style="margin:3px 0;font-size:12px;color:#888;text-align:right;">${new Date(data.updateTime).toLocaleString('my-MM')}</p>`;
    noteCard.querySelector('.inline-copy-btn').addEventListener('click',async()=>{await navigator.clipboard.writeText(data.content||''); const btn=noteCard.querySelector('.inline-copy-btn'); const o=btn.innerHTML; btn.innerHTML='✅'; setTimeout(()=>btn.innerHTML=o,1000);});
    noteCard.querySelector('.inline-edit-btn').addEventListener('click',()=>{currentEditId=data.id; document.getElementById('group').value=data.group||""; document.getElementById('subGroup').value=data.subGroup||""; document.getElementById('content').value=data.content||""; resetUndoStack(data.content||""); changeScreen(editScreen);});
    container.appendChild(noteCard);
  });
  document.getElementById('back-main-btn').addEventListener('click',()=>changeScreen(mainScreen));
  document.getElementById('new-in-subgroup-btn').addEventListener('click',()=>{currentEditId=null; document.querySelectorAll('.input-form input,.input-form textarea').forEach(i=>i.value=""); document.getElementById('group').value=gName; document.getElementById('subGroup').value=sgName; changeScreen(editScreen); setTimeout(()=>document.getElementById('content').focus(),100);});
  changeScreen(viewScreen);
}
const cancelEditBtn=document.getElementById('cancel-edit-btn'), saveWordBtn=document.getElementById('save-word-btn'), contentArea=document.getElementById('content');
let undoStack=[], redoStack=[];
cancelEditBtn.addEventListener('click',()=>changeScreen(mainScreen));
saveWordBtn.addEventListener('click',async()=>{
  const noteData={group:document.getElementById('group').value.trim()||"အခြား", subGroup:document.getElementById('subGroup').value.trim()||"အထွေထွေ", content:contentArea.value.trim(), role:1, updateTime:new Date().toISOString()};
  if(!noteData.content){alert("မှတ်စုထဲစာဖြည့်ဦး"); return;}
  try{if(currentEditId) await updateDoc(doc(db,"AAAnotes",currentEditId),noteData); else await addDoc(collection(db,"AAAnotes"),noteData); currentEditId=null; document.getElementById('group').value=""; document.getElementById('subGroup').value=""; contentArea.value=""; changeScreen(mainScreen);}catch(error){alert('မရဘူး');}
});
contentArea.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'||e.key==='၊'||e.key==='။'){if(undoStack[undoStack.length-1]!==contentArea.value){undoStack.push(contentArea.value); if(undoStack.length>100) undoStack.shift(); redoStack=[];}}});
document.getElementById('editor-toolbar').addEventListener('click',async e=>{const btn=e.target.closest('button'); if(!btn||!btn.dataset.cmd) return; e.preventDefault(); contentArea.focus(); const cmd=btn.dataset.cmd; const start=contentArea.selectionStart, end=contentArea.selectionEnd;
  if(cmd==='undo'){if(undoStack.length>1){redoStack.push(undoStack.pop()); contentArea.value=undoStack[undoStack.length-1]||'';}}
  if(cmd==='redo'){if(redoStack.length>0){const val=redoStack.pop(); undoStack.push(val); contentArea.value=val;}}
  if(cmd==='copy'){await navigator.clipboard.writeText(contentArea.value.substring(start,end)||contentArea.value);}
  if(cmd==='paste'){try{const text=await navigator.clipboard.readText(); contentArea.value=contentArea.value.slice(0,start)+text+contentArea.value.slice(end); contentArea.setSelectionRange(start+text.length,start+text.length);}catch{}}
  if(cmd==='selectAll') contentArea.select(); if(cmd==='left') contentArea.setSelectionRange(Math.max(0,start-1),Math.max(0,start-1)); if(cmd==='right') contentArea.setSelectionRange(start+1,start+1);
});
function resetUndoStack(text){undoStack=[text||'']; redoStack=[];}