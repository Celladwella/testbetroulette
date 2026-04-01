/* SOULMAN FIX: fast betting + no merge */
(function(){
  document.addEventListener("pointerdown", e => {
    if (e.target.closest("[data-spot-id]")) {
      e.preventDefault();
    }
  }, true);

  if (window.normalizeChips) {
    window.normalizeChips = function(){};
  }
})();
