import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LOCAL_API = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'omit', // React Native fetch doesn't use cookies the same way web does, we use SecureStore
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch (e) {
      // JSON parse failed
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

// Temporary compatibility wrapper for existing code
export const api = {
  get: (url: string) => fetchApi(url).then(data => ({ data })),
  post: (url: string, data?: any) => fetchApi(url, { method: 'POST', body: JSON.stringify(data) }).then(data => ({ data })),
  put: (url: string, data?: any) => fetchApi(url, { method: 'PUT', body: JSON.stringify(data) }).then(data => ({ data })),
  delete: (url: string) => fetchApi(url, { method: 'DELETE' }).then(data => ({ data }))
};
