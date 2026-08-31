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
- [ ] Decide whether GST needs to be itemized/collected via Stripe Tax, or whether prices
      are treated as GST-inclusive already. This is an accounting question, not a
      technical one - check with whoever handles the practice's BAS/tax before enabling
      anything.

### 2. Switch from test to live keys
- [ ] In the Stripe Dashboard, toggle to **Live mode** and grab the live
      `sk_live_...` / `pk_live_...` keys.
- [ ] Update `STRIPE_SECRET_KEY` (and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, currently
      unused in code but worth keeping in sync) in Vercel's environment variables for the
      Production environment - never commit live keys to the repo or `.env.local`.
- [ ] Leave test keys in place for Preview/Development environments so PR previews and
      local dev keep hitting Stripe test mode.
- [ ] Note: the tracked `.env` file at the repo root contains obviously-fake `RR_`-prefixed
      credentials (e.g. `RR_STRIPE_SECRET_KEY=...`). The app only ever reads
      `STRIPE_SECRET_KEY`, not the `RR_`-prefixed names, so this file is inert - looks like
      a leftover decoy/canary rather than anything real. Worth confirming and removing
      separately, but not something this pass touches.

### 3. Webhook (strongly recommended, not yet built)
Payment confirmation today is 100% client-driven: `/success` calls `/api/verify-payment`
and then writes `paymentStatus: "paid"` to Firestore itself. If the customer closes the
tab (or their connection drops) between paying and that write landing, **the submission
stays `"unpaid"` forever** even though Stripe successfully charged the card - there's no
webhook to catch it.
- [ ] Consider adding a `checkout.session.completed` webhook endpoint
      (`app/api/webhooks/stripe/route.ts`) that verifies the Stripe signature
      (`STRIPE_WEBHOOK_SECRET`) and writes `paymentStatus: "paid"` server-side from the
      event's `metadata.submissionIds` (now attached to every session - see below).
- [ ] If added, register the webhook URL + get its signing secret from Dashboard →
      Developers → Webhooks, and add `STRIPE_WEBHOOK_SECRET` to Vercel env vars.
- [ ] This is genuinely optional for go-live (the client-side path works for the common
      case), but it's the difference between "usually works" and "always works" - worth
      scheduling soon after launch if not before.

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
      session (see section 8), so no real charges/refunds are involved even in live mode.

### 8. Admin-test $0 mechanism
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

### 9. Housekeeping (out of scope for this pass, noted for later)
- [ ] `components/buttons/StripeCheckoutBtn.tsx` is dead code - nothing imports it,
      `useSubmissionDraft.ts` duplicates its logic inline instead. Worth deleting in a
      separate cleanup PR.
