# I need this, don't judge :)

## How Next works i think
```
/app            → pages (each folder is a route)
/api            → backend endpoints
/lib            → logic (DB, services)
/components     → reusable UI
```

## How backend works
Example
/api/create-case → POST request
/api/upload-url → GET signed S3 URL

## Data Flow
***USer submits a form***
<!-- FIX -->
CaseForm.tsx (component)  →  calls /api/create-case  →  route.ts  →  lib/cases.ts  →  Firebase

***USer uploading file***
<!-- FIX -->
FileUploader.tsx  →  calls /api/upload-url  →  gets signed URL  →  uploads directly to S3

***General flow between files***
```
app/page            = page and component wrapper. no logic,                 **no api calls**
components/xyz      = store state, input validation, submit handlers,       **call hook/api**
hooks/xyz           = helper (e.g. useSubmit, useUpload),                   **call api/logic**
app/api/x/route     = recieve request, validate input                       **call logic**
lib/xyz             = process data, talk to db/auth (e.g. firebase)         **return data to api call**
```


## using hooks
**GOOD**
- need reusable frontend logic
- managing state (upload progress, loading, auth, cases)

**BAD**
- firebase writes (create, update, delete)
- backend logic
- database logic


## Project Structure

### Planned project structure
```
hayes_hip_and_elbow_scoring/
│
├── app/                        # main app routes (pages)
│   ├── layout.tsx              # global layout (navbar, styles)
│   ├── page.tsx                # homepage (/)
│   ├── about/                  # about page
│   │   └── page.tsx
│   ├── submit/                 # form submission page
│   │   └── page.tsx
│   │
│   ├── checkout/               # checkout / payment page
│   │   └── page.tsx
│   │
│   ├── success/                # after successful submission
│   │   └── page.tsx
│   │
│   ├── admin/                  # admin dashboard
│   │   ├── page.tsx            # case list
│   │   └── cases/
│   │       └── [id]/           # cynamic route for each case
│   │           └── page.tsx
│   │
│   └── api/                    # backend routes
│       ├── cases/
│       │   │── route.ts        # POST (create), GET (list)
│       │   └── [id]/
│       │       └── route.ts    # GET (read one), PATCH (update anything of one), DELETE (delete one)
│       │
│       ├── upload-url/
│       │   └── route.ts        # generates signed upload URL (S3 for amazon)
│       │
│       ├── payment/            # stripe payment session
│       │   └── route.ts        
│       │
│       ├── email/              # sends confirmation email
│       │   └── route.ts
│       │
│       └── webhook/            # webhook handler
│           └── route.ts
│
│
│
├── components/                 # reusable UI components
│   │
│   ├── form/
│   │   ├── CaseForm.tsx        # main submission form
│   │   └── InputField.tsx      # reusable input
│   │
│   ├── upload/
│   │   ├── FileUploader.tsx    # drag + drop uploader
│   │   └── UploadProgress.tsx  # progress UI
│   │
│   ├── admin/
│   │   ├── CaseTable.tsx       # table of cases
│   │   ├── CaseRow.tsx
│   │   └── CaseDetail.tsx
│   │
│   ├── ui/                     # generic UI
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Loader.tsx
│   │
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
│
│
│
├── lib/                        # core logic
│   ├── firebase.ts             # firebase init (db, storage + auth)
│   ├── s3.ts                   # AWS S3 config + helpers
│   ├── stripe.ts               # stripe setup
│   ├── email.ts                # email sending logic
│   ├── cases.ts                # case-related functions (createCase, getCase, etc)
│   └── utils.ts                # helpers (formatting, etc)
│
│
│
├── types/                      # TypeScript types
│   ├── case.ts
│   ├── user.ts
│   └── file.ts
│
│
│
├── hooks/                      # custom React hooks
│   ├── useUpload.ts            # upload logic hook
│   ├── useCases.ts             # fetch cases
│   └── useAuth.ts              # firebase auth hook
│
│
│
├── styles/
│   └── globals.css             # global styles
│
│
│
├── public/                     # static assets
│   ├── images/
│   └── icons/
│
│
│
├── .env.local                  # sneaky secrets
├── .env                        # even more sneaky secrets :)
│
├── package.json
└── tsconfig.json
```

