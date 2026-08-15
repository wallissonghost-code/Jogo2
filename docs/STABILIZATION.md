# Runtime stabilization

This branch is isolated from `main` and must not be deployed until validated.

## Rules
- `main` remains the production branch.
- Do not point `index.html` at experimental builds before validation.
- New gameplay changes should be consolidated into one executable source instead of chaining runtime `fetch -> replace -> Blob -> import` patches.
- Validate startup before promotion: Three.js import, renderer creation, world creation, NPC/car initialization, first animation frame, loading-screen dismissal.
- A startup failure must surface an explicit error instead of leaving the loading screen indefinitely.

## Current diagnosis
The production chain currently layers beta015 over beta014 over beta012. This makes exact-string runtime patches fragile: a changed source fragment can make a replacement silently fail or generate incompatible JavaScript.

## Promotion policy
Only merge/promote this branch after the candidate starts successfully and core smoke checks pass.
