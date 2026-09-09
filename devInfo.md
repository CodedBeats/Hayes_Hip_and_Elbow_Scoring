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
- [Resend](https://resend.com/docs/send-with-nextjs)


## GIT stuff
When pulling from master in prod: `git pull --no-rebase origin master`
Then just commit and sync

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
- prod
- submit-form
- transactions

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


## Testing CMDs

### Cron
Force testing orphan file and doc cleanup (a draft doc will need to be >7 days old)
*Git Bash* `curl -H 'Authorization: Bearer CRON_SECRET' http://localhost:3000/api/cron/cleanup-drafts`


## Temp stripe and transaction info for later
### 1. Stripe account activation
- [ ] Complete Stripe's business verification (legal business name/ABN, address, bank
      account for payouts) in the Dashboard - Checkout can't go live until this is done.
- [ ] Confirm the settlement currency is AUD (Dashboard → Settings → Business settings).

### 2. Switch from test to live keys
- [ ] In the Stripe Dashboard, toggle to **Live mode** and grab the live
      `sk_live_...` / `pk_live_...` keys.
- [ ] Update `STRIPE_SECRET_KEY` (and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, currently
      unused in code but worth keeping in sync) in Vercel's environment variables for the
      Production environment - never commit live keys to the repo or `.env.local`.
- [ ] Leave test keys in place for Preview/Development environments so PR previews and
      local dev keep hitting Stripe test mode.

### 3. Payment confirmation hardening (webhook, idempotency, bot protection) - not yet built
Payment confirmation today is 100% client-driven: `/success` calls `/api/verify-payment`
(which only calls `stripe.checkout.sessions.retrieve` - no signature, nothing
cryptographically trustworthy about the call itself) and then the **browser** writes
`paymentStatus: "paid"` straight to Firestore. If the customer closes the tab (or their
connection drops) between paying and that write landing, **the submission stays
`"unpaid"` forever** even though Stripe successfully charged the card. Firestore rule (d)
in `firestore.rules` (~line 165) currently *allows* this anonymous client write of
`"paid"` - it does not block it, despite the comment above it implying otherwise. Work
through these in order, each building on the last:

1. **Build the webhook endpoint.**
   - [ ] Add `app/api/webhooks/stripe/route.ts`. Verify the signature with
         `stripe.webhooks.constructEvent(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET)`
         - must read the raw request body, not `req.json()`, or the signature check fails.
   - [ ] Handle `checkout.session.completed`, read `submissionIds` from
         `event.data.object.metadata` (already attached to every session), and write
         `paymentStatus: "paid"` via the **Admin SDK** (`lib/firebaseAdmin.ts`), not the
         client SDK.
   - [ ] *Test:* run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in one
         terminal, complete a real test-mode checkout locally, and confirm the event shows
         up in the `listen` output and the submission's `paymentStatus` flips to `"paid"`
         in Firestore.
