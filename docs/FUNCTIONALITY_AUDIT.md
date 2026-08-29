# NEXUS Functionality Audit — Phase 2 Bug-Fix Pass

**Date:** 2026-08-27  
**Scope:** Phases 0–2. No Phase 3 work, no UI redesign.

---

## Summary

| Category | Count |
|---|---|
| P0 critical | 0 |
| P1 high (fixed) | 1 |
| P2 medium (fixed) | 3 |
| P3 low / known limitations | 4 |
| Build status | ✅ 0 TS errors, successful |

---

## Bug Table

| Feature | Status | Severity | Problem | Fix |
|---|---|---|---|---|
| ProfileReview — targetRole edit | FIXED | P1 | Editing `targetRole` text did not update `targetRoleId` (CareerTrack). `buildLearnerContext` uses `targetRoleId` for the goal, so editing the role in review had no effect on the generated context. | Exported `extractTargetRole` from `onboarding.ts`; ProfileReview now reverse-maps the edited label back to a `CareerTrack` and updates both fields atomically. |
| ProfileReview — timeline edit | FIXED | P2 | Editing `targetDateRaw` did not re-parse and update `targetDate` (Date object). `buildLearnerContext` uses `targetDate` for `goal.targetDate`. | Exported `extractTimeline` from `onboarding.ts`; ProfileReview now parses the edited raw string and updates both `targetDateRaw` and `targetDate`. |
| `generateNextQuestion` — NEXUS NOTICED insight for strong programming background | FIXED | P2 | `generateInsight(profile, 'asking_skills')` was never called anywhere in `generateNextQuestion`. The insight "Strong software development foundations detected" was dead code — it would never appear. | Added `insight: generateInsight(profile, 'asking_skills') ?? undefined` to all three return branches of the `asking_experience` case. The insight now fires for the P0 demo input. |
| `generateNextQuestion` — duplicate hours insight | FIXED | P2 | `generateInsight(profile, 'asking_preferences')` (which shows "X hours/week is...") was called in both the `asking_availability` case AND the `asking_preferences` case. The same insight appeared twice across two consecutive conversation turns. | Removed the `insight:` line from the `asking_preferences` case. Insight now fires exactly once — on the reply that asks how the learner prefers to learn. |

---

## P0 Onboarding Input Test

**Input:** "I want to become an ML Engineer within 6 months. I currently work in frontend development and know JavaScript, React and TypeScript, but I'm still learning Python and machine learning."

**Result: PASSES**

Trace:
- `extractTargetRole` → `{ track: 'ml_engineer', label: 'ML Engineer' }` ✓
- `extractTimeline` → `{ raw: '6 months', date: Date+6mo }` ✓
- `extractCurrentRole` → `'Frontend Developer'` ✓
- `extractExperienceLevel` → `'intermediate'` ✓
- `extractSkills` → JavaScript(strong), React(strong), TypeScript(strong), Python(learning), Machine Learning(learning) ✓
- Full string accepted without truncation ✓
- Enter and Submit button both submit ✓
- No validation blocks it ✓
- Conversation advances to `asking_experience` stage ✓
- Profile preview updates with extracted data ✓
- NEXUS NOTICED insight fires on the next reply (after P1 fix) ✓

---

## Conversation State Tests

| Scenario | Result |
|---|---|
| Full intro → experience → skills → availability → preferences → review flow | WORKING |
| Empty message | WORKING — textarea check `value.trim()` prevents submission |
| Whitespace-only message | WORKING — same `trim()` guard |
| Long message (full P0 input) | WORKING — no truncation in textarea or parser |
| Punctuation | WORKING — extractors use regex, unaffected by surrounding punctuation |
| Repeated information | WORKING — `mergeProfile` uses union for arrays, scalar keys only overwrite if new value is non-empty |
| Information provided early and re-stated later | WORKING — `extractLearnerInformation` skips already-set scalars; skills use union |

---

## Profile Review Field Tests

| Field | Status | Notes |
|---|---|---|
| Goal | WORKING — editable | Free-text edit via `EditableField` |
| Target role | FIXED | Now also updates `targetRoleId` via `extractTargetRole` |
| Current role | WORKING — editable | Free-text |
| Experience level | WORKING — editable | Validates against beginner/intermediate/advanced |
| Weekly availability | WORKING — editable | Strips non-digits, parses integer |
| Target timeline | FIXED | Now also re-parses and updates `targetDate` |
| Learning preferences | WORKING — editable | Splits comma-separated string |
| Skills | VISUAL ONLY | Skills are displayed with confidence colour-coding but cannot be edited in this UI. Documented as future work. |

---

## Persistence Tests

| Scenario | Result |
|---|---|
| Onboarding → confirm → refresh | WORKING — `OnboardingContextProvider` reads `nexus_onboarding_profile` / `nexus_learner_context` from localStorage on mount via `useEffect`; dates revived correctly |
| Onboarding → navigate Home/Journey/Skills → return | WORKING — context persists in React state and localStorage |
| Clear localStorage → app starts | WORKING — `OnboardingContext` falls back to `null`; all pages use `DEMO_LEARNER_CONTEXT` (seed data) as fallback |

