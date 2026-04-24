function resolveDefaultApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000/v1";
  }

  return "";
}

const defaultApiBaseUrl = resolveDefaultApiBaseUrl();

export const hasExternalApiBaseUrl = Boolean(defaultApiBaseUrl);

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return defaultApiBaseUrl ? `${defaultApiBaseUrl}${normalizedPath}` : normalizedPath;
}

export async function fetchJson<TResponse>(path: string): Promise<TResponse> {
  return requestJson<TResponse>(path);
}

export async function postJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function patchJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function requestJson<TResponse>(
  path: string,
  init?: RequestInit & {
    token?: string | null;
  }
): Promise<TResponse> {
  const requestUrl = apiUrl(path);
  const response = await fetch(requestUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...(init?.headers ?? {})
    },
    ...init
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { message?: string };
      throw new Error(payload.message || `Request failed with status ${response.status}`);
    }

    if (contentType.includes("text/html")) {
      throw new Error(
        `Request failed with status ${response.status}. Received HTML from ${requestUrl} instead of the backend API.`
      );
    }

    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON from ${requestUrl}, but received ${contentType || "an unknown response type"}.`);
  }

  return (await response.json()) as TResponse;
}