2. **Get the signing secret wired up.**
   - [ ] Register the webhook URL in Dashboard → Developers → Webhooks (production) - for
         local dev, `stripe listen` prints its own temporary signing secret.
   - [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.local` and Vercel env vars (per-environment,
         same as the Stripe keys in section 2).
3. **Tighten the Firestore rule now that the webhook can write instead.**
   - [ ] In `firestore.rules`, remove (or restrict to `isStaff()`/`"test"` only) the branch
         in rule (d) that lets anonymous clients set `paymentStatus == 'paid'` - the Admin
         SDK bypasses rules entirely, so the webhook doesn't need that branch to exist.
   - [ ] *Test:* after deploying the tightened rules, try calling
         `updateSubmissionPaymentStatus(id, "paid")` from the browser devtools console
         directly against a real submission - it should come back `permission-denied`.
4. **Turn `/success` into a reader, not a writer.**
   - [ ] Change `app/(main)/success/page.tsx` to poll/read the submission doc (or re-call
         `/api/verify-payment`) until `paymentStatus` reflects `"paid"`, instead of writing
         it itself.
   - [ ] *Test:* after Stripe redirects to `/success`, kill the network before the page's
         effect can run - confirm the submission still ends up `"paid"` on its own because
         the webhook already did it, independent of the browser.
5. **Add idempotency keys to session/coupon creation.**
   - [ ] In `app/api/create-checkout-session/route.ts`, pass a deterministic
         `idempotencyKey` (e.g. derived from `submissionIds`) as the request options on
         both `stripe.checkout.sessions.create` and `stripe.coupons.create`.
   - [ ] *Test:* fire two rapid duplicate POSTs to `/api/create-checkout-session` with the
         same `submissionIds` (double-click retry, or a quick curl loop) - confirm the
         Stripe Dashboard shows only one session/coupon, not two.
6. **Consider a restricted API key.**
   - [ ] Dashboard → Developers → API keys → Create restricted key, scoped to just what
         the app actually calls (Checkout Sessions write, Coupons write, plus whatever the
         webhook handler needs). Swap `STRIPE_SECRET_KEY` to this instead of the full
         secret key.
   - [ ] *Test:* in a scratch script, try an operation outside that scope (e.g.
         `stripe.customers.list()`) with the restricted key and confirm it's rejected -
         proves the scope is actually enforced, not just configured.
7. **Add a bot barrier to the checkout trigger.**
   - [ ] `lib/security.ts` already has `looksLikeBot()` (honeypot + fill-time heuristic)
         wired into `/api/contact` - extend the same pattern to
         `/api/create-checkout-session`, or add a real CAPTCHA/Turnstile if this needs to
         hold up against actual card-testing bots (a honeypot only stops bots that don't
         bother).
   - [ ] *Test:* POST directly to `/api/create-checkout-session` bypassing the form (curl
         or Postman) and confirm it's rejected the same way a bot contact submission is.

Steps 1-4 are the load-bearing ones (they fix the actual correctness gap); 5-7 are
hardening and can land after if time is tight, but all are worth doing before this
handles real cards at volume.

### 4. Branding & display (Dashboard-only, not code)
- [ ] Dashboard → Settings → Branding: upload the practice's logo/icon, set an accent
      color, confirm the business name shown on Checkout is correct.
- [ ] Dashboard → Settings → Checkout and Payment Links → set/confirm the statement
      descriptor (what appears on the customer's card/bank statement) - keep it
      recognizable so customers don't dispute the charge.
- [ ] Consider a Stripe custom domain for Checkout (Dashboard → Settings → Custom
      domains) so the URL reads as the practice's own domain instead of
      `checkout.stripe.com`.
- [ ] Apple Pay / Google Pay show up automatically on Checkout once the account and
      domain are verified - nothing to do in code (`payment_method_types: ["card"]` is
      compatible with both).

Already implemented in code as part of this pass: pinned Stripe API version
(`lib/stripe.ts`), per-dog itemized line items instead of one lump sum, `submit_type`,
`phone_number_collection`, and a short `custom_text` reassurance line on the Checkout
Session (`app/api/create-checkout-session/route.ts`).

### 5. Processing fee
The customer-facing total (`lib/pricing.ts::calculatePrice`) now includes a Stripe
processing fee, "grossed up" so the practice still nets the full base+levy after Stripe's
cut - not shown as a separate line item anywhere (button copy, Checkout itself) per
product decision. Currently modeled on Stripe's standard AU domestic card rate
(1.7% + $0.30). This is an approximation - international and Amex cards cost Stripe more,
so those slightly under-recover. Retune `STRIPE_FEE` in `lib/pricing.ts` if the practice's
actual negotiated rate differs.
- [ ] Add a line to the Privacy Policy / Terms of Service noting that the submission fee
      includes payment processing costs (per the original ask - "we can add notes about
      in PP or ToS where appropriate").

### 6. Final live test
- [ ] Do one real, small, live-mode submission end-to-end with a real card, confirm it
      appears in the admin dashboard correctly, then refund it from the Stripe Dashboard
      before announcing go-live.
- [ ] Confirm the admin-test checkout button (see `components/submission/
      SubmissionFlow.tsx`) still works in live mode - it's a genuine $0 Stripe Checkout
      session (see section 7), so no real charges/refunds are involved even in live mode.

### 7. Admin-test $0 mechanism
The admin-test flow creates a fresh, single-use 100%-off Stripe Coupon
(`stripe.coupons.create({ percent_off: 100, duration: "once", max_redemptions: 1 })`) per
session and applies it via `discounts` on the Checkout Session
(`app/api/create-checkout-session/route.ts`) - the real per-dog itemized prices are shown,
fully discounted to $0, rather than fudging amounts to hit a minimum charge. Stripe skips
asking for payment details entirely once a session's total is fully covered by a discount.
- Coupon IDs are never sent to the client - only the final session URL is - so there's
  nothing to leak, and `max_redemptions: 1` means even a leaked ID couldn't be reused.
- A $0-total session reports `payment_status: "no_payment_required"`, not `"paid"` -
  `app/api/verify-payment/route.ts` treats both as success.

### 8. Test the ClinicInvoice flow with `stripe listen` (blocked - not yet applicable)
`billingType: "invoice"` / `"batchMonthly"` submissions don't touch Stripe at all today -
`app/(main)/success/page.tsx` sets these straight to success since the Firestore doc was
already written `paymentStatus: "pending"` at submission time. There's no Stripe invoice
object yet, so there's nothing to run `stripe listen` against.
- [ ] Once a Stripe Invoicing integration exists for clinic billing (e.g.
      `stripe.invoices.create()` triggered from the batch-monthly cron or an admin
      action), come back here: run
      `stripe listen --events invoice.paid,invoice.payment_failed --forward-to localhost:3000/api/webhooks/stripe`
      locally, trigger a real invoice send/pay in test mode, and confirm the webhook
      handler (section 3) updates `paymentStatus` to `"invoiced"`/`"paid"` correctly.
- [ ] Until that integration exists, this step doesn't apply - don't try to test it
      against the current code.

### 9. Housekeeping (out of scope for this pass, noted for later)
- [ ] `components/buttons/StripeCheckoutBtn.tsx` is dead code - nothing imports it,
      `useSubmissionDraft.ts` duplicates its logic inline instead. Worth deleting in a
      separate cleanup PR.


## Firebase App Check (anti-abuse, not yet set up)
Firestore rules constrain *what* a write can contain; App Check constrains *who* can even
attempt one - it stops someone extracting the public `NEXT_PUBLIC_FIREBASE_*` config out of
the JS bundle and scripting requests straight at Firestore instead of going through the
real site. Worth doing before launch (the anonymous submitter writes in `lib/firebase.ts`
are the exact surface this protects) but not urgent/blocking today.

- [ ] Register a reCAPTCHA v3 site (free) at https://www.google.com/recaptcha/admin -
      get the site key + secret key.
- [ ] Firebase Console → Project settings → App Check → register the web app with the
      reCAPTCHA v3 provider, pasting in the secret key.
      https://firebase.google.com/docs/app-check/web/recaptcha-provider
- [ ] In `lib/firebase.ts`, after `initializeApp`, call `initializeAppCheck(app, { provider:
      new ReCaptchaV3Provider(NEXT_PUBLIC_RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled:
      true })` - guard with `typeof window !== "undefined"` since this file can be
      evaluated outside the browser. Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` to Vercel env
      vars (public value, safe to expose).
- [ ] Local dev needs the debug provider instead of reCAPTCHA (localhost can't attest) -
      logs a debug token to the console on first run, which then gets registered in
      Firebase Console → App Check → Manage debug tokens.
      https://firebase.google.com/docs/app-check/web/debug-provider
- [ ] Firebase Console → App Check → run in **monitor mode** first for a few days (check
      the Cloud Firestore metrics), then flip **Enforce** once confident real traffic
      isn't being blocked. https://firebase.google.com/docs/app-check/enable-enforcement
- [ ] Optional stretch: the S3 presign API routes (`/api/upload-url` etc.) aren't Firebase
      resources, so App Check doesn't cover them automatically - could send the App Check
      token as a header and verify it server-side with `getAppCheck().verifyToken()`
      (firebase-admin) to extend the same protection there.
      https://firebase.google.com/docs/app-check/custom-resource-backend
