// dependencies
import React, { useState, useEffect } from "react";


interface MobileFieldProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    name?: string;
    autoComplete?: string;
}

/**
 * Checks whether a `"<code> <number>"` composite phone value has an actual number typed
 * in.
 *
 * @remarks
 * Checks only the number portion, not raw truthiness of `value` - a country code picked
 * with no digits typed (e.g. `"+61 "`) is truthy as a string but is NOT a filled-in
 * phone number, so callers validating "is this field filled in" must use this rather
 * than a plain `!value` check.
 */
export const isPhoneNumberEmpty = (value: string) => {
    const spaceIndex = value.indexOf(" ");
    const numberPart = spaceIndex === -1 ? "" : value.slice(spaceIndex + 1);
    return !numberPart.trim();
};


export const MobileField: React.FC<MobileFieldProps> = ({ value, onChange, label = "Phone Number", name = "mobile", autoComplete = "off" }) => {
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

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountryCode = e.target.value;
        setSelectedCountryCode(newCountryCode);
        onChange(`${newCountryCode} ${mobileNumber}`);
    };

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMobileNumber = e.target.value;
        setMobileNumber(newMobileNumber);
        onChange(`${selectedCountryCode} ${newMobileNumber}`);
    };

    return (
        <div className="mb-4 w-full">
            <label htmlFor={`${name}-number`} className="block mb-1.5 text-sm font-medium text-gray-700">
                {label} <span className="text-red-700">{" *"}</span>
            </label>
            <div className="flex gap-2">
                <select
                    id={`${name}-code`}
                    name={`${name}-code`}
                    value={selectedCountryCode}
                    onChange={handleCountryChange}
                    autoComplete={autoComplete}
                    className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                >
                    <option value="" disabled hidden>Code</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+91">+91 (IN)</option>
                </select>
                <input
                    id={`${name}-number`}
                    name={`${name}-number`}
                    type="text"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    placeholder="Mobile number"
                    autoComplete={autoComplete}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                />
            </div>
        </div>
    );
};
