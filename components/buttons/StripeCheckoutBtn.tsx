"use client";

type Props = {
    disabled?: boolean;
    text: string;
    onBeforeCheckout?: () => void;
}

export const StripeCheckoutButton = ({ disabled, text = "Proceed To Payment", onBeforeCheckout }: Props) => {
    const handleCheckout = async () => {
        onBeforeCheckout?.();
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