### Maybe actualy project structure
<!--  -->

## DB Structure

### Firestore Folder Structure
clinics
├── clinic_001
│   ├── clinicName
│   ├── contactName
│   ├── email
│   ├── phone
│   ├── address
│   ├── billingType
│   ├── active
│   ├── createdAt
└───└── updatedAt

users
├── user_001
│   ├── role ("admin" | "clinic")
│   ├── clinicId
│   ├── name
│   ├── email
│   ├── createdAt
└───└── updatedAt

submissions
├── submission_001
│   ├── status
│   ├── submitterType ("owner" | "clinic")
│   ├── clinicInfo (optional - clinicName, contactName, email, phone; only when submitterType is "clinic")
│   ├── payer ("owner" | "clinic")
│   ├── pdfFormRef
│   ├── createdAt
│   ├── updatedAt
│   │
│   ├── billing
│   │   ├── paymentStatus
│   │   ├── billingType ("payNow" | "invoice" | "batchMonthly")
│   │   ├── stripePaymentIntentId
│   │   ├── invoiceId
│   │   └── invoiceSentAt
│   │
│   ├── owner
│   │   ├── name
│   │   ├── email
│   │   ├── phone
│   │   ├── address
│   │   └── memberNumber
│   │
│   └── dog
│       ├── registeredName
│       ├── registeredNumber
│       ├── microchipNumber
│       ├── breed
│       ├── sex
│       ├── dateOfBirth
│       ├── isDogsAustraliaRegistered
│       ├── dicomFilesRef
└───────└── supportingDocumentsRef




invoices
├── invoice_001
│   ├── clinicId
│   ├── submissionIds[]
│   ├── amount
│   ├── status
│   ├── quickbooksInvoiceId
│   ├── issuedAt
└───└── paidAt

archivedSubmissions
├── submission_001
│   ├── archiveDate
│   ├── originalSubmissionId
└───└── metadata


### S3 Folder structure
submissions/
└── submission_001/
│   │
│   ├── dog_001/
│   │   │
│   │   ├── dicom/
│   │   │   ├── hips.dcm
│   │   │   └── elbows.dcm
│   │   │
│   │   ├── supporting-documents/
│   │   │   ├── pedigree.pdf
│   │   │   ├── vaccination.pdf
│   │   │   └── registration.pdf
│   │   │
│   │   └── pdf-forms/
│   │       └── submission-form.pdf
│   │
│   ├── dog_002/
│   │   ├── dicom/
│   │   ├── supporting-documents/
└───└───└── pdf-forms/



