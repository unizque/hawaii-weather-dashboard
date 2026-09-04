export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { timeoutMs = 10_000, signal, headers, ...requestOptions } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const abortFromParent = () => controller.abort();
  signal?.addEventListener('abort', abortFromParent, { once: true });

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        Accept: 'application/geo+json, application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new HttpError(`Request failed with ${response.status}`, response.status, url);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromParent);
  }
}
