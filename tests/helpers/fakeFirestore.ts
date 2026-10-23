import { vi } from "vitest";

type DocData = Record<string, unknown>;

export type FakeSnapshot = {
    id: string;
    exists: boolean;
    data: () => DocData | undefined;
};

export const snap = (id: string, data: DocData | undefined): FakeSnapshot => ({
    id,
    exists: data !== undefined,
    data: () => data,
});

/**
 * Minimal in-memory stand-in for the Admin SDK `Firestore` handle - just the surface
 * `lib/firebaseAdmin.ts` and `lib/payments.ts` actually call.
 *
 * @remarks
 * Queries don't evaluate `where` clauses - tests seed exactly the docs a query "returns"
 * via `queryResults`, then assert on the recorded `whereCalls`. Evaluating them here would
 * just be re-implementing Firestore badly; what matters is that the right clauses are sent.
 */
export const createFakeFirestore = () => {
    const docs = new Map<string, DocData>();
    const whereCalls: [string, string, unknown][] = [];
    let queryResults: FakeSnapshot[] = [];

    const update = vi.fn(async (path: string, data: DocData) => {
        if (!docs.has(path)) throw Object.assign(new Error(`NOT_FOUND: ${path}`), { code: 5 });
        docs.set(path, { ...docs.get(path), ...data });
    });
    const remove = vi.fn(async (path: string) => {
        docs.delete(path);
    });

    const query = {
        where: (field: string, op: string, value: unknown) => {
            whereCalls.push([field, op, value]);
            return query;
        },
        get: async () => ({ docs: queryResults }),
    };

    const db = {
        doc: (path: string) => ({
            get: async () => snap(path.split("/").pop()!, docs.get(path)),
            update: (data: DocData) => update(path, data),
            delete: () => remove(path),
        }),
        collection: (name: string) => ({
            where: query.where,
            get: async () => ({
                docs: [...docs.entries()]
                    .filter(([path]) => path.startsWith(`${name}/`))
                    .map(([path, data]) => snap(path.split("/").pop()!, data)),
            }),
        }),
    };

    return {
        db,
        docs,
        whereCalls,
        update,
        remove,
        setQueryResults: (results: FakeSnapshot[]) => {
            queryResults = results;
        },
    };
};