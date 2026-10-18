import React, { useState, useEffect, useMemo } from 'react';
import { readPropertyList } from './utils/property';
import { watchCatalog, filterCatalog, availableRecentViews } from './utils/propertyCatalog';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import StatsBar from './components/StatsBar';
import PropertyFilter from './components/PropertyFilter';
import PropertyCard from './components/PropertyCard';
import PropertyModal from './components/PropertyModal';
import MapView from './components/MapView';
import ContactModal from './components/ContactModal';
import CompareDrawer from './components/CompareDrawer';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import RecentViewsModal from './components/RecentViewsModal';
import Footer from './components/Footer';
import { fetchProperties, getMe, logoutUser, recordViewHistory, fetchViewHistory, clearViewHistoryApi } from './services/api';
import { Building2, Frown, Heart, RefreshCw, Clock, X, ArrowRight } from 'lucide-react';

export default function App() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyError, setPropertyError] = useState('');
  const [dataSource, setDataSource] = useState('local');

  // Auth User State (Spec Nhóm 1 - Tài Khoản)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('3tv_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Filters State
  const [activeTab, setActiveTab] = useState('all'); // all, rent, sale
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDeveloper, setSelectedDeveloper] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBedrooms, setSelectedBedrooms] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedAreaRange, setSelectedAreaRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, map

  // Modals & Interactive States
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [contactProperty, setContactProperty] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showRecentModal, setShowRecentModal] = useState(false);

  // Favorites (LocalStorage)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('3tv_favorites');
      return readPropertyList('3tv_favorites');
    } catch {
      return [];
    }
  });

  // Recent Views (LocalStorage) - Chức năng số 20: Lịch sử xem
  const [recentViews, setRecentViews] = useState(() => {
    try {
      const saved = localStorage.getItem('3tv_recent_views');
      return readPropertyList('3tv_recent_views');
    } catch {
      return [];
    }
  });

  const visibleHistory = useMemo(() => availableRecentViews(recentViews, properties), [recentViews, properties]);

  // Compare List
  const [comparedList, setComparedList] = useState([]);

  // Load Properties Data
  const loadData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchProperties();
      setProperties(result.data);
      setSelectedProperty(previous => previous ? result.data.find(p => p.code === previous.code) || null : null);
      setDataSource(result.source);
      setPropertyError('');
    } catch (error) {
      setPropertyError(error.message);
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => watchCatalog(loadData), []);
  useEffect(() => {
    const requireLogin = () => { setCurrentUser(null); setAuthMode('login'); setShowAuthModal(true); localStorage.removeItem('3tv_user'); localStorage.removeItem('3tv_token'); };
    window.addEventListener('3tv:auth-required', requireLogin);
    return () => window.removeEventListener('3tv:auth-required', requireLogin);
  }, []);

  // Check Current User Auth from Server
  const checkAuth = async () => {
    try {
      const data = await getMe();
      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('3tv_user', JSON.stringify(data.user));
      } else if (currentUser) {
        setCurrentUser(null);
        localStorage.removeItem('3tv_user');
        setAuthMode('login');
        setShowAuthModal(true);
      }
    } catch { /* A temporary network failure is not a successful login. */ }
  };

  useEffect(() => {
    loadData();
    checkAuth();

    // Đồng bộ lịch sử xem bất động sản từ backend nếu có (Chức năng 20)
    fetchViewHistory()
      .then((serverViews) => {
        if (serverViews && serverViews.length > 0) {
          setRecentViews((prev) => {
            const map = new Map();
            [...prev, ...serverViews].forEach((item) => {
              if (item?.code && !map.has(item.code)) {
                map.set(item.code, item);
              }
            });
            const merged = Array.from(map.values()).slice(0, 30);
            try {
              localStorage.setItem('3tv_recent_views', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Save Favorites to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('3tv_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  const handleToggleFavorite = (prop) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.code === prop.code);
      if (exists) {
        return prev.filter((p) => p.code !== prop.code);
      } else {
        return [...prev, prop];
      }
    });
  };

  const handleToggleCompare = (prop) => {
    setComparedList((prev) => {
      const exists = prev.some((p) => p.code === prop.code);
      if (exists) {
        return prev.filter((p) => p.code !== prop.code);
      } else {
        if (prev.length >= 4) {
          alert('Chỉ có thể so sánh tối đa 4 bất động sản cùng lúc.');
          return prev;
        }
        return [...prev, prop];
      }
    });
  };

  const handleSelectProperty = (prop) => {
    setSelectedProperty(prop);
    const nowIso = new Date().toISOString();
    const enrichedProp = { ...prop, viewed_at: nowIso };

    // Lưu vào lịch sử xem (Tối đa 30 tin đã xem gần nhất)
    setRecentViews((prev) => {
      const filtered = prev.filter((p) => p.code !== prop.code);
      const updated = [enrichedProp, ...filtered].slice(0, 30);
      try {
        localStorage.setItem('3tv_recent_views', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // Ghi nhận ngầm lên Backend (Chức năng số 20: Lịch sử xem)
    recordViewHistory(enrichedProp).catch(() => {});
  };

  const handleRemoveRecentItem = (code) => {
    setRecentViews((prev) => {
      const updated = prev.filter((p) => p.code !== code);
      try {
        localStorage.setItem('3tv_recent_views', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    clearViewHistoryApi(code).catch(() => {});
  };

  const handleClearRecent = () => {
    setRecentViews([]);
    try {
      localStorage.removeItem('3tv_recent_views');
    } catch (e) {}
    clearViewHistoryApi().catch(() => {});
  };

  const formatRecentTimeAgo = (dateInput) => {
    if (!dateInput) return 'Gần đây';
    const now = new Date();
    const date = new Date(dateInput);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (isNaN(diffInSeconds) || diffInSeconds < 0 || diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}p trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hôm qua';
    return `${diffInDays} ngày trước`;
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('3tv_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    localStorage.removeItem('3tv_user');
    setShowProfileModal(false);
  };

  // Dropdown Lists Extracted Dynamically
  const projectsList = useMemo(() => {
    const set = new Set(properties.map((p) => p.project).filter(Boolean));
    return Array.from(set);
  }, [properties]);

  const citiesList = useMemo(() => {
    const set = new Set(properties.map((p) => p.city).filter(Boolean));
    return Array.from(set);
  }, [properties]);

  const developersList = useMemo(() => {
    const set = new Set(properties.map((p) => p.developer).filter(Boolean));
    return Array.from(set);
  }, [properties]);

  const typesList = useMemo(() => {
    const set = new Set(properties.map((p) => p.type).filter(Boolean));
    return Array.from(set);
  }, [properties]);

  // Filtered & Sorted Properties
  const filteredProperties = useMemo(() => {
    return filterCatalog(properties, { purpose: activeTab, search: searchKeyword, project: selectedProject, city: selectedCity, developer: selectedDeveloper, type: selectedType, bedrooms: selectedBedrooms, price: selectedPriceRange, area: selectedAreaRange, sort: sortBy });
  }, [properties, activeTab, searchKeyword, selectedProject, selectedCity, selectedDeveloper, selectedType, selectedBedrooms, selectedPriceRange, selectedAreaRange, sortBy]);

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('property');
    const property = properties.find(p => p.code === code);
    if (property) handleSelectProperty(property);
  }, [properties]);

  const resetFilters = () => {
    setSearchKeyword('');
    setSelectedProject('all');
    setSelectedCity('all');
    setSelectedDeveloper('all');
    setSelectedType('all');
    setSelectedBedrooms('all');
    setSelectedPriceRange('all');
    setSelectedAreaRange('all');
    setSortBy('default');
    setActiveTab('all');
  };

  const rentCount = properties.filter((p) => p.purpose === 'rent').length;
  const saleCount = properties.filter((p) => p.purpose === 'sale').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {propertyError && <div role="alert" className="p-4 bg-red-50 text-red-700">{propertyError} <button onClick={loadData}>Thử lại</button></div>}
      {/* Header / Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoriteCount={favorites.length}
        openFavorites={() => setShowFavoritesModal(true)}
        compareCount={comparedList.length}
        openCompare={() => document.getElementById('compare-drawer')?.focus()}
        openContactModal={() => {
          setContactProperty(null);
          setShowContactModal(true);
        }}
        dataSource={dataSource}
        onRefreshData={loadData}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'login');
          setShowAuthModal(true);
        }}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        recentCount={visibleHistory.length}
        openRecent={() => setShowRecentModal(true)}
      />

      {/* Hero & Search Section */}
      <HeroSection
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projectsList={projectsList}
        citiesList={citiesList}
        typesList={typesList}
        totalResults={filteredProperties.length}
      />

      {/* Market Indicator Bar */}
      <StatsBar
        totalCount={properties.length}
        rentCount={rentCount}
        saleCount={saleCount}
      />

      {/* Main Content Area */}
      <main id="listing-section" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Section Heading & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'rent' ? 'Căn Hộ & Nhà Đất Cho Thuê' : activeTab === 'sale' ? 'Bất Động Sản Bán & Chuyển Nhượng' : 'Danh Sách Bất Động Sản Nổi Bật'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thông tin cập nhật mới nhất từ các sàn giao dịch & chủ đầu tư
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs self-start sm:self-auto">
            <span>Tìm thấy: <strong className="text-red-600 font-bold">{filteredProperties.length}</strong> bất động sản</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <PropertyFilter
          selectedDeveloper={selectedDeveloper}
          setSelectedDeveloper={setSelectedDeveloper}
          developersList={developersList}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          typesList={typesList}
          selectedBedrooms={selectedBedrooms}
          setSelectedBedrooms={setSelectedBedrooms}
          selectedPriceRange={selectedPriceRange}
          setSelectedPriceRange={setSelectedPriceRange}
          selectedAreaRange={selectedAreaRange}
          setSelectedAreaRange={setSelectedAreaRange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          resetFilters={resetFilters}
        />

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin mb-3" />
            <p className="text-slate-800 font-bold text-sm">Đang tải danh sách bất động sản...</p>
            <p className="text-slate-400 text-xs mt-1">Đang đồng bộ dữ liệu từ hệ thống</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200 max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Frown className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Không tìm thấy bất động sản nào phù hợp</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Vui lòng điều chỉnh lại mức giá, diện tích, dự án hoặc xóa các điều kiện lọc để hiển thị thêm kết quả.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Xem Tất Cả Tin Đăng
            </button>
          </div>
        ) : viewMode === 'map' ? (
          /* Interactive Map View */
          <MapView
            properties={filteredProperties}
            onSelectProperty={handleSelectProperty}
          />
        ) : (
          /* Grid / List Cards */
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-3.5'
          }>
            {filteredProperties.map((prop) => (
              <PropertyCard
                key={prop.code}
                property={prop}
                onSelect={handleSelectProperty}
                isFavorite={favorites.some((f) => f.code === prop.code)}
                onToggleFavorite={handleToggleFavorite}
                isCompared={comparedList.some((c) => c.code === prop.code)}
                onToggleCompare={handleToggleCompare}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Section: Bất Động Sản Đã Xem Gần Đây (Chức năng số 20: Lịch sử xem) */}
        {visibleHistory.length > 0 && (
          <div className="mt-14 pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Bất Động Sản Bạn Đã Xem Gần Đây</h3>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {visibleHistory.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Tự động lưu các bất động sản bạn đã mở xem chi tiết</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRecentModal(true)}
                  className="text-xs font-semibold text-slate-700 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Xem tất cả lịch sử ({visibleHistory.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Xóa lịch sử
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {visibleHistory.slice(0, 6).map((p) => (
                <div 
                  key={p.code} 
                  onClick={() => handleSelectProperty(p)}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-2.5 cursor-pointer transition-all hover:shadow-xs group relative flex flex-col justify-between"
                >
                  {/* Remove single item button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRecentItem(p.code);
                    }}
                    className="absolute top-3.5 right-3.5 z-10 w-6 h-6 rounded-full bg-slate-900/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs"
                    title="Xóa khỏi lịch sử"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div>
                    <div className="relative h-24 sm:h-28 rounded-lg overflow-hidden mb-2 bg-slate-100">
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        loading="lazy"
                      />
                      <span className={`absolute bottom-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded text-white ${
                        p.purpose === 'rent' ? 'bg-blue-600' : 'bg-red-600'
                      }`}>
                        {p.purpose === 'rent' ? 'Thuê' : 'Bán'}
                      </span>
                    </div>

                    <p className="text-[11px] font-bold text-slate-800 truncate mb-0.5">{p.project || 'BĐS'}</p>
                    <p className="text-xs font-black text-red-600 truncate mb-1">
                      {p.purpose === 'rent' ? p.price_rent_text : p.price_sale_text}
                    </p>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate">{p.area}m² • {p.district}</span>
                    <span className="shrink-0 text-slate-400 font-medium">{formatRecentTimeAgo(p.viewed_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Property Details Modal */}
      <PropertyModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        isFavorite={selectedProperty ? favorites.some((f) => f.code === selectedProperty.code) : false}
        onToggleFavorite={handleToggleFavorite}
        onOpenContact={(p) => {
          setContactProperty(p);
          setShowContactModal(true);
        }}
      />

      {/* Contact / Booking Modal */}
      {showContactModal && (
        <ContactModal
          property={contactProperty}
          currentUser={currentUser}
          onOpenAuth={(mode) => {
            setAuthMode(mode || 'login');
            setShowAuthModal(true);
          }}
          onClose={() => {
            setShowContactModal(false);
            setContactProperty(null);
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile & Password Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        currentUser={currentUser}
        onClose={() => setShowProfileModal(false)}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          localStorage.setItem('3tv_user', JSON.stringify(updatedUser));
        }}
        onLogout={handleLogout}
      />

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-5 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600 fill-red-600" />
                <h3 className="text-base font-bold text-slate-900">Danh Sách Tin Đăng Đã Lưu ({favorites.length})</h3>
              </div>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="text-xs font-bold px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 space-y-2.5">
              {favorites.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">Bạn chưa lưu bất động sản nào vào danh sách yêu thích.</p>
              ) : (
                favorites.map((p) => (
                  <div key={p.code} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 gap-3">
                    <img src={p.image} alt={p.title} className="w-16 h-16 rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.project}</p>
                      <h4 className="text-xs text-slate-600 truncate">{p.title}</h4>
                      <p className="text-xs font-black text-red-600 mt-0.5">{p.purpose === 'rent' ? p.price_rent_text : p.price_sale_text}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setShowFavoritesModal(false);
                          handleSelectProperty(p);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(p)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Bỏ thích"
                      >
                        <Heart className="w-4 h-4 fill-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Views Modal (Chức năng số 20: Lịch sử xem) */}
      <RecentViewsModal
        isOpen={showRecentModal}
        onClose={() => setShowRecentModal(false)}
        recentViews={visibleHistory}
        onSelectProperty={handleSelectProperty}
        onRemoveItem={handleRemoveRecentItem}
        onClearAll={handleClearRecent}
        onToggleCompare={handleToggleCompare}
        comparedList={comparedList}
      />

      {/* Compare Floating Drawer */}
      <CompareDrawer
        comparedList={comparedList}
        onRemove={(p) => handleToggleCompare(p)}
        onClear={() => setComparedList([])}
        onClose={() => setComparedList([])}
        onSelectProperty={handleSelectProperty}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
