const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  data?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, headers, ...customConfig } = options;

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    credentials: 'include', // Crucial for sending & receiving session cookies
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  let normalizedEndpoint = endpoint;
  const baseUrlTrimmed = API_BASE_URL.replace(/\/+$/, '');
  if (baseUrlTrimmed.endsWith('/api') && normalizedEndpoint.startsWith('/api/')) {
    normalizedEndpoint = normalizedEndpoint.slice(4);
  } else if (!normalizedEndpoint.startsWith('/') && !normalizedEndpoint.startsWith('http')) {
    normalizedEndpoint = '/' + normalizedEndpoint;
  }

  const url = normalizedEndpoint.startsWith('http')
    ? normalizedEndpoint
    : `${baseUrlTrimmed}${normalizedEndpoint}`;

  const response = await fetch(url, config);
  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      responseData?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    (error as unknown as { response: Response; data: unknown }).response = response;
    (error as unknown as { response: Response; data: unknown }).data = responseData;
    throw error;
  }

  return responseData as T;
}

export interface ApiEnvelope<T = any> {
  data: T;
  success?: boolean;
  message?: string;
}

apiClient.get = async function <T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const data = await apiClient<any>(endpoint, { ...options, method: 'GET' });
  return { data, success: data?.success ?? true };
};

apiClient.post = async function <T = any>(endpoint: string, bodyData?: unknown, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const data = await apiClient<any>(endpoint, {
    ...options,
    method: 'POST',
    data: bodyData,
    body: bodyData ? JSON.stringify(bodyData) : undefined,
  });
  return { data, success: data?.success ?? true };
};

apiClient.put = async function <T = any>(endpoint: string, bodyData?: unknown, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const data = await apiClient<any>(endpoint, {
    ...options,
    method: 'PUT',
    data: bodyData,
    body: bodyData ? JSON.stringify(bodyData) : undefined,
  });
  return { data, success: data?.success ?? true };
};

apiClient.patch = async function <T = any>(endpoint: string, bodyData?: unknown, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const data = await apiClient<any>(endpoint, {
    ...options,
    method: 'PATCH',
    data: bodyData,
    body: bodyData ? JSON.stringify(bodyData) : undefined,
  });
  return { data, success: data?.success ?? true };
};

apiClient.delete = async function <T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const data = await apiClient<any>(endpoint, { ...options, method: 'DELETE' });
  return { data, success: data?.success ?? true };
};

