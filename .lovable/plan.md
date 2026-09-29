# Verified MAP recommendations and theme support

## Build
- Replace the adjustable illustrative MAP calculator with a read-only, evidence-based recommendation derived from the analysis commodity, product form, respiration, storage temperature, humidity, shelf-life target, and selected material.
- Add curated commodity/category MAP ranges with source attribution, plus material compatibility checks using the selected material’s MAP suitability, gas transmission, and fresh-produce suitability.
- Show the target O₂/CO₂/N₂ range, package approach, compatibility status, cautions, and the basis used. Do not present unsupported precision as laboratory-validated fact.
- Reuse the exact same analysis input summary for both the MAP recommendation and AI advisor, so the two features cannot silently disagree about conditions.
- Update the on-page recommendation, AI advisor context, HTML report, and PDF report to use the same MAP result.
- Add light, dark, and system theme choices in navigation, persist the choice, and apply a full semantic dark palette across cards, forms, charts, menus, and notifications without changing the existing layout.

## Validation
- Check TypeScript and the preview build output.
- Run the Tomato analysis through the results page and verify MAP values, AI input context, both reports, theme switching, persistence, and mobile/desktop rendering.

## Technical details
- Keep the curated MAP reference dataset and calculation logic in one shared client-safe module.
- Store only the user’s theme preference in browser storage; default to the operating-system preference.
- Label MAP values as published reference targets requiring product/package validation, rather than “real-time” or guaranteed values.
