import axios from 'axios';
import localProperties from '../data/all_properties.json';

const API_BASE_URL = '/api';

export const fetchProperties = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/properties`, { timeout: 3000 });
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return { data: response.data, source: 'backend' };
    }
  } catch (error) {
    console.info('Backend API not responding or still starting, using local properties data fallback:', error.message);
  }
  return { data: localProperties, source: 'local' };
};

export const triggerDatabaseMigration = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/run-migrate`, { timeout: 10000 });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không thể kết nối với máy chủ Backend Laravel.');
  }
};
