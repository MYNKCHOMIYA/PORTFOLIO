// Simple enhancements to mimic a modern landing page:
// - Scroll reveal animations
// - Fake video play handlers (you can replace with real players later)

// YEAR IN FOOTER
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// CURSOR "LIGHT" THAT AFFECTS THE ENVIRONMENT
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

// SCROLL REVEAL
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
    {
      threshold: 0.2,
    }
  );

  revealElements.forEach((el) => observer.observe(el));
} else {
  // fallback: show everything
  revealElements.forEach((el) => el.classList.add("reveal--visible"));
}

// MEDIA CARDS (CLICK TO OPEN VIDEO LINK)
document.querySelectorAll(".media-card__thumbnail").forEach((thumb) => {
  thumb.addEventListener("click", () => {
    const url = thumb.getAttribute("data-video-url") || "";
    if (!url || url === "YOUR-MAIN-VIDEO-URL" || url.startsWith("YOUR-")) {
      alert("Replace data-video-url with your real video link in the HTML.");
    } else {
      window.open(url, "_blank");
    }
  });
});

// SCROLL-REACTIVE VIDEO (SCRUBS AS YOU SCROLL MEDIA SECTION)
const scrollVideos = Array.from(
  document.querySelectorAll("video[data-scroll-video='true']")
);

scrollVideos.forEach((video) => {
  const src = video.dataset.videoSrc;
  if (src && !src.startsWith("YOUR-")) {
    video.src = src;
  }
});

if (scrollVideos.length) {
  const onScroll = () => {
    scrollVideos.forEach((video) => {
      if (!video.duration || isNaN(video.duration)) return;

      const rect = video.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      // Only react when the video is in view
      const visible =
        rect.bottom > vh * 0.1 && rect.top < vh * 0.9 && rect.height > 0;
      if (!visible) return;

      const start = vh * 0.9;
      const end = vh * 0.1 + rect.height;
      const center = rect.top + rect.height / 2;
      const progressRaw = 1 - (center - end) / (start - end);
      const progress = Math.min(1, Math.max(0, progressRaw));

      video.currentTime = progress * video.duration;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // Initial position
  window.addEventListener("load", () => {
    setTimeout(onScroll, 100);
  });
}

// INTERACTIVE HOVER TILT + LIGHT FOLLOW FOR CARDS
document.querySelectorAll(".interactive").forEach((card) => {
  const onMove = (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);

    const ry = (px - 0.5) * 8; // deg
    const rx = (0.5 - py) * 8; // deg
    card.style.setProperty("--rx", `${rx}deg`);
    card.style.setProperty("--ry", `${ry}deg`);
  };

  const onLeave = () => {
    card.style.setProperty("--rx", `0deg`);
    card.style.setProperty("--ry", `0deg`);
  };

  card.addEventListener("pointermove", onMove);
  card.addEventListener("pointerleave", onLeave);
});

// ACTIVITY WIDGETS (GITHUB + LEETCODE)
(() => {
  const root = document.querySelector(".activity");
  if (!root) return;

  const ghUser = root.getAttribute("data-github-user") || "";
  const lcUser = root.getAttribute("data-leetcode-user") || "";

  // Fill image URLs (public widgets). These are images/SVGs, so no API keys needed.
  // If you change usernames in HTML, these update automatically.
  const ghContrib = root.querySelector(
    "img[data-activity-img='github'][data-view='contrib']"
  );
  const ghStreak = root.querySelector(
    "img[data-activity-img='github'][data-view='streak']"
  );
  const lcCard = root.querySelector(
    "img[data-activity-img='leetcode'][data-view='card']"
  );
  const lcHeat = root.querySelector(
    "img[data-activity-img='leetcode'][data-view='heatmap']"
  );

  if (ghContrib && ghUser) {
    // Contribution chart as SVG
    ghContrib.src = `https://ghchart.rshah.org/${encodeURIComponent(
      "2ea44f"
    )}/${encodeURIComponent(ghUser)}`;
  }
  if (ghStreak && ghUser) {
    ghStreak.src = `https://github-readme-streak-stats.herokuapp.com/?user=${encodeURIComponent(
      ghUser
    )}&theme=github-dark&hide_border=true`;
  }
  if (lcCard && lcUser) {
    lcCard.src = `https://leetcard.jacoblin.cool/${encodeURIComponent(
      lcUser
    )}?theme=dark&border=0&font=Karla`;
  }
  if (lcHeat && lcUser) {
    lcHeat.src = `https://leetcode-stats-six.vercel.app/api?username=${encodeURIComponent(
      lcUser
    )}&theme=dark&hide_border=true`;
  }

  // Tab switching
  root.querySelectorAll(".activity-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const activity = btn.getAttribute("data-activity");
      const view = btn.getAttribute("data-view");
      if (!activity || !view) return;

      // toggle active tab inside same tablist
      const tablist = btn.closest(".activity-tabs");
      tablist?.querySelectorAll(".activity-tab").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });

      // show matching image, hide others for that activity
      root
        .querySelectorAll(`img[data-activity-img='${activity}']`)
        .forEach((img) => {
          const imgView = img.getAttribute("data-view");
          img.classList.toggle("is-hidden", imgView !== view);
        });
    });
  });
})();

