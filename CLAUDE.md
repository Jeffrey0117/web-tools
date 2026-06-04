## web-tools

Small standalone web utilities for personal use — each folder is an independent static site.

## Stack

- Vanilla HTML + CSS + JavaScript (no build step, no dependencies, no package.json)
- Browser APIs only: `localStorage`, `AudioContext`, `requestAnimationFrame`, `Intl`/`toLocaleString` (timezone)
- Deployed as static sites to pipee.tw

## Directory structure

```
time/                 ← Time tools (時鐘/計時器/番茄鐘)
  index.html          ← Tabbed UI: clock, stopwatch, pomodoro
  style.css           ← Styles
  app.js              ← All logic (tabs, clock, stopwatch, pomodoro)
text/                 ← Subtitle/text processing tool (strver)
  index.html          ← Self-contained: inline CSS + JS in one file
time.zip / text.zip   ← Packaged builds for deploy
README.md             ← Tool index + deploy targets
```

## Key concepts

### time/ — three tabs in one page (app.js)
- **時鐘 (clock)**: live Taiwan time (`Asia/Taipei`), updated every 1s via `setInterval`. Chinese weekday labels.
- **計時器 (stopwatch)**: `performance.now()` + `requestAnimationFrame` for ms precision; start/pause/resume/reset.
- **番茄鐘 (pomodoro)**: work/break cycles, progress bar, `playBeep()` via `AudioContext` on phase change. Work/break minutes and completed count persisted to `localStorage` (`pomo-work`, `pomo-break`, `pomo-completed`).
- Tab switching toggles `.active` class on `.tab` / `.panel` elements.

### text/ — subtitle text processor (single index.html)
- **繁簡轉換**: simplified↔traditional conversion via a large inline `s2tMap` table; `t2sMap` is derived by reversing it. Conversion is naive `split().join()` per character (no word-context handling).
- **替換規則 (replacement rules)**: user-defined find→replace rules, toggleable per-rule, persisted to `localStorage` (`srt-rules`). Default rules included (e.g. remove 呃, 里→裡).
- Char count, copy (via `document.execCommand('copy')`), clear.

## Commands

- **Run locally**: open `time/index.html` or `text/index.html` directly in a browser (no server needed). Optionally `npx serve time` for a local HTTP server.
- **Build**: none — files are served as-is.
- **Deploy**: ship the per-folder static files (zipped as `time.zip` / `text.zip`) to pipee.tw.

## Coding rules

- Keep each tool fully self-contained and dependency-free (no frameworks, no bundler).
- `text/` keeps CSS + JS inline in `index.html`; `time/` separates into `index.html` / `style.css` / `app.js`.
- Persist user settings/state in `localStorage`; wrap parsing in try/catch.
- UI strings are Traditional Chinese (`lang="zh-TW"`).
