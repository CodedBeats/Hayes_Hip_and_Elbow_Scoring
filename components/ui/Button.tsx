// dependencies
import Link from "next/link";


// constants for tailwind classes
const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    solid: "bg-brand-green-mid text-white hover:bg-[#6a7b61]",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/10",
    dark: "bg-brand-brown text-white hover:bg-[#2f221b]",
};
const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
};


interface ButtonProps {
    children: React.ReactNode;
    href?: string;
    target?: "_blank";
    variant?: "solid" | "outline" | "dark";
    size?: "sm" | "md";
    type?: "button" | "submit";
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

export const Button = ({
    children,
    href,
    target,
    variant = "solid",
    size = "md",
    type = "button",
    onClick,
    disabled,
    className = "",
}: ButtonProps) => {
    const classes = [
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        sizeClasses[size],
        variantClasses[variant],
        className,
    ].join(" ");

    if (href && !disabled) {
        return target === "_blank" ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
                {children}
            </a>
        ) : (
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
