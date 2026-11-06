// Works out each meter from the topics marked "done", then fills it with an animation.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fillMeter(meter, label, target) {
  const duration = reduceMotion ? 0 : 1200;
  const start = performance.now();

  function frame(now) {
    const progress = duration ? Math.min((now - start) / duration, 1) : 1;
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    meter.style.setProperty("--value", value);
    label.textContent = value + "%";
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.querySelectorAll(".card").forEach((card) => {
  const total = card.querySelectorAll(".topics li").length;
  const done = card.querySelectorAll(".topics li.done").length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  fillMeter(card.querySelector(".meter"), card.querySelector(".pct"), percent);
});
