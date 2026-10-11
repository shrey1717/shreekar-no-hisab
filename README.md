# HisabMate

HisabMate is a warm, simple shared-expense tracker for hostel friends,
roommates, and trip groups. The website is being built with Next.js and
TypeScript using the product scope in
[`HisabMate_Website_First_Architecture_Plan.md`](./HisabMate_Website_First_Architecture_Plan.md).

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The initial screen lives in [`app/page.tsx`](./app/page.tsx). The visual
foundation follows the warm neomorphic design direction supplied in the design
archive: cream surfaces, coral actions, amber highlights, and Plus Jakarta Sans
typography.

## Available scripts

- `npm run dev` — start the local development server
- `npm run lint` — run ESLint
- `npm run build` — create a production build

## Project direction

The website will grow into the responsive MVP described in the architecture
plan, including groups, expenses, balances, settlements, history, and reports.
The backend and PostgreSQL schema will be added in later tasks.

Never commit real environment secrets. Use local environment files for
development credentials.
