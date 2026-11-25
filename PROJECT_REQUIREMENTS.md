# Testbook Creator Partner Landing Page

## Product goal

Invite creators and education-focused influencers to collaborate with Testbook, promote relevant exam-preparation resources to their communities and apply to join the Creator Partner Program.

## Reference and decisions

`Testbook_Creator_Landing_Page_PRD_v2.docx` remains the supplied product and design reference. Its Google Forms-only registration flow conflicts with the user's later direction for an on-page form, Google Sheets web app endpoint, duplicate checks and `Code.gs`; the implementation follows that later direction. The PRD's anti-fabrication guidance still applies.

The creator earnings cards show an estimated commission scenario linked to the calculator for YouTube, Instagram and Telegram profiles. They do not represent individual creator payouts. Do not invent creator identities or payment records.

## V1 scope

- Responsive one-page marketing site with a premium, light, editorial look and restrained cyan accents.
- Hero focused on the creator opportunity and prominent application actions.
- Partnership benefits, intended creator audiences and four-step onboarding.
- Clearly illustrative coupon sample and adjustable earnings calculator.
- FAQ and final application CTA.
- Compact application dialog connected to a Google Apps Script web app that writes to a private Google Sheet.
- Central theme variables in `assets/css/tokens.css`; separate JavaScript feature modules under `assets/js/features/`.
- Static Vercel deployment for the website; Google Apps Script handles only the requested application intake.

## Application fields

Required: full name, email, mobile number, primary platform, profile/channel URL, city, state/UT, exam focus and consent.

Optional: other platforms (multi-select) and audience size.

Email and mobile are checked against existing applications on blur and again before submission. `Code.gs` checks uniqueness again under a script lock immediately before appending the row.

## Google Apps Script contract

- Frontend endpoint setting: `registration.googleSheetWebAppUrl` in `assets/js/config.js`.
- Endpoint accepts `POST` form parameters through `doPost(e)`.
- Availability checks are POSTed in the request body to a hidden iframe and return only matching booleans through `postMessage`; email/mobile are not placed in the URL.
- Multi-select platform values arrive as `e.parameters.otherPlatforms`; other fields arrive as `e.parameter`.
- The script validates required fields, normalizes email/mobile, blocks duplicates and writes validated submissions to the configured sheet.
- Submit stays disabled while the endpoint contains its setup placeholder.

## Earnings calculator

Defaults: 20% illustrative rate, 1,000 eligible purchases and ₹999 illustrative average purchase value. The default estimate is ₹1,99,800. The calculator and nearby copy must make clear that results are not guaranteed and final commission depends on approved programme terms and eligible purchases.

## Content and brand safeguards

- Use the supplied logo symbol cropped from the original asset; keep the wordmark as separate editable text.
- Use accurate page facts and partnership propositions instead of invented social proof.
- Keep sample coupon copy visibly illustrative.
- Do not claim an approved commission rate, audience reach, creator earnings, response time, payout schedule or eligibility threshold unless programme owners confirm it.
- Add official privacy, terms, contact and support links before launch; do not invent URLs.

## Exclusions

No creator login, dashboard, coupon generation, redemption tracking, order ingestion, commission ledger, payout processing or admin portal.
