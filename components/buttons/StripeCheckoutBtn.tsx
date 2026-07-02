"use client";

type Props = {
    disabled?: boolean;
    text: string;
    amount: number;
    onBeforeCheckout?: () => void;
}

export const StripeCheckoutButton = ({ disabled, text = "Proceed To Payment", amount, onBeforeCheckout }: Props) => {
    const handleCheckout = async () => {
        onBeforeCheckout?.();
        try {
            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
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
