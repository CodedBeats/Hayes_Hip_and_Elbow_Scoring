/**
 * Just enough `XMLHttpRequest` for the presigned-PUT uploads in the upload hooks.
 *
 * @remarks
 * Every instance is recorded in `FakeXhr.instances`; `send()` settles on a microtask with
 * the status from `FakeXhr.statusFor(url)` (200 unless a test overrides it), or fires
 * `onerror` for status 0 - so a test can fail one specific file's upload.
 */
export class FakeXhr {
    static instances: FakeXhr[] = [];
    static statusFor: (url: string) => number = () => 200;

    method = "";
    url = "";
    status = 0;
    headers: Record<string, string> = {};
    body: unknown;
    upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor() {
        FakeXhr.instances.push(this);
    }

    open(method: string, url: string) {
        this.method = method;
        this.url = url;
    }

    setRequestHeader(name: string, value: string) {
        this.headers[name] = value;
    }

    send(body: unknown) {
        this.body = body;
        queueMicrotask(() => {
            const status = FakeXhr.statusFor(this.url);
            if (status === 0) {
                this.onerror?.();
                return;
            }
            this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 1 });
            this.status = status;
            this.onload?.();
        });
    }

    static reset() {
        FakeXhr.instances = [];
        FakeXhr.statusFor = () => 200;
    }
}