/**
 * Clinic contact details captured directly on a submission when submitterType is
 * "clinic" - plain text fields, no clinic account/login system.
 */
export type ClinicInfo = {
    clinicName: string;

    contactName: string;

    email: string;

    phone: string;
};

export type Clinic = {
    id?: string;

    clinicName: string;

    contactName: string;

    email: string;

    phone: string;

    address: string;

    createdAt: Date;

    active: boolean;
};