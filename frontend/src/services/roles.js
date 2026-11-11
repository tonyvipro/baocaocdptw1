import axios from 'axios';

export const SYSTEM_ROLES = [
  { id: 1, name: 'Admin', label: 'Quản trị viên (Admin)', description: 'Toàn quyền quản trị hệ thống' },
  { id: 2, name: 'Broker', label: 'Môi giới (Broker)', description: 'Môi giới bất động sản' },
  { id: 3, name: 'Owner', label: 'Chủ sở hữu (Owner)', description: 'Chủ sở hữu bất động sản' },
  { id: 4, name: 'Staff', label: 'Nhân viên (Staff)', description: 'Nhân viên vận hành hệ thống' },
  { id: 5, name: 'Customer', label: 'Khách hàng / Người thuê (Customer)', description: 'Khách hàng hoặc người thuê căn hộ' },
];

export async function fetchRoles() {
  try {
    const response = await axios.get('/api/roles', { headers: { Accept: 'application/json' } });
    if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
      return response.data.data;
    }
    return SYSTEM_ROLES;
  } catch {
    return SYSTEM_ROLES;
  }
}

export async function fetchUnitOptions() {
  try {
    const response = await axios.get('/api/unit-options', { headers: { Accept: 'application/json' } });
    return response.data?.data || [];
  } catch {
    return [];
  }
}
