// ===== FIREBASE HARDCODE CONFIG - ပြင်ပြီး =====
const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note",
  storageBucket: "arakanartarea-note.firebasestorage.app",
  messagingSenderId: "695659736666",
  appId: "1:695659736666:web:1e76494c0e6819609bf263",
  measurementId: "G-Y9Y5SK15M9"
};

let db=null;
let editingDocId=null;

function initFirebase(){
  try{
    if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db=firebase.firestore();
    const badge = document.getElementById('status-badge');
    if(badge){
      badge.className='status-badge online';
      badge.textContent=`Connected: ${firebaseConfig.projectId}`;
    }
    fetchSongs();
  }catch(e){
    console.error(e);
    alert("Firebase error: "+e.message);
  }
}

// ====== VIEW CONTROL (တိကျစွာ display သတ်မှတ်ပေးခြင်း) ======
function switchView(viewId, isBack = false){
  if(!isBack && viewId!== 'list-view'){
    history.pushState({ view: viewId }, '');
  }

  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.getElementById(viewId)?.classList.add('active');

  const isList = viewId === 'list-view';
  const isPlayer = viewId === 'player-view';
  const isEdit = viewId === 'input-view';

  // Header နှင့် Floating Action Buttons (FABs) များကို View အလိုက် ခွဲခြားပြသခြင်း
  const header = document.getElementById('main-header');
  if (header) header.style.display = isList? 'flex' : 'none';

  const listFab = document.getElementById('list-fab-container');
  if (listFab) listFab.style.display = isList? 'flex' : 'none';

  const playerFab = document.getElementById('fab-container');
  if (playerFab) playerFab.style.display = isPlayer? 'flex' : 'none';

  const editFab = document.getElementById('edit-fab-container');
  if (editFab) editFab.style.display = isEdit? 'flex' : 'none';

  const topStack = document.getElementById('top-right-stack');
  if (topStack) topStack.style.display = isPlayer? 'block' : 'none';

  if(isPlayer) window.scrollTo(0,0);
  if(!isPlayer) stopPlayback();
}

window.addEventListener('popstate', () => {
  const activeView = document.querySelector('.view-section.active')?.id;
  if (activeView && activeView!== 'list-view') {
    switchView('list-view', true);
  }
});

let allSongsData = [];
function fetchSongs() {
  if (!db) return;
  db.collection('AAASongs').onSnapshot(snapshot => {
    allSongsData = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      allSongsData.push(data);
    });
    filterSongs();
  });
}

function filterSongs() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const filtered = allSongsData.filter(s =>
    (s.title || '').toLowerCase().includes(q) ||
    (s.singer || '').toLowerCase().includes(q) ||
    (s.writer || '').toLowerCase().includes(q) ||
    (s.album || '').toLowerCase().includes(q) ||
    (s.content || '').toLowerCase().includes(q)
  );

  const songsBySinger = {};
  filtered.forEach(data => {
    const singer = data.singer || 'အခြား/မသိရှိသူ';
    if (!songsBySinger[singer]) songsBySinger[singer] = [];
    songsBySinger[singer].push(data);
  });
  renderAccordion(songsBySinger);
}

function renderAccordion(groupedData){
  const container=document.getElementById('accordion-container');
  container.innerHTML='';
  if(Object.keys(groupedData).length===0){container.innerHTML='<p style="color:var(--muted)">သီချင်းများ မရှိသေးပါ။</p>';return;}
  for(const [singer,songs] of Object.entries(groupedData)){
    const acc=document.createElement('div');acc.className='accordion';
    let songsHTML=songs.map(song=>`
      <div class="song-item">
        <span class="song-title-click" onclick="playSong('${song.id}')">🎵 ${song.title}</span>
        <div class="item-actions">
          <button class="icon-btn" onclick="editSong('${song.id}')" title="Edit (Private)">📝</button>
          <button class="icon-btn" onclick="deleteSong('${song.id}','${song.title.replace(/'/g,"\\'")}')">🗑️</button>
        </div>
      </div>
    `).join('');
    acc.innerHTML=`<div class="accordion-header" onclick="this.parentElement.classList.toggle('open')"><span>🎤 ${singer} (${songs.length})</span><span>▼</span></div><div class="accordion-content">${songsHTML}</div>`;
    container.appendChild(acc);
  }
}

