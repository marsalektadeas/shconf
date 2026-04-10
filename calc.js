const PACKAGES = {
  basic:      { revenue: 20000,  costs: 4500  },
  extended:   { revenue: 45000,  costs: 22000 },
  individual: { revenue: 100000, costs: 4800  },
};

const MONTHLY_FIXED_COSTS = 0;
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
  const discount  = Math.max(0, num('discount', 0));

  // --- package ---
  // 1 mutace zahrnuta v ceně, každá další = 50 % ceny balíčku / e-shop
  const mutationMultiplier = 1 + (mutations - 1) * 0.5;
  const pkgCosts   = Math.max(0, num(`${pkg}-cost`, PACKAGES[pkg].costs)) * eshops * mutationMultiplier;
  const pkgRevenueDefaults = { basic: 20000, extended: 45000, individual: 100000 };
  const pkgRevenue = Math.max(0, num(`${pkg}-price`, pkgRevenueDefaults[pkg])) * eshops * mutationMultiplier;

  // --- monthly fee (každý e-shop má default 1 mutaci; každá další mutace +245 Kč/e-shop) ---
  const feeEnabled = document.getElementById('fee-enabled').checked;
  const monthlyFee = feeEnabled ? eshops * (FEE_FIRST + (mutations - 1) * FEE_EXTRA) : 0;

  // --- upsell rates ---
  const simpleRevenue   = Math.max(0, num('simple-revenue',   3000));
  const simpleCost      = Math.max(0, num('simple-cost',      1500));
  const complexRevenue  = Math.max(0, num('complex-revenue',  5000));
  const complexCost     = Math.max(0, num('complex-cost',     3000));
  const variantsRevenue = Math.max(0, num('variants-revenue', 1000));
  const variantsCost    = Math.max(0, num('variants-cost',       0));

  // --- one-time ---
  const totalShops = eshops * mutations;
  const oneRevenueBase = pkgRevenue + (simple * simpleRevenue * totalShops) + (complex * complexRevenue * totalShops) + (variants * variantsRevenue * totalShops);
  const oneRevenue = Math.max(0, oneRevenueBase - discount);
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
  document.getElementById('fee-hint-value').style.opacity = feeEnabled ? '1' : '0.3';

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

  // print stats (internal)
  document.getElementById('print-eshops').textContent = eshops;
  document.getElementById('print-mutations').textContent = mutations;
  document.getElementById('print-fee').textContent = fmt(monthlyFee);

  // --- client print layout ---
  const pkgNames = { basic: 'Základní', extended: 'Rozšířený', individual: 'Individuální' };
  document.getElementById('cp-company').textContent = company || '—';
  document.getElementById('cp-pkg-name').textContent = pkgNames[pkg];
  document.getElementById('cp-pkg-price').textContent = fmt(pkgRevenue);
  const pkgTip = document.querySelector(`.package-card[data-package="${pkg}"] .tip`)?.dataset.tip || '';
  document.getElementById('cp-pkg-desc').textContent = pkgTip;
  document.getElementById('cp-one-revenue').textContent = fmt(oneRevenueBase);
  const cpDiscountWrap = document.getElementById('cp-discount-wrap');
  const cpAfterWrap    = document.getElementById('cp-after-discount-wrap');
  if (discount > 0) {
    document.getElementById('cp-discount').textContent = '−\u00a0' + fmt(discount);
    document.getElementById('cp-one-revenue-after').textContent = fmt(oneRevenue);
    cpDiscountWrap.style.display = '';
    cpAfterWrap.style.display = '';
  } else {
    cpDiscountWrap.style.display = 'none';
    cpAfterWrap.style.display = 'none';
  }
  const cpFeeRow = document.getElementById('cp-monthly-fee').closest('.cp-row');
  if (feeEnabled) {
    document.getElementById('cp-monthly-fee').textContent = fmt(moRevenue) + '\u00a0/ měs.';
    cpFeeRow.style.display = '';
  } else {
    cpFeeRow.style.display = 'none';
  }

  const cpProducts = [];
  if (simple > 0)   cpProducts.push({ name: 'Jednoduché produkty', count: simple,   price: simpleRevenue });
  if (complex > 0)  cpProducts.push({ name: 'Složité produkty',    count: complex,  price: complexRevenue });
  if (variants > 0) cpProducts.push({ name: 'Varianty',            count: variants, price: variantsRevenue });

  const cpWrap = document.getElementById('cp-products-wrap');
  if (cpProducts.length > 0) {
    document.getElementById('cp-products-list').innerHTML =
      cpProducts.map(p =>
        `<div class="cp-product-line">
          <span class="cp-pl-name">${p.name}</span>
          <span class="cp-pl-count">${p.count * totalShops}&nbsp;ks</span>
          <span class="cp-pl-price">${fmt(p.count * p.price * totalShops)}&nbsp;celkem</span>
        </div>`
      ).join('');
    cpWrap.style.display = '';
  } else {
    cpWrap.style.display = 'none';
  }

  const eshopsStr = eshops === 1 ? '1 e-shop' : `${eshops} e-shopy`;
  const mutationsStr = `${mutations}\u00a0${mutations === 1 ? 'mutace' : mutations < 5 ? 'mutace' : 'mutací'}`;
  document.getElementById('cp-eshops-info').textContent = `${eshopsStr}\u00a0·\u00a0${mutationsStr}`;

  // --- internal extra: product detail ---
  const intProducts = [];
  if (simple > 0)   intProducts.push({ name: 'Jednoduché', count: simple,   price: simpleRevenue,   cost: simpleCost });
  if (complex > 0)  intProducts.push({ name: 'Složité',    count: complex,  price: complexRevenue,  cost: complexCost });
  if (variants > 0) intProducts.push({ name: 'Varianty',   count: variants, price: variantsRevenue, cost: variantsCost });

  const intEl = document.getElementById('int-products-list');
  if (intProducts.length > 0) {
    const header = `<div class="int-product-header">
      <span>Typ</span><span>Ks</span><span>Cena/ks</span><span>Náklad/ks</span><span>Výnos</span><span>Marže</span>
    </div>`;
    const rows = intProducts.map(p => {
      const rev = p.count * p.price * totalShops;
      const cst = p.count * p.cost * totalShops;
      const margin = rev > 0 ? Math.round((rev - cst) / rev * 100) : 0;
      return `<div class="int-product-line">
        <span>${p.name}</span>
        <span>${p.count * totalShops}&nbsp;ks</span>
        <span>${fmt(p.price)}</span>
        <span>${fmt(p.cost)}</span>
        <span>${fmt(rev)}</span>
        <span>${margin}&nbsp;%</span>
      </div>`;
    }).join('');
    intEl.innerHTML = header + rows;
  } else {
    intEl.innerHTML = '<div class="int-product-empty">—</div>';
  }

  // one-time
  const intDiscountRow     = document.getElementById('int-discount-row');
  const intRevenueAfterRow = document.getElementById('int-revenue-after-row');
  if (discount > 0) {
    document.getElementById('int-discount').textContent = '−\u00a0' + fmt(discount);
    document.getElementById('int-revenue-after').textContent = fmt(oneRevenue);
    intDiscountRow.style.display = '';
    intRevenueAfterRow.style.display = '';
  } else {
    intDiscountRow.style.display = 'none';
    intRevenueAfterRow.style.display = 'none';
  }
  set('one-revenue', fmt(oneRevenueBase));
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
    document.querySelectorAll('.package-cost input, .package-price input[type="number"]').forEach(el => {
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
  input.addEventListener('change', calculate);
});

// --- Reset ---
const DEFAULTS = {
  company: '', eshops: 1, mutations: 1, discount: 0,
  'basic-price': 20000, 'basic-cost': 4500,
  'extended-price': 45000, 'extended-cost': 22000,
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

// --- Print modes ---
function printAs(mode) {
  document.body.classList.add('print-' + mode);
  window.print();
}

window.addEventListener('afterprint', () => {
  document.body.classList.remove('print-client', 'print-internal');
});

// --- Initial run ---
calculate();
