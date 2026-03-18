# Contributing to DOM Inspector Plus

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/Sreelal727/dom-inspector-plus.git
cd dom-inspector-plus
npm install
npm run dev
```

Load the extension from the `dist/` folder in `chrome://extensions` with Developer Mode enabled.

## Contribution Areas

### Easiest: Prompt Templates
Add support for a new AI tool or framework in `src/shared/prompt-templates.ts`. Each format is a function that takes a `ComponentExtraction` and returns a string.

### Easy: AI Integrations
Add a new integration in `src/shared/ai-integrations.ts`. It's a config object:

```typescript
{
  id: 'your-tool',
  name: 'Your Tool',
  icon: '🔧',
  launchUrl: 'https://your-tool.com',
  promptTemplate: (extraction) => `Your prompt: ${generateExport(extraction, 'ai-prompt')}`,
}
```

### Medium: Tailwind Mappings
Improve CSS-to-Tailwind conversion in `src/lib/css-to-tailwind.ts`. Edge cases, better color matching, responsive patterns.

### Medium: Component Boundary Heuristics
Improve detection in `src/lib/component-boundary.ts`. Framework-specific patterns (Next.js, Remix, Astro).

### Advanced: New Export Formats
Add a new format to the `ExportFormat` type in `src/shared/types.ts` and implement it in `src/shared/prompt-templates.ts`.

## Pull Request Guidelines

1. Keep PRs focused — one feature or fix per PR
2. Run `npx tsc --noEmit` before submitting
3. Test on at least 2-3 diverse websites
4. Update the README if you add a user-facing feature

## Code Style

- TypeScript strict mode
- No `any` types
- Descriptive variable names
- Comments only where logic isn't self-evident
