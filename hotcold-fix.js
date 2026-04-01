
// Hot / Cold auto-position — moved RIGHT +80px toward zeros (30 + 50)
function positionHotCold() {
  const panel = document.getElementById('hotColdPanel');
  const zero = document.getElementById('slot-00');
  if (!panel || !zero) return;

  const zeroRect = zero.getBoundingClientRect();

  const gap = 2;        // base gap
  const nudge = 80;     // MOVE RIGHT TOTAL 80px
  panel.style.position = 'absolute';
  panel.style.left = (zeroRect.left - panel.offsetWidth - gap + nudge + window.scrollX) + 'px';
  panel.style.top = (zeroRect.top + window.scrollY) + 'px';
  panel.style.zIndex = '5000';
}

window.addEventListener('load', positionHotCold);
window.addEventListener('resize', positionHotCold);
window.addEventListener('scroll', positionHotCold);
