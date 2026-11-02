# DZZ UNIVERSE

A desktop-focused personal page with English and Chinese, inspired by comic-book print design and the Ronit Earth-42 portfolio experience. Independently implemented with HTML, CSS, Canvas, and GSAP. English is the default.

## Preview

Serve this folder with any static server. For example:

```powershell
python -m http.server 4318 --bind 127.0.0.1
```

Open http://127.0.0.1:4318.

## Interactions

- Click anywhere in the opening universe to shoot a web. Other signals also respond; the yellow signal catches the web and pulls you into the page.
- A short portal transition leads into the paper-and-ink homepage.
- Click empty paper to fire a web, or skill chips for impact lettering.
- Expand the six mission cards, shuffle field notes, and replay the intro.
- Cycle Earth-01, Earth-65, and Earth-Noir palettes.
- Motion can be paused; the system reduced-motion preference is respected.
- Switch English/Chinese from the header or the intro. The language choice is remembered locally.
- Hover over navigation, titles, cards, or skill labels for a short text scramble that resolves from left to right. Keyboard focus also triggers it; pausing motion disables it.
- Escape skips the introduction. All controls support keyboard input.
- The contact section opens an email draft to the provided address through the visitor's email app. It does not send automatically.

## Edit

- `index.html`: visible content and sections.
- `style.css`: layout, colors, typography, and CSS motion.
- `app.js`: page interactions and entrance/scroll motion.
- `portal.js`: animated entry and transition.
- `impact.js`: bounded particle and comic word effects.
- `i18n.js`: English/Chinese text and language preference.
- `scramble.js`: accessible text-scramble overlays.
- `assets/hero-city.webp`: original generated illustration. This is an illustration, not DZZ's photograph.

The current copy describes a learning and forward-deployed working approach. It does not assert employment, credentials, completed projects, or performance metrics. Add verified examples before using it as a complete professional portfolio.

No contact form, analytics, external font request, backend, or personal dataset is included. Minimum layout width is 1000 px, as requested. Intro completion and local preview scroll position use browser session storage; only the language preference uses local storage.

## Assets

The site uses an original generated comic illustration. Local fonts come from Google Fonts (Bangers, Permanent Marker, Space Grotesk, Anton, DM Sans). Third-party font notices are retained in `assets/licenses/`. GSAP and ScrollTr