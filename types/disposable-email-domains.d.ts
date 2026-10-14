/**
 * The `disposable-email-domains` package ships no types - its entry point is a
 * ~120k-entry JSON array. Declaring it as `string[]` here keeps the type-checker
 * fast (inferring a 120k string-literal tuple from the raw JSON is pathologically
 * slow) and gives call sites a sensible type.
 */
declare module "disposable-email-domains" {
    const domains: string[];
    export default domains;
}
