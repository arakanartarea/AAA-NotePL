import { store } from "./firebase-collections.js";
const box = document.getElementById('accordion-container');
const search = document.getElementById('search-input');

function render(){
  if(!store.AllArakanSongs.length){ box.innerHTML="ဒေတာမရောက်သေး..."; return; }
  const q=(search.value||'').toLowerCase();
  const data=store.AllArakanSongs.filter(s=>(s.title||'').toLowerCase().includes(q));
  const grouped={};
  data.forEach(s=>{ const k=(s.singer||'မသိ').split(',')[0].trim(); (grouped[k]||(grouped[k]=[])).push(s); });

  box.innerHTML='';
  Object.keys(grouped).sort().forEach(singer=>{
    const div=document.createElement('div');
    div.innerHTML=`<div style="font-weight:bold; padding:8px; border-bottom:1px solid #ccc; cursor:pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">${singer} (${grouped[singer].length})</div><div class="hidden" style="padding-left:16px">${grouped[singer].map(s=>`<div>${s.title}</div>`).join('')}</div>`;
    box.appendChild(div);
  });
}

window.addEventListener('data-ready', render);
search?.addEventListener('input', render);
setTimeout(render, 2000);