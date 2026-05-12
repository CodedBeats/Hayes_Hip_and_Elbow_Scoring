export const isNonEmptyString = (value: string | undefined): boolean => {
    return value !== undefined && value.trim() !== "";
};