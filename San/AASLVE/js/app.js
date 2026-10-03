// app.js - webpage အခြေခံပဲ
import "./firebase-collections.js";
import "./list.js";
import "./player.js";
import "./fab.js";

const views = document.querySelectorAll('.view');

export function switchView(id) {
  views.forEach(v => v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// theme အခြေခံ
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}

console.log("app.js ready");