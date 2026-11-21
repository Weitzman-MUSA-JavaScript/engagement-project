export function createDataService(context, request = fetch) {
  return async (path, { method = 'GET', body, signal, readOnly = method === 'GET', responseType = 'json' } = {}) => {
    const { origin, token, activeSession } = context();
    const url = new URL(`/api/${path}`, origin);
    url.searchParams.set('activeSession', activeSession);
    let result;
    try {
      result = await request(url, { method, signal, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new Error(readOnly ? 'Could not connect. Your input is still here. Try again when the connection is available.' : 'The connection ended before a save could be confirmed. Your input is still here. Check for new input before retrying.', { cause: error });
    }
    if (result.ok && responseType === 'text') return result.text();
    let data;
    try { data = await result.json(); } catch { throw new Error('The data service returned an unreadable response. Your input is still here. Check for new input before retrying.'); }
    if (!result.ok) {
      const error = new Error(data.message || 'This action could not be completed.');
      error.errors = data.errors;
      error.status = result.status;
      throw error;
    }
    return data;
  };
}
