const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Progress meters---------- */
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
  document.querySelectorAll(".card").forEach((card, i) => {
    const total = card.querySelectorAll(".topics li").length;
    const done = card.querySelectorAll(".topics li.done").length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const meter = card.querySelector(".meter");
    card.style.setProperty("--i", i); // stagger for the entrance animation
    card.querySelectorAll(".topics li").forEach((li, k) => li.style.setProperty("--n", k));
    const thumb = card.querySelector(".thumb");
    if (thumb && !thumb.querySelector(".badge")) {
      const badge = document.createElement("span");
      badge.className = "badge" + (total && done === total ? " full" : "");
      badge.textContent = done === total ? "\u2713 Complete" : `${done}/${total} done`;
      thumb.appendChild(badge);
    }
    meter.setAttribute("role", "progressbar");
    meter.setAttribute("aria-label", card.querySelector(".name").textContent.trim() + " progress");
    meter.setAttribute("aria-valuemin", 0);
    meter.setAttribute("aria-valuemax", 100);
    meter.setAttribute("aria-valuenow", percent);
    fillMeter(meter, card.querySelector(".pct"), percent);
  });
}

/* ---------- Terminal: types out the overall score ---------- */
function typeTerminal() {
  const el = document.getElementById("term");
  const cyber = [...document.querySelectorAll(".card:not(.game) .topics li")];
  const done = cyber.filter((li) => li.classList.contains("done")).length;
  const pct = cyber.length ? Math.round((done / cyber.length) * 100) : 0;
  const bar = "#".repeat(Math.round(pct / 5)).padEnd(20, "-");
  const text = [
    "$ whoami",
    "zulfaqar_ahmed  # cybersecurity student @ Al-Ameen University",
    "$ ./progress --overall",
    `[${bar}] ${pct}%  (${done}/${cyber.length} topics)`,
  ].join("\n");
  if (reduceMotion) { el.textContent = text; return; }
  el.textContent = "";
  let n = 0;
  const timer = setInterval(() => {
    el.textContent = text.slice(0, ++n);
    if (n >= text.length) clearInterval(timer);
  }, 28);
}

/* ---------- Reveal the site ---------- */
const PLAY_INTRO_ONCE_PER_SESSION = true; // set to false to play the intro on every load

function introSeen() {
  try { return PLAY_INTRO_ONCE_PER_SESSION && sessionStorage.getItem("introSeen") === "1"; }
  catch (e) { return false; }
}

function reveal() {
  document.body.classList.add("revealed");
  startMeters();
  typeTerminal();
  startBackground();
  startMusic();
}

/* ---------- Header: scroll progress, shrink on scroll, active section ---------- */
const topBar = document.querySelector(".top-bar");
const scrollBar = document.getElementById("scrollbar");
const navLinks = [...document.querySelectorAll(".nav a")];
let scrollTicking = false;

