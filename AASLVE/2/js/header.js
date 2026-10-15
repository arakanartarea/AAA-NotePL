// js/header.js - HEADER ONLY
const headerEl = document.getElementById("app-header");

let isSearchOpen = false;
let isMobile = window.innerWidth < 768;

/* ---------- CREATE HEADER DOM (NO HTML STRING) ---------- */
function buildHeader() {
  headerEl.innerHTML = "";
  
  const left = document.createElement("div");
  left.className = "header-left";
  
  const title = document.createElement("div");
  title.className = "header-title";
  title.textContent = "Songs";
  left.appendChild(title);
  
  const center = document.createElement("div");
  center.className = "header-center";
  center.id = "header-center";
  
  const searchWrap = document.createElement("div");
  searchWrap.className = "search-wrap";
  searchWrap.id = "search-wrap";
  
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search-input";
  searchInput.placeholder = "ရှာဖွေရန်...";
  searchInput.className = "search-input";
  
  const searchBtn = document.createElement("button");
  searchBtn.id = "search-toggle";
  searchBtn.className = "search-toggle";
  const searchIcon = document.createElement("i");
  searchIcon.className = "fa-solid fa-magnifying-glass";
  searchBtn.appendChild(searchIcon);
  
  searchWrap.appendChild(searchInput);
  center.appendChild(searchWrap);
  center.appendChild(searchBtn);
  
  const right = document.createElement("div");
  right.className = "header-right";
  right.id = "header-right";
  
  const profileName = document.createElement("span");
  profileName.id = "profile-name";
  profileName.className = "profile-name";
  profileName.textContent = "Guest";
  
  const profileImg = document.createElement("img");
  profileImg.id = "profile-img";
  profileImg.className = "profile-img";
  profileImg.src = "default-user.png";
  profileImg.alt = "profile";
  
  right.appendChild(profileName);
  right.appendChild(profileImg);
  
  headerEl.appendChild(left);
  headerEl.appendChild(center);
  headerEl.appendChild(right);
  
  bindEvents();
}

function bindEvents() {
  const searchToggle = document.getElementById("search-toggle");
  const searchInput = document.getElementById("search-input");
  const searchWrap = document.getElementById("search-wrap");
  const headerRight = document.getElementById("header-right");
  const headerLeft = document.querySelector(".header-left");
  
  searchToggle.addEventListener("click", () => {
    isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Mobile: hide header, show search
      if (!isSearchOpen) {
        headerLeft.style.display = "none";
        headerRight.style.display = "none";
        searchWrap.classList.add("active");
        searchInput.focus();
        isSearchOpen = true;
      } else {
        headerLeft.style.display = "flex";
        headerRight.style.display = "flex";
        searchWrap.classList.remove("active");
        isSearchOpen = false;
      }
    } else {
      // Desktop: always visible, just focus
      searchInput.focus();
    }
  });
  
  // Desktop init
  function handleResize() {
    isMobile = window.innerWidth < 768;
    if (!isMobile) {
      document.querySelector(".header-left").style.display = "flex";
      document.getElementById("header-right").style.display = "flex";
      document.getElementById("search-wrap").classList.add("active-desktop");
    } else {
      document.getElementById("search-wrap").classList.remove("active-desktop");
      if (!isSearchOpen) {
        document.getElementById("search-wrap").classList.remove("active");
      }
    }
  }
  
  window.addEventListener("resize", handleResize);
  handleResize();
}

buildHeader();