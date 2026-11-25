/* Public site settings. Never put private keys or secrets in this file. */
export const siteConfig = {
  /* Official Testbook social channel links (used in Hero & across the site) */
  socialLinks: {
    youtube: "https://www.youtube.com/@Testbook",
    telegram: "https://t.me/testbookcom",
    instagram: "https://www.instagram.com/testbookdotcom/",
    whatsapp: "https://wa.me/918655903038",
  },
  registration: {
    googleSheetWebAppUrl: "https://script.google.com/macros/s/AKfycbzs0wkL5PPF1-R2chSVwQ3ZBhJvzFqluQEX443C0OVaSLJl5DnVdFyNwTBNWFbt7EuohQ/exec",
  },
  calculator: {
    defaultCommissionPercent: 20,
    defaultEligiblePurchases: 1000,
    defaultAveragePurchaseValue: 699,
  },
  socialProof: {
    statistics: [
      { value: "₹5 Cr+", label: "Creator earnings*" },
      { value: "10,000+", label: "Creators*" },
      { value: "5 Lakh+", label: "Students reached*" },
      { value: "10+", label: "Exam categories*" },
    ],
  },
  /* Historical ₹5 Cr+ creator revenue disbursed breakdown across platforms */
  creatorEarningsBreakdown: {
    youtube: {
      amount: "₹2.65 Cr+",
      type: "High-reach Creators",
      channel: "4,500+ Active Creators · Marathon lectures & description links",
    },
    telegram: {
      amount: "₹1.55 Cr+",
      type: "Community Creators",
      channel: "3,800+ Study Channels · Daily quiz alerts & test pass links",
    },
    instagram: {
      amount: "₹95 Lakh+",
      type: "Creators & Channel Hosts",
      channel: "1,700+ Active Creators · Bio links, reels & batch alerts",
    },
  },
};