function onScroll() {
  scrollTicking = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
  topBar.classList.toggle("scrolled", window.scrollY > 24);
  let current = null;
  navLinks.forEach((a) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target && target.getBoundingClientRect().top <= window.innerHeight * 0.4) current = a;
  });
  navLinks.forEach((a) => a.classList.toggle("active", a === current));
}
window.addEventListener("scroll", () => {
  if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

/* ---------- Music: Veridis Quo with a volume slider ---------- */
const music = document.getElementById("music");
const player = document.getElementById("player");
const playBtn = document.getElementById("playBtn");
const vol = document.getElementById("vol");
let actx = null, gainNode = null, analyser = null, freq = null;
let bass = 0; // 0..1 loudness of the low notes, makes the background pulse
let musicStarted = false;
let fadeId = 0;

try { const saved = localStorage.getItem("vol"); if (saved !== null) vol.value = saved; } catch (e) {}
function paintSlider() { vol.style.setProperty("--v", vol.value + "%"); }
paintSlider();

// The Web Audio gain node also makes the slider work on iPhones (they ignore audio.volume)
function initGraph() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (actx || !AC || location.protocol === "file:") return;
  actx = new AC();
  gainNode = actx.createGain();
  analyser = actx.createAnalyser();
  analyser.fftSize = 256;
  freq = new Uint8Array(analyser.frequencyBinCount);
  actx.createMediaElementSource(music).connect(gainNode).connect(analyser).connect(actx.destination);
}

function applyVolume(v) { if (gainNode) gainNode.gain.value = v; else music.volume = v; }

function fadeIn(ms) {
  const target = Number(vol.value) / 100;
  const t0 = performance.now();
  cancelAnimationFrame(fadeId);
  (function f(now) {
    const k = Math.min((now - t0) / ms, 1);
    applyVolume(target * k);
    if (k < 1) fadeId = requestAnimationFrame(f);
  })(t0);
}

function setPlaying(on) {
  player.classList.toggle("on", on);
  playBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  playBtn.textContent = on ? "\u275A\u275A" : "\u25B6\uFE0E";
}

async function playMusic(fadeMs) {
  musicStarted = true;
  initGraph();
  applyVolume(0);
  try {
    if (actx && actx.state === "suspended") await actx.resume();
    await music.play();
    setPlaying(true);
    player.classList.remove("hint");
    fadeIn(fadeMs);
  } catch (e) {
    setPlaying(false);
    player.classList.add("hint"); // browser blocked autoplay: pulse the play button
  }
}

function unlockMusic() {
  initGraph();
  music.muted = true;
  music.play().then(() => {
    if (!musicStarted) { music.pause(); music.currentTime = 0; }
    music.muted = false;
  }).catch(() => { music.muted = false; });
}

function startMusic() { playMusic(2500); }

playBtn.addEventListener("click", () => {
  if (music.paused) playMusic(800);
  else { music.pause(); setPlaying(false); }
});
vol.addEventListener("input", () => {
  cancelAnimationFrame(fadeId);
  applyVolume(Number(vol.value) / 100);
  paintSlider();
  try { localStorage.setItem("vol", vol.value); } catch (e) {}
});

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });
});

/* ---------- Background: drifting particle network (reacts to the cursor) ---------- */
let bgStarted = false;
function startBackground() {
  if (bgStarted) return;
  bgStarted = true;
  const cv = document.getElementById("bg");
  const ctx = cv.getContext("2d");
  const LINK = 130;
  const mouse = { x: -999, y: -999 };
  let w = 0, h = 0, dots = [], raf = 0;

  function link(a, b, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      ctx.fillStyle = "rgba(155,214,255,0.7)";
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r * (1 + bass * 1.8), 0, Math.PI * 2);
      ctx.fill();
      for (let j = i + 1; j < dots.length; j++) {
        const d = Math.hypot(a.x - dots[j].x, a.y - dots[j].y);
        if (d < LINK) link(a, dots[j], `rgba(80,150,255,${(0.35 + bass * 0.4) * (1 - d / LINK)})`);
      }
      const m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (m < 170) link(a, mouse, `rgba(255,176,32,${0.6 * (1 - m / 170)})`);
    }
  }

  function step() {
    if (analyser) {
      analyser.getByteFrequencyData(freq);
      let sum = 0;
      for (let i = 0; i < 6; i++) sum += freq[i];
      bass += (sum / 6 / 255 - bass) * 0.25;
    }
    for (const d of dots) {
      d.x += d.vx * (1 + bass * 2);
      d.y += d.vy * (1 + bass * 2);
      if (d.x < 0 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(90, Math.max(30, Math.round((w * h) / 16000)));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1 + Math.random() * 1.2,
    }));
    if (reduceMotion) draw();
  }

  resize();
  // ignore the small height changes caused by phone address bars
  window.addEventListener("resize", () => {
    if (window.innerWidth !== w || Math.abs(window.innerHeight - h) > 150) resize();
  });
  window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener("pointerup", (e) => {
    if (e.pointerType !== "mouse") mouse.x = mouse.y = -999;
  });
  if (!reduceMotion) {
    raf = requestAnimationFrame(step);
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(step);
    });
  }
}

