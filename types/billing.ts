export type BillingInfo = {
    billingType: "payNow" | "invoice";

    amount: number;

    paymentStatus: PaymentStatus;

    stripePaymentIntentId?: string;

    invoiceId?: string;

    invoiceSentAt?: Date;
};

export type PaymentStatus =
    | "unpaid"
    | "pending"
    | "paid"
    | "invoiced"
    | "overdue";
