import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL });

// If the saved login has expired (or the account is gone), clear it and go home
// instead of leaving a dashboard full of silent errors.
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || '';
    if (err.response?.status === 401 && localStorage.getItem('token') && msg.startsWith('Not authorized, ')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/');
    }
    return Promise.reject(err);
  }
);

export default api;
export { baseURL as API_BASE };
