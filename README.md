<div align="center">

# DOM Inspector Plus

### Copy any UI as an AI prompt in one click.

See a button, card, or layout you love? Hover. Click. Paste into Claude, v0, or Cursor.
Get back a pixel-perfect component with Tailwind classes. No more screenshotting or manual inspect.

<!-- Replace with your actual demo GIF -->
<!-- ![DOM Inspector Plus Demo](https://raw.githubusercontent.com/Sreelal727/dom-inspector-plus/main/assets/demo.gif) -->

**[Install from Chrome Web Store](#install)** · **[How it Works](#how-it-works)** · **[Features](#features)** · **[Contributing](#contributing)**

</div>

---

## The Problem

You're browsing Stripe, Linear, or Tailwind UI. You see a component you want to recreate. What do you do?

| Without DOM Inspector Plus | With DOM Inspector Plus |
|---|---|
| Screenshot → paste into AI → "make this" → wrong spacing, wrong colors, missing states | **One click** → structured AI prompt with exact colors, spacing, layout, Tailwind classes, accessibility |
| Right-click → Inspect → manually copy 15 CSS properties → forget the hover state | **Auto-extracts** the full component tree, all styles diffed against defaults, hover/focus states included |
| Describe layout in words → "a card with a button on the right... no, the other right" | **Layout analysis** → "Flex row, space-between, 24px gap, items-center" — zero ambiguity |

## How It Works

```
1. Click the extension icon or press ⌘+Shift+X
2. Hover over any element — see it highlighted with box model
3. Click to extract — the full component tree, styles, and assets
4. Pick your format: AI Prompt, React JSX, HTML+CSS, Tailwind, or JSON
5. Send to Claude, v0, Cursor, or just copy to clipboard
```

The extension auto-detects **component boundaries** — click a button inside a card, and it extracts the whole card. Use `[` and `]` to expand or contract the selection.

## Features

### Component-Level Extraction
Not just one element. Click a button, get the full card/section/component it belongs to. Heuristic boundary detection using framework attributes, ARIA roles, semantic HTML, BEM classes, and visual boundaries.

### Smart Style Extraction (90% Less Noise)
Instead of dumping 300+ CSS properties, we diff against **browser defaults per element type**. A `<div>` with `display: block` gets skipped. A `<span>` with `display: block` gets included. You only see what matters.

### CSS → Tailwind Mapping
Every extracted style is mapped to Tailwind classes. Standard scale values get clean classes (`p-4`, `text-lg`, `rounded-xl`). Non-standard values get arbitrary notation (`w-[347px]`) and are flagged.

### 5 Export Formats

| Format | Best For |
|--------|----------|
| **AI Prompt** | Paste into Claude/ChatGPT — natural language with structure, layout, colors, interactions |
| **React JSX** | Drop-in component skeleton with Tailwind classes |
| **HTML + CSS** | Non-React projects, quick prototypes |
| **Tailwind Only** | Copy class strings into existing components |
| **JSON** | Programmatic use, custom pipelines |

### AI Tool Integrations
One-click export to:
- **Claude** — opens claude.ai with component prompt on clipboard
- **v0** — opens v0.dev with shadcn/ui-optimized prompt
- **Cursor** — copies prompt for paste into Cursor chat

### Interaction State Capture
Capture hover, focus, and active states. The output tells AI exactly what changes:
> "On hover: background changes from #fff to #f0f0f0, scale(1.02), shadow elevation increases, 200ms ease transition"

### Design Token Extraction
Scan any page for its design system: color palette, typography scale, spacing patterns, border radii, shadows. Export as a "Design System Prompt" so AI generates consistent components.

### Inspection History
Every extraction is auto-saved. Search, favorite, tag, and organize past inspections. Build a reference library across sites.

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `⌘+Shift+X` | Toggle inspector |
| `⌘+Shift+C` | Quick copy current extraction |
| `[` | Expand component boundary |
| `]` | Contract component boundary |
| `Esc` | Stop inspecting |

## Install

### From Source (Development)

```bash
git clone https://github.com/Sreelal727/dom-inspector-plus.git
cd dom-inspector-plus
npm install
npm run build
```

Then load in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

### Chrome Web Store
Coming soon.

## Tech Stack

- **TypeScript** — strict mode, full type coverage
- **Vite + CRXJS** — fast builds with Chrome extension HMR
- **Preact** — 3KB JSX runtime for the extension UI
- **Tailwind CSS** — for the extension's own UI (dogfooding)
- **Manifest V3** — modern Chrome extension architecture

### Architecture

```
Content Script (runs on page)
├── highlight-overlay.ts    — visual hover highlight with box model
├── dom-walker.ts           — subtree traversal (200-node cap)
├── style-extractor.ts      — computed styles diffed against defaults
├── layout-analyzer.ts      — flex/grid/spacing detection
├── asset-extractor.ts      — SVG/image/font/icon extraction
└── interaction-capture.ts  — hover/focus/active state diffing

Service Worker (background)
├── message-router.ts       — central message hub
├── storage-manager.ts      — chrome.storage abstraction
└── export-engine.ts        — format conversion + clipboard

Side Panel UI (Preact)
├── tree-view               — component tree visualization
├── style-panel             — categorized styles + Tailwind classes
├── export-panel            — format picker + AI integrations
├── history-panel           — searchable inspection history
└── prompt-preview          — live export preview
```

Permissions are minimal: `activeTab`, `storage`, `sidePanel`, `offscreen`, `clipboardWrite`. No `<all_urls>` background access.

## DOM Inspector Plus vs. Alternatives

| Feature | DOM Inspector Plus | CSS Scan | VisBug | Built-in DevTools |
|---------|:--:|:--:|:--:|:--:|
| AI-ready output | Yes | No | No | No |
| Component boundary detection | Yes | No | No | No |
| Default-diffed styles | Yes | No | No | No |
| Tailwind mapping | Yes | No | No | No |
| Interaction state capture | Yes | No | Partial | Manual |
| Multiple export formats | 5 | 1 | 0 | 1 |
| AI tool integrations | Claude, v0, Cursor | No | No | No |
| Design system extraction | Yes | No | No | No |
| Free & open source | Yes | $40 | Yes | Yes |

## Contributing

Contributions are welcome! Especially:

- **Prompt templates** — new AI tools, new frameworks (Vue, Svelte, Angular)
- **AI integrations** — add a config object + template function
- **Tailwind mappings** — edge case improvements
- **Component boundary heuristics** — framework-specific detection

```bash
# Development with HMR
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT — free for personal and commercial use.

---

<div align="center">

**Built for the vibe coding era.**

If this saves you time, consider giving it a ⭐

[Report a Bug](https://github.com/Sreelal727/dom-inspector-plus/issues) · [Request a Feature](https://github.com/Sreelal727/dom-inspector-plus/issues)

</div>
