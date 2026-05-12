import React from "react";

export const TestLogBtn: React.FC<{ data: unknown }> = ({ data }) => {
    const handleClick = () => {
        console.log(data);
    };

    return (
        <button
            onClick={handleClick}
            className="px-4 py-2 bg-yellow-500 text-black border-2 border-red-600 rounded-md hover:bg-yellow-400 
            focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
            Debug Output
        </button>
    );
};

