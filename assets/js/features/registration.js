let requestSequence = 0;

export function initRegistration(registration = {}) {
  const form = document.querySelector("[data-creator-form]");
  const status = document.querySelector("[data-form-status]");
  const step1Status = document.querySelector("[data-step1-status]");
  const submit = document.querySelector("[data-submit-button]");
  const endpoint = registration.googleSheetWebAppUrl?.trim();
  const configured = isConfiguredEndpoint(endpoint);
  const successCard = document.querySelector("[data-form-success]");
  const resetBtn = document.querySelector("[data-reset-form]");
  const stepPane1 = document.querySelector('[data-step-pane="1"]');
  const stepPane2 = document.querySelector('[data-step-pane="2"]');
  const stepNav1 = document.querySelector('[data-step-nav="1"]');
  const stepNav2 = document.querySelector('[data-step-nav="2"]');
  const loadingOverlay = document.querySelector("[data-loading-overlay]");
  const nextBtn = document.querySelector('[data-next-step]');
  const prevBtn = document.querySelector('[data-prev-step]');
  const duplicateErrors = { email: false, mobile: false };

  if (!form) return;

  // Platform pills interactive state
  form.querySelectorAll('.platform-item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", () => {
      cb.closest(".platform-item")?.classList.toggle("checked", cb.checked);
    });
  });

  // Primary platform change -> dynamically remove/hide matching option from additional platforms
  const platformSelect = form.elements.namedItem("platform");
  if (platformSelect) {
    platformSelect.addEventListener("change", () => {
      syncOtherPlatforms(form);
    });
    syncOtherPlatforms(form);
  }

  // Attach live input clearing & phone cleanup
  const allInputs = form.querySelectorAll("input, select, textarea");
  allInputs.forEach(input => {
    input.addEventListener("input", () => {
      if (input.name === "mobile") {
        let raw = input.value.replace(/\D/g, "");
        if (raw.length > 10 && raw.startsWith("91")) raw = raw.slice(2);
        if (raw.length > 10 && raw.startsWith("0")) raw = raw.slice(1);
        if (raw.length > 10) raw = raw.slice(0, 10);
        if (input.value !== raw) input.value = raw;
      }
      setFieldValidation(input, "");
      if (input.name === "email" || input.name === "mobile") {
        duplicateErrors[input.name] = false;
        if (!duplicateErrors.email && !duplicateErrors.mobile && nextBtn) {
          nextBtn.disabled = false;
          nextBtn.removeAttribute("title");
        }
      }
      clearStatusBanner(step1Status);
      clearStatusBanner(status);
    });

    input.addEventListener("change", () => {
      setFieldValidation(input, "");
      if (input.name === "email" || input.name === "mobile") {
        duplicateErrors[input.name] = false;
        if (!duplicateErrors.email && !duplicateErrors.mobile && nextBtn) {
          nextBtn.disabled = false;
          nextBtn.removeAttribute("title");
        }
      }
      clearStatusBanner(step1Status);
      clearStatusBanner(status);
    });
  });

  // Step 1 -> Step 2 Navigation
  if (nextBtn && stepPane1 && stepPane2) {
    nextBtn.addEventListener("click", () => {
      if (duplicateErrors.email || duplicateErrors.mobile) {
        const dupField = duplicateErrors.email ? form.elements.namedItem("email") : form.elements.namedItem("mobile");
        showStatusBanner(step1Status, "error", "Please resolve the registered contact details before proceeding to the next step.");
        dupField?.focus();
        return;
      }

      const step1Fields = [
        form.elements.namedItem("fullName"),
        form.elements.namedItem("email"),
        form.elements.namedItem("mobile"),
        form.elements.namedItem("city"),
        form.elements.namedItem("state"),
        form.elements.namedItem("platform"),
        form.elements.namedItem("audienceSize"),
        form.elements.namedItem("profileUrl")
      ].filter(Boolean);

      let firstInvalid = null;
      step1Fields.forEach(field => {
        const err = getFieldErrorMessage(field);
        setFieldValidation(field, err);
        if (err && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        showStatusBanner(step1Status, "error", "Please fill in all required personal details correctly before proceeding.");
        firstInvalid.focus();
        return;
      }

      clearStatusBanner(step1Status);
      stepPane1.hidden = true;
      stepPane2.hidden = false;
      stepNav1?.classList.remove("active");
      stepNav1?.classList.add("completed");
      stepNav2?.classList.add("active");
      stepPane2.querySelector("select, input")?.focus();
    });
  }

  // Step 2 -> Step 1 Navigation
  if (prevBtn && stepPane1 && stepPane2) {
    prevBtn.addEventListener("click", () => {
      stepPane2.hidden = true;
      stepPane1.hidden = false;
      stepNav2?.classList.remove("active");
      stepNav1?.classList.remove("completed");
      stepNav1?.classList.add("active");
      stepPane1.querySelector("input")?.focus();
      clearStatusBanner(status);
    });
  }

  // Initial config status
  if (submit && status) {
    if (configured) {
      submit.disabled = false;
      form.action = endpoint;
      initializeDuplicateChecks(form, endpoint, status, submit, successCard, stepPane1, stepPane2, stepNav1, stepNav2, loadingOverlay, nextBtn, duplicateErrors);
    } else {
      // In preview mode, allow form exploration with a clear warning
      submit.disabled = false;
      form.addEventListener("submit", event => {
        event.preventDefault();
        showStatusBanner(status, "warning", "Form is in preview mode. Add your Google Apps Script Web App URL in assets/js/config.js to enable live submissions.");
      });
    }
  }

  // Reset form handler
  if (resetBtn && successCard) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      form.hidden = false;
      successCard.hidden = true;
      if (loadingOverlay) loadingOverlay.hidden = true;
      form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
      form.querySelectorAll("[data-field-error]").forEach(el => el.textContent = "");
      form.querySelectorAll(".platform-item.checked").forEach(el => el.classList.remove("checked"));
      syncOtherPlatforms(form);

      if (stepPane1 && stepPane2) {
        stepPane2.hidden = true;
        stepPane1.hidden = false;
        stepNav2?.classList.remove("active");
        stepNav1?.classList.remove("completed");
        stepNav1?.classList.add("active");
      }
      if (submit) {
        submit.disabled = false;
        submit.innerHTML = 'Submit application <span>↗</span>';
      }
      clearStatusBanner(status);
      clearStatusBanner(step1Status);
    });
  }

  // Scroll to form buttons
  document.querySelectorAll("[data-form-link]").forEach(link => {
    link.href = "#apply";
    link.addEventListener("click", event => {
      const target = document.querySelector("#apply");
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
        form.elements.namedItem("fullName")?.focus();
      }
    });
  });
}

