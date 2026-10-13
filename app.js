// You Know Ball - finish the quote
// Quotes fetched live from dummyjson.com, cached in localStorage for a week.

const API = "https://dummyjson.com/quotes?limit=0";
const CACHE_KEY = "ykb-quotes-v1";
const CACHE_TTL = 7 * 24 * 3600 * 1000;
const MIN_WORDS = 8;

let quotes = [];
let current = null;
let streak = Number(localStorage.getItem("ykb-streak") || 0);

const $ = (id) => document.getElementById(id);
const play = $("play"), win = $("win");

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripFiller(s) {
  return normalize(s).split(" ").filter((w) => !["the", "a", "an", "and", "or", "but", "so"].includes(w)).join(" ");
}

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function splitQuote(text) {
  const words = text.split(/\s+/);
  if (words.length < MIN_WORDS) return null;
  const mid = Math.ceil(words.length / 2);
  if (mid < 3 || words.length - mid < 2) return null;
  return { first: words.slice(0, mid).join(" "), second: words.slice(mid).join(" ") };
}

async function loadQuotes() {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  if (cached && Date.now() - cached.at < CACHE_TTL && cached.quotes?.length > 50) {
    return cached.quotes;
  }
  const res = await fetch(API);
  if (!res.ok) throw new Error("API " + res.status);
  const data = await res.json();
  const list = (data.quotes || []).map((q) => q.quote);
  localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), quotes: list }));
  return list;
}

function nextQuote() {
  const pool = quotes.filter((t) => splitQuote(t));
  const raw = pool[Math.floor(Math.random() * pool.length)];
  const halves = splitQuote(raw);
  current = { text: raw, first: halves.first, second: halves.second };
  $("firstHalf").innerHTML = current.first + ' <span class="tail">…</span>';
  $("guess").value = "";
  $("verdict").textContent = "";
  $("verdict").className = "verdict";
  updateStreak();
  play.hidden = false;
  win.hidden = true;
  $("guess").focus();
}

function updateStreak() {
  const el = $("streak");
  el.textContent = "streak " + streak;
  el.className = "streak" + (streak >= 3 ? " hot" : "");
}

function celebrate() {
  const box = win.querySelector(".confetti");
  box.innerHTML = "";
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("i");
    p.style.setProperty("--x", Math.floor(Math.random() * 100));
    p.style.left = Math.floor(Math.random() * 100) + "%";
    p.style.animationDelay = Math.random() * 0.4 + "s";
    box.appendChild(p);
  }
}

function setStreak(v) {
  streak = v;
  localStorage.setItem("ykb-streak", String(streak));
  updateStreak();
}

function check(e) {
  e.preventDefault();
  const guess = $("guess").value;
  if (!normalize(guess)) return;
  const target = normalize(current.second);
  const got = normalize(guess);
  const wordDist = lev(stripFiller(guess), stripFiller(current.second));
  const wordLen = Math.max(stripFiller(current.second).length, 1);
  const closeEnough = 1 - wordDist / wordLen >= 0.8;

  const verdict = $("verdict");
  if (got === target || (closeEnough && wordDist <= 3)) {
    setStreak(streak + 1);
    $("fullQuote").textContent = "\u201c" + current.text + "\u201d";
    $("author").textContent = "finish one. know ball.";
    $("winStreak").textContent = streak;
    play.hidden = true;
    win.hidden = false;
    celebrate();
  } else {
    play.classList.add("shake");
    setTimeout(() => play.classList.remove("shake"), 400);
    verdict.className = "verdict bad";
    verdict.textContent = got.replace(/\s/g, "").length > 6 && 1 - wordDist / wordLen >= 0.6
      ? "so close. it's \u201c" + current.second + "\u201d"
      : "not quite. try again.";
    $("guess").focus();
  }
}

function skip() {
  nextQuote();
}

function giveUp() {
  setStreak(0);
  $("verdict").className = "verdict";
  $("verdict").textContent = "the answer was \u201c" + current.second + "\u201d";
  setTimeout(nextQuote, 2500);
}

$("guessForm").addEventListener("submit", check);
$("skipBtn").addEventListener("click", skip);
$("revealBtn").addEventListener("click", giveUp);
$("nextBtn").addEventListener("click", nextQuote);

loadQuotes()
  .then((list) => {
    quotes = list;
    nextQuote();
  })
  .catch(() => {
    $("firstHalf").textContent = "couldn't reach the quote server. refresh and try again.";
    $("guess").disabled = true;
    $("skipBtn").disabled = true;
    $("revealBtn").disabled = true;
  });
