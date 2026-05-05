# Admin E2E smoke (manual)

Use this checklist when verifying admin flows; the repo does not include a Playwright or browser harness yet.

1. **Sign in** as a user with the Admin role.
2. Open **Admin** from the app shell (or go to `/admin`).
3. **Sets** — use **Add set** to create a test set (unique code, name). Confirm it appears in the list.
4. Open the new set and go to **Cards** — **Add card** with a name and collector number, save, confirm the row appears.
5. On the set overview, use **Mark released** (or edit the set) so the set is not stuck in “future” if your workflow requires it.
6. **Publish catalog** (sets overview card or global admin) if you need gallery visibility in non-admin views.
7. **Import** — open the set’s **Import** tab, run **Dry run** on a small valid JSON array, then **Run bulk import**; confirm the ingestion job section shows status.
8. Sign out (optional) and confirm a non-admin cannot open `/admin` routes.

## Notes

- Legacy `/admin/import` forwards to **Sets** with a dismissible notice; `?legacy=1` shows a helper page to jump to set-scoped import.
- **Clear all cards** lives under Advanced on the set import page and requires typing the confirmation phrase.
