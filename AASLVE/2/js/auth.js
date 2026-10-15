// js/auth.js - LOGIN ONLY
import { auth, db, COL_ADMIN } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const provider = new GoogleAuthProvider();
let currentUserRole = "guest";

/* ---------- AUTH ACTIONS ---------- */
export async function login() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("Login failed:", e);
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Logout failed:", e);
  }
}

/* ---------- ROLE CHECK ---------- */
async function checkAdminRole(uid) {
  try {
    const ref = doc(db, COL_ADMIN, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return "admin";
    }
    return "member";
  } catch {
    return "member";
  }
}

/* ---------- STATE LISTENER ---------- */
onAuthStateChanged(auth, async (user) => {
  const profileImg = document.getElementById("profile-img");
  const profileName = document.getElementById("profile-name");
  const adminBtn = document.getElementById("btn-admin-outer");
  
  if (user) {
    currentUserRole = await checkAdminRole(user.uid);
    
    // Profile - show account photo if exists
    if (profileImg) {
      profileImg.src = user.photoURL || "default-user.png";
    }
    if (profileName) {
      profileName.textContent = user.displayName || "Member";
    }
    // Admin button - show only if admin
    if (adminBtn) {
      adminBtn.style.display = currentUserRole === "admin" ? "flex" : "none";
    }
    document.body.dataset.role = currentUserRole;
  } else {
    currentUserRole = "guest";
    if (profileImg) profileImg.src = "default-user.png";
    if (profileName) profileName.textContent = "Guest";
    if (adminBtn) adminBtn.style.display = "none";
    document.body.dataset.role = "guest";
  }
});

export function getRole() {
  return currentUserRole;
}