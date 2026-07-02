export const isNonEmptyString = (value: string | undefined): boolean => {
    return value !== undefined && value.trim() !== "";
};

// format number to price
//TODO: use me lol
export const formatPrice = (amount: number): string => {
    const formatted = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD'
    }).format(amount);

    return formatted
}