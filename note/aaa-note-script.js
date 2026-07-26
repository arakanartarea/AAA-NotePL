import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note",
  storageBucket: "arakanartarea-note.firebasestorage.app",
  messagingSenderId: "695659736666",
  appId: "1:695659736666:web:1e76494c0e6819609bf263"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentEditId = null;
let currentSearchText = "";
let debounceTimer = null;
let allWords = [];
let currentSortMode = 'time-new';
let unsubscribe = null;

const mainScreen = document.getElementById('main-screen');
const editScreen = document.getElementById('edit-screen');
const viewScreen = document.getElementById('view-screen');
const expandableList = document.getElementById('expandable-list');
const authBtn = document.getElementById('authBtn');

function changeScreen(targetScreen) {
  mainScreen.classList.add('hidden');
  editScreen.classList.add('hidden');
  viewScreen.classList.add('hidden');
  targetScreen.classList.remove('hidden');
}

// === AUTH + ADMIN BOOK STICK ===
authBtn.onclick = async () => {
  if (!auth.currentUser) await signInWithPopup(auth, provider);
  else {
    if (confirm("OK=ထွက်မယ်, Cancel=ပြောင်းမယ်")) await signOut(auth);
    else await signInWithPopup(auth, provider);
  }
};

async function checkIsAdmin(email){
  const snap = await getDoc(doc(db, "admins", email));
  return snap.exists();
}

function startListening() {
  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(collection(db, "AAAnotes"), (snapshot) => {
    allWords = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.role !== 2) allWords.push({ id: d.id, ...data });
    });
    showWords();
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authBtn.innerText = "👤";
    expandableList.innerHTML = `<p style="text-align:center;padding:20px;">Login ဝင်ပါ</p>`;
    if (unsubscribe) unsubscribe();
    return;
  }
  const isAdmin = await checkIsAdmin(user.email);
  if (!isAdmin) {
    authBtn.innerText = "🚫";
    expandableList.innerHTML = `<p style="text-align:center;padding:20px;">${user.email}<br>ခွင့်မရှိပါ</p>`;
    if (unsubscribe) unsubscribe();
    return;
  }
  authBtn.innerText = "✅";
  startListening();
});

// === မင်းရဲ့ ကျန်ကုဒ် အကုန်အတိုင်း ===
document.getElementById('new-word-btn').addEventListener('click', () => {
  currentEditId = null;
  document.getElementById('group').value = ""; 
  document.getElementById('subGroup').value = "";
  document.getElementById('content').value = "";
  changeScreen(editScreen);
});
document.getElementById('sort-select').addEventListener('change', (e) => {
  currentSortMode = e.target.value; showWords();
});
document.getElementById('Screen-select').addEventListener('change', function() {
  if (this.value) window.location.href = this.value;
});

// ဒီနောက်က showWords(), search, view, edit, save ကုဒ်တွေ မင်းဟာအတိုင်း ဆက်ကူးထည့် - အပြင်က onSnapshot တစ်ခုပဲ ဖျက်ရမှာ