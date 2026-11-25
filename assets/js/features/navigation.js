export function initNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  if (toggle && nav) {
    const closeMenu = () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    };

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });

    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
  }

  initStickyHeader();
  initStickyMobileCTA();
}

function initStickyHeader() {
  const headerSticky = document.querySelector(".site-header-sticky");
  if (!headerSticky) return;

  const handleScroll = () => {
    const isScrolled = (window.scrollY || document.documentElement.scrollTop) > 8;
    headerSticky.classList.toggle("scrolled", isScrolled);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
}

function initStickyMobileCTA() {
  const bar = document.querySelector(".mobile-sticky-bar");
  const hero = document.querySelector(".hero");
  const applySection = document.querySelector("#apply");
  if (!bar) return;

  bar.removeAttribute("hidden");

  let heroVisible = true;
  let formVisible = false;

  const updateVisibility = () => {
    // Show bar only when hero is scrolled past AND the application form is not in view
    const shouldShow = !heroVisible && !formVisible;
    bar.classList.toggle("visible", shouldShow);
  };

  if ("IntersectionObserver" in window) {
    if (hero) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => {
          heroVisible = entry.isIntersecting;
          updateVisibility();
        },
        { threshold: 0.1 }
      );
      heroObserver.observe(hero);
    }

    if (applySection) {
      const formObserver = new IntersectionObserver(
        ([entry]) => {
          formVisible = entry.isIntersecting;
          updateVisibility();
        },
        { threshold: 0.15 }
      );
      formObserver.observe(applySection);
    }
  } else {
    // Scroll fallback
    window.addEventListener(
      "scroll",
      () => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        bar.classList.toggle("visible", scrollY > 450);
      },
      { passive: true }
    );
  }
}