## Helpful Links
- [QuickBooks Documentation](https://developer.intuit.com/app/developer/qbo/docs/get-started)

## GIT stuff
### Branches
- admin
- archive
- auth
- desktop-ui
- docs
- emails
- file-upload
- firebase
- mobile-ui
- prelaucnh-landing
- submit-form
- transactions
- testing
- prod
<!-- temp branches -->
- fix/old-node-version
- fix/remove-optional
- fix/admin-case-dob
- fix/submission-clarity
- fix/deps

### Commit format & Notes
commitType(topic): small description
commit types: [`feat`, `fix`, `refactor`, `style`, `docs`]

### Pull Request Format
Fixed header vocabulary, flexible per PR - include only the headers relevant to the change, skip the rest:
**Title** *Description*
**Summary** *Description*
**Problem** *Description*
**Fix** *Description*
**New Infrastructure** *Description*
**Tested** *Description* 
(A style/refactor PR might only need **Summary** + **Tested**) 
(A bug fix might use **Problem** + **Fix** + **Tested**)
#### Tested Format Example
- uploaded a single file and deleted it
- uploaded multiple files and deleted them all one by one
- uploaded a file, deleted it, reloaded the page to confirm localStorage stayed in sync





## Testing and Deployment
### general development CMDs
```bash
# terminal 1:
npm run dev
# terminal 2:
# needs the Stripe CLI (brew install stripe/stripe-cli/stripe) + `stripe login` to the sandbox
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/webhooks/stripe
```

### Regular testing routine
- Testing `cleanup-drafts`/`cleanup-abandoned` locally hits the **real** `submissions`
  collection (seed and clean up test docs deliberately).
```bash
# first get cron secret:
CRON_SECRET=$(grep '^CRON_SECRET=' .env.local | cut -d '=' -f2-)
# test cleanup-drafts (never finished submission):
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/cleanup-drafts
# test cleanup-abandoned (finished submission but never paid):
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/cleanup-abandoned
```

- devtools`updateSubmissionPaymentStatus(id, "paid")` should come back `permission-denied`.
```bash
# can run this with env vars in devtools...i should make something better than this:
# const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js");
# const { getFirestore, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js");

# const app = initializeApp({
#   apiKey: "xxxxxxxxxxxx",
#   authDomain: "xxxxxxxxxxxx",
#   projectId: "xxxxxxxxxxxx",
#   storageBucket: "xxxxxxxxxxxx",
#   messagingSenderId: "xxxxxxxxxxxx",
#   appId: "xxxxxxxxxxxx",
# });
# const db = getFirestore(app);

# await updateDoc(doc(db, "submissions", "xxxxxxxxxxxx"), {
#   "billing.paymentStatus": "paid",
#   updatedAt: new Date(),
# });
```

### Deployment
```bash
# push current branch, merge into master with PR:
git push...
# checkout master and pull origin:
git checkout master
git pull origin master
# checkout prod and pull no-rebase origin master:
git checkout prod
git pull --no-rebase origin master
# then (commit if needed first) push origin prod:
git push origin prod
# vercel with start building the prod branch after this:
```




## Firebase App Check (anti-abuse, not yet set up)
Firestore rules constrain *what* a write can contain; App Check constrains *who* can even
attempt one - it stops someone extracting the public `NEXT_PUBLIC_FIREBASE_*` config out of
the JS bundle and scripting requests straight at Firestore instead of going through the
real site. Worth doing before launch (the anonymous submitter writes in `lib/firebase.ts`
are the exact surface this protects) but not urgent/blocking today.

- Register a reCAPTCHA v3 site (free) at https://www.google.com/recaptcha/admin -
      get the site key + secret key.
- Firebase Console → Project settings → App Check → register the web app with the
      reCAPTCHA v3 provider, pasting in the secret key.
      https://firebase.google.com/docs/app-check/web/recaptcha-provider
- In `lib/firebase.ts`, after `initializeApp`, call `initializeAppCheck(app, { provider:
      new ReCaptchaV3Provider(NEXT_PUBLIC_RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled:
      true })` - guard with `typeof window !== "undefined"` since this file can be
      evaluated outside the browser. Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` to Vercel env
      vars (public value, safe to expose).
- Local dev needs the debug provider instead of reCAPTCHA (localhost can't attest) -
      logs a debug token to the console on first run, which then gets registered in
      Firebase Console → App Check → Manage debug tokens.
      https://firebase.google.com/docs/app-check/web/debug-provider
- Firebase Console → App Check → run in **monitor mode** first for a few days (check
      the Cloud Firestore metrics), then flip **Enforce** once confident real traffic
      isn't being blocked. https://firebase.google.com/docs/app-check/enable-enforcement
- Optional stretch: the S3 presign API routes (`/api/upload-url` etc.) aren't Firebase
      resources, so App Check doesn't cover them automatically - could send the App Check
      token as a header and verify it server-side with `getAppCheck().verifyToken()`
      (firebase-admin) to extend the same protection there.
      https://firebase.google.com/docs/app-check/custom-resource-backend




## Retrospective review (Nov 2026)
Found reading through the whole project, not by tests - none of these have an `it.fails` yet.

### Urgent (security / live data)
#### A. `/admin` pages send every customer's PII to unauthenticated visitors
- **Where:** `app/admin/layout.tsx` (client-only `useAuth()` gate), every admin page
  (`app/admin/page.tsx`, `cases/[id]`, `pending-reviews`, `archive`, `test-data`)
- **Problem:** the pages are Server Components that call `getAllSubmissions()` / `getSubmissionById()`
  via the Admin SDK with no auth check, and pass the results to client components. The RSC payload
  is serialized into the response *whether or not* the client layout renders `children` - so the
  "Loading..." screen ships every owner's name/email/phone/address, and the case page ships
  30-min presigned DICOM download URLs. A client-side auth gate is UX, not a security boundary.
- **Check:** `curl -s localhost:3000/admin | grep -o '[a-z0-9.]*@[a-z0-9.]*' | sort -u`
- **Fix idea:** Firebase session cookies (`createSessionCookie` on sign-in via a route/action,
  `verifySessionCookie` server-side). A `requireAdmin()` helper called at the top of every admin
  page and every admin mutation - close to the data, not just in the layout/`proxy.ts`.

#### B. Any Firebase Auth account counts as admin
- **Where:** `firestore.rules` (`isAdmin()` = `request.auth != null`), `verifyAdminToken` in `lib/firebaseAdmin.ts`
- **Problem:** if Email/Password sign-up is still enabled in the Firebase project, anyone can create
  an account via the REST API with the public `NEXT_PUBLIC_FIREBASE_API_KEY` (no sign-up page needed)
  and then list all submissions / change statuses.
- **Fix idea:** now: Firebase Console → Authentication → Settings → User actions → untick
  "Enable create (sign-up)". Proper: an `admin: true` custom claim, checked in rules and `requireAdmin()`.

### Bugs
#### C. Checkout prices whatever the client says, not what's in Firestore
- **Where:** `app/api/create-checkout-session/route.ts:88` (prices `items` from the request body)
- **Problem:** `items` (examType, isDogsAustraliaRegistered) are never compared to the docs behind
  `submissionIds`. Devtools can save a "Hips & Elbows" doc and send `elbowsOnly` → pay $60 not $130,
  webhook marks it `paid`. `billing.amount` on the doc is also client-written.
- **Fix idea:** load the docs by `submissionIds` with the Admin SDK and price from them (also check
  they're `pendingReview` + `unpaid`). Drop `items` from the request entirely.

#### D. "Edit" on a completed dog doesn't un-complete it - checkout submits the stale snapshot
- **Where:** `components/submission/DogEntry.tsx:160` (`onEdit` only flips local `isComplete`)
- **Problem:** parent `completedDogs` (`hooks/useSubmissionDraft.ts`) keeps the old entry, so
  `allComplete` stays true and Pay stays enabled while editing. Change exam type or delete a file
  during edit, hit Pay → old data (incl. already-deleted S3 keys) gets submitted.
- **Fix idea:** derive "completed" from `dogDrafts[i].isComplete` instead of keeping a separate
  `completedDogs` copy (duplicated state drifting apart). Quick patch: an `onUncomplete` callback
  that deletes `completedDogs[dogIndex]`.

### Architecture (bigger, do incrementally)
- **One trust model:** right now there are three - browser → Firestore guarded by rules
  (submissions, admin status/archive), route handler → Admin SDK (payments, uploads), Server
  Component → Admin SDK (admin reads, unguarded - see A). Bugs A and C live in the gaps. Direction:
  every write goes through server code (route handler or server action) using the Admin SDK, then
  Firestore rules become `allow read, write: if false` (also removes the `allow get: if true`
  trade-off and the `isUnpaidCheckout` special case).
- **Server action candidates:** `create-checkout-session`, `upload-url`, `delete-file`, `contact`,
  admin status/archive writes. Keep as route handlers: `webhooks/stripe`, crons (external callers).
- **`/success` could be a Server Component** that reads `searchParams` and retrieves the Stripe
  session directly - `app/api/verify-payment` then isn't needed.
- **Runtime validation at boundaries:** `const body: UploadUrlRequest = await req.json()` is a type
  assertion in disguise (bug #5 below is a symptom). Zod/Valibot schema per route/action.
- **Two representations of the same files:** drafts write `files` (full objects), checkout also
  writes `dog.dicomFilesRef` / `dog.supportingDocumentsRef` / `pdfFormRef` (keys only). Admin views
  read one, crons read the other. Pick one.

### Cleanup / could-be-better
- **Stale comments:** `lib/firebase.ts:281,304,323` say rules allow admin writes "without auth" -
  they require `isAdmin()`. `cleanup-drafts/route.ts` header says `RESEND_API_KEY` is empty/unused.
  Also history-in-comments ("used to live here", "removed now that...") in `firestore.rules`,
  `lib/firebase.ts` etc - move to git history, keep comments true for someone who never saw the old version.
- **Duplicated comments:** `saveDraftFiles` explains `createdAt` + `deleteField()` twice (docblock + inline).
- **`SubmissionFlow.tsx`:** progress/total block rendered twice (~lines 219-260 and 269-284); inline
  SVGs despite `components/misc/Icons.tsx`; repeated clinic input classNames (→ `InputField`);
  `setClinicInfo({ ...clinicInfo, ... })` breaks the `prev =>` convention.
- **`"use client"` on whole pages** (`submit`, `success`) - push down to the components that need it.
- **Joke comment** in `hooks/useDogFileUpload.ts:99-101`.
- **Lint warnings (4 unused imports):** `app/admin/admin-settings/page.tsx`, `lib/firebase.ts`,
  `lib/validation.ts`, `types/dog.ts`.
- **"Planned project structure" above is stale** - replace with the actual one (or delete).
- **Scale limits to know about (fine for now):** `getAllSubmissions()` reads the whole collection
  and filters in JS on every admin page load; in-memory rate limiter is per-instance (already noted
  in `lib/security.ts`).




## Known Bugs (found by Vitest)
Each one has a test written for the *correct* behaviour, marked `it.fails` so the suite stays
green. Once a bug is fixed, that test starts failing ("expected to fail but passed") - flip
`it.fails` to `it` and it becomes a normal regression test.
```bash
npm run test:run          # unit (offline, dummy keys)
npm run test:integration  # live smoke tests against .env.local keys
```

### 1. Cron auth passes with `Bearer undefined` if `CRON_SECRET` is unset
- **Where:** `app/api/cron/cleanup-drafts/route.ts:51`, `app/api/cron/cleanup-abandoned/route.ts:39`
- **Problem:** the check is `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``. If the env var is
  ever missing in Vercel, the expected header becomes the literal string `"Bearer undefined"`,
  which anyone can send to trigger real deletions.
- **Fix idea:** fail closed - return 401 (or 500) if `CRON_SECRET` is falsy before comparing.
  Shared helper for both routes.
- **Test:** `tests/unit/api/cron.test.ts` - "401s 'Bearer undefined' when CRON_SECRET is unset"

### 2. One bad doc aborts the whole cron run
- **Where:** cron loops (`cleanup-drafts/route.ts:59`, `cleanup-abandoned/route.ts:47`),
  `lib/s3.ts:78` (`collectFileKeys`), `lib/firebaseAdmin.ts:316,358` (`files ?? {}` cast)
- **Problem:** no per-item try/catch, so one S3 error throws out of the loop - every later doc
  waits another day and the response never reports what was already deleted. A doc with no
  `files` field reaches `collectFileKeys` as `{}` and crashes on `.map`.
- **Fix idea:** try/catch per doc, collect `failedIds` alongside `deletedIds` in the response;
  make `collectFileKeys` default missing arrays to `[]`.
- **Tests:** `tests/unit/api/cron.test.ts` ("keeps going past one failing doc", "skips a stale
  doc with no files field"), `tests/unit/lib/s3.test.ts` ("tolerates a doc with no files")

### 3. Checkout error messages are swallowed on the client
- **Where:** `hooks/useSubmissionDraft.ts:222-223`
- **Problem:** `create-checkout-session` deliberately returns user-safe messages (429 "Too many
  requests - please wait a minute", Stripe's own error text), but `handleSubmit` only checks
  for `data.url` and replaces all of them with "No checkout URL returned".
- **Fix idea:** `if (!res.ok || !data.url) throw new Error(data.error ?? "No checkout URL returned")`
- **Test:** `tests/unit/hooks/useSubmissionDraft.test.ts` - "surfaces the server's own error message"

### 4. Cancel -> edit -> resubmit checkout fails for 24h (confirmed against real Stripe)
- **Where:** `app/api/create-checkout-session/route.ts:114`
- **Problem:** the idempotency key is built from the submission IDs only, and those IDs are
  deterministic (`{s3SubmissionId}_dog{n}`). Customer goes to Stripe, backs out, changes exam
  type (or dog name / registration), resubmits -> same key, different params -> Stripe
  returns `StripeIdempotencyError` and the customer can't pay until the key expires (~24h).
- **Fix idea:** include a hash of the priced cart in the key (e.g. sha256 of
  `JSON.stringify(line_items)`), so an identical double-click still dedupes but a changed
  cart gets a fresh session. Same for the coupon key.
- **Tests:** `tests/unit/api/create-checkout-session.test.ts` ("gives a changed cart ... a
  different idempotency key"), `tests/integration/stripe.test.ts` (live sandbox proof)

### 5. `upload-url` accepts bad `dogIndex` / filenames
- **Where:** `app/api/upload-url/route.ts:64` (dogIndex), `:89` (key built from raw fileName)
- **Problem:** `dogIndex` of `1.5`, `"abc"` or `"1"` passes (only `!dogIndex || dogIndex < 1`
  is checked), producing keys like `dog1.5/`. A `/` in `fileName` adds extra key segments, so
  `keyToUploadedFileStub` (`lib/firebaseAdmin.ts`) shows the wrong filename on the dashboard.
- **Fix idea:** `Number.isInteger(dogIndex) && dogIndex >= 1`; strip/replace `/` and `\` in
  `fileName` before building the key.
- **Tests:** `tests/unit/api/upload-url.test.ts` ("rejects a non-integer dogIndex", "a filename
  containing '/' survives the round trip")

### 6. Webhook signature failures log the full event payload (customer PII)
- **Where:** `app/api/webhooks/stripe/route.ts:38`
- **Problem:** `console.error("...signature verification failed:", err)` prints the whole
  `StripeSignatureVerificationError`, which carries the raw `payload` - for a real checkout
  that's the customer's name, email, phone and address, written to Vercel logs on every
  failed check (wrong/rotated secret, or anyone POSTing junk at the public endpoint). Found
  during the post-rotation webhook test, when the local secret didn't match `stripe listen`.
- **Fix idea:** log `err instanceof Error ? err.message : err` only (still enough to diagnose).
- **Test:** `tests/unit/api/stripe-webhook.test.ts` - "never logs the event payload (customer PII)"

### 7. Replacing the PDF form leaves the old file in S3 forever
- **Where:** `hooks/useDogFileUpload.ts:162` (`pdfForm: dogFiles.pdfForm ?? uploadedFiles?.pdfForm`)
- **Problem:** uploading a new PDF form swaps the reference in local state and the Firestore draft,
  but never deletes the old S3 object. Nothing references it anymore, so neither cron job can
  find it either - they only delete keys listed on a doc (`collectFileKeys`, `lib/s3.ts`). Every
  replaced form is permanently orphaned under `submissions/{id}/dog{n}/pdf-forms/`. Found while
  adding per-dog upload limits (it's also why `pdf-forms` isn't capped in `lib/uploadLimits.ts`).
- **Fix idea:** after the upload + `saveDraftFiles` succeed, if a previous `pdfForm` was replaced,
  delete its key via `/api/delete-file` - same order as `handleDeleteFile` (Firestore first, then
  S3, failures only logged). Existing orphans need a one-off script: list each `pdf-forms/`
  prefix and delete any key the doc doesn't reference.
- **Test:** none yet - would belong in `tests/unit/hooks/useDogFileUpload.test.ts` ("deletes the
  old PDF form from S3 when it's replaced"), as an `it.fails` like the others.

### Also worth a task (not bugs in the app logic)
- **`npm audit` leftovers (accepted, re-check periodically):** `next` critical/RCE + `postcss`/
  `sharp` fixed by `next@16.4.6`. Remaining are upstream-only: `@grpc/grpc-js@1.9` (pinned by
  `firebase` even at 13.x; server-side advisories, not reachable from our client usage),
  `glob`/`minimatch` via `firebase-admin`'s `google-gax` (unused `rimraf`) and `typedoc` (dev-only).
  Don't `npm audit fix --force` - it *downgrades* to `firebase@9` / `typedoc@0.23`.
- **Dead code:** `hooks/useFileUpload.ts` + `components/upload/FileUploader.tsx` - nothing
  imports `FileUploader`. Delete alongside the other orphaned pre-launch pieces.
- **Disposable-email subdomains slip through:** `isDisposableEmail("x@inbox.mailinator.com")`
  is `false` (exact-domain lookup only) - `tests/unit/lib/security.test.ts`. Low priority.
- **Profanity false positives (accepted, FYI):** "bitch" (female dog), "anal glands", names like
  "Dick" all get flagged. Fine while profanity only *flags* the staff email - if it's ever
  changed to *block*, these must be handled first.
