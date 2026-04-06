const PACKAGES = {
  basic:      { revenue: 20000,  costs: 4500  },
  extended:   { revenue: 45000,  costs: 22000 },
  individual: { revenue: 100000, costs: 4800  },
};

const MONTHLY_FIXED_COSTS = 500;
const FEE_FIRST  = 490;
const FEE_EXTRA  = 245;

function num(id, fallback = 0) {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? fallback : v;
}

function fmt(n) {
  return Math.round(n).toLocaleString('cs-CZ') + '\u00a0Kč';
}

function set(id, value) {
  document.getElementById(id).textContent = value;
}

function calculate() {
  // --- inputs ---
  const company   = document.getElementById('company').value.trim();
  const eshops    = Math.max(1, Math.round(num('eshops', 1)));
  const mutations = Math.max(1, Math.round(num('mutations', 1)));
  const pkg       = document.querySelector('input[name="package"]:checked').value;
  const simple    = Math.max(0, Math.round(num('simple')));
  const complex   = Math.max(0, Math.round(num('complex')));
  const variants  = Math.max(0, Math.round(num('variants')));

  // --- package ---
  const pkgCosts   = Math.max(0, num(`${pkg}-cost`, PACKAGES[pkg].costs));
  const pkgRevenue = pkg === 'individual'
    ? Math.max(0, num('individual-price', 100000))
    : PACKAGES[pkg].revenue;

  // --- monthly fee (každý e-shop má default 1 mutaci; každá další mutace +245 Kč/e-shop) ---
  const monthlyFee = eshops * (FEE_FIRST + (mutations - 1) * FEE_EXTRA);

  // --- upsell rates ---
  const simpleRevenue   = Math.max(0, num('simple-revenue',   3000));
  const simpleCost      = Math.max(0, num('simple-cost',      1500));
  const complexRevenue  = Math.max(0, num('complex-revenue',  5000));
  const complexCost     = Math.max(0, num('complex-cost',     3000));
  const variantsRevenue = Math.max(0, num('variants-revenue', 1000));
  const variantsCost    = Math.max(0, num('variants-cost',       0));

  // --- one-time ---
  const totalShops = eshops * mutations;
  const oneRevenue = pkgRevenue + (simple * simpleRevenue * totalShops) + (complex * complexRevenue * totalShops) + (variants * variantsRevenue * totalShops);
  const oneCosts   = pkgCosts   + (simple * simpleCost   * totalShops) + (complex * complexCost   * totalShops) + (variants * variantsCost    * totalShops);
  const oneProfit  = oneRevenue - oneCosts;
  const oneMargin  = oneRevenue > 0 ? (oneProfit / oneRevenue) * 100 : 0;

  // --- monthly ---
  const moRevenue = monthlyFee;
  const moProfit  = moRevenue - (MONTHLY_FIXED_COSTS * eshops);

  // --- yearly ---
  const yrRevenue = oneRevenue + (moRevenue * 12);
  const yrCosts   = oneCosts   + (MONTHLY_FIXED_COSTS * eshops * 12);
  const yrProfit  = yrRevenue  - yrCosts;

  // --- update DOM ---
  set('results-company', company || '—');

  // fee hint in form
  document.getElementById('monthly-fee-display').textContent = fmt(monthlyFee);

  // footer
  const eshopsEl    = document.getElementById('eshops-display');
  const mutationsEl = document.getElementById('mutations-display');
  const mutationsSep = document.getElementById('mutations-sep');
  const feeResultsEl = document.getElementById('monthly-fee-results');

  eshopsEl.textContent = eshops === 1 ? '1 e-shop' : `${eshops} e-shopy`;
  if (mutations > 0) {
    mutationsEl.textContent = `${mutations} ${mutations === 1 ? 'mutace' : mutations < 5 ? 'mutace' : 'mutací'}`;
    mutationsEl.style.display = 'inline';
    mutationsSep.style.display = 'inline';
  } else {
    mutationsEl.style.display = 'none';
    mutationsSep.style.display = 'none';
  }
  feeResultsEl.textContent = fmt(monthlyFee);

  // print stats
  document.getElementById('print-eshops').textContent = eshops;
  document.getElementById('print-mutations').textContent = mutations;
  document.getElementById('print-fee').textContent = fmt(monthlyFee);

  // one-time
  set('one-revenue', fmt(oneRevenue));
  set('one-costs',   fmt(oneCosts));
  setProfit('one-profit', oneProfit);
  document.getElementById('one-margin').textContent =
    oneRevenue > 0 ? `${Math.round(oneMargin)}\u00a0%` : '—';

  // monthly
  set('mo-revenue', fmt(moRevenue));
  set('mo-costs', fmt(MONTHLY_FIXED_COSTS * eshops));
  setProfit('mo-profit', moProfit);

  // yearly
  set('yr-revenue', fmt(yrRevenue));
  set('yr-costs',   fmt(yrCosts));
  setProfit('yr-profit', yrProfit);
}

function setProfit(id, value) {
  const el = document.getElementById(id);
  el.textContent = fmt(value);
  el.classList.toggle('negative', value < 0);
}

// --- Package card click ---
document.querySelectorAll('.package-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    const radio = card.querySelector('input[type="radio"]');
    radio.checked = true;

    // enable cost + price inputs only for active card
    document.querySelectorAll('.package-cost input, #individual-price').forEach(el => {
      el.tabIndex = -1;
    });
    card.querySelectorAll('input[type="number"]').forEach(el => {
      el.tabIndex = 0;
    });

    calculate();
  });
});

// --- Listen to all inputs ---
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', calculate);
});

// --- Reset ---
const DEFAULTS = {
  company: '', eshops: 1, mutations: 1,
  'basic-cost': 4500, 'extended-cost': 22000,
  'individual-price': 100000, 'individual-cost': 4800,
  simple: 0, 'simple-revenue': 3000, 'simple-cost': 1500,
  complex: 0, 'complex-revenue': 5000, 'complex-cost': 3000,
  variants: 0, 'variants-revenue': 1000, 'variants-cost': 0,
};

document.getElementById('reset-btn').addEventListener('click', () => {
  for (const [id, val] of Object.entries(DEFAULTS)) {
    document.getElementById(id).value = val;
  }
  // reset package to basic
  document.querySelectorAll('.package-card').forEach(c => c.classList.remove('active'));
  document.querySelector('.package-card[data-package="basic"]').classList.add('active');
  document.querySelector('input[name="package"][value="basic"]').checked = true;
  calculate();
});

// --- Initial run ---
calculate();
