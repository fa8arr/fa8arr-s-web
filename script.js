const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Progress meters (unchanged logic) ---------- */
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

function startMeters() {
  document.querySelectorAll(".card").forEach((card) => {
    const total = card.querySelectorAll(".topics li").length;
    const done = card.querySelectorAll(".topics li.done").length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    fillMeter(card.querySelector(".meter"), card.querySelector(".pct"), percent);
  });
}

/* ---------- DMC5-style intro ---------- */
// EDIT THIS to change the text or timing. t = seconds into the audio.
const beats = [
  { t: 1.0,  word: "Cybersecurity" },
  { t: 4.5,  word: "Student", cls: "red" },
  { t: 8.0,  word: "Python",     cls: "cut" },
  { t: 9.6,  word: "Networking", cls: "cut" },
  { t: 11.2, word: "Linux",      cls: "cut" },
  { t: 14.0, word: "Zulfaqar Ahmed", sub: "Al-Ameen University", cls: "name" },
  { t: 21.5, word: "SSS", sub: "Stylish!", cls: "rank" },
];

const intro = document.getElementById("intro");
const video = document.getElementById("introVideo");
const audio = document.getElementById("introAudio");
const stage = document.getElementById("stage");
const flash = document.getElementById("flash");
const slash = document.getElementById("slash");
const prog = document.getElementById("prog");
const siteParts = document.querySelectorAll(".top-bar, main");

let started = false;
let finished = false;
let shown = -1;

function hit() {
  if (reduceMotion) return;
  flash.animate([{ opacity: 0.75 }, { opacity: 0 }], { duration: 350 });
  stage.animate(
    [
      { transform: "translate(0,0)" },
      { transform: "translate(-12px,8px)" },
      { transform: "translate(10px,-6px)" },
      { transform: "translate(-5px,3px)" },
      { transform: "translate(0,0)" },
    ],
    { duration: 320 }
  );
  const angle = (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 12);
  const top = 35 + Math.random() * 30;
  slash.style.top = top + "%";
  slash.animate(
    [
      { opacity: 1, transform: `rotate(${angle}deg) scaleX(0)` },
      { opacity: 1, transform: `rotate(${angle}deg) scaleX(1)`, offset: 0.35 },
      { opacity: 0, transform: `rotate(${angle}deg) scaleX(1)` },
    ],
    { duration: 500, easing: "ease-out" }
  );
}

function showBeat(b) {
  stage.textContent = "";
  const wrap = document.createElement("div");
  wrap.className = "beat " + (b.cls || "");
  const w = document.createElement("h2");
  w.className = "word";
  w.textContent = b.word;
  w.dataset.text = b.word;
  wrap.appendChild(w);
  if (b.sub) {
    const s = document.createElement("p");
    s.className = "sub";
    s.textContent = b.sub;
    wrap.appendChild(s);
  }
  stage.appendChild(wrap);
  hit();
}

function tick() {
  if (finished) return;
  const t = audio.currentTime;
  for (let i = beats.length - 1; i > shown; i--) {
    if (t >= beats[i].t) {
      shown = i;
      showBeat(beats[i]);
      break;
    }
  }
  if (audio.duration) prog.style.transform = `scaleX(${t / audio.duration})`;
  requestAnimationFrame(tick);
}

function begin() {
  if (started) return;
  started = true;
  intro.classList.add("playing");
  video.muted = true; // the video's own sound is never used
  video.play().catch(() => {});
  audio.play().then(() => requestAnimationFrame(tick)).catch(finish);
}

function finish() {
  if (finished) return;
  finished = true;

  // fade the music out
  const fade = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - 0.1);
    if (audio.volume === 0) { clearInterval(fade); audio.pause(); }
  }, 40);

  // diagonal slash wipe reveals the site
  const wipe = intro.animate(
    [
      { clipPath: "polygon(0 0, 130% 0, 100% 100%, 0 100%)" },
      { clipPath: "polygon(0 0, 0 0, -30% 100%, 0 100%)" },
    ],
    { duration: reduceMotion ? 1 : 800, easing: "cubic-bezier(0.7, 0, 0.2, 1)", fill: "forwards" }
  );
  startMeters();
  wipe.onfinish = () => {
    video.pause();
    intro.remove();
    document.body.classList.remove("intro-on");
    siteParts.forEach((el) => el.removeAttribute("inert"));
  };
}

document.body.classList.add("intro-on");
siteParts.forEach((el) => el.setAttribute("inert", ""));

const startBtn = document.getElementById("start");
startBtn.focus();
startBtn.addEventListener("click", begin);
document.getElementById("skip").addEventListener("click", finish);
audio.addEventListener("ended", finish);

window.addEventListener("keydown", (e) => {
  if (finished) return;
  if (!started && !["Shift", "Control", "Alt", "Meta", "Tab"].includes(e.key)) begin();
  else if (started && e.key === "Escape") finish();
});
