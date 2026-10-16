// top bar background once the page scrolls
const bar = document.querySelector(".bar");
const onScroll = () => bar.classList.toggle("scrolled", scrollY > 30);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// hero: letters rise one by one, flower drifts with the mouse
document.querySelectorAll(".hero h1 span").forEach((s, i) => (s.style.animationDelay = `${i * 60}ms`));
const flower = document.querySelector(".hero .flower");
if (flower && matchMedia("(pointer: fine)").matches) {
  addEventListener("mousemove", (e) => {
    const x = (e.clientX / innerWidth - 0.5) * 30;
    const y = (e.clientY / innerHeight - 0.5) * 30;
    flower.style.transform = `translate(${x}px, ${y}px)`;
  });
}

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
menuBtn?.addEventListener("click", () => {
  const open = bar.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".bar nav a").forEach((a) => a.addEventListener("click", () => {
  bar.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded", false);
}));

// fade items in as they scroll into view
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => en.isIntersecting && (en.target.classList.add("in"), io.unobserve(en.target))),
  { rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 90}ms`;
  io.observe(el);
});

// lightbox for project galleries
const shots = [...document.querySelectorAll(".gallery button")];
if (shots.length) {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML = `<img alt=""><button class="close" aria-label="Close">×</button>
    <button class="prev" aria-label="Previous">←</button><button class="next" aria-label="Next">→</button>`;
  document.body.append(box);
  const img = box.querySelector("img");
  let cur = 0;
  const show = (i) => {
    cur = (i + shots.length) % shots.length;
    img.src = shots[cur].dataset.full;
    img.alt = shots[cur].querySelector("img").alt;
    box.classList.add("open");
  };
  const close = () => box.classList.remove("open");
  shots.forEach((b, i) => b.addEventListener("click", () => show(i)));
  box.querySelector(".close").onclick = close;
  box.querySelector(".prev").onclick = (e) => (e.stopPropagation(), show(cur - 1));
  box.querySelector(".next").onclick = (e) => (e.stopPropagation(), show(cur + 1));
  box.addEventListener("click", (e) => e.target === box && close());
  addEventListener("keydown", (e) => {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  if (shots.length === 1) box.querySelectorAll(".prev, .next").forEach((b) => b.remove());
}

// contact details are stored scrambled in the HTML so spam bots can't read them
const unscramble = (s) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))).split("").reverse().join("");
document.querySelectorAll(".obf").forEach((el) => (el.textContent = unscramble(el.dataset.o)));
document.querySelectorAll(".obf-mail").forEach((a) => {
  const mail = unscramble(a.dataset.o);
  a.href = "mailto:" + mail;
  a.textContent = mail;
});
