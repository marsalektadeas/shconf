# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Pricing kalkulačka pro e-commerce implementace — single-page app pro obchodníky TvůjBrand. Slouží k rychlému sestavení cenové nabídky na sales callu.

**Live:** https://shconf.vercel.app  
**GitHub:** https://github.com/marsalektadeas/shconf

## Stack

Vanilla HTML + CSS + JS. Žádný build krok, žádné závislosti, žádný package.json.

Otevřít lokálně: stačí `open index.html` nebo jakýkoliv HTTP server.

## Architektura

Tři soubory:

- `index.html` — struktura UI, všechny inputy a výsledkové elementy mají `id` pro JS
- `style.css` — design systém přes CSS custom properties (`:root`), tmavý dashboard styl
- `calc.js` — veškerá logika; čte DOM hodnoty, počítá, zapisuje zpět do DOM

Žádný state management. Kalkulačka je čistě: vstup → výpočet → výstup při každém `input` eventu.

## Výpočtová logika

```
monthly_fee = 490 + ((eshops - 1) * 245) + (mutations * 245)

one_time_revenue = pkg_revenue + (simple*3000) + (complex*5000) + (variants*1000)
one_time_cost    = pkg_cost    + (simple*1500) + (complex*3000)
one_time_profit  = one_time_revenue - one_time_cost

monthly_profit = monthly_fee    // náklady na provoz = 0

year_revenue = one_time_revenue + (monthly_fee * 12)
year_cost    = one_time_cost    // náklady na provoz = 0
year_profit  = year_revenue - year_cost
```

Náklady balíčků jsou editovatelné (`#basic-cost`, `#extended-cost`, `#individual-cost`) — výchozí hodnoty: 4500 / 22000 / 4800 Kč.

## Export systém

Dva PDF exporty — oba přes `printAs(mode)` v `calc.js`, který přidá třídu na `<body>` a zavolá `window.print()`. Po tisku ji `afterprint` event odstraní.

```
printAs('client')   → body.print-client
printAs('internal') → body.print-internal
```

CSS v `@media print` pak podle třídy na `<body>` zobrazí správnou sekci:

- `body.print-client` → zobrazí `.client-print-layout`, skryje `.results-block` a `.print-stats`
- `body.print-internal` → zobrazí vše včetně `.print-internal-extra` (detail produktů s sazbami)

### Klientský export (`cp-*` IDs)
Samostatný HTML blok `.client-print-layout` s vlastními elementy (`#cp-company`, `#cp-pkg-name`, `#cp-pkg-price`, `#cp-pkg-desc`, `#cp-one-revenue`, `#cp-monthly-fee`, `#cp-products-list`). Popis balíčku se tahá z `data-tip` atributu aktivní `.package-card .tip`. Nezobrazuje žádné náklady, zisky ani marže.

### Interní export (`int-*` IDs, `print-*` IDs)
Používá existující `.results-block` elementy (vše viditelné) + `.print-internal-extra` s `#int-products-list` (počty a sazby produktů) + `.print-stats` (e-shopy, mutace, fee).

## Deploy

Git → GitHub (`main`) → Vercel (auto-deploy).

Manuální produkční deploy: `vercel --prod`
