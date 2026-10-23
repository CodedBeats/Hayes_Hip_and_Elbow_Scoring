// Dummy env for the unit suite. Several lib modules read process.env at import time
// (lib/stripe.ts, lib/s3.ts, lib/resend.ts, app/api/contact/route.ts), so these must be
// set before any test file imports them - setupFiles run first, which guarantees that.
// None of these are real: if a unit test ever reaches a live service with them, it fails
// loudly rather than silently touching prod.
Object.assign(process.env, {
    STRIPE_SECRET_KEY: "sk_test_dummy_unit",
    STRIPE_WEBHOOK_SECRET: "whsec_test_dummy_unit",
    AWS_REGION: "ap-southeast-2",
    AWS_BUCKET_NAME: "unit-test-bucket",
    AWS_ACCESS_KEY_ID: "AKIAUNITTESTDUMMY000",
    AWS_SECRET_ACCESS_KEY: "unit-test-dummy-secret-access-key-000000",
    RESEND_API_KEY: "re_dummy_unit",
    CONTACT_NOTIFICATION_RECIPIENT: "practice@example.com",
    CRON_SECRET: "unit-cron-secret",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "unit-test-project",
});