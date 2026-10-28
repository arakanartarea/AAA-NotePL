// CSS cache bust
(function(){
  const t = Date.now();
  ['css-common','css-phone','css-tablet','css-override'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.href = el.getAttribute('href').split('?')[0] + '?v=' + t;
  });
})();

const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note",
  storageBucket: "arakanartarea-note.firebasestorage.app",
  messagingSenderId: "695659736666",
  appId: "1:695659736666:web:1e76494c0e6819609bf263"
};
if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let allSongsData=[], filteredData=[], editingDocId=null, isAdminUser=false, currentUser=null;
let imageMap = {};
let sortBy = localStorage.getItem('aas-sort-by')||'singer';
let showFavOnly = false;
let favList = JSON.parse(localStorage.getItem('aas-fav')||'[]');

function splitNames(str){
  if(!str) return [];
  if(Array.isArray(str)) return str;
  return str.split(/[,၊/&+]+|နဲ့|and|with/gi).map(s=>s.trim()).filter(s=>s);
}
function normalizeMyanmar(str) {
  if (!str) return '';
  return str.trim().normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ');
}
function getUniqueList(type) {
  const map = new Map();
  allSongsData.forEach(s => {
    let arr = [];
    if (type === 'singer') arr = s.singers || [];
    else if (type === 'writer') arr = s.writers || [];
    else { let v = s[type] || ''; if (v) arr = [v]; }
    arr.forEach(name => {
      if (!name) return;
      const norm = normalizeMyanmar(name).toLowerCase();
      if (!norm) return;
      if (map.has(norm)) map.get(norm).count++;
      else map.set(norm, { name: name.trim(), count: 1 });
    });
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
function showSuggest(inputEl, type, isComma) {
  const box = document.getElementById('suggest-' + type);
  let raw = inputEl.value;
  let query = '';
  if (isComma) {
    const parts = raw.split(',');
    query = normalizeMyanmar(parts[parts.length - 1]).toLowerCase();
  } else {
    query = normalizeMyanmar(raw).toLowerCase();
  }
  if (!query) { box.style.display = 'none'; return; }
  const matched = getUniqueList(type).filter(item => normalizeMyanmar(item.name).toLowerCase().includes(query)).slice(0, 10);
  if (matched.length === 0) { box.style.display = 'none'; return; }
  box.innerHTML = '';
  matched.forEach(item => {
    const div = document.createElement('div');
    div.className = 'suggest-item';
    div.innerHTML = `<span>${item.name}</span><span class="suggest-count">${item.count}</span>`;
    div.addEventListener('click', () => { selectSuggest(type, item.name, isComma); });
    box.appendChild(div);
  });
  box.style.display = 'block';
}
function selectSuggest(type, chosenName, isComma) {
  const inputEl = document.getElementById('inp-' + type);
  const box = document.getElementById('suggest-' + type);
  if (isComma) {
    let parts = inputEl.value.split(',');
    parts[parts.length - 1] = chosenName;
    let cleaned = parts.map(p => p.trim()).filter(p => p);
    cleaned = [...new Set(cleaned)];
    inputEl.value = cleaned.join(', ');
  } else {
    inputEl.value = chosenName;
  }
  box.style.display = 'none';
  box.innerHTML = '';
  inputEl.focus();
}
document.addEventListener('click', e => {
  if (!e.target.closest('.form-group')) {
    document.querySelectorAll('.suggest-box').forEach(b => { b.style.display = 'none'; });
  }
});
function initFirebase(){
  db.collection('ImageLink').onSnapshot(snap => {
    imageMap = {};
    snap.forEach(doc => {
      const d = doc.data();
      if (d.name && d.link) imageMap[d.name.trim()] = d.link;
    });
    renderAccordion();
  });
  auth.onAuthStateChanged(async (user)=>{
    currentUser=user;
    if(user){
      try{
        const email=user.email.toLowerCase();
        const adminDoc=await db.collection('admins').doc(email).get();
        isAdminUser=adminDoc.exists;
      }catch(e){isAdminUser=false}
    }else{isAdminUser=false}
    updateAuthUI();
  });
  db.collection('AllArakanSongs').onSnapshot(snap=>{
    allSongsData=[];
    snap.forEach(doc=>{
      let d=doc.data(); d._id=doc.id;
      d.singers=d.singers||splitNames(d.singer);
      d.writers=d.writers||splitNames(d.writer);
      allSongsData.push(d);
    });
    filterSongs();
  });
}
function updateAuthUI(){
  const badge=document.getElementById('status-badge');
  const addBtn=document.getElementById('btn-add');
  if(badge){
    if(isAdminUser&&currentUser){
      badge.textContent='Admin: '+(currentUser.displayName||currentUser.email.split('@')[0]);
      badge.style.background='#16a34a'; badge.style.color='#fff';
    } else {
      badge.textContent=currentUser?'Viewer: '+currentUser.email.split('@')[0]:'Viewer';
      badge.style.background='#eab308'; badge.style.color='#000';
    }
  }
  if(addBtn) addBtn.style.display=isAdminUser?'grid':'none';
  filterSongs();
}
function switchView(id){
  document.querySelectorAll('.view-section').forEach(el=>el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function filterSongs() {
  const q = (document.getElementById('search-input').value || '').toLowerCase().trim();
  let data = allSongsData.filter(s => {
    if (showFavOnly && !favList.includes(s._id)) return false;
    if (!q) return true;
    return (s.title || '').toLowerCase().includes(q) || (s.singer || '').toLowerCase().includes(q) || (s.writer || '').toLowerCase().includes(q) || (s.album || '').toLowerCase().includes(q);
  });
  filteredData = data;
  renderAccordion();
}
const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-search');
searchInput?.addEventListener('input', () => {
  if (clearBtn) clearBtn.style.display = searchInput.value ? 'block' : 'none';
  filterSongs();
});
clearBtn?.addEventListener('click', () => {
  searchInput.value = '';
  clearBtn.style.display = 'none';
  filterSongs();
  searchInput.focus();
});
function renderAccordion(){
  const container=document.getElementById('accordion-container');
  container.innerHTML='';
  const grouped={};
  const isDesc = sortBy.endsWith('-desc') || sortBy==='new';
  filteredData.forEach(s=>{
    let key='';
    let field = sortBy.split('-')[0];
    if(field==='writer') key=s.writers[0]||'မသိ';
    else if(field==='album') key=s.album||'အယ်ဘမ် မသိ';
    else if(field==='singer') key=s.singers[0]||'မသိ';
    else key='All Songs';
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(s);
  });
  let groupKeys = Object.keys(grouped).sort((a,b)=> a.localeCompare(b));
  if(isDesc) groupKeys.reverse();
  groupKeys.forEach(gName=>{
    const songs=grouped[gName];
    const acc=document.createElement('div'); acc.className='accordion';
    const header=document.createElement('div'); header.className='accordion-header';
    header.style.display='flex'; header.style.justifyContent='space-between'; header.style.alignItems='center';
    const imgUrl = imageMap[gName];
    const imgHTML = imgUrl? `<img src="${imgUrl}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;">` : `<span>🎤</span>`;
    header.innerHTML=`<div style="display:flex;align-items:center;gap:8px;">${imgHTML}<span>${gName}</span></div><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;opacity:0.75;">(${songs.length})</span><span>▼</span></div>`;
    header.addEventListener('click', ()=> acc.classList.toggle('open'));
    const content=document.createElement('div'); content.className='accordion-content';
    content.innerHTML = songs.map(song => {
      const isFav = favList.includes(song._id);
      const stars = '⭐'.repeat(song.vote || 0);
      return `<div class="song-item"><span class="song-title-click" onclick="openDetail('${song._id}')"><span class="id-badge" data-id="${song._id}">ID:${song._id}</span> ${song.title||'-'} <span class="vote-badge">${song.vote||0}/9 ${stars}</span><br><small style="color:var(--muted)">${(song.singers||[]).join(', ')} | ရေး: ${(song.writers||[]).join(', ')}</small></span><div class="item-actions"><button class="icon-btn fav-btn ${isFav?'active':''}" data-fav="${song._id}">${isFav?'★':'☆'}</button><div style="display:${isAdminUser?'flex':'none'};gap:4px"><button class="icon-btn" data-edit="${song._id}">📝</button><button class="icon-btn" data-del="${song._id}">🗑️</button></div></div></div>`;
    }).join('');
    content.addEventListener('click', (e)=>{
      const idBadge = e.target.closest('.id-badge');
      if(idBadge){ e.stopPropagation(); navigator.clipboard.writeText(idBadge.dataset.id); return; }
      const favBtn = e.target.closest('[data-fav]');
      if(favBtn){ toggleFav(favBtn.dataset.fav); return; }
      const editBtn = e.target.closest('[data-edit]');
      if(editBtn){ editSong(editBtn.dataset.edit); return; }
      const delBtn = e.target.closest('[data-del]');
      if(delBtn){ deleteSong(delBtn.dataset.del); return; }
    });
    acc.appendChild(header); acc.appendChild(content); container.appendChild(acc);
  });
}
function toggleFav(id){
  if(favList.includes(id)) favList=favList.filter(x=>x!==id);
  else favList.push(id);
  localStorage.setItem('aas-fav',JSON.stringify(favList));
  renderAccordion();
}
function toggleFavFilter(){
  showFavOnly=!showFavOnly;
  document.getElementById('btn-fav-filter').style.background=showFavOnly?'#f59e0b':'';
  filterSongs();
}
function openSortModal(){
  document.getElementById('sortModal').style.display='block';
  document.getElementById('sortOverlay').style.display='block';
  document.querySelectorAll('.sort-item').forEach(el=>{el.classList.toggle('active',el.dataset.sort===sortBy);});
}
function closeSortModal(){
  document.getElementById('sortModal').style.display='none';
  document.getElementById('sortOverlay').style.display='none';
}
function setSort(s){
  sortBy=s; localStorage.setItem('aas-sort-by',s);
  document.querySelectorAll('.sort-item').forEach(e=>e.classList.remove('active'));
  document.querySelector(`.sort-item[data-sort="${s}"]`)?.classList.add('active');
  closeSortModal(); filterSongs();
}
function openFontModal(){document.getElementById('fontModal').style.display='block';document.getElementById('fontOverlay').style.display='block';}
function closeFontModal(){document.getElementById('fontModal').style.display='none';document.getElementById('fontOverlay').style.display='none';}
function changeGlobalFont(f){
  localStorage.setItem('aaaUserFont',f);
  let s=document.getElementById('global-font-style');
  if(!s){s=document.createElement('style');s.id='global-font-style';document.head.appendChild(s);}
  s.innerHTML=`body *:not(.material-symbols-rounded){font-family:'${f}'!important;}`;
  closeFontModal();
}
(function(){
  const saved=localStorage.getItem('aaaUserFont');
  if(saved){
    let s=document.createElement('style');s.id='global-font-style';
    s.innerHTML=`body *:not(.material-symbols-rounded){font-family:'${saved}'!important;}`;
    document.head.appendChild(s);
  }
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark-mode');
})();
function findNextFreeId(){
  const nums = allSongsData.map(s => parseInt(s._id)).filter(n =>!isNaN(n)).sort((a,b)=>a-b);
  if(nums.length===0) return "1";
  for(let i=1;i<nums.length;i++){ if(nums[i]-nums[i-1]>1) return String(nums[i-1]+1); }
  if(nums[0]!==1) return "1";
  return String(nums[nums.length-1]+1);
}
function openCreateForm(){
  if(!isAdminUser){ alert('Admin login လိုတယ်'); return; }
  editingDocId=null;
  const nextId=findNextFreeId();
  document.getElementById('form-title').textContent='အသစ်ထည့် - Auto ID: '+nextId;
  document.getElementById('inp-id').value=nextId;
  ['inp-title','inp-singer','inp-writer','inp-album','inp-albumType','inp-genre','inp-songType','inp-language','inp-releaseDate','inp-coverUrl','inp-audioUrl','inp-remark'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  document.getElementById('inp-vote').value=0;
  switchView('input-view');
}
function editSong(id){
  if(!isAdminUser) return;
  db.collection('AllArakanSongs').doc(id).get().then(doc=>{
    if(!doc.exists) return;
    const d=doc.data(); editingDocId=id;
    document.getElementById('inp-id').value=id;
    document.getElementById('inp-title').value=d.title||'';
    document.getElementById('inp-singer').value=d.singer||(d.singers||[]).join(', ');
    document.getElementById('inp-writer').value=d.writer||(d.writers||[]).join(', ');
    document.getElementById('inp-album').value=d.album||'';
    document.getElementById('inp-albumType').value=d.albumType||'';
    document.getElementById('inp-genre').value=d.genre||'';
    document.getElementById('inp-songType').value=d.songType||'';
    document.getElementById('inp-language').value=d.language||'';
    document.getElementById('inp-releaseDate').value=d.releaseDate||'';
    document.getElementById('inp-coverUrl').value=d.coverUrl||'';
    document.getElementById('inp-audioUrl').value=d.audioUrl||'';
    document.getElementById('inp-vote').value=d.vote||0;
    document.getElementById('inp-remark').value=d.remark||'';
    switchView('input-view');
  });
}
function saveSong(){
  if(!isAdminUser) return;
  const id=document.getElementById('inp-id').value.trim();
  const title=document.getElementById('inp-title').value.trim();
  if(!id||!title){alert('ID နဲ့ Title လိုတယ်');return;}
  const singerStr=document.getElementById('inp-singer').value.trim();
  const writerStr=document.getElementById('inp-writer').value.trim();
  const payload={
    title, singer:singerStr, singers:splitNames(singerStr), writer:writerStr, writers:splitNames(writerStr),
    album:document.getElementById('inp-album').value.trim(),
    albumType:document.getElementById('inp-albumType').value.trim(),
    genre:document.getElementById('inp-genre').value.trim(),
    songType:document.getElementById('inp-songType').value.trim(),
    language:document.getElementById('inp-language').value.trim(),
    releaseDate:document.getElementById('inp-releaseDate').value.trim(),
    coverUrl:document.getElementById('inp-coverUrl').value.trim(),
    audioUrl:document.getElementById('inp-audioUrl').value.trim(),
    vote:parseInt(document.getElementById('inp-vote').value)||0,
    remark:document.getElementById('inp-remark').value.trim()
  };
  db.collection('AllArakanSongs').doc(id).set(payload,{merge:true}).then(()=>switchView('list-view')).catch(e=>alert(e.message));
}
function deleteSong(id){if(!isAdminUser) return; if(confirm('ဖျက်မလား '+id+'?')) db.collection('AllArakanSongs').doc(id).delete();}
function handleAuthClick(){
  if(currentUser){
    document.getElementById('auth-modal-email').textContent=currentUser.email;
    document.getElementById('auth-modal').classList.remove('hidden');
  }else{
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    auth.signInWithPopup(provider);
  }
}
document.getElementById('search-input').addEventListener('input', filterSongs);
document.getElementById('btn-add').addEventListener('click', openCreateForm);
document.getElementById('btn-settings').addEventListener('click', ()=>{
  const m=document.getElementById('list-fab-menu');
  m.style.display=m.style.display==='flex'?'none':'flex';
});
document.getElementById('btn-login').addEventListener('click', handleAuthClick);
document.getElementById('btn-theme').addEventListener('click', ()=>{
  let isDark=document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme',isDark?'dark':'light');
});
document.getElementById('btn-font').addEventListener('click', openFontModal);
document.getElementById('btn-sort').addEventListener('click', openSortModal);
document.getElementById('btn-fav-filter').addEventListener('click', toggleFavFilter);
document.getElementById('btn-save').addEventListener('click', saveSong);
document.getElementById('btn-back').addEventListener('click', ()=>switchView('list-view'));
document.getElementById('btn-detail-back').addEventListener('click', ()=>switchView('list-view'));
document.getElementById('btn-auth-cancel').addEventListener('click', ()=>document.getElementById('auth-modal').classList.add('hidden'));
document.getElementById('btn-auth-logout').addEventListener('click', ()=>{document.getElementById('auth-modal').classList.add('hidden'); auth.signOut();});
document.getElementById('btn-auth-switch').addEventListener('click', ()=>{
  document.getElementById('auth-modal').classList.add('hidden');
  auth.signOut().then(()=>{setTimeout(()=>{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});auth.signInWithPopup(p);},400);});
});
document.getElementById('fontOverlay').addEventListener('click', closeFontModal);
document.getElementById('sortOverlay').addEventListener('click', closeSortModal);
document.querySelectorAll('.font-item').forEach(el=>el.addEventListener('click', ()=>changeGlobalFont(el.dataset.font)));
document.querySelectorAll('.sort-item').forEach(el=>el.addEventListener('click', ()=>setSort(el.dataset.sort)));
initFirebase();
function toggleSec(id) {
  const body = document.getElementById(id);
  const arrow = document.getElementById('arrow-' + id);
  const isHide = body.style.display === 'none' || body.style.display === '';
  body.style.display = isHide ? 'block' : 'none';
  if (arrow) arrow.classList.toggle('open', isHide);
}
function openDetail(id) {
  const meta = allSongsData.find(s => s._id === id);
  if (!meta) return;
  document.getElementById('sec-info').innerHTML = `
    <div class="info-grid">
      <b>ID</b><span>${meta._id||''}</span>
      <b>နာမယ်</b><span>${meta.title||''}</span>
      <b>တေးဆို</b><span>${(meta.singers||[]).join(', ')||meta.singer||''}</span>
      <b>တေးရေး</b><span>${(meta.writers||[]).join(', ')||meta.writer||''}</span>
      <b>အယ်ဘမ်</b><span>${meta.album||''}</span>
      <b>အယ်ဘမ်အမျိုးအစား</b><span>${meta.albumType||''}</span>
      <b>ဂီတအမျိုးအစား</b><span>${meta.genre||''}</span>
      <b>အကြောင်းအရာ</b><span>${meta.songType||''}</span>
      <b>ဘာသာစကား</b><span>${meta.language||''}</span>
      <b>ထွက်ရှိချိန်</b><span>${meta.releaseDate||''}</span>
      <b>Vote</b><span>${meta.vote||0}/9</span>
      <b>Cover</b><span style="word-break:break-all">${meta.coverUrl||''}</span>
      <b>Audio URL</b><span style="word-break:break-all">${meta.audioUrl||''}</span>
      <b>Remark</b><span>${meta.remark||''}</span>
    </div>
  `;
  document.getElementById('list-view').classList.remove('active');
  document.getElementById('detail-view').classList.add('active');
  document.getElementById('sec-info').style.display = 'block';
  document.getElementById('arrow-sec-info')?.classList.add('open');
  history.pushState({ view: 'detail' }, '');
  db.collection('AAASongs').doc(id).get().then(doc => {
    if (doc.exists) {
      const p = doc.data();
      document.getElementById('sec-lyrics').innerHTML = `
        <div class="info-grid" style="margin-bottom:12px">
          <b>Key</b><span>${p.key||''}</span>
          <b>Capo</b><span>${p.capo||0}</span>
          <b>BPM</b><span>${p.bpm||''}</span>
          <b>Strum</b><span>${p.strum||''}</span>
          <b>Pluck</b><span>${p.pluck||''}</span>
          <b>SongMap</b><span>${p.songmap||''}</span>
        </div>
        <div style="border-top:1px solid #334155;padding-top:12px">${p.content||''}</div>
      `;
    } else {
      document.getElementById('sec-lyrics').innerHTML = 'AAASongs ထဲမှာ ID:' + id + ' မရှိသေးဘူး';
    }
  });
}
function closeDetail() {
  document.getElementById('detail-view').classList.remove('active');
  document.getElementById('list-view').classList.add('active');
  history.pushState({ view: 'list' }, '');
}
window.addEventListener('popstate', () => {
  document.getElementById('detail-view').classList.remove('active');
  document.getElementById('list-view').classList.add('active');
});