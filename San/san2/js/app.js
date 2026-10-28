// app.js
import { initFirebase, getAppData } from './firebase.js';
import { renderList } from './list.js';

async function startApp() {
  try {
    console.log("Firebase ချိတ်ဆက်နေသည်...");
    await initFirebase(); // ဒေတာအကုန်ယူပြီးမှ ဆက်သွားမယ်
    
    console.log("List ကို ဒေတာပို့နေသည်...");
    const data = getAppData(); // ယူထားတဲ့ ဒေတာကို ယူမယ်
    renderList(data); // list.js ကို လွှဲမယ်
    
  } catch (error) {
    console.error("App Error: ", error);
  }
}

document.addEventListener("DOMContentLoaded", startApp);