/* ============================================================
   WEDDING INVITATION — script.js
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

// Evita que el browser mobile restaure la posición de scroll al recargar
history.scrollRestoration = "manual";
window.scrollTo(0, 0);

// ── Query params ──────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const modo = params.get("modo");

if (modo === "presencial") {
  document.body.classList.add("modo-presencial");
  document.getElementById("infoPresencial").classList.add("is-active");
} else if (modo === "live") {
  document.body.classList.add("modo-live");
  document.getElementById("infoLive").classList.add("is-active");
}

// ── DOM refs ──────────────────────────────────────────────────
const bookScene = document.getElementById("bookScene");
const bookCover = document.getElementById("bookCover");
const bookShadow = document.getElementById("bookShadow");
const bookStage = document.getElementById("bookStage");
const mainContent = document.getElementById("mainContent");
const scrollCta = document.getElementById("scrollCta");
const dustContainer = document.getElementById("dustContainer");

let bookOpened = false;

// Libro sobre una mesa visto desde abajo — simple rotateX en el child
gsap.set(bookStage, { rotateX: 15, rotateY: 10 });

// ── Dust particles ────────────────────────────────────────────
function spawnDust(x, y, burst = false) {
  const el = document.createElement("div");
  el.className = "dust-particle";
  const size = burst ? gsap.utils.random(3, 10) : gsap.utils.random(2, 5);
  el.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  dustContainer.appendChild(el);

  const angle = gsap.utils.random(0, 360) * (Math.PI / 180);
  const dist = burst ? gsap.utils.random(50, 220) : gsap.utils.random(20, 70);

  gsap.fromTo(
    el,
    { opacity: burst ? 0.85 : 0.5, scale: 1 },
    {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - (burst ? 50 : 15),
      opacity: 0,
      scale: 0,
      duration: burst ? gsap.utils.random(1, 2.2) : gsap.utils.random(1.5, 3),
      ease: "power2.out",
      onComplete: () => el.remove(),
    },
  );
}

// Ambient dust while book is closed
const ambientInterval = setInterval(() => {
  spawnDust(
    gsap.utils.random(0, window.innerWidth),
    gsap.utils.random(window.innerHeight * 0.2, window.innerHeight * 0.9),
  );
}, 700);

// ── Gentle hint nudge after 3s of inaction ────────────────────
setTimeout(() => {
  if (bookOpened) return;
  gsap.to(bookStage, {
    rotateZ: 1.5,
    duration: 0.15,
    repeat: 5,
    yoyo: true,
    ease: "power1.inOut",
    onComplete: () => gsap.set(bookStage, { rotateZ: 0 }),
  });
}, 3500);

// ── BOOK OPEN ─────────────────────────────────────────────────
function openBook() {
  if (bookOpened) return;
  bookOpened = true;

  clearInterval(ambientInterval);

  const tl = gsap.timeline();

  // 1. El libro se levanta de la mesa hacia la cámara
  tl.to(
    bookStage,
    {
      rotateX: 0,
      rotateY: 0,
      duration: 0.9,
      ease: "power2.inOut",
    },
    0,
  );

  // 3. Leve levantamiento simultáneo
  tl.to(
    bookStage,
    {
      y: -14,
      scale: 1.025,
      duration: 0.45,
      ease: "power2.out",
    },
    0,
  );

  // 3. Cover flips to the LEFT — rotateY(-180deg), pivot = left edge
  //    This mimics opening a real book: right edge swings away & left
  tl.to(
    bookCover,
    {
      rotateY: -180,
      duration: 1.3,
      ease: "power3.inOut",
    },
    0.5,
  );

  // 4. Lomo y sombra se desvanecen — solo debe verse el interior
  tl.to(
    document.querySelector(".book-spine"),
    { opacity: 0, duration: 0.3 },
    0.5,
  );

  // 5. Shadow stretches as cover opens, then fades
  tl.to(
    bookShadow,
    {
      scaleX: 1.4,
      opacity: 0.6,
      duration: 0.6,
      ease: "power2.out",
    },
    0.2,
  );
  tl.to(
    bookShadow,
    {
      scaleX: 0.7,
      opacity: 0.2,
      duration: 0.5,
      ease: "power2.in",
    },
    0.8,
  );

  // 6. Book settles
  tl.to(
    bookStage,
    {
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: "back.out(1.6)",
    },
    1.1,
  );

  // 7. Sombra se desvanece mientras la portada termina de girar
  tl.to(bookShadow, { opacity: 0, duration: 0.4 }, 1.5);

  // 8. Interior llena toda la escena — sube al top y escala
  tl.call(
    () => {
      const sceneRect = bookScene.getBoundingClientRect();
      const stageRect = bookStage.getBoundingClientRect();
      const scaleX = sceneRect.width / stageRect.width;
      const scaleY = sceneRect.height / stageRect.height;
      // Distancia desde el top del stage al top de la escena
      const distToTop = stageRect.top - sceneRect.top;

      gsap.to(bookStage, {
        y: -distToTop,
        scale: Math.min(scaleX, scaleY),
        transformOrigin: "top center",
        duration: 0.5,
        ease: "power2.inOut",
      });
    },
    null,
    1.5,
  );

  // 9. CTA aparece tras la expansión, scroll se habilita 2s después
  tl.call(
    () => {
      scrollCta.classList.add("is-visible");
      setTimeout(() => {
        document.documentElement.classList.add("scroll-enabled");
      }, 500);
    },
    null,
    2.8,
  );

  // El libro queda abierto en la escena.
  // El usuario puede scrollear hacia abajo para ver el contenido,
  // y volver arriba para ver el libro abierto.
}

// Trigger: click o swipe hacia arriba
bookScene.addEventListener("click", openBook);

let touchStartX = 0;
let touchStartY = 0;
bookScene.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  },
  { passive: true },
);

bookScene.addEventListener(
  "touchend",
  (e) => {
    const dx = Math.abs(touchStartX - e.changedTouches[0].clientX);
    const dy = Math.abs(touchStartY - e.changedTouches[0].clientY);
    if (Math.max(dx, dy) > 30) openBook();
  },
  { passive: true },
);

// CTA: scroll al contenido principal
scrollCta.addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("mainContent").scrollIntoView({ behavior: "smooth" });
});

// ── Scroll animations (init after main content is revealed) ──
function initScrollAnimations() {
  gsap.utils.toArray(".reveal-up").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 36 },
      {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      },
    );
  });

  gsap.utils.toArray(".reveal-left").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: -45 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      },
    );
  });

  gsap.utils.toArray(".reveal-right").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: 45 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      },
    );
  });

  // Section ornaments: pop in
  gsap.utils.toArray(".section-ornament").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.4, rotate: -15 },
      {
        opacity: 1,
        scale: 1,
        rotate: 0,
        duration: 0.55,
        ease: "back.out(2.5)",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      },
    );
  });

  // Timeline dots pop in
  gsap.utils.toArray(".timeline-dot").forEach((dot) => {
    gsap.fromTo(
      dot,
      { opacity: 0, scale: 0 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.45,
        ease: "back.out(3)",
        scrollTrigger: { trigger: dot, start: "top 90%", once: true },
      },
    );
  });

  // Seal: elastic entrance + dust
  const seal = document.querySelector(".fecha-seal");
  if (seal) {
    gsap.fromTo(
      seal,
      { opacity: 0, scale: 0.2, rotate: -25 },
      {
        opacity: 1,
        scale: 1,
        rotate: 0,
        duration: 1.1,
        ease: "elastic.out(1, 0.55)",
        scrollTrigger: {
          trigger: seal,
          start: "top 85%",
          once: true,
        },
      },
    );
  }

  // Gallery: stagger fade-scale
  gsap.utils.toArray(".gallery-item").forEach((item, i) => {
    gsap.fromTo(
      item,
      { opacity: 0, y: 28, scale: 0.94 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay: (i % 3) * 0.07,
        ease: "power3.out",
        scrollTrigger: { trigger: item, start: "top 90%", once: true },
      },
    );
  });

  // ── Surprise interactions ──────────────────────────────────

  // Timeline dots wobble on hover
  document.querySelectorAll(".timeline-dot").forEach((dot) => {
    dot.style.cursor = "default";
    dot.addEventListener("mouseenter", () => {
      gsap.to(dot, {
        scale: 1.5,
        rotate: gsap.utils.random(-20, 20),
        boxShadow:
          "0 0 0 6px rgba(201,146,42,0.28), 0 0 18px rgba(201,146,42,0.35)",
        duration: 0.28,
        ease: "back.out(3)",
      });
    });
    dot.addEventListener("mouseleave", () => {
      gsap.to(dot, {
        scale: 1,
        rotate: 0,
        boxShadow: "0 0 0 3px rgba(201,146,42,0.14)",
        duration: 0.45,
        ease: "elastic.out(1, 0.5)",
      });
    });
  });

  // Gallery portraits sway like haunted paintings
  document.querySelectorAll(".gallery-placeholder").forEach((item) => {
    item.addEventListener("mouseenter", function () {
      gsap.to(this, {
        rotate: gsap.utils.random(-2.5, 2.5),
        scale: 1.03,
        duration: 0.5,
        ease: "power2.out",
      });
    });
    item.addEventListener("mouseleave", function () {
      gsap.to(this, {
        rotate: 0,
        scale: 1,
        duration: 0.65,
        ease: "elastic.out(1, 0.5)",
      });
    });
  });
}

// Las animaciones de scroll se inician directamente — el main content
// siempre está en el DOM y es visible.
document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
});
