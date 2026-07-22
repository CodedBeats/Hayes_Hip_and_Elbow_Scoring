<!-- BEGIN:nextjs-agent-rules -->
## Project Stack

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* Firebase / Firestore
* AWS S3 uploads

---

## Coding Standards

* Use TypeScript strictly
* Prefer functional React components
* Prefer explicit typing over `any`
* Use named exports unless default export is clearly better
* Keep components small and composable
* Avoid deeply nested JSX
* Prefer early returns

---

## Form Handling

* Reuse generic form components where possible
* Avoid repetitive inline `setFormData`
* Prefer helper handlers for form updates
* Keep form state predictable and typed

---

## Styling

* Use Tailwind utility classes
* Avoid inline styles
* Group layout classes before color/visual classes
* Prefer reusable UI primitives

Example:

```tsx
className="flex items-center gap-2 rounded-md border px-4 py-2"
```

---

## File Organization

* APIs:
  `/app/api`

* Components:
  `/components`

* Hooks:
  `/hooks`

* Service Logic:
  `/lib`

* Types:
  `/types`



---

## React Rules

* Avoid unnecessary `useEffect`
* Prefer derived state over duplicated state
* Keep state local unless shared
* Memoize only when needed

---

## TypeScript Rules

* Use interfaces for component props
* Use union types for finite options
* Avoid type assertions unless necessary
* Prefer inference when readable

---

## Naming

* Components: PascalCase
* Functions: camelCase
* Constants: UPPER_SNAKE_CASE for globals only
* Boolean variables should read naturally:

Good:

* `isLoading`
* `hasError`
* `canSubmit`

---

## Comments

* Write comments explaining WHY, not WHAT
* Remove dead/commented-out code before finalizing
* Keep TODOs actionable
* Functions in `/lib`, `/hooks`, and complex component handlers use TypeDoc-style `/** */` blocks (`@remarks` for rationale, `@param`/`@returns` only when non-obvious, `@see`/`{@link}` for cross-file coupling) — run `npm run docs` to generate a browsable reference

---

## Agent Behavior

When refactoring:

* preserve existing functionality
* prefer minimal safe changes
* reduce repetition carefully
* avoid over-engineering

When generating code:

* produce complete working examples
* avoid placeholders unless requested
* explain non-obvious decisions briefly

When editing forms:

* preserve controlled inputs
* handle checkbox vs text input differences correctly
* maintain type safety

---

## Preferred Patterns

Prefer:

```tsx
setState((prev) => ({
    ...prev,
    field: value,
}));
```

Avoid:

```tsx
setState({
    ...state,
    field: value,
});
```

inside async-sensitive flows.

---

## Output Style

* Keep responses concise
* Avoid repeating the prompt
* Prioritize practical implementation
* Prefer incremental refactors

<!-- END:nextjs-agent-rules -->
