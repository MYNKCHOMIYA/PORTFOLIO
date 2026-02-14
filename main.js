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

      // 2. Fetch Events for Heatmap (multiple pages for better 60-day coverage)
      const allEvents = [];
      for (let page = 1; page <= 3; page++) {
        const eventsRes = await fetch(`https://api.github.com/users/${ghUser}/events?per_page=100&page=${page}`);
        if (!eventsRes.ok) throw new Error("GitHub Events Failed");
        const pageData = await eventsRes.json();
        if (pageData.length === 0) break;
        allEvents.push(...pageData);
      }
      const eventsData = allEvents;

      // Process Data for Heatmap
      const activityMap = {}; // "YYYY-MM-DD": { count: 0, repos: Set() }

      eventsData.forEach(event => {
        if (event.type === "PushEvent" || event.type === "CreateEvent" || event.type === "PullRequestEvent") {
          const date = event.created_at.split("T")[0];
          if (!activityMap[date]) {
            activityMap[date] = { count: 0, repos: new Set(), events: [] };
          }

          // Increment count: PushEvent = commits (size or commits.length), others = 1
          let weight = 1;
          if (event.type === "PushEvent" && event.payload) {
            const commits = event.payload.commits;
            const size = event.payload.size;
            weight = (commits && commits.length) || (typeof size === "number" ? size : 1) || 1;
          }
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
    if (!heatmapEl || !detailsEl) {
      console.error("GitHub heatmap elements not found!");
      return;
    }
    console.log("Rendering GitHub heatmap with activity data:", Object.keys(activityMap).length, "days with activity");

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

      // Determine Level (0-4) - GitHub-style frequency colors
      let level = 0;
      if (count >= 1) level = 1;
      if (count >= 2) level = 2;
      if (count >= 4) level = 3;
      if (count >= 7) level = 4;

      const dayEl = document.createElement("div");
      dayEl.className = "gh-day";
      dayEl.setAttribute("data-date", dateStr);
      dayEl.setAttribute("data-count", count);
      dayEl.setAttribute("data-level", level);

      // Apply inline background so frequency colors always show (CSS fallback)
      const levelColors = ["rgba(255,255,255,0.1)", "#0e4429", "#006d32", "#26a641", "#39d353"];
      dayEl.style.backgroundColor = levelColors[level];
      dayEl.style.background = levelColors[level];
      if (level === 4) {
        dayEl.style.boxShadow = "0 0 10px rgba(57, 211, 83, 0.5)";
      }

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

    console.log("GitHub heatmap rendered:", days.length, "squares created");
    // Log a sample square to verify attributes and styles
    const sampleSquare = heatmapEl.querySelector('.gh-day[data-level="1"], .gh-day[data-level="2"], .gh-day[data-level="3"], .gh-day[data-level="4"]');
    if (sampleSquare) {
      console.log("Sample active square:", {
        level: sampleSquare.getAttribute('data-level'),
        count: sampleSquare.getAttribute('data-count'),
        inlineStyle: sampleSquare.style.backgroundColor,
        computedStyle: window.getComputedStyle(sampleSquare).backgroundColor
      });
    }
  }

  // --- LEETCODE STATS (LeetCode-style interactive) ---
  async function fetchLeetCodeStats() {
    try {
      const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${lcUser}`);
      if (!res.ok) throw new Error("LeetCode API Error");
      const data = await res.json();

      if (data.status === "error") throw new Error(data.message);

      const totalQ = data.totalQuestions || 3837;
      const solved = data.totalSolved || 0;
      const easyS = data.easySolved || 0;
      const medS = data.mediumSolved || 0;
      const hardS = data.hardSolved || 0;
      const totalE = data.totalEasy || 925;
      const totalM = data.totalMedium || 2005;
      const totalH = data.totalHard || 907;

      const ratioEl = document.getElementById("lc-ratio");
      const attemptingEl = document.getElementById("lc-attempting");

      // SVG ring: Easy (teal), Medium (yellow), Hard (red) - stroke segments with dots
      let pEasy = 0, pMedium = 0, pHard = 0, pTotal = 0;
      if (solved > 0 && totalQ > 0) {
        const actualPct = (solved / totalQ) * 100;
        const minVisible = 18;
        const scaledTotal = Math.max(actualPct, minVisible);
        const easyFrac = easyS / solved;
        const medFrac = medS / solved;
        const hardFrac = hardS / solved;
        pEasy = scaledTotal * easyFrac;
        pMedium = scaledTotal * medFrac;
        pHard = scaledTotal * hardFrac;
        pTotal = scaledTotal;
      }

      renderLeetCodeRing(pEasy, pMedium, pHard, pTotal);

      // Animated ratio (solved/total)
      if (ratioEl) {
        animateRatio(ratioEl, 0, solved, 0, totalQ, 1400);
      }

      // Attempting (LeetCode shows problems in progress; API typically doesn't provide)
      if (attemptingEl) {
        attemptingEl.textContent = "0 Attempting";
      }

      // Staggered reveal for breakdown items
      document.querySelectorAll(".lc-stat-item").forEach(el => el.classList.add("lc-stat-item--visible"));

      // Bars with X/Total format and animated fill
      updateBar("easy", easyS, totalE, 0.3);
      updateBar("medium", medS, totalM, 0.5);
      updateBar("hard", hardS, totalH, 0.7);

    } catch (err) {
      console.error("LeetCode Fetch Error:", err);
    }
  }

  function renderLeetCodeRing(pEasy, pMedium, pHard, pTotal) {
    const circum = 2 * Math.PI * 42;
    const easyLen = (pEasy / 100) * circum;
    const medLen = (pMedium / 100) * circum;
    const hardLen = (pHard / 100) * circum;

    const segEasy = document.getElementById("lc-seg-easy");
    const segMed = document.getElementById("lc-seg-medium");
    const segHard = document.getElementById("lc-seg-hard");

    if (segEasy) {
      segEasy.style.strokeDasharray = `${easyLen} ${circum + 100}`;
      segEasy.style.strokeDashoffset = "0";
    }
    if (segMed) {
      segMed.style.strokeDasharray = `${medLen} ${circum + 100}`;
      segMed.style.strokeDashoffset = `-${easyLen}`;
    }
    if (segHard) {
      segHard.style.strokeDasharray = `${hardLen} ${circum + 100}`;
      segHard.style.strokeDashoffset = `-${easyLen + medLen}`;
    }
  }

  function updateBar(difficulty, solved, total, delay = 0) {
    const valEl = document.getElementById(`lc-${difficulty}-val`);
    const barEl = document.getElementById(`lc-${difficulty}-bar`);

    if (valEl) {
      valEl.textContent = `${solved}/${total}`;
      valEl.style.opacity = "0";
      valEl.offsetHeight; // reflow
      valEl.style.transition = "opacity 0.4s ease-out";
      setTimeout(() => { valEl.style.opacity = "1"; }, 400 + delay * 400);
    }
    if (barEl) {
      const pct = total > 0 ? (solved / total) * 100 : 0;
      setTimeout(() => {
        barEl.style.width = `${pct}%`;
      }, 150 + delay * 300);
    }
  }

  function animateRatio(el, startSolved, endSolved, startTotal, endTotal, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const t = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2); // ease-out quad
      const s = Math.floor(eased * (endSolved - startSolved) + startSolved);
      const tot = Math.floor(eased * (endTotal - startTotal) + startTotal);
      el.textContent = `${s}/${tot}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
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