function openCreateForm(){
  editingDocId=null;
  document.getElementById('form-title').textContent="သီချင်းသစ် ထည့်ရန် - Private";
  document.querySelectorAll('#input-view input, #input-view textarea').forEach(i=>{if(i.id!=='inp-key'&&i.id!=='inp-capo'&&i.id!=='inp-bpm') i.value=''});
  document.getElementById('inp-key').value='E';document.getElementById('inp-capo').value=0;document.getElementById('inp-bpm').value=70;
  switchView('input-view');
}

function editSong(id){
  db.collection('AAASongs').doc(id).get().then(doc=>{
    if(!doc.exists) return;
    const data=doc.data();editingDocId=id;
    document.getElementById('form-title').textContent="သီချင်းပြင်ဆင်ရန် - Private";
    document.getElementById('inp-title').value=data.title||'';
    document.getElementById('inp-singer').value=data.singer||'';
    document.getElementById('inp-writer').value=data.writer||'';
    document.getElementById('inp-album').value=data.album||'';
    document.getElementById('inp-key').value=data.key||'E';
    document.getElementById('inp-capo').value=data.capo||0;
    document.getElementById('inp-bpm').value=data.bpm||70;
    document.getElementById('inp-strum').value=data.strum||'';
    document.getElementById('inp-pluck').value=data.pluck||'';
    document.getElementById('inp-songmap').value=data.songmap||'';
    document.getElementById('inp-content').value=data.content||'';
    switchView('input-view');
  });
}

function saveSong(){
  const payload={
    title:document.getElementById('inp-title').value,
    singer:document.getElementById('inp-singer').value,
    writer:document.getElementById('inp-writer').value,
    album:document.getElementById('inp-album').value,
    key:document.getElementById('inp-key').value,
    capo:parseInt(document.getElementById('inp-capo').value)||0,
    bpm:parseInt(document.getElementById('inp-bpm').value)||70,
    strum:document.getElementById('inp-strum').value,
    pluck:document.getElementById('inp-pluck').value,
    songmap:document.getElementById('inp-songmap').value,
    content:document.getElementById('inp-content').value
  };
  if(editingDocId){db.collection('AAASongs').doc(editingDocId).update(payload).then(()=>switchView('list-view'))}
  else{db.collection('AAASongs').add(payload).then(()=>switchView('list-view'))}
}

function deleteSong(id,title){
  if(confirm(`"${title}" ဖျက်မှာလား?`)){db.collection('AAASongs').doc(id).delete()}
}

function playSong(id){
  db.collection('AAASongs').doc(id).get().then(doc=>{
    if(!doc.exists) return;
    const data=doc.data();
    const box=document.getElementById('about-box');
    box.setAttribute('data-title',data.title||'');
    box.setAttribute('data-writer',data.writer||'');
    box.setAttribute('data-singer',data.singer||'');
    box.setAttribute('data-album',data.album||'');
    box.setAttribute('data-key',data.key||'E');
    box.setAttribute('data-capo',data.capo||0);
    box.setAttribute('data-bpm',data.bpm||70);
    box.setAttribute('data-strum',data.strum||'');
    box.setAttribute('data-pluck',data.pluck||'');
    box.setAttribute('data-songmap',data.songmap||'');
    document.getElementById('dynamic-verses').innerHTML = data.content || '<div class="verse"><div class="verse-content"><pre>Content မရှိသေးပါ</pre></div></div>';
    switchView('player-view');
    setTimeout(()=>{syncAll();renderChords();applyCapo(parseInt(data.capo)||0);},50);
  });
}

// ====== VIEW CODE JS (PLAYER LOGIC) ======
const fabToggle=document.getElementById('fab-toggle'),fabMenu=document.getElementById('fab-menu'),aboutOverlay=document.getElementById('about-overlay'),topStack=document.getElementById('top-right-stack');
if(localStorage.getItem('infoBoxHidden')==='true') topStack.classList.add('hidden');
fabToggle.onclick=()=>fabMenu.classList.toggle('show');
document.getElementById('btn-info-box').onclick=()=>{topStack.classList.toggle('hidden');localStorage.setItem('infoBoxHidden',topStack.classList.contains('hidden'))};
document.getElementById('btn-about').onclick=()=>{aboutOverlay.classList.remove('hidden');fabMenu.classList.remove('show')};
document.getElementById('about-close').onclick=()=>aboutOverlay.classList.add('hidden');
aboutOverlay.onclick=(e)=>{if(e.target===aboutOverlay) aboutOverlay.classList.add('hidden')};