function initializeDuplicateChecks(form, endpoint, status, submit, successCard, stepPane1, stepPane2, stepNav1, stepNav2, loadingOverlay, nextBtn, duplicateErrors) {
  const email = form.elements.namedItem("email");
  const mobile = form.elements.namedItem("mobile");
  let allowNextSubmit = false;
  const iframe = getAvailabilityFrame();
  const pending = new Map();

  window.addEventListener("message", event => {
    if (!isAppsScriptOrigin(event.origin)) return;
    const result = event.data;
    if (!result || result.type !== "creator-availability" || !pending.has(result.requestId)) return;
    const request = pending.get(result.requestId);
    window.clearTimeout(request.timeout);
    request.form.remove();
    pending.delete(result.requestId);
    if (result.ok) request.resolve(result);
    else request.reject(new Error("Availability check failed"));
  });

  // Blur availability check
  [email, mobile].filter(Boolean).forEach(field => {
    field.addEventListener("blur", async () => {
      const value = field.value.trim();
      if (!value || getFieldErrorMessage(field)) return;

      try {
        const result = await postAvailability(endpoint, { [field.name]: value }, iframe, pending);
        if (field.value.trim() !== value) return;
        const exists = Boolean(result[`${field.name}Exists`]);
        const step1Status = document.querySelector("[data-step1-status]");
        if (exists) {
          if (duplicateErrors) duplicateErrors[field.name] = true;
          const msg = `This ${field.name === "email" ? "email address" : "mobile number"} is already registered with Testbook Creator.`;
          setFieldValidation(field, msg);
          showStatusBanner(step1Status, "error", msg);
          if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.title = "Please resolve the registered contact details to proceed";
          }
        } else {
          if (duplicateErrors) duplicateErrors[field.name] = false;
          setFieldValidation(field, "");
          if (!duplicateErrors || (!duplicateErrors.email && !duplicateErrors.mobile)) {
            clearStatusBanner(step1Status);
            clearStatusBanner(status);
            if (nextBtn) {
              nextBtn.disabled = false;
              nextBtn.removeAttribute("title");
            }
          }
        }
      } catch {
        // Silent failover on background blur check
      }
    });
  });

  // Form submit handler
  form.addEventListener("submit", async event => {
    if (allowNextSubmit) {
      allowNextSubmit = false;
      return;
    }
    event.preventDefault();
    clearStatusBanner(status);

    // Validate Step 1 fields
    const step1Fields = [
      form.elements.namedItem("fullName"),
      form.elements.namedItem("email"),
      form.elements.namedItem("mobile"),
      form.elements.namedItem("city"),
      form.elements.namedItem("state"),
      form.elements.namedItem("platform"),
      form.elements.namedItem("audienceSize"),
      form.elements.namedItem("profileUrl")
    ].filter(Boolean);

    let firstStep1Invalid = null;
    step1Fields.forEach(field => {
      const err = getFieldErrorMessage(field);
      setFieldValidation(field, err);
      if (err && !firstStep1Invalid) firstStep1Invalid = field;
    });

    if (firstStep1Invalid) {
      // Return to Step 1 to show user the problem
      stepPane2.hidden = true;
      stepPane1.hidden = false;
      stepNav2?.classList.remove("active");
      stepNav1?.classList.remove("completed");
      stepNav1?.classList.add("active");
      firstStep1Invalid.focus();
      const step1Status = document.querySelector("[data-step1-status]");
      showStatusBanner(step1Status, "error", "Please fix the required contact and channel details before submitting.");
      return;
    }

    // Validate Step 2 fields
    const step2Fields = [
      form.elements.namedItem("examFocus"),
      form.elements.namedItem("whyJoin"),
      form.elements.namedItem("consent")
    ].filter(Boolean);

    let firstStep2Invalid = null;
    step2Fields.forEach(field => {
      const err = getFieldErrorMessage(field);
      setFieldValidation(field, err);
      if (err && !firstStep2Invalid) firstStep2Invalid = field;
    });

    if (firstStep2Invalid) {
      showStatusBanner(status, "error", "Please check and complete all required channel details marked in red.");
      firstStep2Invalid.focus();
      return;
    }

    // Begin Submission
    submit.disabled = true;
    submit.innerHTML = 'Submitting... <span>⏳</span>';
    clearStatusBanner(status);
    if (loadingOverlay) loadingOverlay.hidden = false;

    const checkedEmail = email ? email.value.trim() : "";
    const checkedMobile = mobile ? mobile.value.trim() : "";

    try {
      const result = await postAvailability(endpoint, {
        email: checkedEmail,
        mobile: checkedMobile,
      }, iframe, pending);

      const emailExists = Boolean(result.emailExists);
      const mobileExists = Boolean(result.mobileExists);

      if (emailExists || mobileExists) {
        if (loadingOverlay) loadingOverlay.hidden = true;
        if (emailExists && email) {
          if (duplicateErrors) duplicateErrors.email = true;
          setFieldValidation(email, "This email address is already registered.");
        }
        if (mobileExists && mobile) {
          if (duplicateErrors) duplicateErrors.mobile = true;
          setFieldValidation(mobile, "This mobile number is already registered.");
        }

        // Return to Step 1 because email/mobile are in Step 1
        stepPane2.hidden = true;
        stepPane1.hidden = false;
        stepNav2?.classList.remove("active");
        stepNav1?.classList.remove("completed");
        stepNav1?.classList.add("active");

        if (nextBtn) {
          nextBtn.disabled = true;
          nextBtn.title = "Please resolve the registered contact details to proceed";
        }

        const targetField = emailExists ? email : mobile;
        targetField?.focus();

        const step1Status = document.querySelector("[data-step1-status]");
        showStatusBanner(step1Status, "error", "An account already exists with these contact details. Please resolve them to proceed.");
        
        submit.disabled = false;
        submit.innerHTML = 'Submit application <span>↗</span>';
        clearStatusBanner(status);
        return;
      }

      // Live submit via iframe
      getSubmitFrame();
      form.target = "creator-submit-frame";
      allowNextSubmit = true;
      form.requestSubmit(submit);

      if (loadingOverlay) loadingOverlay.hidden = true;
      if (successCard) {
        if (stepPane1) stepPane1.hidden = true;
        if (stepPane2) stepPane2.hidden = true;
        const stepsNav = document.querySelector(".form-steps-nav");
        if (stepsNav) stepsNav.hidden = true;
        form.hidden = true;
        form.style.display = "none";
        successCard.hidden = false;
        successCard.style.display = "flex";
        successCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch {
      if (loadingOverlay) loadingOverlay.hidden = true;
      submit.disabled = false;
      submit.innerHTML = 'Submit application <span>↗</span>';
      showStatusBanner(status, "error", "Network issue or submission timeout. Please check your connection and try again.");
    }
  });
}

function getFieldErrorMessage(field) {
  if (!field) return "";
  const name = field.name;
  const val = field.value ? field.value.trim() : "";

  if (name === "fullName") {
    if (!val) return "Please enter your full name.";
    if (val.length < 2) return "Name must be at least 2 characters.";
    if (!/^[a-zA-Z\s.'-]+$/.test(val)) return "Name should contain only letters and spaces.";
    const junkNames = ["test", "testing", "asdf", "admin", "user", "qwerty", "demo", "xyz"];
    if (junkNames.includes(val.toLowerCase())) return "Please enter your real full name.";
    return "";
  }

  if (name === "email") {
    if (!val) return "Please enter your email address.";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
    if (!emailRegex.test(val)) return "Please enter a valid email address (e.g. name@example.com).";

    const lower = val.toLowerCase();
    // Common typo warnings
    if (lower.endsWith("@gamil.com") || lower.endsWith("@gmial.com") || lower.endsWith("@gmaill.com") || lower.endsWith("@gmai.com")) {
      return "Did you mean @gmail.com? Please check your email.";
    }
    if (lower.endsWith("@yaho.com") || lower.endsWith("@yahooo.com")) {
      return "Did you mean @yahoo.com? Please check your email.";
    }
    if (lower.endsWith("@hotmial.com") || lower.endsWith("@hotmaill.com")) {
      return "Did you mean @hotmail.com? Please check your email.";
    }

    // Block disposable temporary email domains
    const disposableDomains = ["mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com", "throwawaymail.com", "yopmail.com", "sharklasers.com", "trashmail.com"];
    const domain = lower.split("@")[1];
    if (domain && disposableDomains.includes(domain)) {
      return "Please use a permanent personal or work email address.";
    }
    return "";
  }

  if (name === "mobile") {
    if (!val) return "Please enter your mobile number.";
    if (!/^[6-9][0-9]{9}$/.test(val)) return "Please enter a valid phone number.";
    if (/^([6-9])\1{9}$/.test(val)) return "Please enter a valid phone number.";
    if (val === "9876543210" || val === "9123456789") return "Please enter a valid phone number.";
    return "";
  }

  if (name === "city") {
    if (!val) return "Please enter your city.";
    if (val.length < 2) return "City must be at least 2 characters.";
    if (!/^[a-zA-Z\s.-]+$/.test(val)) return "City should contain letters only (e.g. Patna, Jaipur).";
    const junkCities = ["test", "asdf", "qwerty", "xxx", "none", "na"];
    if (junkCities.includes(val.toLowerCase())) return "Please enter a valid city name.";
    return "";
  }

  if (name === "state") {
    if (!val) return "Please select your state or UT.";
    return "";
  }

  if (name === "platform") {
    if (!val) return "Please select your primary platform.";
    return "";
  }

  if (name === "audienceSize") {
    if (!val) return "Please select your audience range.";
    return "";
  }

  if (name === "profileUrl") {
    if (!val) return "Please enter your channel or profile URL.";
    if (!val.startsWith("https://") || val.length < 12) return "Profile URL must start with https:// (e.g. https://youtube.com/@channel).";
    
    const cleanUrl = val.replace(/\/+$/, "");
    if (cleanUrl === "https://youtube.com" || cleanUrl === "https://www.youtube.com") {
      return "Please include your channel name or handle (e.g. https://youtube.com/@yourchannel).";
    }
    if (cleanUrl === "https://instagram.com" || cleanUrl === "https://www.instagram.com") {
      return "Please include your profile handle (e.g. https://instagram.com/yourhandle).";
    }
    if (cleanUrl === "https://t.me" || cleanUrl === "https://telegram.me") {
      return "Please include your Telegram channel link (e.g. https://t.me/yourchannel).";
    }

    // Platform matching verification
    const platformField = field.form?.elements.namedItem("platform");
    const chosenPlatform = platformField?.value;
    if (chosenPlatform === "YouTube" && !val.includes("youtube.com") && !val.includes("youtu.be")) {
      return "URL does not match YouTube. Please provide your YouTube channel link.";
    }
    if (chosenPlatform === "Instagram" && !val.includes("instagram.com")) {
      return "URL does not match Instagram. Please provide your Instagram profile link.";
    }
    if (chosenPlatform === "Telegram" && !val.includes("t.me") && !val.includes("telegram.me")) {
      return "URL does not match Telegram. Please provide your Telegram channel link.";
    }
    return "";
  }

  if (name === "examFocus") {
    if (!val) return "Please select your primary exam category.";
    return "";
  }

  if (name === "whyJoin") {
    if (!val) return "Please tell us why you want to join.";
    if (val.length < 10) return "Please tell us briefly why you want to join (at least 10 characters).";
    return "";
  }

  if (name === "consent") {
    if (!field.checked) return "Please agree to the application review terms.";
    return "";
  }

  return "";
}

function setFieldValidation(field, errorMessage) {
  if (!field) return;
  const isErr = Boolean(errorMessage);
  field.classList.toggle("is-invalid", isErr);

  const phoneGroup = field.closest(".phone-input-group");
  if (phoneGroup) {
    phoneGroup.classList.toggle("is-invalid", isErr);
  }

  field.setCustomValidity(errorMessage || "");

  const errorNode = document.querySelector(`[data-field-error="${field.name}"]`);
  if (errorNode) {
    errorNode.textContent = errorMessage || "";
  }
}

function isStep1Valid(stepPane1) {
  if (!stepPane1) return true;
  const inputs = stepPane1.querySelectorAll("input, select");
  for (const input of inputs) {
    if (getFieldErrorMessage(input)) return false;
  }
  return true;
}

function showStatusBanner(container, type, message) {
  if (!container) return;
  if (!message) {
    clearStatusBanner(container);
    return;
  }

  container.hidden = false;
  const baseClass = container.dataset.step1Status !== undefined ? "step-status-banner" : "form-status";
  container.className = `${baseClass} status-${type}`;

  const icon = type === "error" || type === "warning" ? "⚠️" : type === "success" ? "✓" : "ℹ️";
  container.innerHTML = `<span class="status-icon" aria-hidden="true">${icon}</span><span>${message}</span>`;
}

function clearStatusBanner(container) {
  if (!container) return;
  container.hidden = true;
  const baseClass = container.dataset.step1Status !== undefined ? "step-status-banner" : "form-status";
  container.className = baseClass;
  container.innerHTML = "";
}

function getSubmitFrame() {
  let frame = document.querySelector("#creator-submit-frame");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "creator-submit-frame";
    frame.name = "creator-submit-frame";
    frame.hidden = true;
    document.body.append(frame);
  }
  return frame;
}

function postAvailability(endpoint, values, iframe, pending) {
  const requestId = `check${Date.now()}${++requestSequence}`;
  const form = document.createElement("form");
  form.method = "post";
  form.action = endpoint;
  form.target = iframe.name;
  form.hidden = true;

  const payload = {
    requestType: "availability",
    requestId,
    parentOrigin: window.location.origin,
    ...values,
  };
  Object.entries(payload).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  });

  const promise = new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pending.delete(requestId);
      form.remove();
      reject(new Error("Availability check timed out"));
    }, 10000);
    pending.set(requestId, { resolve, reject, timeout, form });
  });

  document.body.append(form);
  form.submit();
  return promise;
}

