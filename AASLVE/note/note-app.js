// #region FIRE - Firebase အခြေခံ ချိတ်ဆက်
const db = null; // firebase.firestore() ကို ဒီမှာ ထားမယ်
async function fetchData(){
  // AAAnotes ယူမယ့် နေရာ
}
// #endregion

// #region LIST - စာရင်း ပြမယ့် နေရာ
function showList(){
  // group > subGroup ပြမယ့် နေရာ
}
// #endregion

// #region CONTENT - content အကုန်လုံး ပြမယ့် နေရာ
function showContent(){
  // subGroup နှိပ်ရင် content တွေ ပြမယ့် နေရာ
}
// #endregion

// #region BUTTON - ခလုတ် တာဝန်
function onButtonClick(){
  // ခလုတ်နှိပ်ရင် ဘာလုပ်မယ် ဆိုတဲ့ နေရာ
}
// #endregion

// #region EDIT - ပြင်/သိမ်း
function openEdit(){
}
function saveEdit(){
}
// #endregion

// #region Toolbar
/* #region TOOLBAR JS */
function toggleGroup(btn){
  const group = btn.closest('.fab-group');
  const isOpen = group.classList.contains('open');
  
  // တခြား group တွေ ပိတ်မယ် (တစ်ချိန်မှာ တစ်ခုပဲ ပွင့်အောင်)
  document.querySelectorAll('.fab-group').forEach(g=>g.classList.remove('open'));
  document.querySelectorAll('.fab-btn.outer').forEach(b=>b.classList.remove('active'));
  
  if(!isOpen){
    group.classList.add('open');
    btn.classList.add('active');
  }
}

// တခြား နေရာနှိပ်ရင် ပိတ်မယ်
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.fab-toolbar')){
    document.querySelectorAll('.fab-group').forEach(g=>g.classList.remove('open'));
    document.querySelectorAll('.fab-btn.outer').forEach(b=>b.classList.remove('active'));
  }
});

// ဥပမာ function တွေ
function onLogin(){ alert('login'); }
function onLogout(){ alert('logout'); }
function setMode(m){ document.body.dataset.mode=m; }
function onSort(){}
function onBack(){ history.back(); }
/* #endregion */
// #endregion