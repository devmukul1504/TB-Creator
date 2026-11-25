export function initContent(socialLinks, creatorEarningsBreakdown) {
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  if (socialLinks) {
    initSocialLinks(socialLinks);
  }

  if (creatorEarningsBreakdown) {
    initCreatorEarnings(creatorEarningsBreakdown);
  }
}

function initCreatorEarnings(breakdown) {
  const map = {
    youtube: {
      amount: '[data-earning-yt]',
      type: '[data-earning-yt-type]',
      channel: '[data-earning-yt-channel]',
      note: '[data-earning-yt-note]',
    },
    telegram: {
      amount: '[data-earning-tg]',
      type: '[data-earning-tg-type]',
      channel: '[data-earning-tg-channel]',
      note: '[data-earning-tg-note]',
    },
    instagram: {
      amount: '[data-earning-ig]',
      type: '[data-earning-ig-type]',
      channel: '[data-earning-ig-channel]',
      note: '[data-earning-ig-note]',
    },
  };

  Object.entries(breakdown).forEach(([platform, data]) => {
    const selectors = map[platform];
    if (!selectors || !data) return;
    if (data.amount) {
      const el = document.querySelector(selectors.amount);
      if (el) el.textContent = data.amount;
    }
    if (data.type) {
      const el = document.querySelector(selectors.type);
      if (el) el.textContent = data.type;
    }
    if (data.channel) {
      const el = document.querySelector(selectors.channel);
      if (el) el.textContent = data.channel;
    }
    if (selectors.note) {
      const el = document.querySelector(selectors.note);
      if (el) {
        if (data.note) {
          el.textContent = data.note;
        } else {
          el.remove();
        }
      }
    }
  });
}

function initSocialLinks(links) {
  Object.entries(links).forEach(([platform, url]) => {
    if (!url) return;
    const key = String(platform).trim().toLowerCase();
    const elements = document.querySelectorAll(`[data-social-link="${key}"]`);
    elements.forEach(el => {
      el.href = url;
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });
  });
}