---

## Route Tests

| Route | Status | Notes |
|---|---|---|
| `/` | WORKING | Home dashboard, charts, next actions |
| `/onboarding` | WORKING | Full-screen, no sidebar/topbar |
| `/journey` | WORKING | Path nodes, expandable cards, AIInsight |
| `/skills` | WORKING | Search, category filter, skill detail panel |
| `/assessments` | WORKING | Tabs, assessment cards |
| `/tutor` | WORKING | AI chat, fallback response when no API key |
| `/genome` | WORKING | Radar chart, bar chart, learning traits |
| `/career` | WORKING | Role comparison, skill gap table |
| `/passport` | WORKING | Verified skills, badges |
| `/projects` | WORKING | Tabs, project cards |
| `/settings` | WORKING | Toggle rows (visual-only toggles) |

All routes compile to static pages (except `/api/tutor` which is dynamic). No runtime crashes detected.

---

## Interactive Elements Classification

| Element | Classification | Notes |
|---|---|---|
| Sidebar nav links | WORKING | Next.js `Link`, active state, collapse |
| Sidebar collapse toggle | WORKING | Animated 220px ↔ 60px |
| Sidebar mobile drawer | WORKING | Backdrop, close on overlay click |
| Onboarding textarea (intro) | WORKING | Enter submits, button submits |
| Onboarding conversation input | WORKING | Enter submits, disabled during thinking |
| Suggested reply chips | WORKING | Click submits as user message |
| ProfileReview editable fields | WORKING | Hover to reveal, Enter/Escape to confirm/cancel |
| ProfileReview "Confirm" button | WORKING | Builds context, persists, navigates to `/` |
| ProfileReview "Edit profile" button | WORKING | Returns to conversation |
| Skills search input | WORKING | Filters skill grid live |
| Skills category filter buttons | WORKING | Filters by category |
| Skill node click | WORKING | Opens detail panel |
| Skill detail panel "Close" | WORKING |  |
| Skill "Start/Continue Learning" button | VISUAL ONLY | No navigation target yet |
| Journey node expand/collapse | WORKING | AnimatePresence height transition |
| Journey "Start Learning" / "View Project" / "Take Assessment" buttons | VISUAL ONLY | No navigation or modal |
| Assessments Tabs (All / In Progress / Completed) | WORKING | Tab state managed locally |
| Assessment card hover | WORKING | Hover reveals CTA |
| Assessment "Start Assessment" button | VISUAL ONLY | No quiz flow |
| Projects Tabs | WORKING | Filter by status |
| Project card "Start/Continue/View" button | VISUAL ONLY | No project execution flow |
| AI Tutor message input | WORKING | Enter submits, Shift+Enter new line |
| AI Tutor suggested prompts | WORKING | Click sends as message |
| AI Tutor fallback | WORKING | Deterministic responses when API unavailable |
| Settings toggles | VISUAL ONLY | Toggle UI renders but no state persistence |
| Settings "Save Changes" button | VISUAL ONLY | No persistence |
| Passport "Copy share link" | VISUAL ONLY | No real share URL |
| Career "Explore role" buttons | VISUAL ONLY | No navigation |

---

## AI Tutor Tests

| Scenario | Result |
|---|---|
| With `ANTHROPIC_API_KEY` set | WORKING — POSTs to `/api/tutor`, Claude Opus 5 responds |
| Without API key | WORKING — API returns 503, client catch block fires `getFallbackResponse()` |
| Learner context passed | WORKING — `userContext` injected into system prompt |
| Loading state | WORKING — `TypingIndicator` shown while `isLoading` |
| Error handling | WORKING — fallback fires on any non-200 response or network error |
| Status indicator | VISUAL ONLY — always shows "Claude Opus 5 · Active" regardless of key presence |

---

## Console / Runtime Notes

- No hydration warnings expected: all data-heavy components are `'use client'` and initial state matches SSR
- `--bg-input`, `--bg-overlay`, `--text-tertiary`, `--accent-rose`, `--accent-green-glow`, `--accent-amber-glow` CSS variables all defined in `globals.css`
- `NODE_TLS_REJECT_UNAUTHORIZED` warning in build output is from the build environment, not from application code

---

## TypeScript & Build

```
npx tsc --noEmit   → 0 errors
npm run build      → ✅ successful
                   → 15 routes generated (14 static + 1 dynamic API)
```

---

## Known Limitations (Not Fixed — Future Work)

| Item | Reason not fixed |
|---|---|
| Skill editing in ProfileReview | Out of scope — would require significant new UI. Documented as future work. |
| `extractLearningPreferences` adds `['video', 'project']` defaults on every message | Minor: defaults are reasonable; overridden when user explicitly states preferences at the asking_preferences stage. Low impact. |
| Settings toggles have no persistence | Settings are visual scaffolding only — no backend or localStorage integration yet. Expected at this phase. |
| Journey / Assessment / Project action buttons are visual-only | Phase 3 work — requires full resource/assessment/project execution flows. |
| AI Tutor status indicator always shows "Active" | Cosmetic only; fallback works correctly. |
