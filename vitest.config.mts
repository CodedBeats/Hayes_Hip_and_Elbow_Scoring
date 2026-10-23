import { defineConfig } from "vitest/config";

/**
 * Unit test config - offline, dummy env only (see `tests/setup.ts`).
 *
 * @remarks
 * Deliberately does NOT load `.env.local`: every SDK is mocked here, so a real key
 * would only ever be a liability (one un-mocked call away from touching prod). Live
 * key checks live in `vitest.integration.config.ts` instead.
 */
export default defineConfig({
    resolve: {
        // mirrors tsconfig's `@/*` paths so `@/lib/...` imports resolve the same as in Next
        tsconfigPaths: true,
    },
    oxc: {
        // lib/validation.ts imports MobileField.tsx, so JSX has to compile even in node tests
        jsx: { runtime: "automatic" },
    },
    test: {
        environment: "node",
        include: ["tests/unit/**/*.test.ts"],
        setupFiles: ["tests/setup.ts"],
        restoreMocks: true,
        unstubEnvs: true,
        coverage: {
            provider: "v8",
            include: ["lib/**", "app/api/**", "hooks/**"],
            reporter: ["text", "html"],
        },
    },
});