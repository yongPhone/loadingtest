# Loading Test

Batch link rendering performance tester for images and HTML pages. Enter URLs in bulk, auto-detect type, measure download/render/total time, and view live progress plus summary stats.

![Screenshot](public/screenshot.png)

## Features
- Bulk URL input with auto type detection (image vs HTML)
- Cache-busting for every request; fetch + `srcdoc` for HTML, `Image()` for images
- Live in-place progress (no waiting for all tasks to finish)
- Detailed metrics: download, render, total; totals/averages + max values
- Adjustable render viewport (width/height) and concurrency limit
- Multi-language UI (EN/中文) with persistent toggle
- Modern responsive UI, previews per result, error state handling
- Back-to-top shortcut when scrolled

## Tech Stack
- Next.js 14 (App Router) + React 18 + TypeScript
- Styling: CSS
- Timing: `performance.now()`, `requestAnimationFrame`, `fetch` + blob + iframe

## Requirements
- Node.js 18+
- npm (or adjust commands for yarn/pnpm)

## Setup
```bash
npm install
```

### Development
```bash
npm run dev
# open http://localhost:3000
```

### Build
```bash
npm run build
```

### Start (production)
```bash
npm start
```

## Usage
1) Paste URLs (one per line).  
2) Optionally adjust render size and concurrency.  
3) Click Start. Progress and cards update live; errors are shown inline.  
4) View summary stats (totals, averages, maxima) and per-card timings.

Example URLs:
```
https://picsum.photos/800/600
https://example.com
```

## Behavior Notes
- Cache avoidance: unique cache-buster on every request; images use `crossOrigin="anonymous"`; HTML uses `fetch` + blob `iframe` (falls back to direct iframe if fetch blocked).  
- Render timing: measured at first paint via `requestAnimationFrame` after load; deep async work inside pages is not included.  
- Incognito windows have isolated caches per session but still cache within that session; this tool already adds cache-busters.

## Deployment
- Works on Vercel out of the box (`npm run build && npm start`).  
- Any Node host: serve the production build from `.next`.

## License
MIT

