// dependencies
import Link from "next/link";

interface IconButtonProps {
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    download?: boolean;
    disabled?: boolean;
    ariaLabel: string;
    className?: string;
}

export const IconButton = ({
    icon,
    onClick,
    href,
    download,
    disabled,
    ariaLabel,
    className = "",
}: IconButtonProps) => {
    const classes = [
        "inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-brand-brown disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        className,
    ].join(" ");

    if (href && !disabled) {
        return download ? (
            <a href={href} download aria-label={ariaLabel} className={classes}>
                {icon}
            </a>
        ) : (
            <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={classes}>
                {icon}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={classes}>
            {icon}
        </button>
    );
};
