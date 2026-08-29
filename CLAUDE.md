# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A platform for submitting and managing canine hip & elbow radiograph scoring cases for a veterinary specialist practice (Dogs Australia ORCHID/CHED scheme). Dog owners and vets submit radiographs (structured form or uploaded PDF), pay via Stripe, and the practice reviews and scores them through an internal admin dashboard. Submitters are anonymous - only staff authenticate, to access the admin dashboard.

## Common Development Commands
```bash
npm install
npm run dev     # start the dev server
npm run build   # production build
npm run start   # run a production build
npm run lint    # lint the codebase
npm run docs    # generate browsable TypeDoc reference from /** */ comments
```

## High-Level Architecture
### Tech Stack
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Data & Auth: Firebase - Firestore (primary data store, real-time) + Firebase Auth (staff-only, admin dashboard access). Client SDK in the browser, Admin SDK (service account) on the server for admin dashboard reads/writes.
- File Storage: AWS S3, via presigned URLs for direct browser upload/download (DICOM radiographs, supporting documents, signature images, PDF forms - all upload categories, no exceptions). File bytes never pass through the app server.
- Payments: Stripe Checkout, redirect flow (session created server-side, verified server-side on return)
- Email: Resend, for transactional emails
- Scheduled jobs: Vercel Cron (see Cron Jobs below)
- State Management: React context for shared state, local component state for UI

### Directory Structure
- `/app/api`: API routes - Stripe checkout/verification, S3 presigned upload URLs, cron jobs, dev access gate
- `/app/admin`: internal dashboard - case list, case detail, status management, archive view
- `/components`: Reusable UI components, organized by feature (submission, admin, upload, form, auth, layout, ui)
- `/hooks`: Custom React hooks (auth, file upload, responsive checks)
- `/lib`: Business logic and service integrations (Firebase, Firebase Admin, S3, Stripe, pricing)
- `/types`: TypeScript interfaces and type definitions (submissions, dogs, owners, vets, billing, uploads)
- `middleware.ts` + `lib/devAccess.ts`: temporary pre-launch password gate in front of the whole site - unrelated to Firebase Auth, will be removed at go-live

## Cron Jobs
Scheduling is Vercel Cron, declared in `vercel.json`; each job gets its own route under `/app/api/cron/*`, signed with a bearer token checked against `CRON_SECRET`.

- `app/api/cron/cleanup-drafts` (daily, 03:00 UTC): deletes draft submissions and their S3 files after 7+ days untouched. Drafts are created on first file upload, before payment/completion - so this never touches a completed/paid submission.
- New cron jobs should get their own file and `vercel.json` entry rather than being added to an existing handler, so one job's failure can't silently take another down with it.

## Archiving
`"archived"` is a valid `SubmissionStatus` (`types/submission.ts`) with read-side support already built (`/admin/archive` page, sidebar link, status pill, dashboard stat tile) - but there's no write path yet; nothing can transition a submission into `archived`.

When built, archiving should just be a Firestore status/field change on the existing submission doc (e.g. `status: "archived"` + timestamp) - it must not move, copy, or otherwise touch the S3 files.

## Coding Conventions
### React
- Avoid unnecessary `useEffect`; prefer derived state; memoize selectively
- Prefer early returns; avoid deeply nested JSX
- Keep components small and composable
- Prefer `setState((prev) => ({ ...prev, field: value }))` over `setState({ ...state, field: value })`, especially in async-sensitive flows
- Component Structure: functional components with explicit typing, named exports
- Page template: `const pageName = (props) => {}; export default pageName`
- Component template: `export const componentName = (props) => {}`

### TypeScript
- Prefer interfaces over `any`; use union types for finite options; avoid type assertions unless necessary; prefer inference when readable
- Strict typing throughout

### Naming
- Components: PascalCase. Functions: camelCase. Globals: UPPER_SNAKE_CASE.
- Boolean variables should read naturally: `isLoading`, `hasError`, `canSubmit`

