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
// phones: the row is swiped sideways natively; larger screens: scrolling down slides it
const sideways = matchMedia("(max-width: 760px)");
const scrolled = () => (sideways.matches ? document.querySelector(".works .pin")?.scrollLeft ?? 0 : scrollY);
const setFrame = () => {
  const f = Math.floor(scrolled() / STEP) % FRAMES;
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
  if (sideways.matches) {
    works.style.height = "";
    track.style.transform = "";
    return;
  }
  works.querySelector(".pin").scrollLeft = 0;
  travel = Math.max(0, track.scrollWidth - innerWidth);
  works.style.height = `${innerHeight + travel}px`;
  moveTrack();
};
const moveTrack = () => {
  if (!works || sideways.matches) return;
  const x = Math.min(Math.max(-works.getBoundingClientRect().top, 0), travel);
  track.style.transform = `translate3d(${-x}px, 0, 0)`;
  updateHover();
};

// hover effect follows the mouse even when the row slides under a still cursor
// (browsers only re-check :hover when the mouse itself moves)
let mouse = null, hovered = null;
const cards = [...document.querySelectorAll(".card")];
const updateHover = () => {
  // check card outlines directly (the hover inset would make edge hits flicker)
  const open = document.documentElement.classList.contains("locked");
  const card = (mouse && !open && cards.find((c) => {
    const r = c.getBoundingClientRect();
    return mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom;
  })) || null;
  if (card === hovered) return;
  hovered?.classList.remove("is-hover");
  card?.classList.add("is-hover");
  hovered = card;
};
if (matchMedia("(hover: hover)").matches) {
  addEventListener("mousemove", (e) => { mouse = { x: e.clientX, y: e.clientY }; updateHover(); }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { mouse = null; updateHover(); });
  addEventListener("hashchange", () => setTimeout(updateHover)); // clear while an overlay is open
}
// vertical scroll position that shows a given group (artist, degrees, …)
const groupTop = (group) => works.offsetTop + Math.min(group.offsetLeft - 32, travel);
const goTo = (id, smooth = true) => {
  const el = document.getElementById(id);
  if (!el) return false;
  const behavior = smooth ? "smooth" : "instant";
  if (el.classList.contains("group") && sideways.matches) {
    works.querySelector(".pin").scrollTo({ left: el.offsetLeft - 16, behavior });
    return true;
  }
  const top = el.classList.contains("group") ? groupTop(el) : el.getBoundingClientRect().top + scrollY;
  scrollTo({ top, behavior });
  return true;
};
if (works) {
  addEventListener("scroll", () => requestAnimationFrame(moveTrack), { passive: true });
  addEventListener("resize", layoutWorks);
  addEventListener("load", layoutWorks);
  sideways.addEventListener("change", layoutWorks);
  works.querySelector(".pin").addEventListener("scroll", () => requestAnimationFrame(setFrame), { passive: true });
  layoutWorks();
}
// in-page links (#artist, #degrees, …) — groups sit inside the sliding row, so compute their position
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
  addEventListener("load", () => setTimeout(() => { if (!sideways.matches) works.querySelector(".pin").scrollLeft = 0; goTo(initialHash, false); }, 60));
}

// ---------- project overlay (#/project-name) ----------
const overlay = document.createElement("div");
overlay.className = "overlay";
overlay.setAttribute("role", "dialog");
overlay.setAttribute("aria-modal", "true");
overlay.innerHTML = `<div class="overlay-body"></div>`;
const overlayBody = overlay.querySelector(".overlay-body");
const closeBtn = document.createElement("button");
closeBtn.className = "overlay-close";
closeBtn.setAttribute("aria-label", "Close");
closeBtn.textContent = "×";
if (document.querySelector("template[id^='p-']")) document.body.append(overlay, closeBtn);
let openedFromPage = false;

const showProject = () => {
  const slug = location.hash.startsWith("#/") ? location.hash.slice(2) : "";
  const tpl = slug && document.getElementById(`p-${slug}`);
  if (!tpl) {
    overlay.classList.remove("open");
    closeBtn.classList.remove("open");
    document.documentElement.classList.remove("locked");
    return;
  }
  overlayBody.replaceChildren(tpl.content.cloneNode(true));
  overlay.scrollTop = 0;
  overlay.classList.add("open");
  closeBtn.classList.add("open");
  document.documentElement.classList.add("locked");
  closeBtn.focus({ preventScroll: true });
};
const closeProject = () => {
  if (openedFromPage) history.back();
  else {
    history.replaceState(null, "", location.pathname);
    showProject();
  }
  openedFromPage = false;
};
// remember when an overlay was opened from the page, so closing can simply go "back"
document.addEventListener("click", (e) => {
  if (e.target.closest('a[href^="#/"]') && !overlay.classList.contains("open")) openedFromPage = true;
});
addEventListener("hashchange", closeMenu);
closeBtn.addEventListener("click", closeProject);
// a click on empty space (not on text, images or links) closes the overlay
overlay.addEventListener("click", (e) => {
  if (!e.target.closest("p, h1, .meta span, img, a, button")) closeProject();
});
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
