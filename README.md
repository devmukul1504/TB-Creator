# Testbook Creator Partner landing page

Responsive, static landing page for creators. The page focuses on the Testbook collaboration opportunity, explains the four-step creator journey and provides an illustrative earnings calculator.

## Project structure

```text
index.html
assets/
  css/
    tokens.css          # Brand palette, type, spacing and theme variables
    site.css            # Landing page and component styles
    main.css            # CSS entry point
  images/
    testbook_mark.png   # Cropped symbol from the supplied logo
    testbook_logo_source.webp
  js/
    config.js           # Public endpoint and calculator settings
    main.js             # Feature initialization
    features/
      calculator.js
      content.js
      navigation.js
      registration.js
      social-proof.js
integrations/
  google-apps-script/
    Code.gs             # Sheet setup, validation, duplicate checks and submission
```

Add or remove an interactive feature by editing its module under `assets/js/features/` and updating `assets/js/main.js`. Retheme the page through variables in `assets/css/tokens.css`.

The header uses the symbol cropped from the supplied logo. The `testbook` wordmark is editable HTML text, separate from the image.

## Run locally

Serve the folder over HTTP because the JavaScript uses ES modules:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Google Sheets application setup

The current registration flow uses the custom application form and Apps Script endpoint requested for this implementation. This extends the PRD's original Google Forms-only intake plan; the public page itself does not store application data.

1. Create an Apps Script project and paste in `integrations/google-apps-script/Code.gs`.
2. Run `setupCreatorSheet()` once and authorize the script. It creates the response spreadsheet in the script owner's Drive and stores its ID in Script Properties.
3. Edit the URL in `configureCreatorOrigins()` and run it once. Include the exact development and production origins that will host the page.
4. Deploy the script as a Web app, executing as the owner. Copy the deployed URL ending in `/exec`.
5. Replace the placeholder `googleSheetWebAppUrl` in `assets/js/config.js` with that URL.

For an existing spreadsheet, call `connectCreatorSheet(spreadsheetId, "Applications")` from the Apps Script editor. Keep the response spreadsheet private; only the script owner needs access. Availability checks send email and mobile in a POST body to the endpoint, not in the URL. Apps Script rechecks duplicates under a lock before adding a row.

The form submits these fields:

- `fullName`, `email`, `mobile`
- `platform`, `otherPlatforms` (optional multi-select)
- `profileUrl`, `city`, `state`, `examFocus`
- `audienceSize` (optional), `consent`, `source`

Apps Script receives the optional multi-select as `e.parameters.otherPlatforms` and the other values as `e.parameter`.

## Content and launch notes

- The creator earnings cards show the live calculator estimate for YouTube, Instagram and Telegram creator profiles; they are not individual payout records.
- The creator opportunity copy emphasizes brand collaboration, promotion and commission on eligible purchases.
- The calculator's 20% rate, 1,000 purchases and ₹999 average value are examples only; the result is not a promise of earnings.
- The coupon sample is clearly illustrative. Do not publish a real creator code before approval.
- Add named creator payout records only when genuine figures and permission to publish are available.
- Confirm commission terms, eligibility, privacy notice, contact details and legal links before launch.

## Deploy to Vercel

Import the folder as a static project. Use no build command and set the output directory to the project root (`.`). Configure the production origin in Apps Script and replace the endpoint placeholder before accepting applications.
