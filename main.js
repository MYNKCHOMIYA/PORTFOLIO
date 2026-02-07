// Clean portfolio JavaScript - Activity widgets properly configured

// PWA Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

// Mobile Navigation
const nav = document.querySelector(".nav");
const navToggle = document.querySelector(".nav__toggle");
const navLinks = document.getElementById("nav-links");

if (nav && navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen);
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  function closeNav() {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }

  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", closeNav);
  });

  navLinks.addEventListener("click", (e) => {
    if (e.target === navLinks) closeNav();
  });
}

// Footer Year
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Cursor Effect
(() => {
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  const set = () => {
    document.body.style.setProperty("--cursor-x", `${x}px`);
    document.body.style.setProperty("--cursor-y", `${y}px`);
  };

  window.addEventListener(
    "pointermove",
    (e) => {
      x = e.clientX;
      y = e.clientY;
      document.body.classList.add("is-pointer");
      set();
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("is-pointer");
  });

  set();
})();

// Scroll Reveal
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealElements.forEach((el) => observer.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("reveal--visible"));
}

// ============= ACTIVITY WIDGETS =============
(() => {
  const root = document.querySelector(".activity");
  if (!root) return;

  const ghUser = root.getAttribute("data-github-user") || "";
  const lcUser = root.getAttribute("data-leetcode-user") || "";

  // GitHub Images
  const ghContrib = root.querySelector(
    "img[data-activity-img='github'][data-view='contrib']"
  );
  const ghStreak = root.querySelector(
    "img[data-activity-img='github'][data-view='streak']"
  );

  // LeetCode Images
  const lcCard = root.querySelector(
    "img[data-activity-img='leetcode'][data-view='card']"
  );
  const lcHeat = root.querySelector(
    "img[data-activity-img='leetcode'][data-view='heatmap']"
  );

  // Set GitHub URLs
  if (ghContrib && ghUser) {
    ghContrib.src = `https://ghchart.rshah.org/2ea44f/${encodeURIComponent(ghUser)}`;
  }

  if (ghStreak && ghUser) {
    ghStreak.src = `https://github-readme-streak-stats.herokuapp.com/?user=${encodeURIComponent(
      ghUser
    )}&theme=dark&hide_border=true&background=05030A&ring=FF3EA5&fire=FFD34F&currStreakLabel=F7F3FF&sideLabels=F7F3FF&currStreakNum=FF3EA5&dates=A39BB8`;
  }

  // Set LeetCode URLs
  if (lcCard && lcUser) {
    lcCard.src = `https://leetcard.jacoblin.cool/${encodeURIComponent(
      lcUser
    )}?theme=dark&font=Karla&ext=contest&border=0`;
  }

  if (lcHeat && lcUser) {
    lcHeat.src = `https://leetcode-stats-six.vercel.app/api?username=${encodeURIComponent(
      lcUser
    )}&theme=dark`;
  }

  // Tab Switching
  root.querySelectorAll(".activity-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const activity = btn.getAttribute("data-activity");
      const view = btn.getAttribute("data-view");
      if (!activity || !view) return;

      const tablist = btn.closest(".activity-tabs");
      tablist?.querySelectorAll(".activity-tab").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });

      root
        .querySelectorAll(`img[data-activity-img='${activity}']`)
        .forEach((img) => {
          const imgView = img.getAttribute("data-view");
          img.classList.toggle("is-hidden", imgView !== view);
        });
    });
  });
})();

// ============= EXPERIENCE — TIMELINE LINE REVEAL + CERTIFICATE MODAL =============
(function () {
  const timeline = document.querySelector(".timeline");
  if (timeline && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timeline.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    obs.observe(timeline);
  }

  const modal = document.getElementById("cert-modal");
  const certCards = document.querySelectorAll(".cert-card[data-cert-title]");
  if (!modal) return;

  const titleEl = modal.querySelector("#cert-modal-title");
  const orgEl = modal.querySelector(".cert-modal__org");
  const dateEl = modal.querySelector(".cert-modal__date");
  const descEl = modal.querySelector(".cert-modal__desc");
  const linkEl = modal.querySelector(".cert-modal__link");
  const imgWrap = modal.querySelector(".cert-modal__img-wrap");
  const closeBtn = modal.querySelector(".cert-modal__close");
  const backdrop = modal.querySelector(".cert-modal__backdrop");

  function openCertModal(card) {
    const title = card.getAttribute("data-cert-title") || "";
    const org = card.getAttribute("data-cert-org") || "";
    const date = card.getAttribute("data-cert-date") || "";
    const desc = card.getAttribute("data-cert-desc") || "";
    const url = card.getAttribute("data-cert-url") || "#";

    if (titleEl) titleEl.textContent = title;
    if (orgEl) orgEl.textContent = org;
    if (dateEl) dateEl.textContent = date;
    if (descEl) descEl.textContent = desc;
    if (linkEl) {
      linkEl.href = url;
      linkEl.style.display = url && url !== "#" ? "inline-flex" : "none";
    }
    imgWrap.innerHTML = "";
    const imgUrl = card.getAttribute("data-cert-img");
    if (imgUrl) {
      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = title;
      img.loading = "lazy";
      imgWrap.appendChild(img);
    }

    modal.hidden = false;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeCertModal() {
    modal.classList.remove("is-open");
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  certCards.forEach((card) => {
    card.addEventListener("click", () => openCertModal(card));
  });

  closeBtn?.addEventListener("click", closeCertModal);
  backdrop?.addEventListener("click", closeCertModal);

  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeCertModal();
    }
  });
})();