import React, { useState, useEffect, useMemo } from 'react';
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
import Footer from './components/Footer';
import { fetchProperties, getMe, logoutUser } from './services/api';
import { Building2, Frown, Sparkles, Heart, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';

export default function App() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Filters State (Spec Hình 19, 20, 21, 22, 54, 55, 56)
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

  // Favorites (LocalStorage)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('3tv_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Compare List
  const [comparedList, setComparedList] = useState([]);

  // Load Properties Data
  const loadData = async () => {
    setLoading(true);
    const result = await fetchProperties();
    setProperties(result.data || []);
    setDataSource(result.source);
    setLoading(false);
  };

  // Check Current User Auth from Server
  const checkAuth = async () => {
    const data = await getMe();
    if (data?.user) {
      setCurrentUser(data.user);
      localStorage.setItem('3tv_user', JSON.stringify(data.user));
    }
  };

  useEffect(() => {
    loadData();
    checkAuth();
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
          alert('Chỉ có thể so sánh tối đa 3-4 bất động sản cùng loại hình.');
          return prev;
        }
        return [...prev, prop];
      }
    });
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

  // Filtered & Sorted Properties (Spec Chương 3, 4 & 5)
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // 1. Purpose Tab (Tất cả, Cho thuê, Mua bán)
      if (activeTab !== 'all' && prop.purpose !== activeTab) return false;

      // 2. Keyword Search (title, project, street, developer, code)
      if (searchKeyword.trim() !== '') {
        const kw = searchKeyword.toLowerCase();
        const matchTitle = prop.title?.toLowerCase().includes(kw);
        const matchProject = prop.project?.toLowerCase().includes(kw);
        const matchStreet = prop.street?.toLowerCase().includes(kw);
        const matchDev = prop.developer?.toLowerCase().includes(kw);
        const matchCode = prop.code?.toLowerCase().includes(kw);
        if (!matchTitle && !matchProject && !matchStreet && !matchDev && !matchCode) {
          return false;
        }
      }

      // 3. Project Filter
      if (selectedProject !== 'all' && prop.project !== selectedProject) return false;

      // 4. City Filter
      if (selectedCity !== 'all' && prop.city !== selectedCity) return false;

      // 5. Developer Filter
      if (selectedDeveloper !== 'all' && prop.developer !== selectedDeveloper) return false;

      // 6. Property Type Filter (Hình 22)
      if (selectedType !== 'all' && prop.type !== selectedType) return false;

      // 7. Bedrooms Filter
      if (selectedBedrooms !== 'all') {
        const bedNum = parseInt(selectedBedrooms, 10);
        if (prop.bedrooms !== bedNum) return false;
      }

      // 8. Price Range Filter (Hình 20)
      if (selectedPriceRange !== 'all') {
        const priceSale = prop.price_sale ? parseFloat(prop.price_sale) : 0;
        const priceRent = prop.price_rent ? parseFloat(prop.price_rent) : 0;

        if (selectedPriceRange === 'under-3b' && priceSale > 3000000000) return false;
        if (selectedPriceRange === '3b-6b' && (priceSale < 3000000000 || priceSale > 6000000000)) return false;
        if (selectedPriceRange === '6b-15b' && (priceSale < 6000000000 || priceSale > 15000000000)) return false;
        if (selectedPriceRange === '15b-30b' && (priceSale < 15000000000 || priceSale > 30000000000)) return false;
        if (selectedPriceRange === 'above-30b' && priceSale < 30000000000) return false;

        if (selectedPriceRange === 'rent-under-15m' && priceRent > 15000000) return false;
        if (selectedPriceRange === 'rent-15m-30m' && (priceRent < 15000000 || priceRent > 30000000)) return false;
        if (selectedPriceRange === 'rent-above-30m' && priceRent < 30000000) return false;
      }

      // 9. Area Range Filter (Hình 21)
      if (selectedAreaRange !== 'all') {
        const area = prop.area || 0;
        if (selectedAreaRange === 'under-50' && area >= 50) return false;
        if (selectedAreaRange === '50-80' && (area < 50 || area >= 80)) return false;
        if (selectedAreaRange === '80-120' && (area < 80 || area >= 120)) return false;
        if (selectedAreaRange === '120-200' && (area < 120 || area >= 200)) return false;
        if (selectedAreaRange === 'above-200' && area < 200) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sắp xếp theo lựa chọn (Hình 56)
      if (sortBy === 'price-asc') {
        const priceA = a.price_sale || a.price_rent || 0;
        const priceB = b.price_sale || b.price_rent || 0;
        return priceA - priceB;
      }
      if (sortBy === 'price-desc') {
        const priceA = a.price_sale || a.price_rent || 0;
        const priceB = b.price_sale || b.price_rent || 0;
        return priceB - priceA;
      }
      if (sortBy === 'area-asc') {
        return (a.area || 0) - (b.area || 0);
      }
      if (sortBy === 'area-desc') {
        return (b.area || 0) - (a.area || 0);
      }
      if (sortBy === 'newest') {
        return (b.id || 0) - (a.id || 0);
      }
      if (sortBy === 'oldest') {
        return (a.id || 0) - (b.id || 0);
      }
      return 0;
    });
  }, [
    properties,
    activeTab,
    searchKeyword,
    selectedProject,
    selectedCity,
    selectedDeveloper,
    selectedType,
    selectedBedrooms,
    selectedPriceRange,
    selectedAreaRange,
    sortBy
  ]);

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
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white font-sans">
      {/* Header / Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoriteCount={favorites.length}
        openFavorites={() => setShowFavoritesModal(true)}
        compareCount={comparedList.length}
        openCompare={() => {}}
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
      />

      {/* Hero & Search Section (Hình 19, 54, 55) */}
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

      {/* Stats Highlights */}
      <StatsBar
        totalCount={properties.length}
        rentCount={rentCount}
        saleCount={saleCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Section Heading & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold mb-1 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Khám Phá Thị Trường Bất Động Sản</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === 'rent' ? 'Căn Hộ & Nhà Đất Cho Thuê' : activeTab === 'sale' ? 'Bất Động Sản Mua Bán' : 'Tất Cả Danh Sách Bất Động Sản'}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/70 shadow-sm self-start md:self-auto">
            <span>Hiển thị: <strong className="text-emerald-700">{filteredProperties.length}</strong> / {properties.length} BĐS</span>
          </div>
        </div>

        {/* Filter Controls Bar (Hình 20, 21, 22, 56) */}
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
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
            <p className="text-slate-800 font-bold text-sm">Đang kết nối & tải dữ liệu CSDL...</p>
            <p className="text-slate-400 text-xs mt-1">Hệ thống đang truy vấn CSDL MySQL / Laravel Backend</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          /* Empty State (Spec Chương 6: "Không tìm thấy bất động sản nào phù hợp") */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Frown className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Không tìm thấy bất động sản nào phù hợp</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Vui lòng thử điều chỉnh lại mức giá, diện tích, loại hình hoặc xóa các tiêu chí lọc để tìm kiếm thêm nhiều lựa chọn.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              Xem Tất Cả Bất Động Sản
            </button>
          </div>
        ) : viewMode === 'map' ? (
          /* Interactive Map View (Hình 19, 24) */
          <MapView
            properties={filteredProperties}
            onSelectProperty={(prop) => setSelectedProperty(prop)}
          />
        ) : (
          /* Grid / List Cards (Hình 19) */
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredProperties.map((prop) => (
              <PropertyCard
                key={prop.code}
                property={prop}
                onSelect={(p) => setSelectedProperty(p)}
                isFavorite={favorites.some((f) => f.code === prop.code)}
                onToggleFavorite={handleToggleFavorite}
                isCompared={comparedList.some((c) => c.code === prop.code)}
                onToggleCompare={handleToggleCompare}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

      </main>

      {/* Property Details Modal (Hình 23) */}
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

      {/* Contact / Booking Modal (Hình 33, 34) */}
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

      {/* Auth Modal: Đăng Nhập (Hình 5) & Đăng Ký (Hình 6, 7, 8) */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile & Password Modal (Hình 9, 10) */}
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

      {/* Favorites Modal (Hình 25) */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="text-base font-bold text-slate-900">Danh Sách BĐS Yêu Thích ({favorites.length})</h3>
              </div>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-3">
              {favorites.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-10">Chưa có bất động sản nào trong mục yêu thích.</p>
              ) : (
                favorites.map((p) => (
                  <div key={p.code} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                    <img src={p.image} alt={p.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-700 truncate">{p.project}</p>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{p.title}</h4>
                      <p className="text-xs font-extrabold text-slate-700 mt-0.5">{p.purpose === 'rent' ? p.price_rent_text : p.price_sale_text}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowFavoritesModal(false);
                          setSelectedProperty(p);
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(p)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl"
                        title="Bỏ thích"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare Floating Drawer (Hình 26) */}
      <CompareDrawer
        comparedList={comparedList}
        onRemove={(p) => handleToggleCompare(p)}
        onClear={() => setComparedList([])}
        onClose={() => setComparedList([])}
        onSelectProperty={(p) => setSelectedProperty(p)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
