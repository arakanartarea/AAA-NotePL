// မင်းရဲ့ App တွေကို ဒီမှာထည့်။ Link ကိုချိန်းလိုက်ရုံ
const assets = [
  {
    id: 1,
    name: "ရခိုင်အဘိဓာန် ( စုဆောင်းဆဲ )",
    desc: "ဝေါဟာရများ၏ အဓိပ္ပာယ်နှင့် အသုံးကို ရှာဖွေပါ",
    tag: "ဘာသာစကား",
    url: "https://arakanartarea.github.io/AAA-NotePL/ASD/ArakaneseDictionary_Index.html", // မင်းအဘိဓာန် folder လမ်းကြောင်း
    icon: "📚"
  },
  {
    id: 2,
    name: "ရခိုင်သတ်ပုံကျမ်း (စုဆောင်းဆဲ)",
    desc: "စာလုံးအမှား၊ အမှန်ကို စစ်ဆေးပြီး လေ့လာပါ",
    tag: "သတ်ပုံ",
    url: "https://arakanartarea.github.io/AAA-NotePL/ASD/ArakaneseSpellingDict_index.html", // သတ်ပုံ App folder လမ်းကြောင်း
    icon: "✍️"
  },
  {
    id: 3,
    name: "ArakanArtArea တေးခြင်း ",
    desc: "ရခိုင်အဆိုတော်များနှင့် သီချင်းကောင်းများ",
    tag: "ဂီတ",
    url: "https://arakanartarea.github.io/AAA-NotePL/AAA/AAA_Index.html", // ရှိပြီးသား Link ထည့်
    icon: "🎵"
  },
  {
    id: 4,
    name: "ရခိုင်စကားပုံ(Main)",
    desc: "ရှေးလူကြီးများ၏ ပညာရှိစကားများ",
    tag: "ယဉ်ကျေးမှု",
    url: "https://arakanartarea.github.io/AAA-NotePL/ASD/allarakanassets_index.html",
    icon: "🗣️",
    coming: true
  }
];

const cardContainer = document.getElementById('card-container');
const listContainer = document.getElementById('list-container');

// Card တွေဆောက်
assets.forEach(asset => {
  const card = document.createElement('div');
  card.className = 'asset-card';
  card.innerHTML = `
    <h3>${asset.icon} ${asset.name}</h3>
    <p>${asset.desc}</p>
    <span class="tag">${asset.tag}</span>
    ${asset.coming ? '<span class="tag" style="background:#ccc;">မကြာမီ</span>' : ''}
  `;
  if (!asset.coming) {
    card.addEventListener('click', () => window.location.href = asset.url);
  }
  cardContainer.appendChild(card);
});

// List တွေဆောက်
assets.forEach(asset => {
  const item = document.createElement('div');
  item.className = 'asset-list-item';
  item.innerHTML = `
    <div>
      <h3>${asset.icon} ${asset.name}</h3>
      <p style="font-size:0.85rem;color:#666;">${asset.desc}</p>
    </div>
    <span>${asset.coming ? 'မကြာမီ' : '➡️'}</span>
  `;
  if (!asset.coming) {
    item.addEventListener('click', () => window.location.href = asset.url);
  }
  listContainer.appendChild(item);
});

// View Toggle
const cardBtn = document.getElementById('card-view-btn');
const listBtn = document.getElementById('list-view-btn');

cardBtn.addEventListener('click', () => {
  cardContainer.classList.remove('hidden');
  listContainer.classList.add('hidden');
  cardBtn.classList.add('active');
  listBtn.classList.remove('active');
});

listBtn.addEventListener('click', () => {
  listContainer.classList.remove('hidden');
  cardContainer.classList.add('hidden');
  listBtn.classList.add('active');
  cardBtn.classList.remove('active');
});