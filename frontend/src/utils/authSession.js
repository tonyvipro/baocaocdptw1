export async function loginSession(client, credentials) {
  try {
    const response = await client.post('/api/login', credentials, { timeout: 35000, withCredentials: true, headers: { Accept: 'application/json' } });
    if (response.data?.status !== 'success' || !response.data?.user) throw new Error('Máy chủ chưa xác nhận đăng nhập.');
    localStorage.setItem('3tv_user', JSON.stringify(response.data.user));
    if (response.data.token) {
      localStorage.setItem('3tv_token', response.data.token);
    } else {
      localStorage.removeItem('3tv_token');
    }
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Quá thời gian phản hồi (timeout). Vui lòng kiểm tra máy chủ Backend (Laravel port 8080/8000) đã được khởi động chưa.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Không kết nối được máy chủ đăng nhập.');
  }
}

export async function sessionUser(client) {
  try {
    const res = await client.get('/api/me', { timeout: 35000, withCredentials: true, headers: { Accept: 'application/json' } });
    if (res.data?.token) {
      localStorage.setItem('3tv_token', res.data.token);
    }
    return res.data;
  } catch (error) {
    if (error.response?.status === 401) return null;
    throw error;
  }
}
