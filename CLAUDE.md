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

monthly_profit = monthly_fee - 500    // 500 = náklady na provoz celého projektu

year_revenue = one_time_revenue + (monthly_fee * 12)
year_cost    = one_time_cost    + (8000 * 12)
year_profit  = year_revenue - year_cost
```

Náklady balíčků jsou editovatelné (`#basic-cost`, `#extended-cost`, `#individual-cost`) — výchozí hodnoty: 4500 / 22000 / 4800 Kč.

## Deploy

Git → GitHub (`main`) → Vercel (auto-deploy).

Manuální produkční deploy: `vercel --prod`
