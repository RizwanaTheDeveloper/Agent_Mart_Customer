async function firmCall(method, path, body = {}, key = '') {
  if (!Firm.endpoint) throw Error('Set your deployed HTTPS backend URL first.');
  let response;
  if (window.AndroidApp?.firmRequest) {
    response = await new Promise((resolve, reject) => {
      const id = uid('req'),
        timer = setTimeout(() => {
          Firm.pending.delete(id);
          reject(Error('Server timed out. Keep this form open and retry.'));
        }, path.startsWith('/api/intelligence/') ? 100000 : 45000);
      Firm.pending.set(id, {
        resolve,
        timer
      });
      AndroidApp.firmRequest(JSON.stringify({
        id,
        method,
        path,
        body,
        token: Firm.token,
        key,
        origin: Firm.endpoint
      }));
    });
  } else {
    const ctrl = new AbortController(),
      tm = setTimeout(() => ctrl.abort(), path.startsWith('/api/intelligence/') ? 100000 : 35000);
    try {
      const res = await fetch(Firm.endpoint + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(Firm.token ? {
            Authorization: 'Bearer ' + Firm.token
          } : {}),
          ...(key ? {
            'Idempotency-Key': key
          } : {})
        },
        body: method === 'GET' ? undefined : JSON.stringify(body),
        signal: ctrl.signal
      });
      response = {
        status: res.status,
        data: await res.json()
      };
    } finally {
      clearTimeout(tm);
    }
  }
  if (response.status < 200 || response.status >= 300) {
    const e = Error(response.data?.error || 'Server connection failed');
    e.status = response.status;
    if (response.status === 401 && Firm.token) {
      Firm.token = '';
      Firm.data = null;
      Firm.mode = 'local';
      restoreLocal();
      route = 'firm';
      render();
    }
    throw e;
  }
  return response.data;
}
