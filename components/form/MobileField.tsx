import React, { useState, useEffect } from "react";

interface MobileFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export const MobileField: React.FC<MobileFieldProps> = ({ value, onChange }) => {
    const [selectedCountryCode, setSelectedCountryCode] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");

    // init state based on the incoming value prop
    useEffect(() => {
        if (value) {
            const parts = value.split(" ", 2);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedCountryCode(parts[0] || "");
            setMobileNumber(parts[1] || "");
        } else {
            setSelectedCountryCode("");
            setMobileNumber("");
        }
    }, [value]);


    // handle country code selection
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountryCode = e.target.value;
        setSelectedCountryCode(newCountryCode);
        onChange(`${newCountryCode} ${mobileNumber}`);
    };

    // handle mobile number input
    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMobileNumber = e.target.value;
        setMobileNumber(newMobileNumber);
        onChange(`${selectedCountryCode} ${newMobileNumber}`);
    };


    return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }} className="mt-6 text-lg font-semibold text-gray-800">
            <select
                value={selectedCountryCode}
                onChange={handleCountryChange}
                style={{ flex: 1, padding: "4px" }}
            >
                <option value="+61">+61 (Australia)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+1">+1 (USA)</option>
                <option value="+91">+91 (India)</option>
            </select>
            <input
                type="text"
                value={mobileNumber}
                onChange={handleMobileChange}
                placeholder="Mobile number"
                style={{ flex: 2, padding: "4px" }}
            />
        </div>
    );
};
