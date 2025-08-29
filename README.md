# Next.js 15 + Tailwind CSS v4 + shadcn/ui Starter Kit

An opinionated starter template combining:

- Next.js 15 (App Router) with React 19
- Tailwind CSS v4 (config‑less via PostCSS plugin)
- shadcn/ui (Radix primitives, Lucide icons)
- Dark mode via `next-themes`
- TypeScript, ESLint (flat config), Turbopack

This repo is ready for local development and Vercel deployment.

## Quick Start

```bash
# 1) Install deps
npm install
# or: pnpm install | yarn | bun install

# 2) Dev server
npm run dev   # http://localhost:3000

# 3) Build & start
npm run build
npm start

# 4) Lint
npm run lint
```

## What’s Included

- Next: `15.x`, React: `19.x`
- Tailwind: `^4` with `@tailwindcss/postcss` (see `postcss.config.mjs`)
- Prebuilt components in `components/ui/*` (e.g. `button`, `dropdown-menu`)
- Theme provider and dark mode toggle (`components/theme-provider.tsx`, `components/ModeToggle.tsx`)
- Utility `cn` helper (`lib/utils.ts`)

## Project Structure

- `app/`
  - `layout.tsx`: App shell + `ThemeProvider`
  - `page.tsx`: Example page using `Button` and `ModeToggle`
  - `globals.css`: Tailwind v4 imports, CSS variables, theme tokens
- `components/`: shadcn/ui components and theme utilities
- `lib/`: utilities
- Config: `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json`

## Tailwind CSS v4

Tailwind v4 is configured via PostCSS only (no `tailwind.config.*`).

- Imports live in `app/globals.css`:

  ```css
  @import "tailwindcss";
  @import "tw-animate-css";
  ```

- PostCSS plugins are defined in `postcss.config.mjs`:

  ```js
  const config = { plugins: ["@tailwindcss/postcss"] };
  export default config;
  ```

- Theme tokens are authored with CSS variables in `:root` and `.dark`, and exposed via an `@theme inline` block for semantic usage (e.g., `--color-primary`).

## shadcn/ui

- Components live under `components/ui/*` and are styled with Tailwind utilities.
- The example page shows `Button` and a theme `ModeToggle`.
- You can add more components using the CLI:

  ```bash
  npx shadcn@latest add accordion
  ```

  This repo includes a `components.json` for the CLI. If you use the CLI, ensure its Tailwind CSS path matches where your globals live (here it’s `app/globals.css`).

## Theming & Dark Mode

- `ThemeProvider` from `next-themes` is set up in `app/layout.tsx`.
- Dark mode uses the `class` strategy (applied on `<html>`).
- Use `ModeToggle` to switch between light, dark, and system.

## Deploy

- Deploy easily to Vercel (recommended). Push your repo and import it at https://vercel.com.
- Next.js deployment docs: https://nextjs.org/docs/app/building-your-application/deploying

---

Happy shipping!

