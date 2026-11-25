const formatINR = value => new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
}).format(value);

export function initCalculator(defaults = {}) {
  const purchases = document.querySelector("#students");
  if (!purchases) return;

  const commission = document.querySelector("#commission");
  const average = document.querySelector("#purchase");

  const defaultCommission = defaults.defaultCommissionPercent ?? 20;
  const defaultCount = defaults.defaultEligiblePurchases ?? 1000;
  const defaultAmount = defaults.defaultAveragePurchaseValue ?? 699;

  purchases.value = defaultCount;
  if (commission) commission.value = defaultCommission;
  if (average) average.value = defaultAmount;

  const purchasesValue = document.querySelector("#studentsValue");
  const commissionValue = document.querySelector("#commissionValue");
  const averageValue = document.querySelector("#purchaseValue");
  const estimateValue = document.querySelector("#estimateValue");
  const annualEstimateValue = document.querySelector("#annualEstimateValue");
  const calcBreakdown = document.querySelector("#calcBreakdown");

  const referralChips = document.querySelectorAll("[data-referral-chip]");

  const updateSliderFill = slider => {
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const val = Number(slider.value) || 0;
    const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    slider.style.background = `linear-gradient(to right, var(--color-primary-strong) 0%, var(--color-primary-strong) ${pct}%, var(--color-line) ${pct}%, var(--color-line) 100%)`;
  };

  const update = () => {
    const count = Number(purchases.value) || 0;
    const rate = commission ? Number(commission.value) || defaultCommission : defaultCommission;
    const amount = average ? Number(average.value) || defaultAmount : defaultAmount;

    if (purchasesValue) purchasesValue.textContent = formatINR(count);
    if (commissionValue) commissionValue.textContent = `${rate}%`;
    if (averageValue) averageValue.textContent = `₹${formatINR(amount)}`;

    const baseMonthly = Math.round((count * amount * rate) / 100);
    const annual = baseMonthly * 12;

    if (estimateValue) estimateValue.textContent = formatINR(baseMonthly);
    if (annualEstimateValue) annualEstimateValue.textContent = formatINR(annual);
    if (calcBreakdown) {
      calcBreakdown.textContent = `${formatINR(count)} referrals × ₹${formatINR(amount)} × ${rate}%`;
    }

    updateSliderFill(purchases);

    // Sync referral chips active state
    referralChips.forEach(chip => {
      const chipVal = Number(chip.dataset.referralChip);
      chip.classList.toggle("active", chipVal === count);
    });
  };

  // Wire referral chips
  referralChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.dataset.referralChip;
      purchases.value = val;
      update();
    });
  });

  purchases.addEventListener("input", update);
  if (commission) commission.addEventListener("input", update);
  if (average) average.addEventListener("input", update);

  update();
}
