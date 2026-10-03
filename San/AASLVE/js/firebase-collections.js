import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdPFzE2_Rbg8Xi-9DGBvfoOA95c1R3S4U",
  authDomain: "arakanartarea-note.firebaseapp.com",
  projectId: "arakanartarea-note",
  storageBucket: "arakanartarea-note.firebasestorage.app",
  messagingSenderId: "695659736666",
  appId: "1:695659736666:web:1e76494c0e6819609bf263"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const store = { AllArakanSongs: [], ImageLink: {}, AAASongs: [], AAANotes: [], admins: [], aid: [], counters: [], users: [] };
window.store = store; // console မှာ store လို့ ရိုက်စစ်လို့ရအောင်

onSnapshot(collection(db, "AllArakanSongs"), snap => {
  const arr = [];
  snap.forEach(d => arr.push({ _id: d.id, ...d.data() }));
  store.AllArakanSongs = arr;
  console.log("AllArakanSongs:", arr.length);
  window.dispatchEvent(new Event('data-ready'));
});

onSnapshot(collection(db, "ImageLink"), snap => {
  const map = {};
  snap.forEach(d => { const v = d.data(); if (v.name) map[v.name.trim()] = v.link; });
  store.ImageLink = map;
});