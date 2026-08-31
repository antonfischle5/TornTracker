# TornTracker

TornTracker is a personal Torn dashboard with live read-only API data and a searchable item-market view.

## Features
- Torn API v2 serverless proxy
- API-key validation before entering the dashboard
- Customizable statistic cards saved locally in the browser
- Dashboard refresh
- Item Market search by item ID
- Bazaar search by item ID
- Responsive dark UI

## Important deployment note
The frontend can be hosted as a static site, but `/api/torn.js` needs a serverless runtime such as Vercel. Do not expose a Torn API key in source code or commit it to GitHub.

## Vercel
Import this repository into Vercel. The `api/torn.js` serverless function is detected automatically. No Torn API key needs to be configured as a project secret because each user enters their own key at runtime.

## Torn API
Torn documents its API as read-only and documents the v2 market endpoints for item-market and bazaar data. See the official Torn API documentation for current endpoint details.
