export async function loginSession(client, credentials) {
  try {
    const response = await client.post('/api/login', credentials, { timeout: 20000, withCredentials: true, headers: { Accept: 'application/json' } });
    if (response.data?.status !== 'success' || !response.data?.user) throw new Error('Máy chủ chưa xác nhận đăng nhập.');
    localStorage.setItem('3tv_user', JSON.stringify(response.data.user));
    localStorage.removeItem('3tv_token');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Không kết nối được máy chủ đăng nhập.');
  }
}

export async function sessionUser(client) {
  try {
    return (await client.get('/api/me', { timeout: 20000, withCredentials: true, headers: { Accept: 'application/json' } })).data;
  } catch (error) {
    if (error.response?.status === 401) return null;
    throw error;
  }
}
