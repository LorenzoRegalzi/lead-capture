# Inventory capture

Mobile web app used in stores to take an inventory of a product display:

1. enter the store name and number;
2. scan the products' barcodes (EAN-13 / EAN-8) with the phone camera, or type them in;
3. take up to 4 photos of the display;
4. send everything: photos go to Firebase Storage, rows go to a Google Sheet through an Apps Script.

Built with Next.js (App Router), React 19 and Tailwind CSS 4. Deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # or create it by hand, see "Environment variables"
npm run dev                  # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Re-run tests on every change |
| `npm run lint` | ESLint |

### Testing on a phone

The camera only works in a secure context (HTTPS or `localhost`), so a phone on the LAN needs HTTPS.
Create a self-signed certificate for your machine's IP once, then start the dev server with it:

```bash
IP=192.168.0.25   # your machine's LAN IP (hostname -I)
openssl req -x509 -newkey rsa:2048 -nodes -days 30 \
  -keyout dev-key.pem -out dev-cert.pem \
  -subj "/CN=$IP" -addext "subjectAltName=IP:$IP,DNS:localhost"

npx next dev --experimental-https \
  --experimental-https-key dev-key.pem --experimental-https-cert dev-cert.pem \
  -H 0.0.0.0
```

Open `https://<IP>:3000` on the phone and accept the certificate warning. `*.pem` files are git-ignored.

> The dev server talks to the real Firebase bucket and Google Sheet: use a store name like `TEST` for trials.

## Environment variables

Set them in `.env.local` locally and in the Vercel project settings.

| Variable | Used by | Value |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | `/api/upload` | Firebase service-account JSON, base64-encoded |
| `FIREBASE_STORAGE_BUCKET` | `/api/upload` | Bucket name, e.g. `my-project.appspot.com` |
| `GOOGLE_SCRIPT_URL` | `/api/save-inventory` | URL of the Apps Script web app deployment (`…/exec`) |

## How it works

### Screens and routes

| URL | Screen |
|---|---|
| `/` | Store form (step 1) — also links to the history |
| `/scan` | Camera scanner + barcode list (step 2) |
| `/manual` | Add a barcode by hand (step 2) |
| `/photos` | Photos and send (step 3) |
| `/done/[id]` | "Inventory sent" summary, Share CSV, New inventory — clears the draft |
| `/history` | Every inventory sent from this phone |
| `/history/[id]` | One inventory in detail |

`/scan`, `/manual` and `/photos` live in the `app/(inventory)` route group: its layout sends the user back to `/` when no store is set. `/done/[id]` is outside the group on purpose, because it clears the draft; it reads the sent inventory from the history by its id.

After a scan the result overlay replaces the scanner, so the camera stays off until the user taps — otherwise the same barcode would be read over and over.

### Data on the phone

Stored in `localStorage`, so nothing is lost if the browser reloads or kills the tab (common when the camera app opens):

- `lead-capture:draft:v2` — the inventory in progress: store, barcodes, `submissionId`. Photos are **not** saved: they live in memory only and must be retaken after a reload.
- `lead-capture:history:v1` — every send attempt with its status (`sent`, `failed`, `pending` = started but never confirmed). From `/history` each one can be viewed, shared as CSV or resent.

The `lead-capture:` prefix is the app's original name; don't rename the keys or phones lose their drafts and history.

### Sending an inventory

1. Photos are compressed on the phone (max 3072px, JPEG quality 0.9 → 0.7 only if needed) to stay under Vercel's 4.5MB request limit while keeping enough detail to see defects on the furniture.
2. Each photo is uploaded to `/api/upload` → Firebase Storage under `uploads/<submissionId>/`; the route returns a signed read URL.
3. `/api/save-inventory` forwards the inventory to the Apps Script, which appends one row per barcode (photo URLs on the first row only).

`submissionId` is generated once per inventory and kept across retries; the Apps Script uses it to ignore an inventory that is already in the sheet, so **Resend** never creates duplicates.

Both the "Inventory sent" screen and the send-error screen offer **Share CSV** (same file as in the history), so an inventory can always leave the phone — e.g. by WhatsApp or email — even when sending keeps failing.

### Apps Script

The source is in [`appscript2.js`](appscript2.js) (current) — [`appscript.js`](appscript.js) is the previous version, kept for reference. To deploy it:

1. Paste `appscript2.js` into the Apps Script project bound to the sheet.
2. Project Settings → Script Properties → add `SHEET_ID` with the spreadsheet id.
3. Make sure the sheet has a "Submission ID" header in column **K**.
4. Deploy → New deployment (Web app) and put the new URL in `GOOGLE_SCRIPT_URL`.

It takes a script lock before writing, so inventories sent at the same moment don't overwrite each other.

## Project structure

```
app/                     routes only
  (inventory)/           pages that need a store (scan, manual, photos) + their guard layout
  api/                   save-inventory, upload
  done/  history/  page.tsx  layout.tsx
src/
  components/            screens (StoreForm, ScanScreen, PhotosScreen, History, …)
  components/ui/         shared building blocks: Screen + ScreenHeader, Button, TextField, Feedback
  hooks/useInventoryDraft.ts   draft state, photo handling, submit
  providers/             InventoryDraftProvider: shares the draft between pages
  lib/                   inventory API calls, history, CSV, routes, strings, image compression
tests/                   same layout as app/ and src/
```

### UI conventions

- Every screen uses `<Screen header={<ScreenHeader …/>} footer={…}>`: Back on the left, title in the middle, the main action pinned at the bottom.
- Buttons come from `<Button variant="primary | secondary | success | danger | ghost">`; `success` is reserved for sending the inventory.
- Colors are design tokens defined in `app/globals.css` (`bg-primary`, `text-muted`, `border-line`, …) — don't use raw Tailwind colors.
- Every user-facing text is in `src/lib/strings.ts`; tests import the same strings.
- A disabled main action always comes with a `<Hint>` explaining why. No `alert()`/`confirm()`: use `ConfirmDialog` and `Toast`.

## Tests

Vitest + Testing Library, in `tests/`. `tests/flow.test.tsx` drives the whole app through an in-memory router (store → scan → photos → done → history), including reloads; the camera and image compression are mocked, so check those on a real phone.

## Known limitations

- Photos aren't persisted: after a reload they must be retaken.
- A retry after a partial upload uploads every photo again (duplicate files in Storage, not in the sheet).
- Signed photo URLs never expire.
