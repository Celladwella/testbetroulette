
// Hot/Cold scroll-page positioning: TIGHTER to zeros + DOWN
function positionHeat() {
  const heat = document.getElementById('hotColdPanel');
  const zero = document.getElementById('slot-00');
  if (!heat || !zero) return;

  const r = zero.getBoundingClientRect();

  const NUDGE_RIGHT_PX = 15; // tighter to zeros
  const NUDGE_DOWN_PX  = 65; // down more

  heat.style.position = 'absolute';
  heat.style.left = (r.left + window.scrollX + NUDGE_RIGHT_PX) + 'px';
  heat.style.top  = (r.top  + window.scrollY  + NUDGE_DOWN_PX) + 'px';
  heat.style.zIndex = '3000';
}

window.addEventListener('load', positionHeat);
window.addEventListener('resize', positionHeat);
window.addEventListener('scroll', positionHeat);