let lyricSize=parseInt(localStorage.getItem('lyricSize'))||14;
function applyLyricSize(){document.documentElement.style.setProperty('--lyric-size',lyricSize+'px');localStorage.setItem('lyricSize',lyricSize)}
document.getElementById('btn-font-up').onclick=()=>{if(lyricSize<45){lyricSize++;applyLyricSize()}};
document.getElementById('btn-font-down').onclick=()=>{if(lyricSize>8){lyricSize--;applyLyricSize()}};
document.getElementById('btn-chord-row').onclick=()=>document.body.classList.toggle('hide-chords');

// ====== THEME TOGGLE ======
let isDark=localStorage.getItem('theme')==='dark';
function updateThemeIcon(){
  document.body.classList.toggle('dark-mode',isDark);
  const iconName = isDark? 'light_mode' : 'dark_mode';
  const playerThemeBtn = document.getElementById('btn-theme');
  const listThemeBtn = document.getElementById('btn-list-theme');
  if(playerThemeBtn) playerThemeBtn.innerHTML = `<span class="material-symbols-rounded">${iconName}</span>`;
  if(listThemeBtn) listThemeBtn.innerHTML = `<span class="material-symbols-rounded">${iconName}</span>`;
}
function toggleTheme(){
  isDark =!isDark;
  localStorage.setItem('theme', isDark? 'dark' : 'light');
  updateThemeIcon();
}

function renderChords() {
  document.querySelectorAll('pre.resizable-text').forEach(pre => {
    if (pre.dataset.chorded === '1') return;
    if (!pre.textContent.includes('[')) return;
    let t = pre.textContent;
    let inHarmony = false;
    t = t.replace(/\[([^\s\]]+)\s+([1-4])\]([^\[\]\n]*)/g, (m, chord, bar, lyric) => {
      let cleanLyric = lyric || '';
      if (cleanLyric.includes('(')) inHarmony = true;
      let harmClass = inHarmony? ' harmony' : '';
      if (cleanLyric.includes(')')) inHarmony = false;
      return `<span class="chord-wrap bar-${bar}${harmClass}"><span class="chord">${chord}</span><span class="lyric">${cleanLyric || '&nbsp;'}</span></span>`;
    });
    t = t.replace(/\[([^\]]+)\]/g, `<span class="chord-wrap bar-1"><span class="chord">$1</span><span class="lyric">&nbsp;</span></span>`);
    pre.innerHTML = t;
    pre.dataset.chorded = '1';
  });
}

const yPos={6:10,5:24,4:38,3:52,2:66,1:80};
let tokens=[],pluckTokens=[];

function renderBoard(){
  const el=document.getElementById('strumPattern'),container=document.getElementById('staffContainer');
  if(el&&container){
    const rawText=el.innerText.trim(); tokens=rawText?rawText.split(/\s+/):[];
    while(tokens.length<16) tokens.push('.');
    const boxWidth=52,boxGap=4,totalWidth=(boxWidth*4)+(boxGap*3),height=90;
    let svg=`<svg viewBox="0 0 ${totalWidth} ${height}"><defs><marker id="arr-d" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ff0000"/></marker><marker id="arr-u" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0000ff"/></marker></defs>`;
    for(let b=0;b<4;b++){const boxX=b*(boxWidth+boxGap);svg+=`<rect x="${boxX}" y="2" width="${boxWidth}" height="${height-4}" rx="4" fill="#15151a" stroke="#2ed573" stroke-width="1.2" opacity="0.9"/>`; [6,5,4,3,2,1].forEach(num=>{svg+=`<line x1="${boxX+2}" y1="${yPos[num]}" x2="${boxX+boxWidth-2}" y2="${yPos[num]}" stroke="#333" stroke-width="1"/>`;});}
    tokens.forEach((code,i)=>{if(i>=16) return; if(code==='.') return; const beat=Math.floor(i/4),sub=i%4,boxX=beat*(boxWidth+boxGap),x=boxX+(sub+0.5)*(boxWidth/4);const isDown=code.startsWith('D'),color=isDown?'#ff0000':'#0000ff',marker=isDown?'url(#arr-d)':'url(#arr-u)';let s=6,e=1; if(code.includes('HT')){s=6;e=3;} else if(code.includes('HB')){s=4;e=1;} else if(code.includes('F')){s=6;e=1;}const y1=isDown?yPos[s]:yPos[e],y2=isDown?yPos[e]:yPos[s];svg+=`<g class="strum-arrow" id="arrow-${i}" style="color:${color}"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${color}" stroke-width="2.5" marker-end="${marker}"/></g>`;});
    svg+=`</svg>`; container.innerHTML=svg;
  }
  const pEl=document.getElementById('pluckPattern'),pContainer=document.getElementById('pluckContainer');
  if(pEl&&pContainer){
    const raw=pEl.innerText.trim();
    pluckTokens=raw?raw.split(/\s+/).filter(t=>t!==''):[];
    pluckTokens = pluckTokens.slice(0,16);
    while(pluckTokens.length<16) pluckTokens.push('.');
    pContainer.innerHTML="";
    for(let b=0;b<4;b++){
      let box=document.createElement('div');box.className='pluck-box';box.id=`pbox-${b}`;
      let beatLabel=document.createElement('span');
      beatLabel.textContent=(b+1);
      beatLabel.style.cssText='position:absolute;top:-1px;left:2px;font-size:7px;color:#666;line-height:1';
      box.style.position='relative';
      box.appendChild(beatLabel);
      for(let s=0;s<4;s++){
        let idx=b*4+s;
        let code=pluckTokens[idx]||".";
        let note=document.createElement('div');note.className='pluck-note'+(code==='.'||code==='-'?' empty':'');note.id=`pluck-${idx}`;note.textContent=(code==='.'||code==='-')?'·':code;box.appendChild(note);
      }
      pContainer.appendChild(box);
    }
  }
}

