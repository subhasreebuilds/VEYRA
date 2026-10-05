export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export async function fetchApi(endpoint: string, options: RequestInit & { ignore401?: boolean } = {}) {
  const { ignore401, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Important for sending/receiving HttpOnly cookies
    cache: 'no-store',
    signal: fetchOptions.signal || AbortSignal.timeout(120000), // 2 min timeout for AI requests
  });

  if (response.status === 401 && ignore401) {
    return null;
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch (e) {
      // JSON parse failed
    }
    const err: any = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  // Handle empty responses like logout
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}
