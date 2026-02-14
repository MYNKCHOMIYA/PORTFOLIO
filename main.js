// Clean portfolio JavaScript - Activity widgets properly configured

// PWA Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => { });
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
// Cursor Effect
(() => {
  const cursor = document.getElementById("cursor-spotlight");
  if (!cursor) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let ticking = false;

  const updateCursor = () => {
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ticking = false;
  };

  window.addEventListener(
    "pointermove",
    (e) => {
      x = e.clientX; // No need to account for scroll because position: fixed
      y = e.clientY;
      document.body.classList.add("is-pointer");

      if (!ticking) {
        window.requestAnimationFrame(updateCursor);
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("is-pointer");
  });

  // Initial set
  updateCursor();
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
// ============= ACTIVITY WIDGETS (DYNAMIC) =============
(() => {
  const root = document.querySelector(".activity");
  if (!root) return;

  const ghUser = root.getAttribute("data-github-user") || "MYNKCHOMIYA";
  const lcUser = root.getAttribute("data-leetcode-user") || "MYNK_CHOMIYA";

  // --- GITHUB STATS ---
  async function fetchGitHubStats() {
    try {
      // 1. User Profile Stats
      const profileRes = await fetch(`https://api.github.com/users/${ghUser}`);
      if (!profileRes.ok) throw new Error("GitHub User Not Found");
      const profileData = await profileRes.json();

      const repoEl = document.getElementById("gh-repos");
      const followerEl = document.getElementById("gh-followers");

      if (repoEl) repoEl.textContent = profileData.public_repos;
      if (followerEl) followerEl.textContent = profileData.followers;

      // 2. Fetch Events for Heatmap (Last ~300 events)
      const eventsRes = await fetch(`https://api.github.com/users/${ghUser}/events?per_page=100`);
      if (!eventsRes.ok) throw new Error("GitHub Events Failed");
      const eventsData = await eventsRes.json();

      // Process Data for Heatmap
      const activityMap = {}; // "YYYY-MM-DD": { count: 0, repos: Set() }

      eventsData.forEach(event => {
        if (event.type === "PushEvent" || event.type === "CreateEvent" || event.type === "PullRequestEvent") {
          const date = event.created_at.split("T")[0];
          if (!activityMap[date]) {
            activityMap[date] = { count: 0, repos: new Set(), events: [] };
          }

          // Increment count (weight Pushes more?)
          const weight = event.type === "PushEvent" ? event.payload.size : 1;
          activityMap[date].count += weight;
          activityMap[date].repos.add(event.repo.name);
          activityMap[date].events.push(event);
        }
      });

      renderHeatmap(activityMap);

    } catch (err) {
      console.error("GitHub Fetch Error:", err);
      const heatmapEl = document.getElementById("gh-heatmap");
      if (heatmapEl) heatmapEl.innerHTML = `<div class="timeline-loader">Failed to load GitHub activity.</div>`;
    }
  }

  function renderHeatmap(activityMap) {
    const heatmapEl = document.getElementById("gh-heatmap");
    const detailsEl = document.getElementById("gh-details");
    if (!heatmapEl || !detailsEl) return;

    heatmapEl.innerHTML = "";

    // Generate last 60 days
    const today = new Date();
    const days = [];
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }

    days.forEach(dateStr => {
      const dayData = activityMap[dateStr] || { count: 0, repos: new Set(), events: [] };
      const count = dayData.count;

      // Determine Level (0-4)
      let level = 0;
      if (count > 0) level = 1;
      if (count > 3) level = 2;
      if (count > 6) level = 3;
      if (count > 10) level = 4;

      const dayEl = document.createElement("div");
      dayEl.className = "gh-day";
      dayEl.setAttribute("data-date", dateStr);
      dayEl.setAttribute("data-count", count);
      dayEl.setAttribute("data-level", level);

      // Click Interaction
      dayEl.addEventListener("click", () => {
        // Highlight selected day
        document.querySelectorAll(".gh-day").forEach(d => d.style.border = "none");
        dayEl.style.border = "1px solid #fff";

        // Show details
        if (count === 0) {
          detailsEl.innerHTML = `<p class="gh-details-placeholder">No public activity on ${dateStr}.</p>`;
        } else {
          const repoList = Array.from(dayData.repos).map(repo => {
            return `
              <a href="https://github.com/${repo}" target="_blank" class="gh-repo-item">
                <span class="gh-repo-name">${repo}</span>
                <span class="gh-repo-desc">${dayData.events.filter(e => e.repo.name === repo).length} actions</span>
              </a>
            `;
          }).join("");

          detailsEl.innerHTML = `
            <p class="widget-subtitle" style="margin-bottom:0.5rem; color:#fff;">Activity on ${dateStr}</p>
            <div style="max-height:100px; overflow-y:auto; padding-right:5px;">
              ${repoList}
            </div>
          `;
        }
      });

      heatmapEl.appendChild(dayEl);
    });
  }

  // --- LEETCODE STATS ---
  async function fetchLeetCodeStats() {
    try {
      // Using a proxy because LeetCode does not have a public CORS-enabled API
      const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${lcUser}`);
      if (!res.ok) throw new Error("LeetCode API Error");
      const data = await res.json();

      if (data.status === "error") throw new Error(data.message);

      // Update Total
      const totalEl = document.getElementById("lc-total");
      const circleEl = document.getElementById("lc-circle");

      if (totalEl) {
        animateValue(totalEl, 0, data.totalSolved, 1500);
      }

      // Update Circle Ring (Assuming ~2500 total problems on site for calculation, or just use percentage of arbitrary max)
      // Actually data.totalQuestions is available
      if (circleEl && data.totalQuestions) {
        const percentage = (data.totalSolved / data.totalQuestions) * 100;
        // set timeout to trigger CSS animation
        setTimeout(() => {
          circleEl.style.setProperty("--p", Math.round(percentage));
        }, 100);
      }

      // Update Bars
      updateBar("easy", data.easySolved, data.totalEasy);
      updateBar("medium", data.mediumSolved, data.totalMedium);
      updateBar("hard", data.hardSolved, data.totalHard);

    } catch (err) {
      console.error("LeetCode Fetch Error:", err);
      // Fallback or error state
    }
  }

  function updateBar(difficulty, solved, total) {
    const valEl = document.getElementById(`lc-${difficulty}-val`);
    const barEl = document.getElementById(`lc-${difficulty}-bar`);

    if (valEl) valEl.textContent = solved;
    if (barEl) {
      const pct = (solved / total) * 100;
      setTimeout(() => {
        barEl.style.width = `${pct}%`;
      }, 300);
    }
  }

  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  fetchGitHubStats();
  fetchLeetCodeStats();
})();

// ============= TYPING EFFECT =============
(() => {
  const typingText = document.getElementById("typing-text");
  if (!typingText) return;

  const roles = [
    "Data Scientist",
    "System Programmer",
    "Full Stack Developer",
    "Problem Solver"
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  function type() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
      typingText.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50; // Deleting speed
    } else {
      typingText.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 100; // Typing speed
    }

    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      typeSpeed = 500; // Pause before typing next
    }

    setTimeout(type, typeSpeed);
  }

  // Start
  setTimeout(type, 1000);
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