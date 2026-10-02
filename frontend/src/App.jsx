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
import Footer from './components/Footer';
import { fetchProperties } from './services/api';
import { Building2, Frown, Sparkles, Heart, RefreshCw } from 'lucide-react';

export default function App() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('local');

  // Filters State
  const [activeTab, setActiveTab] = useState('all'); // all, rent, sale
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDeveloper, setSelectedDeveloper] = useState('all');
  const [selectedBedrooms, setSelectedBedrooms] = useState('all');
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

  // Load Data
  const loadData = async () => {
    setLoading(true);
    const result = await fetchProperties();
    setProperties(result.data || []);
    setDataSource(result.source);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Favorites
  useEffect(() => {
    try {
      localStorage.setItem('3tv_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Toggle Favorite
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

  // Toggle Compare
  const handleToggleCompare = (prop) => {
    setComparedList((prev) => {
      const exists = prev.some((p) => p.code === prop.code);
      if (exists) {
        return prev.filter((p) => p.code !== prop.code);
      } else {
        if (prev.length >= 4) {
          alert('Bạn chỉ có thể chọn tối đa 4 bất động sản để so sánh cùng lúc.');
          return prev;
        }
        return [...prev, prop];
      }
    });
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

  // Filtered & Sorted Properties
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Tab purpose filter
      if (activeTab !== 'all' && prop.purpose !== activeTab) return false;

      // Keyword search (title, project, street, developer, code)
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

      // Project filter
      if (selectedProject !== 'all' && prop.project !== selectedProject) return false;

      // City filter
      if (selectedCity !== 'all' && prop.city !== selectedCity) return false;

      // Developer filter
      if (selectedDeveloper !== 'all' && prop.developer !== selectedDeveloper) return false;

      // Bedrooms filter
      if (selectedBedrooms !== 'all') {
        const bedNum = parseInt(selectedBedrooms, 10);
        if (prop.bedrooms !== bedNum) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') {
        const priceA = a.price_rent || a.price_sale || 0;
        const priceB = b.price_rent || b.price_sale || 0;
        return priceA - priceB;
      }
      if (sortBy === 'price-desc') {
        const priceA = a.price_rent || a.price_sale || 0;
        const priceB = b.price_rent || b.price_sale || 0;
        return priceB - priceA;
      }
      if (sortBy === 'area-desc') {
        return (b.area || 0) - (a.area || 0);
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
    selectedBedrooms,
    sortBy
  ]);

  const resetFilters = () => {
    setSearchKeyword('');
    setSelectedProject('all');
    setSelectedCity('all');
    setSelectedDeveloper('all');
    setSelectedBedrooms('all');
    setSortBy('default');
    setActiveTab('all');
  };

  const rentCount = properties.filter((p) => p.purpose === 'rent').length;
  const saleCount = properties.filter((p) => p.purpose === 'sale').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
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
      />

      {/* Hero & Search Header */}
      <HeroSection
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projectsList={projectsList}
        citiesList={citiesList}
        totalResults={filteredProperties.length}
      />

      {/* Stats Highlights */}
      <StatsBar
        totalCount={properties.length}
        rentCount={rentCount}
        saleCount={saleCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Filter Controls Bar */}
        <PropertyFilter
          selectedDeveloper={selectedDeveloper}
          setSelectedDeveloper={setSelectedDeveloper}
          developersList={developersList}
          selectedBedrooms={selectedBedrooms}
          setSelectedBedrooms={setSelectedBedrooms}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          resetFilters={resetFilters}
        />

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
            <p className="text-slate-600 font-semibold text-sm">Đang tải dữ liệu bất động sản...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
            <Frown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">Không tìm thấy bất động sản phù hợp</h3>
            <p className="text-xs text-slate-500 mb-5">Vui lòng thử điều chỉnh lại từ khóa hoặc xóa bớt bộ lọc để có thêm kết quả.</p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Xem Tất Cả Bất Động Sản
            </button>
          </div>
        ) : viewMode === 'map' ? (
          /* Interactive Map View */
          <MapView
            properties={filteredProperties}
            onSelectProperty={(prop) => setSelectedProperty(prop)}
          />
        ) : (
          /* Grid / List Cards */
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
          onClose={() => {
            setShowContactModal(false);
            setContactProperty(null);
          }}
        />
      )}

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
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

      {/* Compare Floating Drawer */}
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
