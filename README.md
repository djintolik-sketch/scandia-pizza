# Scandia Pizza — v5 functional demo

## What is implemented
- v5 visual design preserved as baseline.
- Real menu data from the supplied ChoiceQR snapshot (`menu.json`).
- Category filtering.
- Product detail modal with description, image, starting price and ChoiceQR source link.
- Working cart: add, increase/decrease quantity, remove, clear.
- Checkout flow with delivery / pickup switching.
- Demo order creation with unique order number (`SC-0001`, etc.).
- Orders persist in browser `localStorage`.
- Demo admin panel: search, status filter, status changes, delete, clear, JSON export.
- Responsive/mobile behavior retained.

## Important
This is a **static demo**. No order is sent to Scandia Pizza or ChoiceQR. Orders exist only in the browser where they were created.

To connect real order delivery later, add a backend/API or an approved ChoiceQR integration.

## Run
Open `index.html` through a local static server or the VS Code Live Server extension. Direct `file://` opening may block `fetch('./menu.json')` in some browsers.
