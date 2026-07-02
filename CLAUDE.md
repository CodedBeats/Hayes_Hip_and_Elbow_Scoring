# CLAUDE.md

This file provides guidance to Claude Code
(claude.ai/code) when working with code in this
repository.

## Common Development Commands
### Project Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build Production
```bash
npm run build
```




## High-Level Architecture
### Tech Stack
- Frontend: Next.js App Router, React, TypeScript,
Tailwind CSS
- Backend: Firebase Firestore (real-time database), AWS
 S3 (file storage)
- State Management: react context for shared
state, local component state for UI

### Directory Structure
- /app/api: API routes for server-side operations
- /components: Reusable UI components (Tailwind CSS
with utility-first approach)
- /hooks: Custom React hooks for state logic
- /lib: Business logic and service integrations
(Firebase, AWS)
- /types: TypeScript interfaces and type definitions



## Key Patterns
- Component Structure: Functional components with
explicit typing, named exports
- Form Handling: Centralized form state management with
 typed handlers
- State Management: Firebase Firestore for shared data,
 local state for UI
- Styling: Tailwind CSS with class grouping (layout
first, then color/visual classes)
- TypeScript: Interfaces for props, union types for
finite options, strict type checking



## Firebase Integration
- Real-time data synchronization via Firestore
- Authentication and user management via Firebase Auth
(implemented soon)
- Signature images stored with Firebase storage



## AWS S3
- File uploads
- Integration via AWS SDK in /lib services



## Coding Conventions
- React: Avoid unnecessary useEffect, prefer derived
state, memoize selectively
- TypeScript: Prefer interfaces over any, use union
types, avoid type assertions
- Naming: PascalCase for components, camelCase for
functions, UPPER_SNAKE_CASE for globals
- React pages: use template `const pageName = (props) => {}; export default pageName`
- React Components: use template `export const componentName = (props) => {}`
- Comments: Add more comments in more complex sections
- Comments: Explain intent, not implementation; remove
dead code before finalizing
- Form Patterns: Use generic form components, avoid
inline setFormData for state updates

