// js/toolbar.js
export function initToolbar() {
  const toolBtns = document.querySelectorAll('.tool-btn[data-target]');
  const subMenus = document.querySelectorAll('.sub-menu');

  toolBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const targetMenu = document.getElementById(targetId);

      subMenus.forEach(menu => {
        if (menu !== targetMenu) menu.classList.add('hidden');
      });

      targetMenu.classList.toggle('hidden');
    });
  });

  document.addEventListener('click', () => {
    subMenus.forEach(menu => menu.classList.add('hidden'));
  });
}
initToolbar();
