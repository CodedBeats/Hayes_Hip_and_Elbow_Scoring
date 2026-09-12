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





## Testing and Deployment
### general development CMDs
```bash
# terminal 1:
npm run dev
# terminal 2:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
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
