import { db, COL2, COL1 } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const FIELDS_12 = ["album","bpm","capo","content","key","pluck","singer","songId","songmap","strum","title","writer"];
let onBackToList = null;
let currentAllSongs = [];

export function initView(allSongsRef, backCallback){
  currentAllSongs = allSongsRef;
  onBackToList = backCallback;
}

function getEls(){
  return {
    mainLayout: document.getElementById("mainLayout"),
    viewPane: document.getElementById("viewPane"),
    viewContent: document.getElementById("viewContent"),
    viewTpl: document.getElementById("view-template"),
    editTpl: document.getElementById("editTemplate"),
    favBtn: document.getElementById("favFilterBtn"),
    searchBtn: document.getElementById("searchBtn"),
    modeBtn: document.getElementById("modeBtn"),
    settingsBtn: document.getElementById("settingsBtn"),
    backBtn: document.getElementById("backToList"),
    row2Mode: document.getElementById("row2-mode")
  };
}

function showViewFull(){
  const { mainLayout, viewPane, favBtn, searchBtn, modeBtn, settingsBtn, backBtn, row2Mode } = getEls();
  mainLayout?.classList.add("view-full");
  viewPane?.classList.remove("hidden");
  favBtn?.classList.add("hidden");
  searchBtn?.classList.add("hidden");
  modeBtn?.classList.add("hidden");
  settingsBtn?.classList.add("hidden");
  backBtn?.classList.remove("hidden");
  row2Mode?.classList.remove("show");
  if(location.hash!== '#view') history.pushState({view:'song'}, '', '#view');
}

export function showList(isPop=false){
  const { mainLayout, viewPane, viewContent, favBtn, searchBtn, modeBtn, settingsBtn, backBtn, row2Mode } = getEls();
  mainLayout?.classList.remove("view-full");
  viewPane?.classList.add("hidden");
  if(viewContent) viewContent.innerHTML="";
  favBtn?.classList.remove("hidden");
  searchBtn?.classList.remove("hidden");
  modeBtn?.classList.remove("hidden");
  settingsBtn?.classList.remove("hidden");
  backBtn?.classList.add("hidden");
  row2Mode?.classList.remove("show");
  if(onBackToList) onBackToList();
  if(!isPop && location.hash==='#view') history.back();
}

// မင်းအလုပ်ဖြစ်တဲ့ ဟာအတိုင်း - clone ပေါ်မှာပဲ ဖြည့်
export async function openViewMode(id, allSongs = currentAllSongs){
  currentAllSongs = allSongs;
  const { viewContent, viewTpl } = getEls();
  if(!viewContent) return;
  viewContent.innerHTML = `<div style="padding:20px"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
  showViewFull();
  let d=null;
  try{ const snap = await getDoc(doc(db, COL2, id)); if(snap.exists()) d=snap.data(); }catch{}
  const meta = allSongs.find(x=>x.id===id);
  if(!viewTpl) return;
  const clone = viewTpl.content.cloneNode(true);

  // အဟောင်း - ရပြီးသား
  clone.querySelector(".view-title").textContent = d?.title || meta?.title || id;
  const idEl = clone.querySelector(".view-id");
  if(idEl) idEl.textContent = id;
  const contentEl = clone.querySelector(".view-content");
  if(contentEl) contentEl.textContent = d?.content||"— no content";
  const metaEl = clone.querySelector(".view-meta");
  if(metaEl) metaEl.textContent = `key:${d?.key||""} capo:${d?.capo||0} bpm:${d?.bpm||70}`;

  // အသစ် template အတွက် ထပ်ဖြည့်
  const writerEl = clone.querySelector(".view-writer") || clone.querySelector("#view-writer");
  if(writerEl) writerEl.textContent = d?.writer || meta?.writer || '';
  const singerEl = clone.querySelector(".view-singer") || clone.querySelector("#view-singer");
  if(singerEl) singerEl.textContent = d?.singer || meta?.singer || '';
  const kEl = clone.querySelector("#keyValue"); if(kEl) kEl.textContent = d?.key||'E';
  const cEl = clone.querySelector("#capoValue"); if(cEl) cEl.textContent = d?.capo||0;
  const bEl = clone.querySelector("#tempoInput"); if(bEl) bEl.value = d?.bpm||70;
  const sEl = clone.querySelector("#strumPattern"); if(sEl) sEl.textContent = d?.strum||'';
  const pEl = clone.querySelector("#pluckPattern"); if(pEl) pEl.textContent = d?.pluck||'';
  const versesEl = clone.querySelector("#dynamic-verses"); if(versesEl) versesEl.innerHTML = d?.content || '<div class="verse"><pre>Content မရှိသေးပါ</pre></div>';
  const tlEl = clone.querySelector("#song-timeline-bar"); if(tlEl) tlEl.textContent = d?.songmap||'';

  viewContent.innerHTML="";
  viewContent.appendChild(clone);
}

export async function openEditMode(id, allSongs = currentAllSongs, onSaved=()=>{}){
  currentAllSongs = allSongs;
  const { viewContent, editTpl } = getEls();
  if(!viewContent) return;
  showViewFull();
  viewContent.innerHTML = `<div style="padding:20px"><i class="fa-solid fa-spinner fa-spin"></i> ${id} loading...</div>`;
  let col2Data={}, col1Data={};
  try{ const s=await getDoc(doc(db, COL2, id)); if(s.exists()) col2Data=s.data(); }catch{}
  try{ const s=await getDoc(doc(db, COL1, id)); if(s.exists()) col1Data=s.data(); }catch{}
  function getMerged(f){
    if(col2Data[f]!==undefined && col2Data[f]!=="") return col2Data[f];
    if(col1Data[f]!==undefined && col1Data[f]!=="") return col1Data[f];
    if(f==="singer" && Array.isArray(col1Data.singers) && col1Data.singers[0]) return col1Data.singers[0];
    if(f==="writer" && Array.isArray(col1Data.writers) && col1Data.writers[0]) return col1Data.writers[0];
    return "";
  }
  viewContent.innerHTML="";
  viewContent.appendChild(editTpl.content.cloneNode(true));
  FIELDS_12.forEach(f=>{
    const el=document.getElementById(`edit_${f}`);
    if(el) el.value = f==="songId"? id : getMerged(f);
  });
  document.getElementById("cancelEdit")?.addEventListener("click", ()=> openViewMode(id, allSongs));
  document.getElementById("saveEditBtn")?.addEventListener("click", async ()=>{
    const payload={};
    FIELDS_12.forEach(f=>{
      const el=document.getElementById(`edit_${f}`);
      let v=el?.value||""; if(f==="bpm"||f==="capo") v=Number(v)||0; payload[f]=v;
    });
    payload.songId=id; payload.updatedAt=Date.now();
    await setDoc(doc(db, COL2, id), payload, {merge:true});
    await setDoc(doc(db, COL1, id), {title:payload.title, singer:payload.singer, writer:payload.writer, album:payload.album}, {merge:true});
    onSaved(); openViewMode(id, allSongs);
  });
}

document.getElementById("backToList")?.addEventListener("click", ()=> showList());
document.getElementById("modeBtn")?.addEventListener("click", ()=>{
  document.getElementById("row2-mode")?.classList.toggle("show");
});
window.addEventListener("popstate", ()=>{
  if(document.getElementById("mainLayout")?.classList.contains("view-full")) showList(true);
});