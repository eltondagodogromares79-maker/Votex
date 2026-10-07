# Coordinator Candidate Modals — Implementation Notes

## Summary

Rebuilt the coordinator candidate management modals to match the org_owner
"auth palette" dialog style, using the shared `Modal`/`ConfirmModal` components.

### Files changed

- `src/features/coordinator/components/modals/AddCandidates.tsx` — rebuilt to
  use `Modal`, `Field`/`fieldInput`/`fieldLabel`/`fieldError` conventions (copied
  from `app/(org_owner)/org_owner/teams/coordinator/page.tsx`), and
  `CloudinaryImageUpload` (folder `contestant-photos`, `dark`, `rounded`) instead
  of the old raw photo URL text input. Still uses `useCreateContestant` and the
  same zod schema pattern (now exported as `candidateFormSchema` so the Edit
  modal can reuse it). Added `useToast` success/error feedback.
- `src/features/coordinator/components/modals/EditCandidate.tsx` — new.
  `EditCandidateModal` component. Takes `pageantId`, `candidate: CandidateResponse | null`,
  `onClose`. Pre-fills the form via `reset()` when `candidate` changes. Uses
  `useUpdateContestant(pageantId, candidate?.id ?? "")` keyed off the edit
  target, mirroring the `useUpdateCoordinator(orgId, editTarget?.userId ?? "")`
  pattern in the reference page. Same field set as Add, reusing
  `candidateFormSchema`/`Field`/`fieldInput` exported from `AddCandidates.tsx`.
- `src/features/coordinator/components/modals/DeactivateCandidate.tsx` — new.
  `DeactivateCandidateModal`, a thin wrapper around the shared `ConfirmModal`.
  Calls `useDeactivateContestant(pageantId)` with the target's `id`. Copy says
  "Deactivate Candidate" / "Deactivate" (not "Delete") since the backend DELETE
  endpoint is a soft-delete/deactivation, consistent with the existing
  `isActive`-driven status badge in the list.
- `src/features/coordinator/components/management/CoordinatorCandidatesSection.tsx` —
  replaced the dead "Manage" button (desktop + mobile) with working "Edit" and
  "Deactivate" buttons. Added `editTarget`/`deactivateTarget` state
  (`CandidateResponse | null`), wired to the new modals. `isAddModalOpen` wiring
  and `useContestants` data-fetching/layout left untouched.

### Not modified (per constraints)

- `Modal.tsx`, `Button.tsx`, `CloudinaryImageUpload.tsx` — untouched.
- `coordinator.ts` API client, `useContestants.ts` hooks — untouched, no bugs found.
- Backend — untouched.
- No reactivate/restore flow added (out of scope, no backend endpoint).

## Verification

Ran from `frontend/`:

1. `npx tsc --noEmit` → **exit 0**, no output (no type errors).
2. `npx eslint <4 changed files>` → **exit 0**, no output (no lint errors/warnings).
3. `npm run build` (`next build`, Turbopack) → **succeeded**:
   - "Compiled successfully in 3.1s"
   - "Finished TypeScript" (build-time type check also clean)
   - All 79 routes generated successfully, including `/coordinator/pageants/[pageantId]`
     where `CoordinatorCandidatesSection` is rendered.

## Manual trace-through (read final code, no dev server/screenshots per task guidance)

- **Add flow**: `AddCandidateModal` opens on `+ Add Candidate` / empty-state CTA.
  Zod resolver validates on submit; `Field` renders `errors.<name>?.message` under
  each input. `createContestant.isPending` disables Cancel and feeds
  `Button`'s `loading` prop on Submit (shows spinner, auto-disables). On success:
  toast.success, `reset()`, `onClose()`. `useCreateContestant`'s
  `onSuccess: invalidateQueries` (untouched) refreshes the list automatically.
  On failure: `toast.error` with `ApiError.userMessage` fallback.
- **Edit flow**: Clicking "Edit" sets `editTarget`, which both opens the modal
  (`open={!!candidate}`) and keys `useUpdateContestant(pageantId, candidate?.id ?? "")`.
  `useEffect` on `candidate` pre-fills the form via `reset()`. Submit behaves like
  Add (loading/disable/toast/close), relies on the hook's existing
  `invalidateQueries` to refresh the list.
- **Deactivate flow**: Clicking "Deactivate" sets `deactivateTarget`, opening the
  `ConfirmModal` (`destructive`, confirmLabel "Deactivate"). Confirm calls
  `useDeactivateContestant(pageantId).mutateAsync(candidate.id)`; loading state
  passed to `ConfirmModal`'s `loading` prop (disables Cancel, spinner on Confirm).
  Success → toast + close; list refetches via existing `invalidateQueries`;
  candidate now shows "Inactive" via the pre-existing `CandidateStatus` badge.
  Failure → toast.error.

All three modals share the navy-card / gold-accent chrome from `Modal.tsx` —
no ad-hoc overlay markup remains.
