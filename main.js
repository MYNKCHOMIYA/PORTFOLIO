/* ============================================================
   PORTFOLIO SCRIPTS — TABLE OF CONTENTS
   ============================================================
   1.  SERVICE WORKER CLEANUP
   2.  MOBILE NAVIGATION
   3.  FOOTER YEAR
   4.  CURSOR SPOTLIGHT EFFECT
   5.  SCROLL REVEAL (IntersectionObserver)
   6.  ACTIVITY WIDGETS (GitHub + LeetCode)
       6a. GitHub Stats + Heatmap
       6b. LeetCode Stats + Ring
   7.  TYPING EFFECT
   8.  EXPERIENCE TIMELINE + CERTIFICATE MODAL
   9.  CARD PARALLAX TILT
   10. RIPPLE CLICK EFFECT
   11. PROJECT DETAIL MODAL
   12. AMBIENT FLOATING PARTICLES
   13. CURSOR SCROLL COLOR SHIFT
   14. STAGGERED SCROLL REVEAL
   ============================================================ */


/* ═══════════════════════════════════════════════════════════════
   1. SERVICE WORKER CLEANUP
   ═══════════════════════════════════════════════════════════════ */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}


/* ═══════════════════════════════════════════════════════════════
   2. MOBILE NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
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


/* ═══════════════════════════════════════════════════════════════
   3. FOOTER YEAR
   ═══════════════════════════════════════════════════════════════ */
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


/* ═══════════════════════════════════════════════════════════════
   4. CURSOR SPOTLIGHT EFFECT
   Follows the mouse with a radial glow via translate3d (GPU).
   Hidden on touch-only devices via CSS.
   ═══════════════════════════════════════════════════════════════ */
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
      x = e.clientX;
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

  updateCursor();
})();


/* ═══════════════════════════════════════════════════════════════
   5. SCROLL REVEAL (IntersectionObserver)
   Elements with class "reveal" fade in when 15% visible.
   Observer unobserves after first reveal for performance.
   ═══════════════════════════════════════════════════════════════ */
{
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
      { threshold: 0.15 }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    revealElements.forEach((el) => el.classList.add("reveal--visible"));
  }
}


