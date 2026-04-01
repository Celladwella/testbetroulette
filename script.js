function incrementHit(number) {
  const el = document.querySelector(
    `.number-square[data-number="${number}"] .hit-count`
  );
  if (!el) return;
  el.textContent = Number(el.textContent) + 1;
}

function spin() {
  const numbers = [17, 23, 8];
  const win = numbers[Math.floor(Math.random() * numbers.length)];
  incrementHit(win);
}
