// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ဒေတာတွေ သိမ်းထားဖို့ Global Variable
let allData = {};

// တခြားသူတွေ လာယူဖို့ Function
export function getAppData() {
  return allData;
}

// ဒေတာအကုန် ယူပေးမယ့် Function
export async function initFirebase() {
  const COLLECTIONS = ["AllArakanSongs", "AAASongs", "admin"];
  
  for (const colName of COLLECTIONS) {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    allData[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  return true;
}