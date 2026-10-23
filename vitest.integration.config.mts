import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

/**
 * Integration / smoke test config - hits REAL services with the keys in `.env.local`.
 *
 * @remarks
 * Run with `npm run test:integration`. Exists to prove each rotated key actually works
 * against its service - not to test logic (that's the unit suite's job). Files run one at
 * a time, since they share live resources and rate limits, and every file cleans up
 * whatever it created in `afterAll`.
 *
 * `loadEnv(..., "")` loads every var, not just `VITE_`-prefixed ones, which is what
 * Next's own `.env.local` handling does.
 */
export default defineConfig(({ mode }) => ({
    resolve: {
        tsconfigPaths: true,
    },
    oxc: {
        jsx: { runtime: "automatic" },
    },
    test: {
        environment: "node",
        include: ["tests/integration/**/*.test.ts"],
        env: loadEnv(mode, process.cwd(), ""),
        fileParallelism: false,
        testTimeout: 30_000,
        hookTimeout: 30_000,
    },
}));