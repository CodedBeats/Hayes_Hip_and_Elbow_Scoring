"use client";

type Props = {
    disabled?: boolean;
    text: string;
}

export const StripeCheckoutButton = ({ disabled, text = "Proceed To Payment" }: Props) => {
    const handleCheckout = async () => {
        try {
            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
            });

            const data = await res.json();

            if (!data.url) {
                throw new Error("No checkout URL");
            }

            window.location.href = data.url;
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <button 
            type="button" 
            disabled={disabled} 
            onClick={handleCheckout}
            style={{
                color: disabled ? "red" : "green"
            }}
        >
            {text}
        </button>
    );
}
