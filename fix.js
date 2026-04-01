
// Restore Hot/Cold original positioning + move hit count to LEFT of each square

// assumes numberCounts[number] already exists
function updateNumberCounts() {
  document.querySelectorAll('.number-cell').forEach(cell => {
    const num = cell.dataset.number;
    let badge = cell.querySelector('.hit-count');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'hit-count';
      cell.appendChild(badge);
    }
    const count = window.numberCounts?.[num] || 0;
    badge.textContent = count > 0 ? count : '';
  });
}

// restore original hot/cold (no offsets, scroll-page behavior)
function restoreHotCold() {
  const hc = document.getElementById('hotColdPanel');
  if (!hc) return;
  hc.style.position = '';
  hc.style.left = '';
  hc.style.top = '';
}

window.addEventListener('load', ()=>{
  restoreHotCold();
  updateNumberCounts();
});
