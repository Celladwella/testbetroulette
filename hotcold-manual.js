
// --- Last number highlight (yellow pulse + green outline) ---
window.__lastHitEl = null;
function highlightLastNumber(num){
  // Try SVG slot ids first (common: slot-0, slot-00, slot-17)
  const id = (String(num) === "00") ? "slot-00" : ("slot-" + String(num));
  let el = document.getElementById(id);
  // Fallback: div squares with data-number
  if (!el) el = document.querySelector(`.number-square[data-number="${num}"]`);

  if (!el) return;

  // Some tables wrap clickable areas; if we got a child, climb to a reasonable container
  if (el.tagName && (el.tagName.toLowerCase() === 'rect' || el.tagName.toLowerCase() === 'path')) {
    el = el.closest('g') || el;
  }

  window.__lastHitEl = el;
  el.classList.add('last-hit-pulse');

  // retrigger animation if same number hits twice
  void el.offsetWidth;
  el.classList.add('last-hit-pulse');
}

// --- Spin lock (prevents chip changes during spin) ---
window.__SPIN_LOCK__ = false;
function chipsLocked() { return !!window.__SPIN_LOCK__; }
function setChipsLocked(v){
  window.__SPIN_LOCK__ = !!v;
  document.body.classList.toggle('chips-locked', !!v);
}


// Hot / Cold MANUAL placement with save (FIXED: works over SVG)
(function(){
  const panel = document.getElementById('hotColdPanel');
  if(!panel) return;

  panel.style.position = 'absolute';
  panel.style.cursor = 'grab';
  panel.style.pointerEvents = 'auto';

  const saved = localStorage.getItem('hotColdPos');
  if(saved){
    const {left, top} = JSON.parse(saved);
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  let drag = false;
  let offsetX = 0;
  let offsetY = 0;

  panel.addEventListener('pointerdown', e=>{
    drag = true;
    panel.setPointerCapture(e.pointerId);
    panel.style.cursor = 'grabbing';
    offsetX = e.clientX - panel.offsetLeft;
    offsetY = e.clientY - panel.offsetTop;
    e.preventDefault();
  });

  panel.addEventListener('pointermove', e=>{
    if(!drag) return;
    panel.style.left = (e.clientX - offsetX) + 'px';
    panel.style.top = (e.clientY - offsetY) + 'px';
  });

  panel.addEventListener('pointerup', e=>{
    if(!drag) return;
    drag = false;
    panel.releasePointerCapture(e.pointerId);
    panel.style.cursor = 'grab';
    localStorage.setItem('hotColdPos', JSON.stringify({
      left: panel.offsetLeft,
      top: panel.offsetTop
    }));
  });
})();
