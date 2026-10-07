# Part A — Candidate modal fixes

## Files changed
- `src/features/coordinator/components/modals/AddCandidates.tsx`
- `src/features/coordinator/components/modals/EditCandidate.tsx`

## Bug 1 — modal closing mid photo upload
- Added `const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);` in both modals.
- Passed `onUploadingChange={setIsUploadingPhoto}` to each modal's `CloudinaryImageUpload` instance (via the `Controller` render for `photoUrl`).
- `handleClose()` in both modals now bails out when either the mutation is pending or a photo is uploading:
  `if (createContestant.isPending || isUploadingPhoto) return;` (Add) and the equivalent `updateContestant.isPending || isUploadingPhoto` (Edit).
- The footer Cancel `Button` in both modals is now `disabled={createContestant.isPending || isUploadingPhoto}` / `disabled={updateContestant.isPending || isUploadingPhoto}`.
- No change needed to `Modal`'s `onClose` wiring — it already routes through `handleClose`, which now guards on the new flag. Backdrop click, the header close (X) button, and Escape all go through `onClose`/`handleClose`, so all three paths are covered.

## Bug 2 — narrow modal / cramped name fields
- Added `size="lg"` to both `<Modal>` usages (matches org_owner's "Create Pageant" modal convention, `max-w-2xl`).
- Bumped the 3-column name row and the 2-column display name/gender row from `gap-4` to `gap-5` in both modals for more breathing room at the new width.

## Verification
- `npx tsc --noEmit` from `frontend/` — passed with exit code 0, no type errors.
- Re-read both files end-to-end after editing to confirm all four changes are present in both: `isUploadingPhoto` state, `onUploadingChange` wiring, `handleClose` guard, and `size="lg"` on `Modal`.
