# I need this, don't judge

## How Next works i think
/app            → pages (each folder is a route)
/api            → backend endpoints
/lib            → logic (DB, services)
/components     → reusable UI

## How backend works
Example
/api/create-case → POST request
/api/upload-url → GET signed S3 URL

## Data Flow
***USer submits a form***
CaseForm.tsx (component)  →  calls /api/create-case  →  route.ts  →  lib/cases.ts  →  Firebase

***USer uploading file***
FileUploader.tsx  →  calls /api/upload-url  →  gets signed URL  →  uploads directly to S3

***General flow between files***
app/page            = page and component wrapper. no logic,                 **no api calls**
components/xyz      = store state, input validation, submit handlers,       **call hook/api**
hooks/xyz           = helper (e.g. useSubmit, useUpload),                   **call api**
app/api/x/route     = recieve request, validate input                       **call logic**
lib/xyz             = process data, talk to db/auth (e.g. firebase)         **return data to api call**


## using hooks
**GOOD**
- need reusable frontend logic
- managing state (upload progress, loading, auth, cases)

**BAD**
- firebase writes (create, update, delete)
- backend logic
- database logic


## Planned project structure
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
│       ├── create-case/
│       │   └── route.ts        # creates case in Firebase
│       │
│       ├── upload-url/
│       │   └── route.ts        # generates S3 signed upload URL
│       │
│       ├── complete-case/
│       │   └── route.ts        # marks case completed
│       │
│       ├── send-email/
│       │   └── route.ts        # sends confirmation email
│       │
│       ├── stripe/
│       │   └── route.ts        # stripe payment session
│       │
│       └── webhook/
│           └── route.ts        # stripe webhook handler
│
│
│
├── components/                 # reusable UI components
│   │
│   ├── forms/
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
│   ├── firebase.ts             # firebase init (db + auth)
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
├── .env.local                  # sneaky secrets `:)`
│
├── package.json
└── tsconfig.json

## Helpful Links
- [Next.js Documentation](https://nextjs.org/docs)
