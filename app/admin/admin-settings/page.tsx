"use client"

import Link from "next/link"

const AdminSettingsPage = () => {

    return (
        <div>
            <h2 className="text-2xl font-bold text-brand-brown">
                Admin Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
                Let me know what kinds of settings you want in here
            </p>

            {/* contact details */}
            <div className="flex flex-col gap-6 mt-15">
                <div className="flex flex-col">
                    <p className="mt-1 text-sm text-gray-500">Email Me</p>
                    <a href="mailto:luca.haar@icloud.com" className="font-semibold text-brand-green underline">
                        luca.haar@icloud.com
                    </a>
                </div>
                <div className="flex flex-col">
                    <p className="mt-1 text-sm text-gray-500">Call Me</p>
                    <a href="tel:+61458109711" className="font-semibold text-brand-green underline">
                        0458 109 711
                    </a>
                </div>
            </div>
        </div>
    );
}

export default AdminSettingsPage