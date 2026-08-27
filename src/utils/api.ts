export async function safeFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  
  let data: any;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error('Failed to parse API response');
  }

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data as T;
}
