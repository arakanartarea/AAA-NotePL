// js/list.js
// Group -> Child -> Content ဆက်စပ်ဆောင်ရွက်မည့် Core Logic
export function renderGroupList(data, groupField) {
  const groupListEl = document.getElementById('groupList');
  groupListEl.innerHTML = '';

  // Group အလိုက် စုစည်းခြင်းနှင့် Count တွက်ခြင်း
  const grouped = data.reduce((acc, song) => {
    const key = song[groupField] || 'အခြား';
    if (!acc[key]) acc[key] = [];
    acc[key].push(song);
    return acc;
  }, {});

  for (const [groupName, songs] of Object.entries(grouped)) {
    const item = document.createElement('div');
    item.className = 'group-item';
    item.innerHTML = `
      <div class="group-title">${groupName} (${songs.length})</div>
    `;
    item.addEventListener('click', () => {
      renderChildList(songs);
    });
    groupListEl.appendChild(item);
  }
}

function renderChildList(songs) {
  const childListEl = document.getElementById('childList');
  childListEl.innerHTML = '';

  songs.forEach(song => {
    const li = document.createElement('div');
    li.className = 'child-item';
    li.innerHTML = `
      <span>${song.title}</span>
      <div class="child-actions">
        <button class="fav-btn" data-id="${song.songId}">❤</button>
        <button class="edit-btn admin-only hidden" data-id="${song.songId}">✎</button>
      </div>
    `;
    childListEl.appendChild(li);
  });
}