### Styling
- Tailwind CSS, utility-first; avoid inline styles
- Class grouping: layout classes before color/visual classes
- Prefer reusable UI primitives

### Forms
- Use generic form components; avoid inline `setFormData` for state updates; prefer typed helper handlers

### Comments
- Explain intent/why, not implementation; remove dead code before finalizing
- Add more comments in more complex sections
- Functions in `/lib`, `/hooks`, and complex component handlers use TypeDoc-style `/** */` blocks (`@remarks` for rationale, `@param`/`@returns` only when non-obvious, `@see`/`{@link}` for cross-file coupling) - run `npm run docs` to generate a browsable reference

## Git
### Commit Format & Notes
commitType(topic): small description (in past-tense. e.g. "added xxx" instead of "add")
commit types: [`feat`, `fix`, `refactor`, `style`, `docs`]
When a commit is requested, this does NOT mean to run the commit cmd. Instead, output in plain text with basically a plan. The plan should include each commit with its message and what files to commit for each commit (referencing the file in the text will help too).
Batch larger changes (>3 files at most changed) into multiple commits.
This applies no matter what triggered the commit request - a direct ask, a skill, or a subagent. Never actually run `git commit`, `git push`, `gh pr create`, or any other command that commits/pushes/opens a PR - text only, always. If a skill or subagent would otherwise take that action automatically, stop before the action and output the text instead.
Immediately after the commit plan text, in the same response, also output the Pull Request text (see format below) - don't wait for a separate request for it.

### Pull Request Format
Fixed header vocabulary, flexible per PR - include only the headers relevant to the change, skip the rest:
**Title** *Description*
**Summary** *Description*
**Problem** *Description*
**Fix** *Description*
**New Infrastructure** *Description*
**Tested** *Description*
e.g. a style/refactor PR might only need **Summary** + **Tested**; a bug fix might use **Problem** + **Fix** + **Tested**.

**Tested** - assume manual testing was already done to success before the PR is opened; don't restate standard checks (type-check, lint, "it works as expected") since those are a given. Instead list the specific scenarios manually exercised, as bullets, e.g.:
- uploaded a single file and deleted it
- uploaded multiple files and deleted them all one by one
- uploaded a file, deleted it, reloaded the page to confirm localStorage stayed in sync
Only call out non-standard verification (e.g. manually triggering a cron job, checking a Firestore doc directly) when it's relevant to the change.

## Working Style & Mentorship
Act as both a coding assistant and a technical mentor. I'm a junior-to-mid-level developer - comfortable with syntax, data structures, Git, and modern tooling, but still building professional engineering judgement. Skip explanations of basics I clearly already know. My goal isn't just working code - it's becoming a better developer through the work itself.

**Teaching style:** When we hit something new to me, a significant architectural decision, a non-obvious technique, or a meaningful trade-off, teach me briefly - the *why*, not just the *what*. Cover alternatives and whether an approach is conventional, opinionated, or emerging, but only when relevant - don't manufacture lessons. Scale the depth to the task: small changes get a line of context; large or unfamiliar ones deserve real discussion before implementation. Where it fits, name the broader pattern a local decision is an instance of, so I build the intuition to recognise it myself over time. Occasionally check my understanding after explaining something substantial - a quick question, not a quiz. I control the depth at any point: "move on" means drop it immediately.

**Honest technical judgment:** Don't present opinionated or context-dependent choices as objectively correct - flag convention vs. requirement, and say when you're genuinely unsure rather than guessing confidently. If I propose something with real drawbacks, say so rather than implementing it silently. Distinguish actually-problematic, could-be-better, and just-a-different-preference.

## Agent Behavior
When refactoring: preserve existing functionality, prefer minimal safe changes, reduce repetition carefully, avoid over-engineering.
When generating code: produce complete working examples, avoid placeholders unless requested, explain non-obvious decisions briefly.
When editing forms: preserve controlled inputs, handle checkbox vs. text input differences correctly, maintain type safety.

## Output Style
Keep responses concise. Avoid repeating the prompt. Prioritize practical implementation. Prefer incremental refactors.