/* ═══════════════════════════════════════════════════════════════
   6. ACTIVITY WIDGETS (GitHub + LeetCode)
   Fetches live data from GitHub API and LeetCode Stats API,
   then renders an interactive heatmap and progress ring.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const root = document.querySelector(".activity");
  if (!root) return;

  const ghUser = root.getAttribute("data-github-user") || "MYNKCHOMIYA";
  const lcUser = root.getAttribute("data-leetcode-user") || "MYNK_CHOMIYA";


  /* ─── 6a. GitHub Stats + Heatmap ─── */

  async function fetchGitHubStats() {
    try {
      // Fetch user profile (repos, followers)
      const profileRes = await fetch(`https://api.github.com/users/${ghUser}`);
      if (!profileRes.ok) throw new Error("GitHub User Not Found");
      const profileData = await profileRes.json();

      const repoEl = document.getElementById("gh-repos");
      const followerEl = document.getElementById("gh-followers");

      if (repoEl) repoEl.textContent = profileData.public_repos;
      if (followerEl) followerEl.textContent = profileData.followers;

      // Fetch events for heatmap (up to 3 pages for 60-day coverage)
      const allEvents = [];
      for (let page = 1; page <= 3; page++) {
        const eventsRes = await fetch(
          `https://api.github.com/users/${ghUser}/events?per_page=100&page=${page}`
        );
        if (!eventsRes.ok) throw new Error("GitHub Events Failed");
        const pageData = await eventsRes.json();
        if (pageData.length === 0) break;
        allEvents.push(...pageData);
      }

      // Build activity map: { "YYYY-MM-DD": { count, repos, events } }
      const activityMap = {};
      allEvents.forEach((event) => {
        if (
          event.type === "PushEvent" ||
          event.type === "CreateEvent" ||
          event.type === "PullRequestEvent"
        ) {
          const date = event.created_at.split("T")[0];
          if (!activityMap[date]) {
            activityMap[date] = { count: 0, repos: new Set(), events: [] };
          }

          // Weight: PushEvent counts commits, others count as 1
          let weight = 1;
          if (event.type === "PushEvent" && event.payload) {
            const commits = event.payload.commits;
            const size = event.payload.size;
            weight =
              (commits && commits.length) ||
              (typeof size === "number" ? size : 1) ||
              1;
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
      if (heatmapEl)
        heatmapEl.innerHTML = `<div class="timeline-loader">Failed to load GitHub activity.</div>`;
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

    // GitHub-style level colors
    const levelColors = [
      "rgba(255,255,255,0.1)",
      "#0e4429",
      "#006d32",
      "#26a641",
      "#39d353",
    ];

    days.forEach((dateStr) => {
      const dayData = activityMap[dateStr] || {
        count: 0,
        repos: new Set(),
        events: [],
      };
      const count = dayData.count;

      // Determine level (0–4)
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

      // Inline colors as fallback
      dayEl.style.backgroundColor = levelColors[level];
      dayEl.style.background = levelColors[level];
      if (level === 4) {
        dayEl.style.boxShadow = "0 0 10px rgba(57, 211, 83, 0.5)";
      }

      // Click → show day details
      dayEl.addEventListener("click", () => {
        document
          .querySelectorAll(".gh-day")
          .forEach((d) => (d.style.border = "none"));
        dayEl.style.border = "1px solid #fff";

        if (count === 0) {
          detailsEl.innerHTML = `<p class="gh-details-placeholder">No public activity on ${dateStr}.</p>`;
        } else {
          const repoList = Array.from(dayData.repos)
            .map(
              (repo) => `
              <a href="https://github.com/${repo}" target="_blank" class="gh-repo-item">
                <span class="gh-repo-name">${repo}</span>
                <span class="gh-repo-desc">${dayData.events.filter((e) => e.repo.name === repo).length} actions</span>
              </a>`
            )
            .join("");

          detailsEl.innerHTML = `
            <p class="widget-subtitle" style="margin-bottom:0.5rem; color:#fff;">Activity on ${dateStr}</p>
            <div style="max-height:100px; overflow-y:auto; padding-right:5px;">
              ${repoList}
            </div>`;
        }
      });

      heatmapEl.appendChild(dayEl);
    });
  }


  /* ─── 6b. LeetCode Stats + Ring ─── */

  async function fetchLeetCodeStats() {
    try {
      const res = await fetch(
        `https://leetcode-stats-api.herokuapp.com/${lcUser}`
      );
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

      // Calculate ring segment percentages
      let pEasy = 0,
        pMedium = 0,
        pHard = 0,
        pTotal = 0;
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

      // Animated ratio counter
      if (ratioEl) {
        animateRatio(ratioEl, 0, solved, 0, totalQ, 1400);
      }

      if (attemptingEl) {
        attemptingEl.textContent = "0 Attempting";
      }

      // Staggered reveal for breakdown bars
      document
        .querySelectorAll(".lc-stat-item")
        .forEach((el) => el.classList.add("lc-stat-item--visible"));

      updateBar("easy", easyS, totalE, 0.3);
      updateBar("medium", medS, totalM, 0.5);
      updateBar("hard", hardS, totalH, 0.7);
    } catch (err) {
      console.error("LeetCode Fetch Error:", err);
    }
  }

  function renderLeetCodeRing(pEasy, pMedium, pHard, pTotal) {
    const circum = 2 * Math.PI * 42;
    const easyLen = Math.max(0, (pEasy / 100) * circum);
    const medLen = Math.max(0, (pMedium / 100) * circum);
    const hardLen = Math.max(0, (pHard / 100) * circum);

    const segEasy = document.getElementById("lc-seg-easy");
    const segMed = document.getElementById("lc-seg-medium");
    const segHard = document.getElementById("lc-seg-hard");

    if (segEasy) {
      if (easyLen <= 0) {
        segEasy.style.opacity = "0";
      } else {
        segEasy.style.opacity = "1";
        segEasy.style.strokeDasharray = `${easyLen} ${circum + 100}`;
        segEasy.style.strokeDashoffset = "0";
      }
    }
    if (segMed) {
      if (medLen <= 0) {
        segMed.style.opacity = "0";
      } else {
        segMed.style.opacity = "1";
        segMed.style.strokeDasharray = `${medLen} ${circum + 100}`;
        segMed.style.strokeDashoffset = `-${easyLen}`;
      }
    }
    if (segHard) {
      if (hardLen <= 0) {
        segHard.style.opacity = "0";
      } else {
        segHard.style.opacity = "1";
        segHard.style.strokeDasharray = `${hardLen} ${circum + 100}`;
        segHard.style.strokeDashoffset = `-${easyLen + medLen}`;
      }
    }
  }

  function updateBar(difficulty, solved, total, delay = 0) {
    const valEl = document.getElementById(`lc-${difficulty}-val`);
    const barEl = document.getElementById(`lc-${difficulty}-bar`);

    if (valEl) {
      valEl.textContent = `${solved}/${total}`;
      valEl.style.opacity = "0";
      valEl.offsetHeight; // force reflow
      valEl.style.transition = "opacity 0.4s ease-out";
      setTimeout(() => {
        valEl.style.opacity = "1";
      }, 400 + delay * 400);
    }
    if (barEl) {
      const pct = total > 0 ? (solved / total) * 100 : 0;
      setTimeout(() => {
        barEl.style.width = `${pct}%`;
      }, 150 + delay * 300);
    }
  }

  function animateRatio(
    el,
    startSolved,
    endSolved,
    startTotal,
    endTotal,
    duration
  ) {
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

  // Kick off both fetches
  fetchGitHubStats();
  fetchLeetCodeStats();
})();


/* ═══════════════════════════════════════════════════════════════
   7. TYPING EFFECT
   Cycles through role titles with a typewriter animation.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const typingText = document.getElementById("typing-text");
  if (!typingText) return;

  const roles = [
    "Data Scientist",
    "System Programmer",
    "Full Stack Developer",
    "Problem Solver",
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
      typeSpeed = 50;
    } else {
      typingText.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 100;
    }

    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      typeSpeed = 2000; // pause at end
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      typeSpeed = 500; // pause before next word
    }

    setTimeout(type, typeSpeed);
  }

  setTimeout(type, 1000);
})();


/* ═══════════════════════════════════════════════════════════════
   8. EXPERIENCE TIMELINE + CERTIFICATE MODAL
   - Timeline line animates in via IntersectionObserver.
   - Certificate cards open a detail modal with image preview.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  // Timeline reveal
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

  // Certificate modal
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


/* ═══════════════════════════════════════════════════════════════
   9. CARD PARALLAX TILT
   Adds a subtle 3D tilt on mouse hover using requestAnimationFrame.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const tiltElements = document.querySelectorAll(
    ".card, .activity-card, .tweets-card, .projects-dash-card"
  );
  if (!tiltElements.length) return;

  let ticking = false;

  tiltElements.forEach((el) => {
    el.addEventListener(
      "mousemove",
      (e) => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateY = ((x - centerX) / centerX) * 5;
          const rotateX = ((centerY - y) / centerY) * 5;
          el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.02)`;
          ticking = false;
        });
      },
      { passive: true }
    );

    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
})();


/* ═══════════════════════════════════════════════════════════════
   10. RIPPLE CLICK EFFECT
   Creates expanding ripple on click for interactive elements.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const rippleTargets = document.querySelectorAll(
    ".card, .activity-card, .tour-card, .cert-card, .btn, .hero__badge, .tweets-card, .projects-dash-card, .project-mini, .tweet-embed"
  );

  rippleTargets.forEach((el) => {
    el.addEventListener("click", (e) => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });
})();


/* ═══════════════════════════════════════════════════════════════
   11. PROJECT DETAIL MODAL
   Opens a modal overlay with project details when a project
   mini-card is clicked in the dashboard.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const modal = document.getElementById("project-modal");
  if (!modal) return;

  const titleEl = document.getElementById("project-modal-title");
  const bodyEl = document.getElementById("project-modal-body");
  const tagsEl = document.getElementById("project-modal-tags");
  const linkEl = document.getElementById("project-modal-link");
  const closeBtn = modal.querySelector(".dash-modal__close");
  const backdrop = modal.querySelector(".dash-modal__backdrop");

  function openProjectModal(card) {
    const title = card.getAttribute("data-title") || "";
    const desc = card.getAttribute("data-desc") || "";
    const tech = card.getAttribute("data-tech") || "";
    const url = card.getAttribute("data-url") || "#";

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = desc;
    if (tagsEl) {
      tagsEl.innerHTML = tech
        .split(",")
        .filter(Boolean)
        .map((t) => `<span class="dash-modal__tag">${t.trim()}</span>`)
        .join("");
    }
    if (linkEl) {
      linkEl.href = url;
      linkEl.style.display = url && url !== "#" ? "inline-flex" : "none";
    }

    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeProjectModal() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".project-mini[data-title]").forEach((card) => {
    card.addEventListener("click", () => openProjectModal(card));
  });

  closeBtn?.addEventListener("click", closeProjectModal);
  backdrop?.addEventListener("click", closeProjectModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeProjectModal();
    }
  });
})();


/* ═══════════════════════════════════════════════════════════════
   12. AMBIENT FLOATING PARTICLES
   Canvas-based particle system using requestAnimationFrame.
   Respects prefers-reduced-motion for accessibility.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) {
    canvas.style.display = "none";
    return;
  }

  const ctx = canvas.getContext("2d");
  let w, h;
  const particles = [];
  const PARTICLE_COUNT = 35;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const PALETTE = [
    "255, 62, 165",   // pink
    "55, 183, 255",   // blue
    "255, 211, 79",   // gold
    "200, 200, 255",  // white-ish
  ];

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w;
      this.y = h + Math.random() * 100;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedY = -(Math.random() * 0.4 + 0.1);
      this.speedX = (Math.random() - 0.5) * 0.2;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.fadeDir = Math.random() > 0.5 ? 0.002 : -0.002;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.opacity += this.fadeDir;
      if (this.opacity <= 0.05 || this.opacity >= 0.6) this.fadeDir *= -1;
      if (this.y < -20 || this.x < -20 || this.x > w + 20) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = new Particle();
    p.y = Math.random() * h; // spread across screen initially
    particles.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();


/* ═══════════════════════════════════════════════════════════════
   13. CURSOR SCROLL COLOR SHIFT
   Shifts the cursor spotlight hue from blue → pink as
   the user scrolls down the page.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const cursor = document.getElementById("cursor-spotlight");
  if (!cursor) return;

  function updateCursorColor() {
    const scrollPct =
      window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    const hue = 210 + scrollPct * 120;
    cursor.style.background = `radial-gradient(circle at 50% 50%, hsla(${hue}, 80%, 65%, 0.12), transparent 65%)`;
  }

  window.addEventListener("scroll", updateCursorColor, { passive: true });
  updateCursorColor();
})();


/* ═══════════════════════════════════════════════════════════════
   14. STAGGERED SCROLL REVEAL
   Adds incremental transition-delay to sibling .reveal
   elements inside grids, creating a cascade effect.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const groups = document.querySelectorAll(
    ".card-grid, .dashboard-grid, .tour-grid, .cert-grid, .activity-grid, .hero__badges"
  );

  groups.forEach((group) => {
    const reveals = group.querySelectorAll(".reveal");
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${i * 80}ms`;
    });
  });
})();