function getAvailabilityFrame() {
  let frame = document.querySelector("#creator-availability-frame");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "creator-availability-frame";
    frame.name = "creator-availability-frame";
    frame.title = "Application availability check";
    frame.hidden = true;
    document.body.append(frame);
  }
  return frame;
}

function isAppsScriptOrigin(origin) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "script.google.com" || hostname.endsWith(".googleusercontent.com");
  } catch {
    return false;
  }
}

function isConfiguredEndpoint(value) {
  if (!value || value.includes("REPLACE_WITH")) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "script.google.com" && url.pathname.endsWith("/exec");
  } catch {
    return false;
  }
}

function syncOtherPlatforms(form) {
  if (!form) return;
  const platformField = form.elements.namedItem("platform");
  const primaryPlatform = platformField ? platformField.value.trim() : "";
  const otherCheckboxes = form.querySelectorAll('input[name="otherPlatforms"]');

  otherCheckboxes.forEach(cb => {
    const item = cb.closest(".platform-item");
    if (!item) return;

    let shouldHide = false;
    if (primaryPlatform === "YouTube" && cb.value === "YouTube") shouldHide = true;
    else if (primaryPlatform === "Instagram" && cb.value === "Instagram") shouldHide = true;
    else if (primaryPlatform === "Telegram" && cb.value === "Telegram") shouldHide = true;
    else if (primaryPlatform === "Coaching / website" && cb.value === "Website or blog") shouldHide = true;

    if (shouldHide) {
      if (cb.checked) {
        cb.checked = false;
        item.classList.remove("checked");
      }
      item.hidden = true;
      item.style.setProperty("display", "none", "important");
    } else {
      item.hidden = false;
      item.style.removeProperty("display");
    }
  });
}
