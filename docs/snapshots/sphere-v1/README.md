# Learning Sphere — snapshot `sphere-v1`

Frozen copy of the sphere as it renders today (violet/cyan node cloud, auto-revealing
labels, hover tooltip, prerequisite/related edges). Taken **2026-08-31**, before any
sphere redesign, so the current look can be restored in one command.

The copies carry a `.snapshot` suffix on purpose: `tsconfig.json` includes `**/*.tsx`
and `**/*.ts`, so a plain `.tsx` copy in this folder would be type-checked as a second
copy of the module. The suffix keeps it inert — it is data, not source.

## What is in here

| Snapshot file | Restores to |
| --- | --- |
| `LearningSphere.tsx.snapshot` | `src/components/visualization/LearningSphere.tsx` |
| `SphereScene.tsx.snapshot` | `src/components/visualization/SphereScene.tsx` |
| `sphereDataAdapter.ts.snapshot` | `src/lib/visualization/sphereDataAdapter.ts` |
| `sphereLayout.ts.snapshot` | `src/lib/visualization/sphereLayout.ts` |
| `sphereTypes.ts.snapshot` | `src/lib/visualization/sphereTypes.ts` |

That is the whole sphere: nothing else in `src/` is sphere-only. Its two callers are
`src/app/page.tsx` (Home, "Your learning state") and `src/app/skills/page.tsx`.

## Restore

Either route gives the same bytes back — verify with the manifest below.

**Files (works even with no git history):**

```sh
cd <repo root>
cp docs/snapshots/sphere-v1/LearningSphere.tsx.snapshot   src/components/visualization/LearningSphere.tsx
cp docs/snapshots/sphere-v1/SphereScene.tsx.snapshot      src/components/visualization/SphereScene.tsx
cp docs/snapshots/sphere-v1/sphereDataAdapter.ts.snapshot src/lib/visualization/sphereDataAdapter.ts
cp docs/snapshots/sphere-v1/sphereLayout.ts.snapshot      src/lib/visualization/sphereLayout.ts
cp docs/snapshots/sphere-v1/sphereTypes.ts.snapshot       src/lib/visualization/sphereTypes.ts
```

**Git tag (same commit these copies were taken from):**

```sh
git checkout sphere-v1 -- src/components/visualization src/lib/visualization
```

The tag `sphere-v1` is local to this clone. `git push origin sphere-v1` if the backup
needs to survive the machine.

After restoring: `npx tsc --noEmit && npm run build`.

## Verify a restore

```sh
shasum -a 256 src/components/visualization/LearningSphere.tsx \
              src/components/visualization/SphereScene.tsx \
              src/lib/visualization/sphereDataAdapter.ts \
              src/lib/visualization/sphereLayout.ts \
              src/lib/visualization/sphereTypes.ts
```

Expected (sha256, at snapshot time):

```
782900e72389e366bc5c86e9471b558e77ca8747fe2d6421fd7d88fba3290190  LearningSphere.tsx
21bf386bdb50cef33271ff87a32989bce021967090f80b4f57cab0984f924489  SphereScene.tsx
b33317f274f457a7e591061c703d6afcef7674a2d3559e6c1cecf8c039b25e6a  sphereDataAdapter.ts
723b80553dfa7e39c4462833a6a270cfc3e3a1690f018340bedc737827952953  sphereLayout.ts
aab3cbc5108475f4cb460ded6e7d371ad2655081db949169f6090ed294184848  sphereTypes.ts
```

## What a restore also needs

The snapshot is source only — it assumes these versions are still installed:

```
three               ^0.185.1
@react-three/fiber  ^9.7.0
@react-three/drei   ^10.7.8
```

A future redesign that drops or upgrades any of them has to reinstall the pinned
range before this snapshot compiles again.

## The prop contract to preserve

If the sphere is rebuilt rather than replaced, keeping this signature means neither
caller has to change — and it means this snapshot can be dropped back in at any time:

```ts
interface LearningSphereProps {
  skills: SphereSkill[];                              // { id, name, mastery, importance, isRecommended?, isGoal? }
  connections: SphereConnection[];                     // { fromId, toId, type: 'prerequisite' | 'related' }
  selectedSkillId?: string | null;
  recommendedSkillIds?: string[];
  goalSkillId?: string | null;
  interactive?: boolean;
  onSkillSelect?: (skillId: string | null) => void;
  className?: string;
  height?: number;                                     // px — Home mirrors it in a CSS-sized box
}
```

Two behaviours the callers depend on beyond the props:

- **No SSR.** `SphereScene` is loaded through `next/dynamic` with `ssr: false` and a
  placeholder, because WebGL is client-only. Home reserves the same height in CSS
  (`h-[320px] lg:h-[460px]`, mirroring `SPHERE_HEIGHT_COMPACT` / `SPHERE_HEIGHT_WIDE`)
  so the box does not resize when the chunk lands.
- **The `sr-only` list.** A `<ul>` of buttons, one per skill, naming its mastery and
  whether it is recommended or the goal. That list *is* the sphere's accessibility
  story — a rebuild that drops it makes the map unreachable by keyboard.
