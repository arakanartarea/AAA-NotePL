import { db, COL1 } from "./firebase.js";
import { setAuthCallback } from "./login.js";
import { collection, getDocs } from "firebase/firestore";
import { initView, openViewMode, openEditMode, showList } from "./view.js";

let allSongs=[], filtered=[], groupBy="singer", selectedGroup=null, selectedId=null;
let favIds=new Set(JSON.parse(localStorage.getItem("favIds")||"[]")), favOnly=false;

const mainLayout=document.getElementById("mainLayout");
const groupPane=document.getElementById("groupPane");
const childPane=document.getElementById("childPane");
const searchInput=document.getElementById("searchInput");
const groupTpl=document.getElementById("group-template");
const childTpl=document.getElementById("child-template");

async function loadSongs(){
  try{ 
    const snap=await getDocs(collection(db, COL1));
    allSongs=snap.docs.map(d=>({id:d.id,...d.data(),title:d.data().title||d.id,singer:d.data().singer||"Unknown",writer:d.data().writer||"Unknown",album:d.data().album||"Unknown"}));
  }catch{ allSongs=[]; }
  initView(allSongs, ()=>{ selectedId=null; renderChildPane(); });
  applyFilter();
}
function applyFilter(){
  const q=(searchInput?.value||"").toLowerCase();
  filtered=allSongs.filter(s=>{
    if(favOnly &&!favIds.has(s.id)) return false;
    if(!q) return true;
    return `${s.title} ${s.singer} ${s.writer}`.toLowerCase().includes(q);
  });
  renderGroupPane(); renderChildPane();
}
function getGroupValue(s){ return groupBy==="titleLetter"? (s.title[0]||"#").toUpperCase() : s[groupBy]||"Unknown"; }
function renderGroupPane(){
  if(!groupPane || !groupTpl) return;
  groupPane.innerHTML="";
  const groups={}; filtered.forEach(s=>{ const g=getGroupValue(s); if(!groups[g]) groups[g]=[]; groups[g].push(s); });
  const sorted=Object.keys(groups).sort((a,b)=>a.localeCompare(b));
  if(!selectedGroup && sorted[0]) selectedGroup=sorted[0];
  sorted.forEach(gName=>{
    const clone=groupTpl.content.cloneNode(true);
    const head=clone.querySelector(".group-head");
    head.dataset.g=gName; if(selectedGroup===gName) head.classList.add("active");
    clone.querySelector(".group-name").textContent=gName;
    clone.querySelector(".group-count").textContent=groups[gName].length;
    groupPane.appendChild(clone);
  });
}
function renderChildPane(){
  if(!childPane || !childTpl) return;
  childPane.innerHTML="";
  if(!selectedGroup){ childPane.innerHTML='<div style="padding:16px;opacity:.5">ဘယ်က Group ရွေးပါ</div>'; return; }
  const list=filtered.filter(s=>getGroupValue(s)===selectedGroup).sort((a,b)=>a.title.localeCompare(b.title));
  list.forEach(child=>{
    const cClone=childTpl.content.cloneNode(true);
    const cEl=cClone.querySelector(".child");
    cEl.dataset.id=child.id; if(selectedId===child.id) cEl.classList.add("active");
    cClone.querySelector(".child-title").textContent=child.title;
    const favBtn=cClone.querySelector(".fav"); favBtn.dataset.fav=child.id;
    const isFav=favIds.has(child.id); favBtn.classList.toggle("active",isFav);
    favBtn.querySelector("i").className=`${isFav?'fa-solid':'fa-regular'} fa-heart`;
    const editBtn=cClone.querySelector(".edit-icon"); editBtn.dataset.edit=child.id;
    editBtn.classList.toggle("show",!!window._isAdmin);
    childPane.appendChild(cClone);
  });
}
function toggleFav(id){ if(favIds.has(id)) favIds.delete(id); else favIds.add(id); localStorage.setItem("favIds", JSON.stringify([...favIds])); renderChildPane(); }

groupPane?.addEventListener("click", e=>{ const g=e.target.closest(".group-head"); if(g){ selectedGroup=g.dataset.g; selectedId=null; renderGroupPane(); renderChildPane(); } });
childPane?.addEventListener("click", e=>{
  const favBtn=e.target.closest("[data-fav]"); if(favBtn){ e.stopPropagation(); toggleFav(favBtn.dataset.fav); return; }
  const editBtn=e.target.closest("[data-edit]"); if(editBtn){ e.stopPropagation(); selectedId=editBtn.dataset.edit; renderChildPane(); openEditMode(editBtn.dataset.edit, allSongs, loadSongs); return; }
  const child=e.target.closest(".child"); if(child){ selectedId=child.dataset.id; renderChildPane(); openViewMode(child.dataset.id, allSongs); }
});
document.querySelectorAll(".g-btn").forEach(b=>b.addEventListener("click",()=>{ document.querySelectorAll(".g-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active"); groupBy=b.dataset.group; selectedGroup=null; selectedId=null; renderGroupPane(); renderChildPane(); }));
searchInput?.addEventListener("input", applyFilter);
//ရှာဖွေရေး 
document.getElementById("searchBtn")?.addEventListener("click", () => {
  const box = document.querySelector(".search-box");
  const input = document.getElementById("searchInput");
  if (!box || !input) return;
  box.classList.toggle("hidden");
  if (!box.classList.contains("hidden")) {
    input.focus();
  } else {
    input.value = "";
    applyFilter();
  }
});

document.getElementById("favFilterBtn")?.addEventListener("click", () => { favOnly = !favOnly; document.getElementById("favFilterBtn").style.color = favOnly ? 'var(--accent)' : ''; applyFilter(); });
document.getElementById("settingsBtn")?.addEventListener("click", () => { document.getElementById("loginModal")?.classList.remove("hidden"); });
setAuthCallback(()=>{ renderGroupPane(); renderChildPane(); });
loadSongs();