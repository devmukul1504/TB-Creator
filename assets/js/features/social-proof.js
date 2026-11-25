export function initSocialProof(config) {
  if (config?.statistics) {
    applyStatistics(config.statistics);
  }
  if (config?.testimonials && Array.isArray(config.testimonials)) {
    renderTestimonials(config.testimonials);
  }
  initStatCounters();
}

function applyStatistics(stats) {
  if (!stats) return;

  const mapping = [
    {
      key: "earnings",
      valSelector: "[data-stat-card='earnings'] .stat-value, .stat-card-hero .stat-value",
      lblSelector: "[data-stat-card='earnings'] .stat-hero-badge span, .stat-card-hero .stat-hero-badge span"
    },
    {
      key: "creators",
      valSelector: "[data-stat-card='creators'] .stat-value, .stat-card-left .stat-value",
      lblSelector: "[data-stat-card='creators'] .stat-label-text, .stat-card-left .stat-label-text"
    },
    {
      key: "students",
      valSelector: "[data-stat-card='students'] .stat-value, .stat-col-right .stat-mini-card:first-child .stat-value",
      lblSelector: "[data-stat-card='students'] .stat-mini-label, .stat-col-right .stat-mini-card:first-child .stat-mini-label"
    },
    {
      key: "categories",
      valSelector: "[data-stat-card='categories'] .stat-value, .stat-col-right .stat-mini-card:last-child .stat-value",
      lblSelector: "[data-stat-card='categories'] .stat-mini-label, .stat-col-right .stat-mini-card:last-child .stat-mini-label"
    }
  ];

  if (Array.isArray(stats)) {
    stats.forEach((item, index) => {
      if (!item) return;
      const val = typeof item === "object" ? item.value : item;
      const lbl = typeof item === "object" ? item.label : null;
      if (val === undefined || val === null) return;

      let targetSlot = null;
      if (item.key) {
        targetSlot = mapping.find(m => m.key === item.key);
      } else {
        const text = `${item.label || ""} ${item.value || ""}`.toLowerCase();
        if (/\b(earning|earnings|crore|cr\+?)\b|₹/.test(text)) {
          targetSlot = mapping[0];
        } else if (/\b(creator|creators)\b/.test(text)) {
          targetSlot = mapping[1];
        } else if (/\b(student|students|reach|learners)\b/.test(text)) {
          targetSlot = mapping[2];
        } else if (/\b(exam|exams|category|categories)\b/.test(text)) {
          targetSlot = mapping[3];
        }
      }

      if (!targetSlot && mapping[index]) {
        targetSlot = mapping[index];
      }

      if (targetSlot) {
        const valEl = document.querySelector(targetSlot.valSelector);
        if (valEl) {
          valEl.dataset.statTarget = String(val).trim();
          valEl.textContent = String(val).trim();
        }
        if (lbl) {
          const lblEl = document.querySelector(targetSlot.lblSelector);
          if (lblEl) {
            lblEl.textContent = String(lbl).replace(/\*+$/, "").trim();
          }
        }
      }
    });
  } else if (typeof stats === "object") {
    Object.entries(stats).forEach(([k, item]) => {
      const lower = k.toLowerCase();
      let targetSlot = mapping.find(m => m.key === lower);
      if (!targetSlot) {
        if (/\b(earning|earnings|crore|cr\+?)\b|₹/.test(lower)) targetSlot = mapping[0];
        else if (/\b(creator|creators)\b/.test(lower)) targetSlot = mapping[1];
        else if (/\b(student|students|reach)\b/.test(lower)) targetSlot = mapping[2];
        else if (/\b(exam|exams|category|categories)\b/.test(lower)) targetSlot = mapping[3];
      }
      if (targetSlot) {
        const val = typeof item === "object" ? item.value : item;
        const valEl = document.querySelector(targetSlot.valSelector);
        if (valEl && val) {
          valEl.dataset.statTarget = String(val).trim();
          valEl.textContent = String(val).trim();
        }
      }
    });
  }
}

function renderTestimonials(testimonials) {
  const track = document.querySelector("[data-proof-track]") || document.querySelector(".proof-slider-track");
  if (!track || !testimonials.length) return;

  track.innerHTML = testimonials
    .filter(item => item && item.image)
    .map(item => {
      const hasOverlay = Boolean(item.name || item.quote || item.badge);
      const hasEarning = Boolean(item.earning);

      const earningPillHtml = hasEarning
        ? `
          <div class="proof-earning-pill" aria-label="Monthly earning ${escapeAttr(item.earning)}">
            <div class="earning-pill-top">
              <span class="earning-pill-dot" aria-hidden="true"></span>
              <span class="earning-pill-label">${escapeHtml(item.earningLabel || "Monthly Payout")}</span>
            </div>
            <div class="earning-pill-main">
              <strong class="earning-pill-val">${escapeHtml(item.earning)}</strong>
              ${item.growth ? `<span class="earning-pill-growth" title="Monthly growth rate">↑ ${escapeHtml(item.growth)}</span>` : ""}
            </div>
          </div>
        `
        : "";

      const overlayHtml = hasOverlay
        ? `
          <div class="proof-card-overlay">
            ${item.badge ? `<span class="proof-badge">${escapeHtml(item.badge)}</span>` : ""}
            ${item.name ? `<strong>${escapeHtml(item.name)}</strong>` : ""}
            ${item.quote ? `<p>${escapeHtml(item.quote)}</p>` : ""}
          </div>
        `
        : "";

      return `
        <article class="proof-image-card">
          <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name ? `Creator Testimonial - ${item.name}` : "Creator Testimonial")}" loading="lazy">
          ${earningPillHtml}
          ${overlayHtml}
        </article>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function initStatCounters() {
  const root = document.querySelector("[data-stat-items]");
  if (!root) return;

  const statValues = root.querySelectorAll(".stat-value");
  if (!statValues.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const items = Array.from(statValues).map(el => {
    const rawVal = el.dataset.statTarget || el.textContent;
    const parsed = parseStat(rawVal);
    if (!prefersReducedMotion && parsed) {
      el.textContent = `${parsed.prefix}0${parsed.suffix}`;
    }
    return { el, parsed, rawVal };
  });

  if (prefersReducedMotion) return;

  if ("IntersectionObserver" in window) {
    let animated = false;
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && !animated) {
          animated = true;
          observer.disconnect();
          items.forEach(({ el, parsed }, i) => {
            if (parsed) {
              setTimeout(() => {
                animateCounter(el, parsed, 1300);
              }, i * 90);
            }
          });
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(root);
  } else {
    items.forEach(({ el, parsed }) => {
      if (parsed) animateCounter(el, parsed, 1200);
    });
  }
}

function parseStat(val) {
  const match = String(val).trim().match(/^([^\d]*)([\d,.]+)(.*)$/);
  if (!match) return null;
  const rawNum = parseFloat(match[2].replace(/,/g, ""));
  const decimals = (match[2].split(".")[1] || "").length;
  return { prefix: match[1], target: rawNum, decimals, suffix: match[3] };
}

function formatNumber(num, decimals) {
  if (decimals > 0) {
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return Math.round(num).toLocaleString("en-IN");
}

function animateCounter(el, statInfo, duration = 1400) {
  const { prefix, target, decimals, suffix } = statInfo;
  const startTime = performance.now();

  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  const step = now => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = eased * target;

    el.textContent = `${prefix}${formatNumber(current, decimals)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = `${prefix}${formatNumber(target, decimals)}${suffix}`;
    }
  };

  requestAnimationFrame(step);
}
