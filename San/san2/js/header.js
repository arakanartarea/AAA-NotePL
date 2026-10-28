const aboutBtn = document.getElementById('aboutBtn');
const title = document.getElementById('title');
const searchBox = document.getElementById('searchBox');

aboutBtn.addEventListener('click', () => {
  const isSearching = !searchBox.classList.contains('hidden');
  if (isSearching) {
    searchBox.classList.add('hidden');
    title.classList.remove('hidden');
  } else {
    title.classList.add('hidden');
    searchBox.classList.remove('hidden');
    searchBox.focus();
  }
});
// #region code1
function code1() {
  console.log("code1 အလုပ်လုပ်နေတယ်");
}

function code1a() {
  console.log("code1a အလုပ်လုပ်နေတယ်");
}

function code1b() {
  console.log("code1b အလုပ်လုပ်နေတယ်");
}
// #endregion
