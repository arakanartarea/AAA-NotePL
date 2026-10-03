const dock = document.getElementById('fab-dock');
document.getElementById('fab-main').onclick = () => dock.classList.toggle('open');
document.querySelector('[data-action="sort"]').onclick = (e) => {
  e.stopPropagation();
  e.currentTarget.closest('.fab-group').classList.toggle('open');
};
document.getElementById('fab-side').onclick = (e) => {
  const isLeft = dock.classList.toggle('left');
  e.currentTarget.textContent = isLeft ? 'Right' : 'Left';
};