import { auth, db, COL_ADMIN } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";

export let currentUser = null;
export let isAdmin = false;
export let onAuthChange = () => {};
export function setAuthCallback(cb) { onAuthChange = cb; }

const loginBtn = document.getElementById("settingsBtn") || document.getElementById("loginBtn");
const loginModal = document.getElementById("loginModal");
const loginStatus = document.getElementById("loginStatus");
const primaryBtn = document.getElementById("primaryBtn");
const switchBtn = document.getElementById("switchBtn");
const googleBtn = document.getElementById("googleLogin");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("pass");

function openModal(){ loginModal.classList.remove("hidden"); }
function closeModal(){ loginModal.classList.add("hidden"); }

// UI update
function renderAuthUI(u){
  if(u){
    loginStatus.textContent = u.displayName || u.email || "အကောင့်ဝင်ထားသည်";
    primaryBtn.textContent = "ထွက်မယ်";
    switchBtn.classList.remove("hidden");
    loginBtn.innerHTML = `<i class="fa-solid fa-user"></i>`;
    window._isAdmin = isAdmin;
  }else{
    loginStatus.textContent = "အကောင့်ဝင်ပါ";
    primaryBtn.textContent = "ဝင်မယ်";
    switchBtn.classList.add("hidden");
    loginBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i>`;
    window._isAdmin = false;
  }
}

// events - modal open/close
loginBtn.addEventListener("click", openModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
loginModal.querySelector(".modal-overlay").addEventListener("click", closeModal);

// Google ဖြင့်ဝင်ရန်
googleBtn.addEventListener("click", async()=>{
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  try{ await signInWithPopup(auth, provider); closeModal(); }catch(e){ console.log(e); }
});

// ခလုတ် 1 - ဝင်မယ် / ထွက်မယ်
primaryBtn.addEventListener("click", async()=>{
  if(currentUser){
    // ထွက်မယ်
    await signOut(auth);
    closeModal();
  }else{
    // ဝင်မယ် - email pass ရှိရင် email login
    const e = emailEl.value.trim();
    const p = passEl.value.trim();
    if(!e||!p){ alert("Email/Password ထည့်ပါ"); return; }
    try{ await signInWithEmailAndPassword(auth, e, p); closeModal(); }catch(err){ alert(err.message); }
  }
});

// ခလုတ် 2 - ပြောင်းမယ်
switchBtn.addEventListener("click", async()=>{
  if(currentUser) await signOut(auth);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  try{ await signInWithPopup(auth, provider); closeModal(); }catch(e){ console.log(e); }
});

onAuthStateChanged(auth, async (u) => {
  currentUser = u;
  isAdmin = false;
  if (u) {
    try {
      const d = await getDoc(doc(db, COL_ADMIN, u.uid));
      if (d.exists()) isAdmin = true;
      else {
        const q1 = await getDocs(query(collection(db, COL_ADMIN), where("uid", "==", u.uid)));
        const q2 = await getDocs(query(collection(db, COL_ADMIN), where("email", "==", u.email)));
        if (!q1.empty || !q2.empty) isAdmin = true;
      }
    } catch {}
  }
  renderAuthUI(u);
  onAuthChange();
});