# Ad Campaign Dashboard

Internal dashboard for managing products, campaigns, styles, and ad generation workflows.

## Development

Run the app locally with:

```bash
pnpm dev
```

Build for production with:

```bash
pnpm build
```

## Navigation Guard Notes

Unsaved-change protection in the dashboard should follow this rule:

- Keep normal `next/link` usage. Dirty-form protection for link clicks, browser refresh or close, and back or forward should be handled by shared provider-level logic.
- For imperative navigation such as `router.push()`, `router.replace()`, and `router.back()`, use the shared guarded helpers from the unsaved-changes infrastructure. The Next.js App Router does not expose a clean global interception API for those imperative calls.
- Do not introduce a separate `GuardedLink` component unless there is a concrete gap the provider-level anchor interception cannot cover.

Reasoning:

- Plain links render to anchors, so they can be intercepted centrally.
- Imperative router calls happen inside arbitrary components and cannot be reliably blocked globally without brittle framework-level hacks.
- The preferred pattern is shared guard logic with page-level dirty-state registration.
