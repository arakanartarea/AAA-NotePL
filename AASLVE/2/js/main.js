import { db, COL1 } from "./firebase.js";
import { collection, onSnapshot } from "firebase/firestore";

const listContainer = document.getElementById("songList");

onSnapshot(collection(db, COL1), (snapshot) => {
  listContainer.innerHTML = "";
  
  // Group songs by singer
  const groups = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    const singer = data.singer || "Unknown Singer";
    if (!groups[singer]) groups[singer] = [];
    groups[singer].push(data.title);
  });
  
  // Render Expandable List
  Object.keys(groups).forEach(singer => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "group";
    
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle";
    toggleBtn.textContent = singer;
    
    const childDiv = document.createElement("div");
    childDiv.className = "child hidden";
    
    groups[singer].forEach(title => {
      const songDiv = document.createElement("div");
      songDiv.textContent = "🎵 " + title;
      childDiv.appendChild(songDiv);
    });
    
    toggleBtn.addEventListener("click", () => {
      childDiv.classList.toggle("hidden");
    });
    
    groupDiv.appendChild(toggleBtn);
    groupDiv.appendChild(childDiv);
    listContainer.appendChild(groupDiv);
  });
});