let originalKey=document.getElementById('about-box').getAttribute('data-key')||'A';
let currentCapo=parseInt(document.getElementById('about-box').getAttribute('data-capo'))||0;
let capoVal=currentCapo;
let isEasyMode=localStorage.getItem('chord-easy')!=='false';
const SCALE_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const SCALE_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const SHARP_KEYS=['G','D','A','E','B','F#','C#'];

function parseKey(k){
  const m = k.match(/^([A-G][b#]?)(.*)$/i);
  if(!m) return {base:'C', suffix:''};
  return {base: m[1], suffix: m[2] || ''};
}
function noteIndex(n){
  const m={'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11};
  const p = parseKey(n);
  return m[p.base]?? 0;
}
function getScaleForKey(k){
  if(isEasyMode) return SCALE_FLAT;
  const p = parseKey(k);
  if(SHARP_KEYS.includes(p.base)) return SCALE_SHARP;
  return SCALE_FLAT;
}
function transposeNote(r,s,t){
  let i=(noteIndex(r)+s)%12; if(i<0)i+=12;
  return getScaleForKey(t)[i];
}
function simplifyChord(s){if(!isEasyMode) return s; return s.replace(/m7b5/g,'m').replace(/dim7/g,'dim').replace(/add9/g,'')}
function transposeChord(str,semi,targetKey){
  const m=str.match(/^([A-G][b#]?)(.*)$/);
  if(!m) return str;
  return simplifyChord(transposeNote(m[1],semi,targetKey)+m[2])
}
function applyCapo(newCapo){
  currentCapo=newCapo; capoVal=newCapo;
  originalKey=document.getElementById('about-box').getAttribute('data-key')||'A';
  let parsed = parseKey(originalKey);
  let temp=transposeNote(parsed.base,-newCapo,parsed.base);
  let actualBase=transposeNote(parsed.base,-newCapo,temp);
  let actual = actualBase + parsed.suffix;
  document.getElementById('capoValue').textContent=currentCapo;
  document.getElementById('keyValue').textContent=actual;
  const abC=document.getElementById('ab-capo'); if(abC) abC.textContent=currentCapo;
  const abK=document.getElementById('ab-key'); if(abK) abK.textContent=actual;
  document.querySelectorAll('.chord').forEach(el=>{
    if(!el.dataset.orig) el.dataset.orig=el.textContent.trim();
    el.textContent=transposeChord(el.dataset.orig,-newCapo,actual);
  });
  parseSongStructure();
}

document.getElementById('btn-capo-up').onclick=()=>{if(capoVal<12) applyCapo(capoVal+1)};
document.getElementById('btn-capo-down').onclick=()=>{if(capoVal>0) applyCapo(capoVal-1)};
document.getElementById('btn-easy-toggle').onclick=()=>{isEasyMode=!isEasyMode;localStorage.setItem('chord-easy',isEasyMode);document.getElementById('btn-easy-toggle').innerHTML=`<span class="material-symbols-rounded">${isEasyMode?'tune':'auto_awesome'}</span>`;applyCapo(currentCapo)};

function syncAll(){
  const box=document.getElementById('about-box'); if(!box) return;
  const g=k=>box.getAttribute('data-'+k)||'';
  const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
  set('ab-title',g('title')); set('ab-writer',g('writer')); set('ab-singer',g('singer')); set('ab-album',g('album')); set('ab-key',g('key')); set('ab-capo',g('capo')); set('ab-bpm',g('bpm')); set('view-title',g('title')); set('view-writer',g('writer')); set('view-singer',g('singer')); set('capoValue',g('capo')); set('keyValue',g('key'));
  const bi=document.getElementById('tempoInput'); if(bi) bi.value=g('bpm');
  document.getElementById('strumPattern').textContent = g('strum') || "";
  document.getElementById('pluckPattern').textContent = g('pluck') || "";
  renderBoard();
  parseSongStructure();
  renderTimeline();
}

let isPlaying=false,isPaused=false,highlightInterval=null,currentChordIndex=-1,countdownInterval=null;
let activeSectionElement=null,activeSectionKey=null,nextSectionElement=null,walker=null;
let songSections={},allChords=[],chordDisplayBar=document.getElementById('chordDisplayBar');
let globalStrumPos=0, globalPluckPos=0;

function parseSongStructure(){
  songSections={};
  document.querySelectorAll('.verse').forEach(v=>{
    const labelEl=v.querySelector('.section-label'); if(!labelEl) return;
    if(labelEl.textContent.toLowerCase().includes('map')) return;
    const name=labelEl.textContent.trim();
    const key=name.toLowerCase().replace(/\s+/g,'');
    const wraps=v.querySelectorAll('.chord-wrap');
    const chordsInSection=[];
    wraps.forEach(w=>{
      const chordEl=w.querySelector('.chord'); if(!chordEl) return;
      let beats=1;
      if(w.classList.contains('bar-4')) beats=4;
      else if(w.classList.contains('bar-3')) beats=3;
      else if(w.classList.contains('bar-2')) beats=2;
      else beats=1;
      chordsInSection.push({element:chordEl,wrap:w,beats:beats});
    });
    if(chordsInSection.length>0) songSections[key]={chords:chordsInSection,displayName:name,element:v};
  });
}

function getPlaybackMapFromHtml() {
  const box = document.getElementById('about-box');
  const raw = box.getAttribute('data-songmap') || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function buildQueueFromMap(map){
  allChords=[];
  map.forEach(secName => {
    const secKey = secName.toLowerCase().replace(/\s+/g,'');
    const foundKey = Object.keys(songSections).find(k=>k===secKey || k.includes(secKey) || secKey.includes(k));
    const sec = songSections[foundKey];
    if(sec){
      sec.chords.forEach(c=>{
        allChords.push({...c, sectionKey:foundKey, sectionDisplayName:sec.displayName, sectionElement:sec.element})
      });
    }
  });
  if(allChords.length===0){
    document.querySelectorAll('.chord-wrap').forEach(w=>{
      const chordEl=w.querySelector('.chord'); if(!chordEl) return;
      let beats=1; if(w.classList.contains('bar-4')) beats=4; else if(w.classList.contains('bar-3')) beats=3; else if(w.classList.contains('bar-2')) beats=2;
      allChords.push({element:chordEl,wrap:w,beats:beats,sectionKey:'all',sectionDisplayName:'All',sectionElement:w.closest('.verse')});
    });
  }
}

function renderTimeline() {
  const bar = document.getElementById('song-timeline-bar');
  if (!bar) return;
  const map = getPlaybackMapFromHtml();
  bar.innerHTML = '';
  map.forEach((name, idx) => {
    const chip = document.createElement('div');
    chip.className = 'timeline-chip';
    chip.id = `tl-${idx}`;
    let shortName = name.replace('Intro','In').replace('Verse','V').replace('Chorus','Cho').replace('Pre Cho','Pre').replace('Bridge','Bri').replace('Outro','Out').replace('Solo','Solo').replace(/ /g,'');
    chip.innerHTML = `<span class="chip-progress"></span><span style="position:relative;z-index:1">${shortName}</span>`;
    chip.onclick = () => {
      const key = name.toLowerCase().replace(/\s+/g, '');
      const foundKey = Object.keys(songSections).find(k => key.includes(k) || k.includes(key));
      if (foundKey && songSections[foundKey]) songSections[foundKey].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    bar.appendChild(chip);
  });
}

function updateTimelineProgress(currentIdx) {
  const map = getPlaybackMapFromHtml();
  let currentSectionIdx = -1;
  if (allChords[currentIdx]) {
    const curSecName = allChords[currentIdx].sectionDisplayName.toLowerCase().replace(/\s+/g, '');
    currentSectionIdx = map.findIndex(m => {
      const mm = m.toLowerCase().replace(/\s+/g, '');
      return curSecName.includes(mm) || mm.includes(curSecName);
    });
  }
  document.querySelectorAll('.timeline-chip').forEach((chip, i) => {
    chip.classList.remove('active', 'passed');
    const prog = chip.querySelector('.chip-progress');
    if (prog) prog.style.width = '0%';
    if (i < currentSectionIdx) chip.classList.add('passed');
    if (i === currentSectionIdx) {
      chip.classList.add('active');
      const chordsInSection = allChords.filter(c => c.sectionDisplayName.toLowerCase().replace(/\s+/g, '') === allChords[currentIdx].sectionDisplayName.toLowerCase().replace(/\s+/g, ''));
      const idxInSection = chordsInSection.findIndex(c => c === allChords[currentIdx]);
      const pct = chordsInSection.length? ((idxInSection + 1) / chordsInSection.length) * 100 : 0;
      if (prog) prog.style.width = pct + '%';
    }
  });
}

function clearSectionHighlights(){
  if(activeSectionElement){activeSectionElement.classList.remove('current-section-highlight');activeSectionElement=null;activeSectionKey=null}
  if(nextSectionElement){nextSectionElement.classList.remove('next-section-highlight');nextSectionElement=null}
}

function updateActiveSectionAndScroll(el){
  if(activeSectionElement===el) return;
  if(activeSectionElement) activeSectionElement.classList.remove('current-section-highlight');
  el.classList.add('current-section-highlight'); activeSectionElement=el;
  el.scrollIntoView({behavior:'smooth',block:'center'});
}

function updateNextSectionNotifier(fromIndex){
  if(nextSectionElement){nextSectionElement.classList.remove('next-section-highlight');nextSectionElement=null}
  const curKey=allChords[fromIndex]?.sectionKey; if(!curKey) return;
  for(let i=fromIndex+1;i<allChords.length;i++){ if(allChords[i].sectionKey!==curKey){ const nxt=songSections[allChords[i].sectionKey]; if(nxt){nxt.element.classList.add('next-section-highlight');nextSectionElement=nxt.element;break;} } }
}

function updateChordDisplayBar(idx){
  const cur=document.getElementById('currentChord'),next=document.getElementById('nextChord');
  if(allChords[idx]){ const el=allChords[idx].element; cur.textContent=el.textContent.trim(); const col=getComputedStyle(el.parentElement).getPropertyValue('--bar-color')||'#EAB308'; cur.style.background=col; cur.style.color='#000'; }
  else { cur.textContent='END'; cur.style.background='#333'; cur.style.color='#fff' }
  if(next){ next.innerHTML=''; for(let i=1;i<=4;i++){ const n=allChords[idx+i]; if(n){ const sp=document.createElement('span'); sp.className='next-item'; sp.textContent=n.element.textContent.trim(); next.appendChild(sp);} } }
}

function resetHighlights(){
  document.querySelectorAll('.chord').forEach(c=>{c.style.background='';c.style.color='';c.style.padding='';c.style.borderRadius='';c.classList.remove('bouncing-chord');c.style.animation='';});
  document.querySelectorAll('.lyric').forEach(l=>{l.classList.remove('kara-active');l.style.backgroundImage='';l.style.webkitTextFillColor='';l.style.backgroundPosition='';l.style.transition='';l.style.webkitBackgroundClip='';});
  document.querySelectorAll('.strum-arrow').forEach(e=>{e.classList.remove('active');e.classList.remove('played')});
  document.querySelectorAll('.pluck-note').forEach(e=>{e.classList.remove('active');e.classList.remove('played')});
  document.querySelectorAll('.pluck-box').forEach(e=>{e.classList.remove('active-box');e.classList.remove('completed')});
}

function getTempo(){
  const v=parseInt(document.getElementById('tempoInput')?.value)||80; return (isNaN(v)||v<30)?80:v; }

function startCountdown(onComplete){
  const overlay=document.getElementById('countdown-overlay'),txt=document.getElementById('countdown-text');
  let count=4; overlay.classList.remove('hidden'); txt.textContent=count;
  countdownInterval=setInterval(()=>{ count--; if(count>0) txt.textContent=count; else if(count===0) txt.textContent='Go!'; else {clearInterval(countdownInterval);countdownInterval=null;overlay.classList.add('hidden'); if(onComplete) onComplete();}},600);
}

function playStrumForBeats(beats, tempo, onDone){
  const stepsNeeded = beats * 4;
  const totalMs = (60/tempo)*1000*beats;
  const stepMs = totalMs / stepsNeeded;
  let stepCount=0;
  function doStep(){
    if(stepCount>=stepsNeeded || isPaused){ if(onDone && stepCount>=stepsNeeded) onDone(); return; }
    const pos = (globalStrumPos + stepCount) % 16;
    const pluckPos = (globalPluckPos + stepCount) % 16;
    document.querySelectorAll('.strum-arrow').forEach(e=>e.classList.remove('active'));
    const arrow=document.getElementById(`arrow-${pos}`);
    if(arrow){ arrow.classList.add('active'); setTimeout(()=>{ arrow.classList.remove('active'); arrow.classList.add('played'); }, stepMs*0.8); }
    document.querySelectorAll('.pluck-note').forEach(e=>e.classList.remove('active'));
    const pNote = document.getElementById(`pluck-${pluckPos}`);
    if (pNote &&!pNote.classList.contains('empty')) {
      pNote.classList.remove('played');
      pNote.classList.add('active');
      setTimeout(() => { pNote.classList.remove('active'); }, stepMs * 0.9);
    }
    document.querySelectorAll('.pluck-box').forEach(e=>e.classList.remove('active-box'));
    document.getElementById(`pbox-${Math.floor(pos/4)}`)?.classList.add('active-box');
    stepCount++;
    setTimeout(doStep, stepMs);
  }
  doStep();
  setTimeout(()=>{globalStrumPos = (globalStrumPos + stepsNeeded) % 16;globalPluckPos = (globalPluckPos + stepsNeeded) % 16;}, totalMs);
}

function highlightAndScheduleNext(){
  if(isPaused) return;
  if(currentChordIndex>=0&&allChords[currentChordIndex]){
    const prev=allChords[currentChordIndex].element;
    prev.style.background='';prev.style.padding='';prev.style.borderRadius='';prev.classList.remove('bouncing-chord');
  }
  currentChordIndex++;
  if(currentChordIndex>=allChords.length){ stopPlayback(); return; }
  const cur=allChords[currentChordIndex]; if(!cur) return;
  const el=cur.element, wrap=cur.wrap, lyric=wrap.querySelector('.lyric');
  const beats=cur.beats;
  const tempo=getTempo();
  const totalMs=(60/tempo)*1000*beats;
  if(!walker) walker=document.getElementById('walker-emoji');
  walker.style.display='block';
  const rect=el.getBoundingClientRect();
  walker.style.top=(rect.top+window.scrollY-38)+'px';
  walker.style.left=(rect.left+window.scrollX)+'px';
  window.lastPre=wrap.closest('pre');
  if(cur.sectionKey!==activeSectionKey){ updateActiveSectionAndScroll(cur.sectionElement); activeSectionKey=cur.sectionKey; updateNextSectionNotifier(currentChordIndex); }
  if(chordDisplayBar) updateChordDisplayBar(currentChordIndex);
  if(typeof updateTimelineProgress === 'function'){ updateTimelineProgress(currentChordIndex); }
  el.style.background='#ffeb3b'; el.style.padding='2px 6px'; el.style.borderRadius='6px'; el.style.fontWeight='bold';
  if(beats>0){ el.classList.add('bouncing-chord'); el.style.animationDuration=(totalMs/1000/beats)+'s'; el.style.animationIterationCount=beats; }
  if(lyric){
    if(window.lastActivePre&&window.lastActivePre!==wrap.closest('pre')){
      window.lastActivePre.querySelectorAll('.lyric').forEach(l=>{l.classList.remove('kara-active');l.style.backgroundImage='';l.style.webkitTextFillColor='';l.style.transition='';});
    }
    window.lastActivePre=wrap.closest('pre');
    const isDark=document.body.classList.contains('dark-mode');
    const activeColor=isDark?'#00FF00':'#ff0000';
    const baseColor=isDark?'#E2E8F0':'#1E293B';
    lyric.classList.add('kara-active');
    lyric.style.backgroundImage=`linear-gradient(to right, ${activeColor} 50%, ${baseColor} 50%)`;
    lyric.style.backgroundSize='200% 100%'; lyric.style.backgroundPosition='100% 0';
    lyric.style.webkitBackgroundClip='text'; lyric.style.webkitTextFillColor='transparent';
    lyric.style.transition='none'; void lyric.offsetWidth;
    lyric.style.transition=`background-position ${totalMs}ms linear`;
    lyric.style.backgroundPosition='0% 0';
  }
  playStrumForBeats(beats, tempo, null);
  highlightInterval=setTimeout(highlightAndScheduleNext, totalMs);
}

function controlPlayback(){
  document.getElementById('about-overlay').classList.add('hidden');
  const btn=document.getElementById('btn-kara-play');
  if(!isPlaying){
    const map=getPlaybackMapFromHtml(); if(!map.length) return;
    buildQueueFromMap(map); if(allChords.length===0) return;
    isPlaying=true; btn.innerHTML='<span class="material-symbols-rounded">pause</span>';
    globalStrumPos=0; globalPluckPos=0;
    if(chordDisplayBar) chordDisplayBar.classList.add('active');
    startCountdown(()=>{ isPaused=false; currentChordIndex=-1; resetHighlights(); clearSectionHighlights(); highlightAndScheduleNext(); });
  } else {
    if(!isPaused){ isPaused=true; clearTimeout(highlightInterval); btn.innerHTML='<span class="material-symbols-rounded">play_arrow</span>'; if(chordDisplayBar) chordDisplayBar.classList.remove('active'); }
    else { isPaused=false; btn.innerHTML='<span class="material-symbols-rounded">play_arrow</span>'; if(chordDisplayBar) chordDisplayBar.classList.add('active'); highlightAndScheduleNext(); }
  }
}

function stopPlayback(){
  if(countdownInterval){clearInterval(countdownInterval);countdownInterval=null;document.getElementById('countdown-overlay').classList.add('hidden')}
  clearTimeout(highlightInterval); clearSectionHighlights(); resetHighlights();
  isPlaying=false; isPaused=false; currentChordIndex=-1; globalStrumPos=0; globalPluckPos=0;
  const btn=document.getElementById('btn-kara-play'); if(btn) btn.innerHTML='<span class="material-symbols-rounded">play_arrow</span>';
  if(chordDisplayBar) chordDisplayBar.classList.remove('active');
  if(walker) walker.style.display='none';
  window.lastActivePre=null;
}

document.getElementById('btn-kara-play').onclick=controlPlayback;
document.getElementById('btn-kara-restart').onclick=stopPlayback;

function toggleListFabMenu() {
  const menu = document.getElementById('list-fab-menu');
  if (menu) {
    menu.style.display = (menu.style.display === 'none' ||!menu.style.display)? 'flex' : 'none';
  }
}

window.onload = ()=>{
  initFirebase();
  applyLyricSize();
  updateThemeIcon();
  switchView('list-view');
  document.getElementById('btn-easy-toggle').innerHTML=`<span class="material-symbols-rounded">${isEasyMode?'tune':'auto_awesome'}</span>`;
};

// ===== ဖောင့် စ =====
const fontOverlay = document.getElementById('fontOverlay');
const fontModal = document.getElementById('fontModal');

function openFontModal(){
  const modal = document.getElementById('fontModal');
  const overlay = document.getElementById('fontOverlay');
  modal.style.display='block';
  overlay.style.display='block';
  const saved = localStorage.getItem('aaaUserFont');
  document.querySelectorAll('.font-item').forEach(i => {
    if(i.dataset.font === saved){
      i.classList.add('active');
    } else {
      i.classList.remove('active');
    }
  });
}
function closeFontModal(){
  document.getElementById('fontModal').style.display='none';
  document.getElementById('fontOverlay').style.display='none';
}
function changeGlobalFont(f, el){
  localStorage.setItem('aaaUserFont', f);
  let s = document.getElementById('global-font-style');
  if(!s){ s = document.createElement('style'); s.id='global-font-style'; document.head.appendChild(s); }
  s.innerHTML = `body *:not(#fontModal):not(#fontModal *):not(.material-symbols-rounded) { font-family:'${f}'!important; }`;
  document.querySelectorAll('.font-item').forEach(i=>i.classList.remove('active'));
  if(el) el.classList.add('active');
  closeFontModal();
}
(function(){
  const saved = localStorage.getItem('aaaUserFont');
  if(saved){
    let s = document.createElement('style'); s.id='global-font-style';
    s.innerHTML = `body *:not(#fontModal):not(#fontModal *):not(.material-symbols-rounded) { font-family:'${saved}'!important; }`;
    document.head.appendChild(s);
  }
})();
function applySavedFont() {
  const savedFont = localStorage.getItem('aaaUserFont');
  if (savedFont) {
    let styleTag = document.getElementById('global-font-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'global-font-style';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `body *:not(.material-symbols-rounded):not(.font-item) { font-family: '${savedFont}'!important; }`;
  }
}
document.addEventListener('DOMContentLoaded', applySavedFont);
// ===== ဖောင့် ဆုံး =====