import Link from "next/link";

interface ButtonProps {
    children: React.ReactNode;
    href?: string;
    variant?: "solid" | "outline" | "dark";
    type?: "button" | "submit";
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    solid: "bg-brand-green-mid text-white hover:bg-[#6a7b61]",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/10",
    dark: "bg-brand-brown text-white hover:bg-[#2f221b]",
};

export const Button = ({
    children,
    href,
    variant = "solid",
    type = "button",
    onClick,
    disabled,
    className = "",
}: ButtonProps) => {
    const classes = [
        "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        className,
    ].join(" ");

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={classes}>
            {children}
        </button>
    );
};