/* ---------- Discord: copy the username ---------- */
document.getElementById("dc").addEventListener("click", async (e) => {
  const label = document.getElementById("dcText");
  const name = e.currentTarget.dataset.copy;
  try {
    await navigator.clipboard.writeText(name);
    label.textContent = "Copied!";
  } catch (err) {
    label.textContent = name;
  }
  setTimeout(() => { label.textContent = name + " · tap to copy"; }, 1800);
});

document.getElementById("yr").textContent = new Date().getFullYear();
document.getElementById("replay").addEventListener("click", () => {
  try { sessionStorage.removeItem("introSeen"); } catch (e) {}
  location.reload();
});

/* ---------- DMC5-style ---------- */
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
const siteParts = document.querySelectorAll(".top-bar, main, .foot, .player");

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

//  (مشكلة التلفون والايباد )
function fit(el) {
  const max = window.innerWidth * 0.92;
  let size = parseFloat(getComputedStyle(el).fontSize);
  while (el.offsetWidth > max && size > 14) {
    size -= 2;
    el.style.fontSize = size + "px";
  }
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
  fit(w);
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
  unlockMusic(); // still inside the click, so the music may start later without another one
  video.muted = true; // صوت المقطع الاصلي مضروب بالقندرة (ميوت)
  video.play().catch(() => {});
  audio.play().then(() => requestAnimationFrame(tick)).catch(finish);
}

function finish() {
  if (finished) return;
  finished = true;
  try { sessionStorage.setItem("introSeen", "1"); } catch (e) {}

  // ترهيم الصوتيات مال الاغنية (fade out)
  const fade = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - 0.1);
    if (audio.volume === 0) { clearInterval(fade); audio.pause(); }
  }, 40);

  // الخطوط اللي فوك (الانيميشن)
  const wipe = intro.animate(
    [
      { clipPath: "polygon(0 0, 130% 0, 100% 100%, 0 100%)" },
      { clipPath: "polygon(0 0, 0 0, -30% 100%, 0 100%)" },
    ],
    { duration: reduceMotion ? 1 : 800, easing: "cubic-bezier(0.7, 0, 0.2, 1)", fill: "forwards" }
  );
  reveal();
  wipe.onfinish = () => {
    video.pause();
    intro.remove();
    document.body.classList.remove("intro-on");
    siteParts.forEach((el) => el.removeAttribute("inert"));
  };
}

if (introSeen()) {
  intro.remove();
  reveal();
} else {
  document.body.classList.add("intro-on");
  siteParts.forEach((el) => el.setAttribute("inert", ""));

  const startBtn = document.getElementById("start");
  startBtn.focus();

  //الدكمه اللي يضغط عليها المستخدم علمود  يبدأ الانيميشن واذا ماكو المقطع يسوي سكب
  const pressLabel = startBtn.querySelector(".press");
  function reportMissing(media) {
    const name = media.getAttribute("src");
    console.error("Intro: could not load " + name);
    pressLabel.textContent = "Can't load " + name + " - upload it next to index.html";
  }
  if (window.matchMedia("(pointer: coarse)").matches) pressLabel.textContent = "Tap to start";
  [video, audio].forEach((m) => {
    if (m.error || m.networkState === 3) reportMissing(m);
    m.addEventListener("error", () => reportMissing(m));
  });

  startBtn.addEventListener("click", begin);
  document.getElementById("skip").addEventListener("click", finish);
  audio.addEventListener("ended", finish);

  window.addEventListener("keydown", (e) => {
    if (finished) return;
    if (!started && !["Shift", "Control", "Alt", "Meta", "Tab"].includes(e.key)) begin();
    else if (started && e.key === "Escape") finish();
  });
}
