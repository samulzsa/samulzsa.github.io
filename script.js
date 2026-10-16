// top bar background once the page scrolls
const bar = document.querySelector(".bar");
const onScroll = () => bar.classList.toggle("scrolled", scrollY > 30);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// hero: letters rise one by one
document.querySelectorAll(".hero h1 span").forEach((s, i) => (s.style.animationDelay = `${i * 60}ms`));

// flower morphs one frame per scroll step (frames live in images/flower/)
const FRAMES = 93, STEP = 90; // px of scrolling per frame
const flowers = document.querySelectorAll(".flower-frame");
const root = flowers[0]?.dataset.root ?? "";
const frameSrc = (i) => `${root}images/flower/${String(i).padStart(2, "0")}.webp`;
for (let i = 1; i < FRAMES; i++) new Image().src = frameSrc(i); // preload
let lastFrame = 0;
const setFrame = () => {
  const f = Math.floor(scrollY / STEP) % FRAMES;
  if (f === lastFrame) return;
  lastFrame = f;
  flowers.forEach((img) => (img.src = frameSrc(f)));
};
addEventListener("scroll", () => requestAnimationFrame(setFrame), { passive: true });

// mobile menu
const menuBtn = document.querySelector(".bar .menu");
const closeMenu = () => {
  bar.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded", false);
};
menuBtn?.addEventListener("click", () => {
  const open = bar.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});

// ---------- works: scrolling down slides the project track sideways ----------
const works = document.querySelector(".works");
const track = works?.querySelector(".track");
let travel = 0;
const layoutWorks = () => {
  if (!works) return;
  travel = Math.max(0, track.scrollWidth - innerWidth);
  works.style.height = `${innerHeight + travel}px`;
  moveTrack();
};
const moveTrack = () => {
  if (!works) return;
  const x = Math.min(Math.max(-works.getBoundingClientRect().top, 0), travel);
  track.style.transform = `translate3d(${-x}px, 0, 0)`;
};
// vertical scroll position that shows a given panel (artist, degrees, …)
const panelTop = (panel) => works.offsetTop + Math.min(panel.offsetLeft - 24, travel);
const goTo = (id, smooth = true) => {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.classList.contains("panel") ? panelTop(el) : el.getBoundingClientRect().top + scrollY;
  scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
  return true;
};
if (works) {
  addEventListener("scroll", () => requestAnimationFrame(moveTrack), { passive: true });
  addEventListener("resize", layoutWorks);
  addEventListener("load", layoutWorks);
  layoutWorks();
}
// in-page links (#artist, #about, …) — panels sit inside the sliding track, so compute their position
document.querySelectorAll('a[href^="#"]:not([href^="#/"])').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1);
    if (id && goTo(id)) {
      e.preventDefault();
      history.replaceState(null, "", `#${id}`);
    }
    closeMenu();
  })
);
const initialHash = location.hash.slice(1);
if (initialHash && !initialHash.startsWith("/")) {
  history.scrollRestoration = "manual";
  addEventListener("load", () => setTimeout(() => { works.querySelector(".pin").scrollLeft = 0; goTo(initialHash, false); }, 60));
}

// ---------- project overlay (#/project-name) ----------
const overlay = document.createElement("div");
overlay.className = "overlay";
overlay.setAttribute("role", "dialog");
overlay.setAttribute("aria-modal", "true");
overlay.innerHTML = `<button class="overlay-close" aria-label="Close">×</button><div class="overlay-body"></div>`;
const overlayBody = overlay.querySelector(".overlay-body");
if (document.querySelector("template[id^='p-']")) document.body.append(overlay);
let openedFromPage = false;

const showProject = () => {
  const slug = location.hash.startsWith("#/") ? location.hash.slice(2) : "";
  const tpl = slug && document.getElementById(`p-${slug}`);
  if (!tpl) {
    overlay.classList.remove("open");
    document.documentElement.classList.remove("locked");
    return;
  }
  overlayBody.replaceChildren(tpl.content.cloneNode(true));
  overlay.scrollTop = 0;
  overlay.classList.add("open");
  document.documentElement.classList.add("locked");
  overlay.querySelector(".overlay-close").focus({ preventScroll: true });
};
const closeProject = () => {
  if (openedFromPage) history.back();
  else {
    history.replaceState(null, "", location.pathname);
    showProject();
  }
  openedFromPage = false;
};
document.querySelectorAll('.card[href^="#/"]').forEach((a) => a.addEventListener("click", () => (openedFromPage = true)));
overlay.querySelector(".overlay-close").addEventListener("click", closeProject);
addEventListener("hashchange", showProject);
showProject();

// ---------- lightbox for project images ----------
const box = document.createElement("div");
box.className = "lightbox";
box.innerHTML = `<img alt=""><button class="close" aria-label="Close">×</button>
  <button class="prev" aria-label="Previous">←</button><button class="next" aria-label="Next">→</button>`;
document.body.append(box);
const boxImg = box.querySelector("img");
let shots = [], cur = 0;
const show = (i) => {
  cur = (i + shots.length) % shots.length;
  boxImg.src = shots[cur].dataset.full;
  boxImg.alt = shots[cur].querySelector("img").alt;
  box.querySelectorAll(".prev, .next").forEach((b) => (b.hidden = shots.length < 2));
  box.classList.add("open");
};
const closeBox = () => box.classList.remove("open");
overlay.addEventListener("click", (e) => {
  const btn = e.target.closest(".gallery button");
  if (!btn) return;
  shots = [...btn.parentElement.querySelectorAll("button")];
  show(shots.indexOf(btn));
});
box.querySelector(".close").onclick = closeBox;
box.querySelector(".prev").onclick = (e) => (e.stopPropagation(), show(cur - 1));
box.querySelector(".next").onclick = (e) => (e.stopPropagation(), show(cur + 1));
box.addEventListener("click", (e) => e.target === box && closeBox());
addEventListener("keydown", (e) => {
  if (box.classList.contains("open")) {
    if (e.key === "Escape") closeBox();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  } else if (e.key === "Escape" && overlay.classList.contains("open")) closeProject();
});

// contact details are stored scrambled in the HTML so spam bots can't read them
const unscramble = (s) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))).split("").reverse().join("");
document.querySelectorAll(".obf").forEach((el) => (el.textContent = unscramble(el.dataset.o)));
document.querySelectorAll(".obf-mail").forEach((a) => {
  const mail = unscramble(a.dataset.o);
  a.href = "mailto:" + mail;
  a.textContent = mail;
});
