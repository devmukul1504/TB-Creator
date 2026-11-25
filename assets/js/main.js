import { siteConfig } from "./config.js?v=6.6";
import { initCalculator } from "./features/calculator.js";
import { initContent } from "./features/content.js";
import { initNavigation } from "./features/navigation.js";
import { initRegistration } from "./features/registration.js";
import { initSocialProof } from "./features/social-proof.js";

initNavigation();
initCalculator(siteConfig.calculator);
initContent(siteConfig.socialLinks, siteConfig.creatorEarningsBreakdown);
initRegistration(siteConfig.registration);
initSocialProof(siteConfig.socialProof);
