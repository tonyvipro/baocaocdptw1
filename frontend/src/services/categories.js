import axios from 'axios';

export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Căn hộ chung cư', slug: 'can-ho-chung-cu' },
  { id: 2, name: 'Nhà phố liền kề', slug: 'nha-pho-lien-ke' },
  { id: 3, name: 'Biệt thự nghỉ dưỡng', slug: 'biet-thu-nghi-duong' },
  { id: 4, name: 'Shophouse thương mại', slug: 'shophouse-thuong-mai' },
  { id: 5, name: 'Đất nền dự án', slug: 'dat-nen-du-an' },
  { id: 6, name: 'Văn phòng cho thuê', slug: 'van-phong-cho-thue' },
  { id: 7, name: 'Phòng trọ sinh viên', slug: 'phong-tro-sinh-vien' },
  { id: 8, name: 'Bất động sản công nghiệp', slug: 'bat-dong-san-cong-nghiep' },
];

export async function fetchCategoryOptions() {
  try {
    const res = await axios.get('/api/categories/options', { headers: { Accept: 'application/json' } });
    if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
      return res.data.data;
    }
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

