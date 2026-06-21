export const baseUrl = "https://ai-scraper-tb7n.onrender.com";

// create an easy to use API wrapper around fetch
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.detail || "Request failed");
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, options: RequestInit = {}) =>
    request<T>(endpoint, options),

  post: <T>(endpoint: string, data: any, options: RequestInit = {}) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    }),

  put: <T>(endpoint: string, data: any, options: RequestInit = {}) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    }),

  patch: <T>(endpoint: string, data: any, options: RequestInit = {}) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    }),

  delete: <T>(endpoint: string, options: RequestInit = {}) =>
    request<T>(endpoint, {
      method: "DELETE",
      ...options,
    }),
};