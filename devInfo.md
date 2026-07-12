# I need this, don't judge

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


## Planned project structure
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

## Maybe actualy project structure
<!--  -->

## Firestore Folder Structure
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
│   ├── clinicId (optional)
│   ├── submissionType ("online" | "pdf")
│   ├── createdAt
│   ├── updatedAt
│   │
│   ├── billing
│   │   ├── paymentStatus
│   │   ├── billingType
│   │   ├── stripePaymentIntentId
│   │   ├── invoiceId
│   │   └── invoiceSentAt
│   │
│   ├── files
│   │   ├── dicomFilesRef
│   │   ├── supportingDocumentsRef
│   │   ├── vetSignatureRef
│   │   └── ownerSignatureRef
│   │
│   ├── owner
│   │   ├── name
│   │   ├── email
│   │   ├── phone
│   │   ├── address
│   │   └── memberNumber
│   │
│   ├── veterinarian
│   │   ├── veterinarianName
│   │   ├── practiceName
│   │   ├── address
│   │   ├── phone
│   │   ├── positiveIdentificationSighted
│   │   └── certificateSighted
│   │
│   └── dog
│       ├── registeredName
│       ├── registeredNumber
│       ├── microchipNumber
│       ├── breed
│       ├── sex
│       ├── dateOfBirth
│       ├── dateOfRadiograph
└───────└── isDogsAustraliaRegistered




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


## S3 Folder structure
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
│   │   └── signatures/
│   │       ├── owner-signature.png
│   │       └── vet-signature.png
│   │
│   ├── dog_002/
│   │   ├── dicom/
│   │   ├── documents/
└───└───└── signatures/



## Helpful Links
- [QuickBooks Documentation](https://developer.intuit.com/app/developer/qbo/docs/get-started)
- [Resend](https://resend.com/docs/send-with-nextjs)


## GIT stuff
When pulling from master in prod: `git pull --no-rebase origin master`
Then just commit and sync

