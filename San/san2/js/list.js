// list.js

export function renderList(data) {
  const appDiv = document.getElementById("app");
  if (!appDiv) return;
  
  if (!data || Object.keys(data).length === 0) {
    appDiv.innerHTML = `<h2>ဒေတာ မရသေးပါ</h2>`;
    return;
  }
  
  let html = `<h2>ဒေတာ ရပါပြီ</h2>`;
  
  for (const colName in data) {
    const count = data[colName].length;
    // CSS class တွေကို ဒီမှာ သုံးထားပါတယ်
    html += `
      <div class="col-group">
        <h3>${colName} <span class="count-badge">${count}</span></h3>
        <p>ဒေတာ ${count} ခု ရရှိထားပါသည်။</p>
      </div>
    `;
  }
  
  appDiv.innerHTML = html;
}