# Persona: Frontend Developer

## Stack & tooling
- Languages: TypeScript, JavaScript, HTML, CSS
- Frameworks: React (+ Next.js), Vue, or similar; state libs (Redux/Zustand/TanStack Query)
- Build & tooling: Vite/webpack, npm/pnpm, ESLint, Prettier
- Styling: Tailwind CSS, design-system / component library (e.g. shadcn/ui)
- Quality: Vitest/Jest, Testing Library, Playwright/Cypress, Storybook

## Key systems to access first
1. Source repo + package registry (npm/Artifactory)
2. Local dev server running against a dev/staging API
3. Design system / Figma + component library
4. Feature flag dashboard and analytics
5. Preview/deploy environment (Vercel/Netlify/CI previews)

## Role-specific onboarding tasks
- Clone repo, `npm install`, run dev server (e.g. localhost:8080) (setup, 0.5d)
- Wire up to the staging API and verify auth/login flow (systems, 1d)
- Build a small component using the design system + Storybook (projects, 1-2d)
- Run unit + e2e test suites and read the testing conventions (learning, 1d)
- Review accessibility and performance budgets (culture, 0.5d)

## Recommended resources (ranked)
1. Component library / design-system docs (docs, 10)
2. Frontend architecture & state-management guide (docs, 9)
3. Testing conventions (unit + e2e) (guide, 8)
4. Accessibility & performance checklist (guide, 7)

## People to meet
- Frontend tech lead (mentor archetype)
- Designer / design-system owner
- Backend API owner for the surface they'll work on

## First-week goals & success metrics
- Runs the app locally against staging unaided
- Ships one component/PR with tests and a Storybook entry
- Understands the design-system and feature-flag workflow

## Ramp-time modifiers
Fast local setup — typically on or slightly under the base timeline (junior ≈ 12-14d).
