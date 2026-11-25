const SHEET_ID_PROPERTY = "CREATOR_APPLICATION_SPREADSHEET_ID";
const SHEET_NAME_PROPERTY = "CREATOR_APPLICATION_SHEET_NAME";
const ALLOWED_ORIGINS_PROPERTY = "CREATOR_APPLICATION_ALLOWED_ORIGINS";
const DEFAULT_SHEET_NAME = "Applications";
const HEADERS = [
  "Submitted at",
  "Full name",
  "Email",
  "Mobile number",
  "Primary platform",
  "Other platforms",
  "Profile or channel URL",
  "City",
  "State / UT",
  "Primary exam category",
  "Audience size",
  "Why join Testbook Creator",
  "Consent",
  "Source",
];

/**
 * Setup function for your sheet.
 * Yeh function koi nayi spreadsheet create nahi karega.
 * Yeh sirf aapki open sheet me headers daalega aur connection save karega.
 */
function setupThisSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("No active spreadsheet found. Open Apps Script from inside your Google Sheet (Extensions > Apps Script).");
  }

  let sheet = spreadsheet.getActiveSheet();
  // Name the tab 'Applications' if desired, or keep current
  if (sheet.getName() === "Sheet1") {
    sheet.setName(DEFAULT_SHEET_NAME);
  }

  // Row 1 me headers set karega
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  sheet.getRange(1, 1, 1, HEADERS.length).setBackground("#e9fafb");

  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(SHEET_ID_PROPERTY, spreadsheet.getId());
  properties.setProperty(SHEET_NAME_PROPERTY, sheet.getName());

  if (!properties.getProperty(ALLOWED_ORIGINS_PROPERTY)) {
    properties.setProperty(ALLOWED_ORIGINS_PROPERTY,
      "http://localhost:8000,http://127.0.0.1:5500,http://localhost:3000,http://localhost:5173,https://testbookcreator.vercel.app"
    );
  }

  Logger.log("Linked to current spreadsheet: " + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

/** Point this web app at an existing spreadsheet owned by the script account. */
function connectCreatorSheet(spreadsheetId, sheetName) {
  if (!spreadsheetId || typeof spreadsheetId !== "string") {
    throw new Error("Provide a spreadsheet ID from its URL.");
  }
  PropertiesService.getScriptProperties().setProperties({
    [SHEET_ID_PROPERTY]: spreadsheetId.trim(),
    [SHEET_NAME_PROPERTY]: (sheetName || DEFAULT_SHEET_NAME).trim(),
  });
  const sheet = getApplicationSheet_();
  ensureHeaders_(sheet);
  return sheet.getParent().getUrl();
}

/** Set the exact website origins allowed to receive availability-check responses. */
function setCreatorAllowedOrigins(commaSeparatedOrigins) {
  const origins = String(commaSeparatedOrigins || "").split(",").map(value => value.trim()).filter(Boolean);
  if (!origins.length || origins.some(origin => !/^https?:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(origin))) {
    throw new Error("Use a comma-separated list of exact origins, such as https://example.com,http://localhost:8000");
  }
  PropertiesService.getScriptProperties().setProperty(ALLOWED_ORIGINS_PROPERTY, origins.join(","));
  return origins;
}

/**
 * Run this ONCE from the Apps Script editor after each new deployment / domain change.
 * Steps: select this function in the dropdown → click ▶ Run.
 */
function configureCreatorOrigins() {
  return setCreatorAllowedOrigins([
    "http://localhost:8000",
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    "https://testbookcreator.vercel.app",
    // Add any custom domain here, e.g. "https://creator.testbook.com"
  ].join(","));
}

function doGet(e) {
  return createFramedHtmlOutput_(responseHtml_("Creator application service", "The application endpoint is active."));
}

/** Validate, de-duplicate and append one application. */
function doPost(e) {
  const parameters = (e && e.parameter) || {};
  if (parameters.requestType === "availability") return availabilityResponse_(parameters);

  let lock;
  try {
    const application = readApplication_(e);
    lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const sheet = getApplicationSheet_();
    ensureHeaders_(sheet);
    const duplicate = findDuplicate_(sheet, application.email, application.mobile);
    if (duplicate.emailExists || duplicate.mobileExists) {
      return createFramedHtmlOutput_(responseHtml_(
        "Application already received",
        "An application already uses this email address or mobile number. Return to the form and use different details or contact the programme team."
      ));
    }

    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 2, 1, HEADERS.length - 1).setNumberFormat("@");
    sheet.getRange(nextRow, 1, 1, HEADERS.length).setValues([[
      new Date(),
      safeCellText_(application.fullName),
      safeCellText_(application.email),
      safeCellText_(application.mobile),
      safeCellText_(application.platform),
      safeCellText_(application.otherPlatforms.join(", ")),
      safeCellText_(application.profileUrl),
      safeCellText_(application.city),
      safeCellText_(application.state),
      safeCellText_(application.examFocus),
      safeCellText_(application.audienceSize),
      safeCellText_(application.whyJoin),
      "yes",
      safeCellText_(application.source),
    ]]);
    sheet.getRange(nextRow, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");

    return createFramedHtmlOutput_(responseHtml_(
      "Application received",
      "Thank you. Your creator application has been submitted for programme review. Submission does not mean approval or automatic coupon assignment."
    ));
  } catch (error) {
    console.error(error);
    return createFramedHtmlOutput_(responseHtml_(
      "Application not submitted",
      error.publicMessage || "We could not submit this application. Check the details and try again, or contact the programme team."
    ));
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function readApplication_(e) {
  const p = (e && e.parameter) || {};
  const multi = (e && e.parameters) || {};
  const application = {
    fullName: cleanText_(p.fullName, 100),
    email: normalizeEmail_(p.email),
    mobile: normalizeMobile_(p.mobile),
    platform: cleanText_(p.platform, 80),
    otherPlatforms: (multi.otherPlatforms == null
      ? (p.otherPlatforms ? [p.otherPlatforms] : [])
      : (Array.isArray(multi.otherPlatforms) ? multi.otherPlatforms : [multi.otherPlatforms]))
      .map(value => cleanText_(value, 80)).filter(Boolean),
    profileUrl: cleanText_(p.profileUrl, 500),
    city: cleanText_(p.city, 100),
    state: cleanText_(p.state, 100),
    examFocus: cleanText_(p.examFocus, 250),
    audienceSize: cleanText_(p.audienceSize, 100),
    whyJoin: cleanText_(p.whyJoin, 500),
    source: cleanText_(p.source, 100),
  };

  if (!application.fullName || !application.email || !application.mobile || !application.platform ||
      !application.profileUrl || !application.city || !application.state || !application.examFocus || !application.audienceSize || !application.whyJoin || p.consent !== "yes") {
    throw publicError_("Please complete all required fields and confirm consent.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email)) {
    throw publicError_("Enter a valid email address.");
  }
  if (!/^https:\/\//i.test(application.profileUrl)) {
    throw publicError_("Enter a profile URL beginning with https://.");
  }
  return application;
}

function getApplicationSheet_() {
  const properties = PropertiesService.getScriptProperties();
  let id = properties.getProperty(SHEET_ID_PROPERTY);
  let spreadsheet;

  if (id) {
    spreadsheet = SpreadsheetApp.openById(id);
  } else {
    try {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (spreadsheet) {
        id = spreadsheet.getId();
        properties.setProperty(SHEET_ID_PROPERTY, id);
      }
    } catch (e) {}
  }

  if (!spreadsheet) {
    throw new Error("Run setupThisSheet() or setupCreatorSheet() before deployment.");
  }

  const name = properties.getProperty(SHEET_NAME_PROPERTY) || DEFAULT_SHEET_NAME;
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.getActiveSheet();
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    return;
  }
  const lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  if (currentHeaders.length < HEADERS.length || HEADERS.some((header, index) => currentHeaders[index] !== header)) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
}

function findDuplicate_(sheet, email, mobile) {
  const result = { emailExists: false, mobileExists: false };
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return result;

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
  rows.forEach(row => {
    if (email && normalizeEmail_(row[2]) === email) result.emailExists = true;
    if (mobile && normalizeMobile_(row[3]) === mobile) result.mobileExists = true;
  });
  return result;
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeMobile_(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length > 10) digits = digits.slice(-10);
  return /^[6-9][0-9]{9}$/.test(digits) ? digits : "";
}

function cleanText_(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function safeCellText_(value) {
  const text = String(value || "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function availabilityResponse_(parameters) {
  const origin = allowedParentOrigin_(parameters.parentOrigin);
  const requestId = String(parameters.requestId || "");
  if (!origin || !/^check[0-9]+$/.test(requestId)) {
    return createFramedHtmlOutput_(responseHtml_("Availability check unavailable", "Please retry from the creator application page."));
  }

  try {
    const duplicate = findDuplicate_(getApplicationSheet_(), normalizeEmail_(parameters.email), normalizeMobile_(parameters.mobile));
    return createFramedHtmlOutput_(postMessageHtml_(origin, {
      type: "creator-availability",
      requestId,
      ok: true,
      emailExists: duplicate.emailExists,
      mobileExists: duplicate.mobileExists,
    }));
  } catch (error) {
    console.error(error);
    return createFramedHtmlOutput_(postMessageHtml_(origin, {
      type: "creator-availability",
      requestId,
      ok: false,
      emailExists: false,
      mobileExists: false,
    }));
  }
}

function createFramedHtmlOutput_(htmlString) {
  return HtmlService.createHtmlOutput(htmlString)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function allowedParentOrigin_(origin) {
  const configured = PropertiesService.getScriptProperties().getProperty(ALLOWED_ORIGINS_PROPERTY);
  const allowed = configured || "http://localhost:8000,http://127.0.0.1:5500,http://localhost:3000,http://localhost:5173";
  return allowed.split(",").map(value => value.trim()).includes(String(origin || "")) ? String(origin) : "";
}

function postMessageHtml_(origin, payload) {
  const message = JSON.stringify(payload).replace(/</g, "\\u003c");
  const target = JSON.stringify(origin || "*");
  return `<!doctype html><html><meta charset="utf-8"><body><script>
(function() {
  var msg = ${message};
  var tgt = ${target};
  // 1. Post to top-level window where the parent form lives
  try {
    if (window.top && window.top !== window) {
      window.top.postMessage(msg, tgt);
      return;
    }
  } catch (err) {}

  // 2. Fallback to direct parent if not nested
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, tgt);
      return;
    }
  } catch (err) {}

  // 3. Fallback wildcard to prevent any origin mismatch across sandbox boundaries
  try {
    if (window.top) {
      window.top.postMessage(msg, "*");
    } else if (window.parent) {
      window.parent.postMessage(msg, "*");
    }
  } catch (err) {}
})();
</script></body></html>`;
}

function responseHtml_(title, message) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;padding:40px 20px;background:#f4fbfc;color:#10243b;font:16px/1.6 Arial,sans-serif}.card{max-width:520px;margin:8vh auto;padding:32px;background:#fff;border:1px solid #d9edf0;border-radius:16px}h1{font-size:26px;margin:0 0 12px}p{color:#526579}</style><main class="card"><h1>${title}</h1><p>${message}</p><p>You can close this tab and return to the application page.</p></main></html>`;
}

function publicError_(message) {
  const error = new Error(message);
  error.publicMessage = message;
  return error;
}
