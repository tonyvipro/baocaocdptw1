/**
 * Multi-Tab Sync & Conflict Prevention Service
 * Sử dụng BroadcastChannel API kết hợp Storage Event để đồng bộ đa tab/cửa sổ.
 */

const CHANNEL_NAME = '3tv_realestate_sync_channel';
const STORAGE_SYNC_KEY = '3tv_tab_sync_mutation';

// Khởi tạo BroadcastChannel an toàn
let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel không được hỗ trợ, sử dụng Storage Event fallback', e);
}

/**
 * Phát tín hiệu khi một tab thực hiện thành công thao tác CRUD
 * @param {Object} data { entity: 'categories'|'properties'|'users'|'contracts'|..., action: 'create'|'update'|'delete', id, message }
 */
export function broadcastDataChange(data) {
  const payload = {
    ...data,
    senderId: window.__3tv_tab_id || (window.__3tv_tab_id = Math.random().toString(36).substring(2, 9)),
    timestamp: Date.now(),
  };

  // 1. Gửi qua BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (e) {
      console.warn('Lỗi postMessage BroadcastChannel:', e);
    }
  }

  // 2. Gửi qua localStorage (kích hoạt storage event ở các tab khác)
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(payload));
  } catch (e) {
    // Ignore storage quota
  }
}

/**
 * Đăng ký lắng nghe sự kiện đồng bộ từ các tab khác
 * @param {Function} callback (event) => void
 * @returns {Function} unsubscribe function
 */
export function subscribeDataChange(callback) {
  const currentTabId = window.__3tv_tab_id || (window.__3tv_tab_id = Math.random().toString(36).substring(2, 9));

  // Handler xử lý message từ BroadcastChannel
  const handleBroadcastMessage = (event) => {
    if (event.data && event.data.senderId !== currentTabId) {
      callback(event.data);
    }
  };

  // Handler xử lý sự kiện Storage Event (fallback & đa cửa sổ)
  const handleStorageEvent = (event) => {
    if (event.key === STORAGE_SYNC_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        if (data && data.senderId !== currentTabId) {
          callback(data);
        }
      } catch (e) {}
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}
