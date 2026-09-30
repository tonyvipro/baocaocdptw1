<!DOCTYPE html>
<html lang="vi" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3TV - Nơi hành trình về nhà  | Bất động sản cao cấp & uy tín</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
    
    <!-- AOS (Animate On Scroll) CSS -->
    <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />

    <!-- Leaflet CSS & JS for Interactive Map -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            50: '#f0fdf4',
                            100: '#dcfce7',
                            200: '#bbf7d0',
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                            800: '#065f46',
                            900: '#064e3b',
                            dark: '#0e2a22',
                            darker: '#091c16',
                            teal: '#0d5c52',
                            accent: '#14b8a6'
                        }
                    },
                    animation: {
                        'float-slow': 'float 6s ease-in-out infinite',
                        'float-fast': 'float 3s ease-in-out infinite',
                        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'shimmer': 'shimmer 2.5s infinite linear',
                        'spin-slow': 'spin 12s linear infinite',
                    },
                    keyframes: {
                        float: {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-10px)' },
                        },
                        shimmer: {
                            '0%': { backgroundPosition: '-200% 0' },
                            '100%': { backgroundPosition: '200% 0' },
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        /* Base typography & scrollbar */
        * {
            -webkit-font-smoothing: antialiased;
        }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f8faf9;
            color: #1e293b;
            overflow-x: hidden;
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #10b981;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #047857;
        }

        /* Glassmorphism */
        .glass-nav {
            background: rgba(14, 42, 34, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 20px 40px -15px rgba(6, 78, 59, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
        }
        .badge-pill {
            background: rgba(255, 255, 255, 0.16);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .hero-gradient {
            background: linear-gradient(180deg, rgba(6, 40, 32, 0.82) 0%, rgba(6, 40, 32, 0.45) 50%, rgba(6, 40, 32, 0.9) 100%);
        }
        .project-card-overlay {
            background: linear-gradient(to top, rgba(9, 28, 22, 0.95) 0%, rgba(9, 28, 22, 0.5) 45%, rgba(0, 0, 0, 0) 100%);
        }

        /* Ambient glowing orbs */
        .ambient-glow {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
            opacity: 0.45;
            animation: float 8s ease-in-out infinite alternate;
        }

        /* Navigation Animated Underline */
        .nav-link {
            position: relative;
            transition: color 0.3s ease;
        }
        .nav-link::after {
            content: '';
            position: absolute;
            width: 0%;
            height: 2px;
            bottom: -4px;
            left: 0;
            background: linear-gradient(90deg, #34d399, #10b981);
            border-radius: 2px;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-link:hover::after {
            width: 100%;
        }

        /* Shimmer Button Effect */
        .btn-shimmer {
            position: relative;
            overflow: hidden;
        }
        .btn-shimmer::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                60deg,
                transparent,
                rgba(255, 255, 255, 0.25),
                transparent
            );
            transform: rotate(30deg) translateY(-100%);
            transition: transform 0.75s ease;
        }
        .btn-shimmer:hover::before {
            transform: rotate(30deg) translateY(100%);
        }

        /* Interactive Card Lift & Hover Effects */
        .interactive-card {
            transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease, border-color 0.4s ease;
        }
        .interactive-card:hover {
            transform: translateY(-8px) scale(1.015);
            box-shadow: 0 25px 35px -10px rgba(6, 78, 59, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.04);
            border-color: rgba(16, 185, 129, 0.4);
        }

        /* Category Card Hover */
        .category-card {
            transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .category-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 25px -8px rgba(16, 185, 129, 0.22);
            border-color: #34d399;
        }
        .category-card:hover .cat-icon-box {
            transform: scale(1.15) rotate(6deg);
            background: linear-gradient(135deg, #059669, #047857);
            color: #ffffff;
            box-shadow: 0 8px 16px -4px rgba(5, 150, 105, 0.4);
        }

        /* Pulsing Radar Ring (for live indicators & contact button) */
        .radar-ping {
            position: relative;
        }
        .radar-ping::before {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: inherit;
            background: inherit;
            opacity: 0.6;
            animation: radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes radarPing {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
        }

        /* Search Tab active styling */
        .search-tab-btn {
            position: relative;
            transition: all 0.3s ease;
        }
        .search-tab-btn.active {
            color: #047857;
            font-weight: 700;
        }
        .search-tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: -13px;
            left: 0;
            width: 100%;
            height: 3px;
            background: #059669;
            border-radius: 3px 3px 0 0;
        }

        /* Custom Dropdown Animations */
        .filter-dropdown {
            opacity: 0;
            visibility: hidden;
            transform: translateY(8px) scale(0.98);
            transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
            z-index: 100 !important;
            box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.22), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
        }
        .filter-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }

        /* Developer filter chips */
        .dev-filter-chip {
            background-color: #ffffff;
            color: #374151;
            border: 1px solid #e5e7eb;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            white-space: nowrap;
            cursor: pointer;
        }
        .dev-filter-chip:hover {
            border-color: #10b981;
            color: #047857;
            background-color: #f0fdf4;
            transform: translateY(-1px);
        }
        .dev-filter-chip.active {
            background: linear-gradient(135deg, #047857 0%, #065f46 100%);
            color: #ffffff;
            border-color: #047857;
            box-shadow: 0 4px 14px rgba(4, 120, 87, 0.3);
        }

        /* Heart Wishlist Animation */
        .btn-heart.liked svg {
            fill: #ef4444;
            color: #ef4444;
            transform: scale(1.2);
        }
        .btn-heart svg {
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .btn-heart:hover svg {
            transform: scale(1.25);
        }

        /* Floating Back To Top Button */
        #backToTop {
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #backToTop.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        /* Toast notification */
        #toast {
            opacity: 0;
            transform: translate(-50%, 20px);
            pointer-events: none;
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #toast.show {
            opacity: 1;
            transform: translate(-50%, 0);
            pointer-events: auto;
        }
    </style>
</head>
<body class="antialiased">

    <!-- Toast Notification (Popup khi bấm tương tác) -->
    <div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gray-900/95 text-white text-sm font-medium shadow-2xl backdrop-blur-md border border-emerald-500/30">
        <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <i data-lucide="check" class="w-4 h-4"></i>
        </div>
        <span id="toast-message">Hành động thành công!</span>
    </div>

    <!-- Floating Hotline & Back to Top Widget -->
    <div class="fixed right-6 bottom-6 z-40 flex flex-col items-center gap-3">
        <!-- Zalo / Hotline Pulse Button -->
        <a href="tel:19006868" 
           title="Gọi tư vấn miễn phí" 
           class="radar-ping group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:shadow-emerald-500/40 hover:scale-110 active:scale-95 transition duration-300">
            <i data-lucide="phone-call" class="w-6 h-6 group-hover:rotate-12 transition"></i>
            <span class="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none backdrop-blur-sm border border-emerald-500/30">
                Hotline 1900 6868
            </span>
        </a>

        <!-- Back to Top Button -->
        <button id="backToTop" 
                onclick="window.scrollTo({top: 0, behavior: 'smooth'})" 
                title="Về đầu trang" 
                class="w-12 h-12 rounded-full bg-white text-emerald-800 shadow-lg border border-emerald-100 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-900 hover:scale-110 active:scale-95 transition">
            <i data-lucide="chevron-up" class="w-6 h-6"></i>
        </button>
    </div>

    <!-- ============================================== -->
    <!-- 1. HERO SECTION & NAVBAR                       -->
    <!-- ============================================== -->
    <div class="relative z-20 min-h-[660px] lg:min-h-[760px] w-full flex flex-col justify-between overflow-visible pb-12 sm:pb-16">
        
        <!-- Hero Background Image with Ken Burns Effect -->
        <div class="absolute inset-0 z-0 overflow-hidden">
            <img src="{{ asset('images/hero-villa.jpg') }}" 
                 alt="Biệt thự nghỉ dưỡng" 
                 class="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition duration-[8000ms] ease-out">
            <div class="absolute inset-0 hero-gradient"></div>

            <!-- Ambient Floating Glowing Orbs -->
            <div class="ambient-glow bg-emerald-400 w-96 h-96 -top-20 -left-20"></div>
            <div class="ambient-glow bg-teal-300 w-80 h-80 top-1/2 right-0"></div>
        </div>

        <!-- Sticky Nav Wrapper -->
        <div id="navbarWrapper" class="relative z-30 w-full transition-all duration-300">
            <header class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <nav class="flex items-center justify-between text-white">
                    
                    <!-- Logo with Hover Pulse -->
                    <a href="{{ url('/') }}" class="flex items-center gap-2.5 group">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center backdrop-blur-sm group-hover:bg-emerald-500/40 group-hover:scale-110 group-hover:rotate-6 transition duration-300 shadow-lg shadow-emerald-900/30">
                            <i data-lucide="home" class="w-5 h-5 text-emerald-300 group-hover:text-white transition"></i>
                        </div>
                        <span class="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1">
                            <span class="text-emerald-400 group-hover:text-emerald-300 transition">3</span>TV
                        </span>
                    </a>

                    <!-- Nav Links with Slide Underlines -->
                    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-200">
                        <a href="#featured-listings" class="nav-link hover:text-emerald-300 py-1">Mua bán</a>
                        <a href="#featured-listings" class="nav-link hover:text-emerald-300 py-1">Cho thuê</a>
                        <a href="#projects" class="nav-link hover:text-emerald-300 py-1">Dự án</a>
                        <a href="#categories" class="nav-link hover:text-emerald-300 py-1">Phân loại</a>
                        <a href="#testimonials" class="nav-link hover:text-emerald-300 py-1">Đánh giá</a>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-3">
                        <button onclick="showToast('Chức năng đăng nhập đang mở!')" 
                                class="hidden sm:inline-block px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-full transition">
                            Đăng nhập
                        </button>
                        <button onclick="showToast('Chào mừng bạn đến với 3TV!')" 
                                class="btn-shimmer px-5 py-2 text-sm font-semibold text-emerald-950 bg-white hover:bg-emerald-50 hover:shadow-lg hover:shadow-white/20 hover:scale-105 active:scale-95 rounded-full transition duration-300 shadow-md">
                            Đăng ký
                        </button>
                        <button onclick="showToast('Mở trình soạn thảo đăng tin BĐS!')" 
                                class="btn-shimmer inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-full border border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition duration-300">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            <span>Đăng tin</span>
                        </button>
                    </div>
                </nav>
            </header>
        </div>

        <!-- Hero Content & Search Card -->
        <div class="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 my-auto">
            
            <!-- Badge with floating animation -->
            <div data-aos="fade-down" data-aos-duration="800" class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-pill text-xs font-bold text-emerald-200 uppercase tracking-wider mb-6 hover:bg-white/25 hover:scale-105 transition duration-300 cursor-default">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-slow"></span>
                <span>BẤT ĐỘNG SẢN CAO CẤP VÀ UY TÍN HÀNG ĐẦU</span>
            </div>

            <!-- Main Heading with Staggered Entrance -->
            <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="900" class="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl tracking-tight mb-4 drop-shadow-md">
                Nơi hành trình về nhà <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">bắt đầu.</span>
            </h1>
            
            <p data-aos="fade-up" data-aos-delay="200" data-aos-duration="900" class="text-base sm:text-lg text-emerald-100/90 max-w-xl font-normal leading-relaxed mb-8">
                Tìm kiếm hàng ngàn bất động sản đẳng cấp với pháp lý chuẩn mực và vị trí đắc địa nhất.
            </p>

            <!-- Search Container Box with Glassmorphism & Micro-interactions -->
            <div data-aos="zoom-in-up" data-aos-delay="300" data-aos-duration="1000" class="glass-card rounded-3xl p-4 sm:p-6 max-w-4xl border border-white/80 shadow-2xl relative z-40">
                
                <!-- Search Tabs Switcher -->
                <div class="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-5 text-sm font-semibold">
                    <div class="flex items-center gap-6 sm:gap-8">
                        <button id="tab-buy" onclick="switchSearchTab('buy')" class="search-tab-btn active flex items-center gap-2 pb-1 hover:text-emerald-700 transition">
                            <i data-lucide="key" class="w-4 h-4 text-emerald-600"></i> Mua nhà đất
                        </button>
                        <button id="tab-rent" onclick="switchSearchTab('rent')" class="search-tab-btn text-gray-500 hover:text-emerald-700 flex items-center gap-2 pb-1 transition">
                            <i data-lucide="home" class="w-4 h-4"></i> Thuê nhà đất
                        </button>
                        <button id="tab-project" onclick="switchSearchTab('project')" class="search-tab-btn text-gray-500 hover:text-emerald-700 flex items-center gap-2 pb-1 transition">
                            <i data-lucide="building" class="w-4 h-4"></i> Dự án mới
                        </button>
                    </div>

                    <!-- Button: Open Interactive Map -->
                    <button type="button" onclick="openMapModal()" 
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition shadow-sm hover:shadow group border border-emerald-200">
                        <i data-lucide="map" class="w-4 h-4 text-emerald-600 group-hover:scale-110 transition"></i>
                        <span class="hidden sm:inline">Chọn trên bản đồ</span>
                        <span class="sm:hidden">Bản đồ</span>
                    </button>
                </div>

                <!-- Row 1: Search Keyword Input with Autocomplete & Quick Clear -->
                <div class="mb-3.5 relative">
                    <div class="flex items-center bg-gray-50/90 hover:bg-white focus-within:bg-white border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200 rounded-2xl px-4 py-3 transition duration-300 shadow-sm">
                        <i data-lucide="search" class="w-5 h-5 text-emerald-600 shrink-0 mr-3"></i>
                        <input id="search-keyword" 
                               type="text" 
                               autocomplete="off"
                               oninput="handleKeywordInput(this.value)"
                               onkeydown="if(event.key === 'Enter') performSearch()"
                               placeholder="Nhập tên đường, tên dự án (Eaton Park, The River...), khu vực (Thủ Thiêm, Hải Châu, Quận 2...)"
                               class="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 font-medium focus:outline-none">
                        <button id="btn-clear-search" onclick="clearKeyword()" class="hidden text-gray-400 hover:text-gray-600 p-1 mr-2 transition">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                        <button onclick="openMapModal()" title="Chọn trực tiếp trên bản đồ" class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                            <span class="hidden sm:inline">Bản đồ</span>
                        </button>
                    </div>

                    <!-- Autocomplete Suggestions Dropdown -->
                    <div id="search-suggestions" class="hidden absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] max-h-60 overflow-y-auto">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- Row 2: Filter Inputs Grid -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative">
                    
                    <!-- Location Filter with Dropdown -->
                    <div class="md:col-span-4 relative">
                        <div onclick="toggleDropdown('dropdown-location')" 
                             class="py-3 px-2.5 sm:px-3 rounded-2xl bg-gray-50/70 hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-400/80 transition duration-300 flex items-center gap-2.5 cursor-pointer group hover:shadow-sm">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
                                <i data-lucide="map-pin" class="w-4 h-4"></i>
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <div class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">Vị trí</div>
                                <div id="selected-location" class="text-xs sm:text-sm font-bold text-gray-800 truncate group-hover:text-emerald-800 transition">Tất cả vị trí</div>
                            </div>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:rotate-180 transition duration-300 shrink-0"></i>
                        </div>

                        <!-- Dropdown Menu: Location -->
                        <div id="dropdown-location" class="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] max-h-64 overflow-y-auto">
                            <div class="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase sticky top-0 bg-white">Chọn tỉnh / thành phố</div>
                            <button onclick="selectOption('selected-location', 'Tất cả vị trí', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Tất cả vị trí</button>
                            <button onclick="selectOption('selected-location', 'TP. Hồ Chí Minh', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">TP. Hồ Chí Minh</button>
                            <button onclick="selectOption('selected-location', 'Hà Nội', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Hà Nội</button>
                            <button onclick="selectOption('selected-location', 'Đà Nẵng', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Đà Nẵng</button>
                            <button onclick="selectOption('selected-location', 'Bình Dương', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Bình Dương</button>
                            <button onclick="selectOption('selected-location', 'Phú Quốc', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Phú Quốc</button>
                        </div>
                    </div>

                    <!-- Property Type Filter with Dropdown -->
                    <div class="md:col-span-3 relative">
                        <div onclick="toggleDropdown('dropdown-type')" 
                             class="py-3 px-2.5 sm:px-3 rounded-2xl bg-gray-50/70 hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-400/80 transition duration-300 flex items-center gap-2.5 cursor-pointer group hover:shadow-sm">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
                                <i data-lucide="building-2" class="w-4 h-4"></i>
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <div class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">Loại BĐS</div>
                                <div id="selected-type" class="text-xs sm:text-sm font-bold text-gray-800 truncate group-hover:text-emerald-800 transition">Tất cả loại hình</div>
                            </div>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:rotate-180 transition duration-300 shrink-0"></i>
                        </div>

                        <!-- Dropdown Menu: Type -->
                        <div id="dropdown-type" class="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] max-h-64 overflow-y-auto">
                            <div class="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase sticky top-0 bg-white">Loại hình bất động sản</div>
                            <button onclick="selectOption('selected-type', 'Tất cả loại hình', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Tất cả loại hình</button>
                            <button onclick="selectOption('selected-type', 'Căn hộ cao cấp', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Căn hộ cao cấp</button>
                            <button onclick="selectOption('selected-type', 'Nhà phố / Liền kề', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Nhà phố / Liền kề</button>
                            <button onclick="selectOption('selected-type', 'Biệt thự nghỉ dưỡng', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Biệt thự nghỉ dưỡng</button>
                            <button onclick="selectOption('selected-type', 'Đất nền dự án', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Đất nền dự án</button>
                        </div>
                    </div>

                    <!-- Price Filter with Dropdown -->
                    <div class="md:col-span-3 relative">
                        <div onclick="toggleDropdown('dropdown-price')" 
                             class="py-3 px-2.5 sm:px-3 rounded-2xl bg-gray-50/70 hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-400/80 transition duration-300 flex items-center gap-2.5 cursor-pointer group hover:shadow-sm">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
                                <i data-lucide="tag" class="w-4 h-4"></i>
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <div class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">Mức giá</div>
                                <div id="selected-price" class="text-xs sm:text-sm font-bold text-gray-800 truncate group-hover:text-emerald-800 transition">Tất cả mức giá</div>
                            </div>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:rotate-180 transition duration-300 shrink-0"></i>
                        </div>

                        <!-- Dropdown Menu: Price -->
                        <div id="dropdown-price" class="filter-dropdown absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] max-h-64 overflow-y-auto">
                            <div class="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase sticky top-0 bg-white">Khoảng giá phù hợp</div>
                            <button onclick="selectOption('selected-price', 'Tất cả mức giá', 'dropdown-price')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Tất cả mức giá</button>
                            <button onclick="selectOption('selected-price', 'Dưới 2 tỷ', 'dropdown-price')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Dưới 2 tỷ</button>
                            <button onclick="selectOption('selected-price', '2 tỷ - 6 tỷ', 'dropdown-price')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">2 tỷ - 6 tỷ</button>
                            <button onclick="selectOption('selected-price', '6 tỷ - 12 tỷ', 'dropdown-price')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">6 tỷ - 12 tỷ</button>
                            <button onclick="selectOption('selected-price', 'Trên 12 tỷ', 'dropdown-price')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Trên 12 tỷ</button>
                        </div>
                    </div>

                    <!-- Search Button with Light Sweep Shimmer & Pulse -->
                    <div class="md:col-span-2">
                        <button onclick="performSearch()" 
                                class="btn-shimmer w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-700/30 hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 transition duration-300 flex items-center justify-center gap-2 group">
                            <i data-lucide="search" class="w-4 h-4 group-hover:rotate-90 transition duration-300"></i>
                            <span>Tìm kiếm</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- ============================================== -->
    <!-- 2. FEATURED LISTINGS (BẠN ĐANG TÌM LOẠI HÌNH?) -->
    <!-- ============================================== -->
    <section id="featured-listings" class="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header with Animation -->
        <div data-aos="fade-up" class="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
                <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> KHÁM PHÁ THEO NHU CẦU
                </span>
                <h2 id="featured-section-title" class="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">
                    Bất động sản mua bán nổi bật
                </h2>
                <p id="featured-section-desc" class="text-gray-500 text-sm mt-1">Dữ liệu thực tế 10 Tập đoàn BĐS hàng đầu: Vinhomes, Novaland, Khang Điền, Nam Long, Sun Group, Hưng Thịnh, Him Lam, FLC, BIM Group, Kim Oanh</p>
            </div>
            <a href="#" class="group inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 px-4 py-2 rounded-full transition duration-300">
                <span>Xem tất cả 1,420+ BĐS</span>
                <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition duration-300"></i>
            </a>
        </div>

        <!-- Developer Filter Bar (10 Chủ Đầu Tư Lớn) -->
        <div class="mb-8 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <i data-lucide="building-2" class="w-4 h-4 text-emerald-600"></i> LỌC THEO CHỦ ĐẦU TƯ
                </span>
                <span id="developer-count-badge" class="text-xs text-gray-500 font-medium">10 Tập đoàn BĐS</span>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" id="developer-chips-container">
                <button onclick="filterByDeveloper('all')" class="dev-filter-chip active px-4 py-2 rounded-xl text-xs font-bold shadow-xs">Tất cả CĐT</button>
                <button onclick="filterByDeveloper('Vinhomes')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">Vinhomes</button>
                <button onclick="filterByDeveloper('Novaland')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">Novaland</button>
                <button onclick="filterByDeveloper('Khang Điền')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">Khang Điền</button>
                <button onclick="filterByDeveloper('Nam Long')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">Nam Long</button>
                <button onclick="filterByDeveloper('Sun Group')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">Sun Group</button>
                <button onclick="filterByDeveloper('Hưng Thịnh')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">Hưng Thịnh</button>
                <button onclick="filterByDeveloper('Him Lam')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">Him Lam</button>
                <button onclick="filterByDeveloper('FLC')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">FLC</button>
                <button onclick="filterByDeveloper('BIM Group')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">BIM Group</button>
                <button onclick="filterByDeveloper('Kim Oanh')" class="dev-filter-chip px-3.5 py-2 rounded-xl text-xs font-bold">Kim Oanh</button>
            </div>
        </div>

        <!-- Live Search Status Banner -->
        <div id="search-status-banner" class="hidden mb-8 p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 transition duration-300 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                </div>
                <div>
                    <div id="search-status-text" class="text-sm font-bold text-gray-900">Tìm thấy 3 bất động sản phù hợp</div>
                    <div id="search-status-tags" class="flex flex-wrap gap-1.5 mt-1"></div>
                </div>
            </div>
            <button onclick="resetSearchFilters()" class="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100/80 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition shadow-sm">
                Xóa tất cả bộ lọc ✕
            </button>
        </div>

        <!-- 3 Interactive Cards Grid (Dynamically filtered) -->
        <div id="properties-container" class="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <!-- Card 1 -->
            <div data-aos="fade-up" data-aos-delay="100" class="interactive-card bg-white rounded-3xl overflow-hidden border border-gray-100 group">
                <!-- Image Container with Zoom & Badge -->
                <div class="relative h-64 overflow-hidden">
                    <img src="{{ asset('images/prop-apartment.jpg') }}" 
                         alt="Căn hộ The River" 
                         class="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition duration-700 ease-out">
                    
                    <!-- Floating Pill Badge -->
                    <div class="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-900/80 backdrop-blur-md text-[11px] font-bold text-emerald-200 border border-emerald-400/30 shadow-md">
                        Đang mở bán
                    </div>

                    <!-- Heart Wishlist Button -->
                    <button onclick="toggleLike(this, event)" class="btn-heart absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-gray-600 flex items-center justify-center shadow-md active:scale-90 transition">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>

                    <!-- Hover Quick Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                        <button onclick="showToast('Xem chi tiết Căn hộ The River!')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transform translate-y-3 group-hover:translate-y-0 transition duration-300">
                            Xem chi tiết BĐS
                        </button>
                    </div>
                </div>

                <!-- Content Info -->
                <div class="p-6">
                    <h3 class="font-extrabold text-gray-900 text-lg group-hover:text-emerald-700 transition duration-300 line-clamp-1">
                        Căn hộ 2PN view sông tại The River
                    </h3>
                    
                    <div class="flex items-baseline justify-between mt-4">
                        <span class="text-2xl font-black text-emerald-700 tracking-tight">6.8 tỷ</span>
                        <div class="flex items-center gap-3 text-xs font-semibold text-gray-500">
                            <span class="flex items-center gap-1"><i data-lucide="maximize" class="w-3.5 h-3.5 text-gray-400"></i> 54 m²</span>
                            <span class="flex items-center gap-1"><i data-lucide="bed" class="w-3.5 h-3.5 text-gray-400"></i> 2 PN</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                        <i data-lucide="map-pin" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                        <span class="truncate font-medium">Thủ Thiêm, TP. Thủ Đức, TP.HCM</span>
                    </div>
                </div>
            </div>

            <!-- Card 2 -->
            <div data-aos="fade-up" data-aos-delay="200" class="interactive-card bg-white rounded-3xl overflow-hidden border border-gray-100 group">
                <div class="relative h-64 overflow-hidden">
                    <img src="{{ asset('images/prop-townhouse.jpg') }}" 
                         alt="Nhà phố xanh Đà Nẵng" 
                         class="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition duration-700 ease-out">
                    
                    <div class="absolute top-4 left-4 px-3 py-1 rounded-full bg-blue-900/80 backdrop-blur-md text-[11px] font-bold text-blue-200 border border-blue-400/30 shadow-md">
                        Mới cập nhật
                    </div>

                    <button onclick="toggleLike(this, event)" class="btn-heart absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-gray-600 flex items-center justify-center shadow-md active:scale-90 transition">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>

                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                        <button onclick="showToast('Xem chi tiết Nhà phố xanh Đà Nẵng!')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transform translate-y-3 group-hover:translate-y-0 transition duration-300">
                            Xem chi tiết BĐS
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    <h3 class="font-extrabold text-gray-900 text-lg group-hover:text-emerald-700 transition duration-300 line-clamp-1">
                        Nhà phố xanh giữa lòng Đà Nẵng
                    </h3>
                    
                    <div class="flex items-baseline justify-between mt-4">
                        <span class="text-2xl font-black text-emerald-700 tracking-tight">4.2 tỷ</span>
                        <div class="flex items-center gap-3 text-xs font-semibold text-gray-500">
                            <span class="flex items-center gap-1"><i data-lucide="maximize" class="w-3.5 h-3.5 text-gray-400"></i> 108 m²</span>
                            <span class="flex items-center gap-1"><i data-lucide="bed" class="w-3.5 h-3.5 text-gray-400"></i> 3 PN</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                        <i data-lucide="map-pin" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                        <span class="truncate font-medium">Hải Châu, TP. Đà Nẵng</span>
                    </div>
                </div>
            </div>

            <!-- Card 3 -->
            <div data-aos="fade-up" data-aos-delay="300" class="interactive-card bg-white rounded-3xl overflow-hidden border border-gray-100 group">
                <div class="relative h-64 overflow-hidden">
                    <img src="{{ asset('images/prop-resort.jpg') }}" 
                         alt="Biệt thự ven hồ" 
                         class="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition duration-700 ease-out">
                    
                    <div class="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-900/80 backdrop-blur-md text-[11px] font-bold text-amber-200 border border-amber-400/30 shadow-md">
                        Đang hot
                    </div>

                    <button onclick="toggleLike(this, event)" class="btn-heart absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-gray-600 flex items-center justify-center shadow-md active:scale-90 transition">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>

                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                        <button onclick="showToast('Xem chi tiết Biệt thự ven hồ!')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transform translate-y-3 group-hover:translate-y-0 transition duration-300">
                            Xem chi tiết BĐS
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    <h3 class="font-extrabold text-gray-900 text-lg group-hover:text-emerald-700 transition duration-300 line-clamp-1">
                        Biệt thự nghỉ dưỡng ven hồ sinh thái
                    </h3>
                    
                    <div class="flex items-baseline justify-between mt-4">
                        <span class="text-2xl font-black text-emerald-700 tracking-tight">12.5 tỷ</span>
                        <div class="flex items-center gap-3 text-xs font-semibold text-gray-500">
                            <span class="flex items-center gap-1"><i data-lucide="maximize" class="w-3.5 h-3.5 text-gray-400"></i> 240 m²</span>
                            <span class="flex items-center gap-1"><i data-lucide="bed" class="w-3.5 h-3.5 text-gray-400"></i> 4 PN</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                        <i data-lucide="map-pin" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                        <span class="truncate font-medium">Sơn Trà, TP. Đà Nẵng</span>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 3. FEATURED PROJECTS (DỰ ÁN NỔI BẬT)            -->
    <!-- ============================================== -->
    <section id="projects" class="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div data-aos="fade-up" class="mb-10">
            <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <i data-lucide="award" class="w-3.5 h-3.5"></i> DỰ ÁN TIÊU BIỂU
            </span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">Dự án quy mô nổi bật</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Project 1 -->
            <div data-aos="fade-right" data-aos-duration="900" 
                 onclick="showToast('Khám phá Dự án Eaton Park!')"
                 class="relative h-96 rounded-3xl overflow-hidden shadow-xl group cursor-pointer border border-emerald-950/20 hover:border-emerald-500/50 transition duration-500">
                <img src="{{ asset('images/project-eaton.jpg') }}" 
                     alt="Eaton Park" 
                     class="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition duration-1000 ease-out">
                
                <div class="absolute inset-0 project-card-overlay flex flex-col justify-between p-8">
                    <div class="flex items-center justify-between">
                        <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-700/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-emerald-400/40 shadow-lg group-hover:bg-emerald-600 transition">
                            <span class="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                            ĐANG MỞ BÁN
                        </span>
                        <div class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-3 group-hover:translate-x-0 transition duration-300">
                            <i data-lucide="arrow-up-right" class="w-5 h-5"></i>
                        </div>
                    </div>

                    <div class="transform group-hover:-translate-y-2 transition duration-300">
                        <h3 class="text-3xl font-extrabold text-white mb-2 tracking-tight">Eaton Park</h3>
                        <p class="text-sm text-emerald-200 flex items-center gap-1.5 font-medium">
                            <i data-lucide="map-pin" class="w-4 h-4 text-emerald-400"></i>
                            Mai Chí Thọ, TP. Thủ Đức, TP.HCM • 1,980 Căn hộ cao cấp
                        </p>
                    </div>
                </div>
            </div>

            <!-- Project 2 -->
            <div data-aos="fade-left" data-aos-duration="900" 
                 onclick="showToast('Khám phá Dự án Sun Urban City!')"
                 class="relative h-96 rounded-3xl overflow-hidden shadow-xl group cursor-pointer border border-emerald-950/20 hover:border-emerald-500/50 transition duration-500">
                <img src="{{ asset('images/project-sunurban.jpg') }}" 
                     alt="Sun Urban City" 
                     class="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition duration-1000 ease-out">
                
                <div class="absolute inset-0 project-card-overlay flex flex-col justify-between p-8">
                    <div class="flex items-center justify-between">
                        <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/25 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/40 shadow-lg group-hover:bg-white/40 transition">
                            <span class="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
                            SẮP RA MẮT
                        </span>
                        <div class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-3 group-hover:translate-x-0 transition duration-300">
                            <i data-lucide="arrow-up-right" class="w-5 h-5"></i>
                        </div>
                    </div>

                    <div class="transform group-hover:-translate-y-2 transition duration-300">
                        <h3 class="text-3xl font-extrabold text-white mb-2 tracking-tight">Sun Urban City</h3>
                        <p class="text-sm text-emerald-200 flex items-center gap-1.5 font-medium">
                            <i data-lucide="map-pin" class="w-4 h-4 text-emerald-400"></i>
                            Phủ Lý, Hà Nam • Đại đô thị sinh thái • Từ 1.5 tỷ/căn
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 4. THREE STEPS / POSTING CATEGORIES            -->
    <!-- ============================================== -->
    <section id="categories" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div data-aos="fade-up" class="text-left mb-12">
            <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <i data-lucide="grid" class="w-3.5 h-3.5"></i> DÀNH CHO NGƯỜI BÁN & CHO THUÊ
            </span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">Đăng tin nhanh chóng theo danh mục</h2>
            <p class="text-gray-500 text-sm mt-1">Chọn phân khúc bạn muốn tiếp cận hơn 2.4 triệu khách hàng tiềm năng</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 mb-10">
            
            <!-- 1. Căn hộ -->
            <div data-aos="zoom-in" data-aos-delay="50" onclick="showToast('Chọn danh mục Căn hộ')" class="category-card bg-white p-6 rounded-3xl border border-gray-100 cursor-pointer text-center group">
                <div class="cat-icon-box w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition duration-300">
                    <i data-lucide="building" class="w-6 h-6"></i>
                </div>
                <div class="font-extrabold text-gray-900 text-base group-hover:text-emerald-700 transition">Căn hộ</div>
                <div class="text-xs text-gray-400 font-semibold mt-1">14,230 tin</div>
            </div>

            <!-- 2. Nhà phố -->
            <div data-aos="zoom-in" data-aos-delay="100" onclick="showToast('Chọn danh mục Nhà phố')" class="category-card bg-white p-6 rounded-3xl border border-gray-100 cursor-pointer text-center group">
                <div class="cat-icon-box w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition duration-300">
                    <i data-lucide="home" class="w-6 h-6"></i>
                </div>
                <div class="font-extrabold text-gray-900 text-base group-hover:text-emerald-700 transition">Nhà phố</div>
                <div class="text-xs text-gray-400 font-semibold mt-1">8,120 tin</div>
            </div>

            <!-- 3. Biệt thự -->
            <div data-aos="zoom-in" data-aos-delay="150" onclick="showToast('Chọn danh mục Biệt thự')" class="category-card bg-white p-6 rounded-3xl border border-gray-100 cursor-pointer text-center group">
                <div class="cat-icon-box w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition duration-300">
                    <i data-lucide="castle" class="w-6 h-6"></i>
                </div>
                <div class="font-extrabold text-gray-900 text-base group-hover:text-emerald-700 transition">Biệt thự</div>
                <div class="text-xs text-gray-400 font-semibold mt-1">2,434 tin</div>
            </div>

            <!-- 4. Đất nền -->
            <div data-aos="zoom-in" data-aos-delay="200" onclick="showToast('Chọn danh mục Đất nền')" class="category-card bg-white p-6 rounded-3xl border border-gray-100 cursor-pointer text-center group">
                <div class="cat-icon-box w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition duration-300">
                    <i data-lucide="layers" class="w-6 h-6"></i>
                </div>
                <div class="font-extrabold text-gray-900 text-base group-hover:text-emerald-700 transition">Đất nền</div>
                <div class="text-xs text-gray-400 font-semibold mt-1">6,170 tin</div>
            </div>

            <!-- 5. Văn phòng -->
            <div data-aos="zoom-in" data-aos-delay="250" onclick="showToast('Chọn danh mục Văn phòng')" class="category-card bg-white p-6 rounded-3xl border border-gray-100 cursor-pointer text-center group">
                <div class="cat-icon-box w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition duration-300">
                    <i data-lucide="briefcase" class="w-6 h-6"></i>
                </div>
                <div class="font-extrabold text-gray-900 text-base group-hover:text-emerald-700 transition">Văn phòng</div>
                <div class="text-xs text-gray-400 font-semibold mt-1">2,108 tin</div>
            </div>

            <!-- 6. Mặt bằng -->
            <div data-aos="zoom-in" data-aos-delay="300" onclick="showToast('Chọn danh mục Mặt bằng')" class="category-card bg-white p-6 rounded-3xl border border-gray-100 cursor-pointer text-center group">
                <div class="cat-icon-box w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition duration-300">
                    <i data-lucide="store" class="w-6 h-6"></i>
                </div>
                <div class="font-extrabold text-gray-900 text-base group-hover:text-emerald-700 transition">Mặt bằng</div>
                <div class="text-xs text-gray-400 font-semibold mt-1">1,450 tin</div>
            </div>
        </div>

        <div data-aos="fade-up" class="text-center sm:text-left">
            <button onclick="showToast('Bắt đầu quy trình đăng tin 3 bước!')" 
                    class="btn-shimmer px-8 py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-900/20 hover:shadow-emerald-700/40 hover:scale-105 active:scale-95 transition duration-300 inline-flex items-center gap-2">
                <span>Bắt đầu đăng tin miễn phí ngay</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 5. STATS COUNTER STRIP WITH NUMBER ANIMATION   -->
    <!-- ============================================== -->
    <section class="bg-gradient-to-r from-[#0a231c] via-[#0f352a] to-[#0a231c] text-white py-16 relative overflow-hidden">
        
        <!-- Ambient background lights -->
        <div class="ambient-glow bg-emerald-500 w-72 h-72 top-0 left-1/4 opacity-20"></div>
        <div class="ambient-glow bg-teal-400 w-72 h-72 bottom-0 right-1/4 opacity-20"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-800/60">
                
                <!-- Stat 1 -->
                <div data-aos="fade-up" data-aos-delay="100" class="pt-4 md:pt-0 p-4 rounded-2xl hover:bg-white/5 transition duration-300">
                    <div class="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100 flex items-center justify-center">
                        <span class="counter" data-target="80">0</span>K+
                    </div>
                    <div class="text-xs sm:text-sm text-emerald-200/90 font-medium mt-2">Tin đăng kiểm duyệt</div>
                </div>

                <!-- Stat 2 -->
                <div data-aos="fade-up" data-aos-delay="200" class="pt-4 md:pt-0 p-4 rounded-2xl hover:bg-white/5 transition duration-300">
                    <div class="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100 flex items-center justify-center">
                        <span class="counter" data-target="2.4" data-decimals="1">0</span>M+
                    </div>
                    <div class="text-xs sm:text-sm text-emerald-200/90 font-medium mt-2">Lượt truy cập / tháng</div>
                </div>

                <!-- Stat 3 -->
                <div data-aos="fade-up" data-aos-delay="300" class="pt-4 md:pt-0 p-4 rounded-2xl hover:bg-white/5 transition duration-300">
                    <div class="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100 flex items-center justify-center">
                        <span class="counter" data-target="12000">0</span>+
                    </div>
                    <div class="text-xs sm:text-sm text-emerald-200/90 font-medium mt-2">Môi giới xác thực</div>
                </div>

                <!-- Stat 4 -->
                <div data-aos="fade-up" data-aos-delay="400" class="pt-4 md:pt-0 p-4 rounded-2xl hover:bg-white/5 transition duration-300">
                    <div class="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100 flex items-center justify-center">
                        <span class="counter" data-target="63">0</span>
                    </div>
                    <div class="text-xs sm:text-sm text-emerald-200/90 font-medium mt-2">Tỉnh thành toàn quốc</div>
                </div>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 6. TESTIMONIALS / TRUST                        -->
    <!-- ============================================== -->
    <section id="testimonials" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <!-- Left Header & Profile -->
            <div data-aos="fade-right" data-aos-duration="800" class="lg:col-span-5">
                <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-3">
                    <i data-lucide="message-square-quote" class="w-3.5 h-3.5"></i> KHÁCH HÀNG NÓI GÌ
                </span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-6 tracking-tight leading-tight">
                    An tâm hơn trong mọi quyết định giao dịch.
                </h2>
                
                <div class="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-emerald-700/20">
                        NA
                    </div>
                    <div>
                        <div class="font-bold text-gray-900 text-base">Nguyễn Minh Anh</div>
                        <div class="text-xs text-gray-500">Nhà đầu tư cá nhân tại TP.HCM</div>
                    </div>
                </div>
            </div>

            <!-- Right Testimonial Card with 3D feel -->
            <div data-aos="fade-left" data-aos-duration="800" class="lg:col-span-7">
                <div class="interactive-card bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 relative group">
                    <i data-lucide="quote" class="w-12 h-12 text-emerald-100 absolute top-6 right-6 -z-0"></i>
                    
                    <div class="flex text-amber-400 gap-1.5 mb-5 text-base">
                        <i data-lucide="star" class="w-5 h-5 fill-amber-400"></i>
                        <i data-lucide="star" class="w-5 h-5 fill-amber-400"></i>
                        <i data-lucide="star" class="w-5 h-5 fill-amber-400"></i>
                        <i data-lucide="star" class="w-5 h-5 fill-amber-400"></i>
                        <i data-lucide="star" class="w-5 h-5 fill-amber-400"></i>
                    </div>

                    <blockquote class="text-gray-700 text-lg sm:text-xl leading-relaxed mb-8 font-semibold italic">
                        “3TV giúp tôi tìm kiếm khu vực mua căn hộ rất nhanh và an toàn. Trải nghiệm minh bạch, thông tin chính xác và môi giới hỗ trợ vô cùng tận tâm!”
                    </blockquote>

                    <div class="flex items-center gap-3 pt-6 border-t border-gray-100">
                        <div class="w-11 h-11 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200">
                            TB
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 text-sm">Trần Quốc Bảo</div>
                            <div class="text-xs text-gray-500">Chuyên viên kinh doanh • Đã mua nhà qua 3TV</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 7. CTA BANNER CARD                             -->
    <!-- ============================================== -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div data-aos="zoom-in" data-aos-duration="800" class="relative overflow-hidden bg-gradient-to-r from-[#173e33] via-[#1b4b3e] to-[#0e2a22] rounded-3xl p-8 sm:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border border-emerald-500/20">
            
            <!-- Animated background accent -->
            <div class="ambient-glow bg-emerald-400 w-80 h-80 -top-20 -right-20 opacity-30"></div>

            <div class="relative z-10 max-w-xl text-center md:text-left">
                <h3 class="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                    Bạn đã sẵn sàng cho bước tiếp theo?
                </h3>
                <p class="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
                    Tìm ngôi nhà lý tưởng hoặc đưa bất động sản của bạn tới hàng triệu khách hàng ngay hôm nay.
                </p>
            </div>

            <div class="relative z-10 flex flex-wrap items-center justify-center gap-4 shrink-0">
                <button onclick="showToast('Bắt đầu tìm nhà mơ ước!')" 
                        class="btn-shimmer px-7 py-3.5 rounded-full bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold text-sm shadow-xl hover:shadow-white/30 hover:scale-105 active:scale-95 transition duration-300">
                    Tìm nhà ngay
                </button>
                <button onclick="showToast('Chuyển tới đăng tin miễn phí!')" 
                        class="btn-shimmer px-7 py-3.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-sm border border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition duration-300 backdrop-blur-sm">
                    Đăng tin miễn phí
                </button>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 8. FOOTER                                      -->
    <!-- ============================================== -->
    <footer class="bg-[#081914] text-gray-300 pt-20 pb-12 border-t border-emerald-950/60">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-10 pb-14 border-b border-emerald-900/40">
                
                <!-- Brand Info -->
                <div class="md:col-span-4">
                    <a href="{{ url('/') }}" class="flex items-center gap-2.5 mb-5 group">
                        <div class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center group-hover:bg-emerald-500/40 transition">
                            <i data-lucide="home" class="w-5 h-5 text-emerald-300"></i>
                        </div>
                        <span class="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                            <span class="text-emerald-400">3</span>TV
                        </span>
                    </a>
                    <p class="text-xs text-gray-400 leading-relaxed mb-6 max-w-sm font-normal">
                        Nền tảng giao dịch bất động sản uy tín hàng đầu Việt Nam. Kết nối khách hàng và chuyên viên tư vấn với quy trình minh bạch, hiệu quả nhất.
                    </p>
                    <div class="text-xs text-emerald-300 font-semibold space-y-1">
                        <div>Hotline: <strong class="text-white font-bold text-sm">1900 6868</strong> (8:00 - 21:00)</div>
                        <div>Email: <span class="text-white">contact@3tv.vn</span></div>
                    </div>
                </div>

                <!-- Column 1 -->
                <div class="md:col-span-3">
                    <h4 class="text-sm font-bold text-white mb-4 uppercase tracking-wider">Bất động sản</h4>
                    <ul class="space-y-3 text-xs text-gray-400 font-medium">
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Mua bán nhà đất</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Cho thuê căn hộ</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Dự án bất động sản</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Tin tức thị trường</a></li>
                    </ul>
                </div>

                <!-- Column 2 -->
                <div class="md:col-span-3">
                    <h4 class="text-sm font-bold text-white mb-4 uppercase tracking-wider">Hỗ trợ</h4>
                    <ul class="space-y-3 text-xs text-gray-400 font-medium">
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Trung tâm trợ giúp</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Hướng dẫn đăng tin</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Bảng giá dịch vụ</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Quy chế hoạt động</a></li>
                    </ul>
                </div>

                <!-- Column 3 -->
                <div class="md:col-span-2">
                    <h4 class="text-sm font-bold text-white mb-4 uppercase tracking-wider">Về 3TV</h4>
                    <ul class="space-y-3 text-xs text-gray-400 font-medium">
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Giới thiệu công ty</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Tuyển dụng</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Liên hệ</a></li>
                        <li><a href="#" class="hover:text-emerald-300 hover:translate-x-1 inline-block transition">Chính sách bảo mật</a></li>
                    </ul>
                </div>
            </div>

            <!-- Bottom Copyright -->
            <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                <div>
                    © {{ date('Y') }} 3TV. Tất cả các quyền được bảo lưu.
                </div>
                <div class="flex items-center gap-6 font-medium">
                    <a href="#" class="hover:text-gray-300 transition">Điều khoản</a>
                    <a href="#" class="hover:text-gray-300 transition">Bảo mật</a>
                    <a href="#" class="hover:text-gray-300 transition">Cookies</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- ============================================== -->
    <!-- INTERACTIVE REAL ESTATE MAP MODAL (LEAFLET.JS) -->
    <!-- ============================================== -->
    <div id="map-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md transition-opacity duration-300">
        <div class="relative w-full max-w-5xl h-[85vh] max-h-[750px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
            
            <!-- Modal Header -->
            <div class="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                        <i data-lucide="map" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-base sm:text-lg">Bản đồ Bất động sản tương tác</h3>
                        <p class="text-xs text-emerald-200/80">Nhấp chọn khu vực hoặc dự án để tìm kiếm nhanh</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <!-- Quick City Jump Buttons -->
                    <div class="hidden md:flex items-center gap-1.5 bg-white/10 p-1 rounded-xl text-xs">
                        <button type="button" onclick="flyToCity('hcm')" class="px-2.5 py-1 rounded-lg hover:bg-emerald-600 transition font-medium">TP.HCM</button>
                        <button type="button" onclick="flyToCity('hanoi')" class="px-2.5 py-1 rounded-lg hover:bg-emerald-600 transition font-medium">Hà Nội</button>
                        <button type="button" onclick="flyToCity('danang')" class="px-2.5 py-1 rounded-lg hover:bg-emerald-600 transition font-medium">Đà Nẵng</button>
                        <button type="button" onclick="flyToCity('binhduong')" class="px-2.5 py-1 rounded-lg hover:bg-emerald-600 transition font-medium">Bình Dương</button>
                        <button type="button" onclick="flyToCity('phuquoc')" class="px-2.5 py-1 rounded-lg hover:bg-emerald-600 transition font-medium">Phú Quốc</button>
                    </div>

                    <button type="button" onclick="closeMapModal()" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <!-- Leaflet Map Container -->
            <div class="relative flex-1 w-full h-full bg-gray-100">
                <div id="interactive-leaflet-map" class="w-full h-full z-10" style="min-height: 400px;"></div>

                <!-- Floating Map Helper Overlay -->
                <div class="absolute bottom-4 left-4 right-4 sm:right-auto z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl border border-gray-100 max-w-md">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="info" class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 text-xs text-gray-600">
                            <p class="font-bold text-gray-900 mb-0.5">Mẹo chọn khu vực:</p>
                            <p>Nhấp vào bất kỳ điểm ghim trên bản đồ để xem chi tiết BĐS & chọn, hoặc nhấp vào vị trí bất kỳ để tìm quanh tọa độ đó.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                <div id="map-selected-info" class="text-xs text-gray-600 font-medium truncate max-w-md flex items-center gap-1.5">
                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
                    <span>Chưa chọn khu vực nào (Nhấp vào điểm ghim trên bản đồ)</span>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="closeMapModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition">
                        Đóng
                    </button>
                    <button id="btn-apply-map-selection" type="button" onclick="applyMapSelection()" class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition">
                        Áp dụng khu vực này
                    </button>
                </div>
            </div>

        </div>
    </div>



    <!-- ============================================== -->
    <!-- MODAL: CHI TIẾT GIÁ THUÊ & TIỀN CỌC VINHOMES  -->
    <!-- ============================================== -->
    <div id="rent-detail-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md transition-opacity duration-300">
        <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                        <i data-lucide="receipt" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-base sm:text-lg">Chi tiết tài chính & Hợp đồng thuê</h3>
                        <p class="text-xs text-emerald-200/80">Minh bạch giá thuê, tiền cọc và điều khoản</p>
                    </div>
                </div>
                <button type="button" onclick="closeRentDetailModal()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>

            <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div class="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <img id="rent-modal-img" src="" class="w-16 h-16 rounded-xl object-cover shrink-0">
                    <div>
                        <div id="rent-modal-project" class="text-xs font-bold text-emerald-600 uppercase"></div>
                        <div id="rent-modal-title" class="text-sm font-extrabold text-gray-900 line-clamp-1"></div>
                        <div id="rent-modal-address" class="text-xs text-gray-500 mt-0.5"></div>
                    </div>
                </div>

                <!-- Financial Breakdown Table -->
                <div class="border border-emerald-100 rounded-2xl overflow-hidden">
                    <div class="bg-emerald-50/80 px-4 py-2.5 font-bold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <i data-lucide="dollar-sign" class="w-3.5 h-3.5 text-emerald-700"></i> Bảng tính chi phí ban đầu
                    </div>
                    <div class="p-4 space-y-3 text-xs">
                        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span class="text-gray-600 font-medium">Giá thuê hàng tháng:</span>
                            <span id="rent-modal-price" class="text-base font-black text-emerald-700"></span>
                        </div>
                        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span class="text-gray-600 font-medium">Tiền đặt cọc bảo đảm:</span>
                            <span id="rent-modal-deposit" class="text-sm font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200"></span>
                        </div>
                        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span class="text-gray-600 font-medium">Phí quản lý tòa nhà:</span>
                            <span id="rent-modal-fee" class="font-bold text-gray-800"></span>
                        </div>
                        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span class="text-gray-600 font-medium">Thời hạn hợp đồng tối thiểu:</span>
                            <span id="rent-modal-period" class="font-bold text-gray-800"></span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600 font-medium">Tình trạng nội thất:</span>
                            <span id="rent-modal-furniture" class="font-bold text-gray-800"></span>
                        </div>
                    </div>
                </div>

                <!-- Owner / Agent Info -->
                <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                        <div class="text-gray-400 font-medium text-[11px]">Chủ nhà / Môi giới phụ trách:</div>
                        <div id="rent-modal-owner" class="font-bold text-gray-900 mt-0.5"></div>
                    </div>
                    <a id="rent-modal-phone-btn" href="#" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm">
                        <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                        <span id="rent-modal-phone"></span>
                    </a>
                </div>

                <div class="pt-2 flex items-center justify-end gap-3">
                    <button type="button" onclick="closeRentDetailModal()" class="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition">
                        Đóng
                    </button>
                    <a id="rent-modal-call-btn" href="#" class="btn-shimmer px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5">
                        <i data-lucide="phone-call" class="w-4 h-4"></i>
                        <span>Gọi điện liên hệ ngay</span>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- AOS (Animate On Scroll) JS -->
    <script src="https://unpkg.com/aos@next/dist/aos.js"></script>

    <!-- Interactive Scripts -->
    <script>
        // 1. Initialize Lucide Icons & AOS
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            AOS.init({
                once: true,
                duration: 700,
                easing: 'ease-out-cubic',
                offset: 60
            });
            initCounters();
            performSearch();
        });

        // 2. Sticky Navbar Glass Blur on Scroll
        window.addEventListener('scroll', () => {
            const navWrapper = document.getElementById('navbarWrapper');
            const backToTop = document.getElementById('backToTop');
            
            if (window.scrollY > 50) {
                navWrapper.classList.add('glass-nav', 'sticky', 'top-0', 'shadow-lg');
                navWrapper.classList.remove('relative');
            } else {
                navWrapper.classList.remove('glass-nav', 'sticky', 'top-0', 'shadow-lg');
                navWrapper.classList.add('relative');
            }

            // Back to top visibility
            if (window.scrollY > 350) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        // 3. Search Tab Switcher & Purpose State
        let currentPurpose = 'buy'; // 'buy' (Mua bán), 'rent' (Cho thuê), 'project' (Dự án mới)

        function switchSearchTab(tabKey) {
            currentPurpose = tabKey;
            
            document.querySelectorAll('.search-tab-btn').forEach(btn => {
                btn.classList.remove('active', 'text-emerald-700');
                btn.classList.add('text-gray-500');
            });
            const activeBtn = document.getElementById(`tab-${tabKey}`);
            if (activeBtn) {
                activeBtn.classList.add('active');
                activeBtn.classList.remove('text-gray-500');
            }

            // Update Section Header dynamically
            const secTitle = document.getElementById('featured-section-title');
            const secDesc = document.getElementById('featured-section-desc');
            if (secTitle && secDesc) {
                if (tabKey === 'buy') {
                    secTitle.textContent = 'Bất động sản mua bán Vinhomes cao cấp';
                    secDesc.textContent = 'Dữ liệu thực tế: Căn hộ & biệt thự sở hữu lâu dài, pháp lý chuẩn mực';
                } else if (tabKey === 'rent') {
                    secTitle.textContent = 'Căn hộ & Nhà phố cho thuê Vinhomes (Kèm giá cọc)';
                    secDesc.textContent = 'Minh bạch giá thuê theo tháng, tiền đặt cọc bảo đảm và tình trạng nội thất';
                } else if (tabKey === 'project') {
                    secTitle.textContent = 'Đại đô thị & Dự án Vinhomes mới nhất';
                    secDesc.textContent = 'Quy mô quốc tế, tiện ích trọn vẹn, chính sách bán hàng trực tiếp chủ đầu tư';
                }
            }

            performSearch();
            showToast(`Đã chuyển sang chế độ: ${activeBtn ? activeBtn.textContent.trim() : tabKey}`);
        }

        // 4. Interactive Dropdowns
        function toggleDropdown(id) {
            const el = document.getElementById(id);
            const isShown = el.classList.contains('show');
            
            // Close all dropdowns
            document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('show'));
            
            if (!isShown) {
                el.classList.add('show');
            }
        }

        function selectOption(targetLabelId, value, dropdownId) {
            document.getElementById(targetLabelId).textContent = value;
            document.getElementById(dropdownId).classList.remove('show');
            performSearch();
            showToast(`Đã chọn: ${value}`);
        }

        // Close dropdowns when clicking outside
        window.addEventListener('click', (e) => {
            if (!e.target.closest('.relative')) {
                document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('show'));
            }
        });

        // ==============================================
        // 5. REALISTIC VINHOMES DATASET & SEARCH ENGINE
        let selectedDeveloper = 'all';

        function filterByDeveloper(dev) {
            selectedDeveloper = dev;
            const container = document.getElementById('developer-chips-container');
            if (container) {
                container.querySelectorAll('.dev-filter-chip').forEach(btn => {
                    const text = btn.textContent.trim();
                    if ((dev === 'all' && text === 'Tất cả CĐT') || text === dev) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
            const badge = document.getElementById('developer-count-badge');
            if (badge) {
                badge.textContent = dev === 'all' ? '10 Tập đoàn BĐS' : `Đang lọc: ${dev}`;
            }
            performSearch();
            showToast(`Đã lọc BĐS theo chủ đầu tư: ${dev === 'all' ? 'Tất cả chủ đầu tư' : dev}`);
        }

        let propertiesData = [
            {
                id: 1,
                code: "VH-CP-L81-01",
                title: "Căn hộ 2PN Landmark 81 view sông Sài Gòn trực diện",
                project: "Vinhomes Central Park",
                purpose: "rent",
                type: "Căn hộ cao cấp",
                priceRentText: "26 triệu/tháng",
                priceRentNum: 26,
                depositText: "52 triệu (cọc 2 tháng)",
                priceSaleText: null,
                priceNum: 26,
                rentPeriodMin: "Hợp đồng 1 năm",
                furniture: "Full nội thất cao cấp",
                managementFee: "21.000 đ/m²/tháng",
                availableDate: "Dọn vào ở ngay",
                area: 78,
                beds: 2,
                baths: 2,
                street: "208 Nguyễn Hữu Cảnh",
                district: "Phường 22, Quận Bình Thạnh",
                city: "TP. Hồ Chí Minh",
                lat: 10.7951,
                lng: 106.7218,
                image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
                badge: "Cho thuê gấp",
                badgeClass: "bg-emerald-900/80 text-emerald-200 border-emerald-400/30",
                ownerName: "Chị Minh Thư",
                ownerPhone: "0908 123 456"
            },
            {
                id: 2,
                code: "VH-GP-OR-02",
                title: "Căn hộ 2PN+1 The Origami phong cách Nhật Bản",
                project: "Vinhomes Grand Park",
                purpose: "rent",
                type: "Căn hộ cao cấp",
                priceRentText: "9.5 triệu/tháng",
                priceRentNum: 9.5,
                depositText: "19 triệu (cọc 2 tháng)",
                priceSaleText: null,
                priceNum: 9.5,
                rentPeriodMin: "Tối thiểu 6 tháng",
                furniture: "Nội thất cơ bản + Rèm & Bếp từ",
                managementFee: "8.800 đ/m²/tháng",
                availableDate: "Từ đầu tháng tới",
                area: 69,
                beds: 2,
                baths: 2,
                street: "Đường Nguyễn Xiển - Phước Thiện",
                district: "Phường Long Thạnh Mỹ, TP. Thủ Đức",
                city: "TP. Hồ Chí Minh",
                lat: 10.8415,
                lng: 106.8402,
                image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
                badge: "Giá thuê tốt",
                badgeClass: "bg-teal-900/80 text-teal-200 border-teal-400/30",
                ownerName: "Anh Quốc Bảo",
                ownerPhone: "0912 345 678"
            },
            {
                id: 3,
                code: "VH-SC-TK-03",
                title: "Căn hộ Studio The Tonkin Vinhomes Smart City view hồ",
                project: "Vinhomes Smart City",
                purpose: "rent",
                type: "Căn hộ cao cấp",
                priceRentText: "7.5 triệu/tháng",
                priceRentNum: 7.5,
                depositText: "7.5 triệu (cọc 1 tháng)",
                priceSaleText: null,
                priceNum: 7.5,
                rentPeriodMin: "Hợp đồng 1 năm",
                furniture: "Full nội thất 100% xách vali vào ở",
                managementFee: "12.000 đ/m²/tháng",
                availableDate: "Dọn vào ngay",
                area: 32,
                beds: 1,
                baths: 1,
                street: "Đại lộ Thăng Long",
                district: "Phường Tây Mỗ, Quận Nam Từ Liêm",
                city: "Hà Nội",
                lat: 21.0022,
                lng: 105.7423,
                image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
                badge: "Cọc 1 tháng",
                badgeClass: "bg-blue-900/80 text-blue-200 border-blue-400/30",
                ownerName: "Chị Hoàng Lan",
                ownerPhone: "0934 888 999"
            },
            {
                id: 4,
                code: "VH-OP1-ZP-04",
                title: "Căn 3PN Zen Park ban công Đông Nam view hồ nước mặn",
                project: "Vinhomes Ocean Park 1",
                purpose: "rent",
                type: "Căn hộ cao cấp",
                priceRentText: "16 triệu/tháng",
                priceRentNum: 16,
                depositText: "32 triệu (cọc 2 tháng)",
                priceSaleText: null,
                priceNum: 16,
                rentPeriodMin: "Hợp đồng 1 năm trở lên",
                furniture: "Full nội thất gỗ cao cấp & thiết bị thông minh",
                managementFee: "Miễn phí 1 năm",
                availableDate: "Xem nhà 24/7",
                area: 88,
                beds: 3,
                baths: 2,
                street: "Đường Đại Dương",
                district: "Xã Đa Tốn, Huyện Gia Lâm",
                city: "Hà Nội",
                lat: 20.9950,
                lng: 105.9450,
                image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
                badge: "Gần biển nhân tạo",
                badgeClass: "bg-cyan-900/80 text-cyan-200 border-cyan-400/30",
                ownerName: "Anh Tuấn Anh",
                ownerPhone: "0977 112 233"
            },
            {
                id: 5,
                code: "VH-GR-AQ-05",
                title: "Căn hộ hạng sang Aqua 1 Vinhomes Golden River Ba Son",
                project: "Vinhomes Golden River",
                purpose: "sale",
                type: "Căn hộ cao cấp",
                priceRentText: null,
                priceRentNum: null,
                depositText: null,
                priceSaleText: "11.5 tỷ",
                priceNum: 11.5,
                unitPrice: "145 triệu/m²",
                legal: "Sổ hồng sở hữu lâu dài",
                furniture: "Full nội thất Duravit & Bosch Đức",
                area: 79,
                beds: 2,
                baths: 2,
                street: "Số 2 Tôn Đức Thắng",
                district: "Phường Bến Nghé, Quận 1",
                city: "TP. Hồ Chí Minh",
                lat: 10.7850,
                lng: 106.7090,
                image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                badge: "View sông Sài Gòn",
                badgeClass: "bg-rose-900/80 text-rose-200 border-rose-400/30",
                ownerName: "Chị Thu Thảo",
                ownerPhone: "0903 667 889"
            },
            {
                id: 6,
                code: "VH-GP-BV-06",
                title: "Căn hộ resort The Beverly tầng cao trực diện công viên 36ha",
                project: "Vinhomes Grand Park",
                purpose: "sale",
                type: "Căn hộ cao cấp",
                priceRentText: null,
                priceRentNum: null,
                depositText: null,
                priceSaleText: "4.2 tỷ",
                priceNum: 4.2,
                unitPrice: "58 triệu/m²",
                legal: "HĐMB trực tiếp Chủ đầu tư",
                furniture: "Bàn giao hoàn thiện cơ bản cao cấp",
                area: 72,
                beds: 2,
                baths: 2,
                street: "Đường Phước Thiện",
                district: "Phường Long Bình, TP. Thủ Đức",
                city: "TP. Hồ Chí Minh",
                lat: 10.8460,
                lng: 106.8450,
                image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
                badge: "Suất ngoại giao",
                badgeClass: "bg-amber-900/80 text-amber-200 border-amber-400/30",
                ownerName: "Anh Hoàng Nam",
                ownerPhone: "0988 333 444"
            },
            {
                id: 7,
                code: "VH-OP1-BT-07",
                title: "Biệt thự song lập San Hô vị trí góc đối diện hồ 24.5ha",
                project: "Vinhomes Ocean Park 1",
                purpose: "sale",
                type: "Biệt thự nghỉ dưỡng",
                priceRentText: null,
                priceRentNum: null,
                depositText: null,
                priceSaleText: "28.5 tỷ",
                priceNum: 28.5,
                unitPrice: "190 triệu/m²",
                legal: "Sổ đỏ chính chủ trao tay",
                furniture: "Xây thô hoàn thiện mặt ngoài 4 tầng",
                area: 150,
                beds: 5,
                baths: 5,
                street: "Khu San Hô, Vinhomes Ocean Park",
                district: "Huyện Gia Lâm",
                city: "Hà Nội",
                lat: 20.9980,
                lng: 105.9520,
                image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
                badge: "Lô góc hoa hậu",
                badgeClass: "bg-purple-900/80 text-purple-200 border-purple-400/30",
                ownerName: "Bác Thanh Sơn",
                ownerPhone: "0918 777 999"
            },
            {
                id: 8,
                code: "VH-CP-P5-08",
                title: "Căn hộ 1PN Park 5 full nội thất cao cấp cho chuyên gia",
                project: "Vinhomes Central Park",
                purpose: "rent",
                type: "Căn hộ cao cấp",
                priceRentText: "15 triệu/tháng",
                priceRentNum: 15,
                depositText: "30 triệu (cọc 2 tháng)",
                priceSaleText: null,
                priceNum: 15,
                rentPeriodMin: "Hợp đồng 1 năm",
                furniture: "Đầy đủ điện máy, máy sấy, lò vi sóng cao cấp",
                managementFee: "Chủ nhà bao trọn gói phí QL",
                availableDate: "Trống sẵn vào ở ngay",
                area: 52,
                beds: 1,
                baths: 1,
                street: "208 Nguyễn Hữu Cảnh",
                district: "Phường 22, Quận Bình Thạnh",
                city: "TP. Hồ Chí Minh",
                lat: 10.7925,
                lng: 106.7205,
                image: "https://images.unsplash.com/photo-1502005229762-ee1b2da97e06?auto=format&fit=crop&w=800&q=80",
                badge: "Bao phí QL",
                badgeClass: "bg-emerald-900/80 text-emerald-200 border-emerald-400/30",
                ownerName: "Chị Phương Nga",
                ownerPhone: "0909 555 777"
            },
            {
                id: 9,
                code: "VH-RI-VY-09",
                title: "Biệt thự đảo Hoàng Gia Vinhomes Royal Island Vũ Yên",
                project: "Vinhomes Royal Island",
                purpose: "project",
                type: "Biệt thự nghỉ dưỡng",
                priceRentText: null,
                priceRentNum: null,
                depositText: null,
                priceSaleText: "Từ 18.5 tỷ",
                priceNum: 18.5,
                unitPrice: "92 triệu/m²",
                legal: "Sở hữu lâu dài",
                furniture: "Bàn giao thô đồng bộ",
                area: 200,
                beds: 4,
                baths: 5,
                street: "Đảo Vũ Yên",
                district: "Huyện Thủy Nguyên",
                city: "Hải Phòng",
                lat: 20.8950,
                lng: 106.7280,
                image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
                badge: "Sân Golf & Du Thuyền",
                badgeClass: "bg-indigo-900/80 text-indigo-200 border-indigo-400/30",
                ownerName: "Tập đoàn Vingroup",
                ownerPhone: "1900 232389"
            },
            {
                id: 10,
                code: "VH-GG-CL-10",
                title: "Nhà phố thương mại Vinhomes Global Gate Cổ Loa Đông Anh",
                project: "Vinhomes Global Gate",
                purpose: "project",
                type: "Nhà phố / Liền kề",
                priceRentText: null,
                priceRentNum: null,
                depositText: null,
                priceSaleText: "Từ 16 tỷ",
                priceNum: 16,
                unitPrice: "180 triệu/m²",
                legal: "Sổ đỏ lâu dài",
                furniture: "Xây dựng 5 tầng hoàn thiện mặt ngoài",
                area: 85,
                beds: 4,
                baths: 4,
                street: "Đường Trường Sa",
                district: "Huyện Đông Anh",
                city: "Hà Nội",
                lat: 21.1080,
                lng: 105.8580,
                image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                badge: "Dự án mới 2026",
                badgeClass: "bg-rose-900/80 text-rose-200 border-rose-400/30",
                ownerName: "Tập đoàn Vingroup",
                ownerPhone: "1900 232389"
            },
            {
                id: 11,
                code: "VH-RS-HM-11",
                title: "Biệt thự đơn lập ven kênh sinh thái Vinhomes Riverside The Harmony",
                project: "Vinhomes Riverside",
                purpose: "sale",
                type: "Biệt thự nghỉ dưỡng",
                priceRentText: null,
                priceRentNum: null,
                depositText: null,
                priceSaleText: "45 tỷ",
                priceNum: 45,
                unitPrice: "150 triệu/m²",
                legal: "Sổ đỏ chính chủ vĩnh viễn",
                furniture: "Full nội thất nhập khẩu Ý cao cấp trị giá 5 tỷ",
                area: 300,
                beds: 5,
                baths: 6,
                street: "Khu đô thị sinh thái Vinhomes Riverside",
                district: "Quận Long Biên",
                city: "Hà Nội",
                lat: 21.0420,
                lng: 105.9080,
                image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
                badge: "Đẳng cấp thượng lưu",
                badgeClass: "bg-yellow-900/80 text-yellow-200 border-yellow-400/30",
                ownerName: "Bác Minh Đức",
                ownerPhone: "0913 222 111"
            },
            {
                id: 12,
                code: "VH-GP-MH-12",
                title: "Shophouse The Manhattan Grand Park kinh doanh sầm uất",
                project: "Vinhomes Grand Park",
                purpose: "rent",
                type: "Nhà phố / Liền kề",
                priceRentText: "40 triệu/tháng",
                priceRentNum: 40,
                depositText: "120 triệu (cọc 3 tháng)",
                priceSaleText: null,
                priceNum: 40,
                rentPeriodMin: "Hợp đồng 2 năm trở lên",
                furniture: "Nhà thô hoàn thiện điện nước cơ bản tầng 1",
                managementFee: "Thỏa thuận theo HĐ",
                availableDate: "Bàn giao ngay để kinh doanh",
                area: 126,
                beds: 4,
                baths: 5,
                street: "Trục đường đại lộ Manhattan D2A",
                district: "Phường Long Thạnh Mỹ, TP. Thủ Đức",
                city: "TP. Hồ Chí Minh",
                lat: 10.8430,
                lng: 106.8420,
                image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
                badge: "Kinh doanh vàng",
                badgeClass: "bg-emerald-900/80 text-emerald-200 border-emerald-400/30",
                ownerName: "Công ty BĐS Khang Điền Gia",
                ownerPhone: "0938 999 123"
            }
        ];

        // Autocomplete Suggestions
        function handleKeywordInput(val) {
            const clearBtn = document.getElementById('btn-clear-search');
            const suggestionsEl = document.getElementById('search-suggestions');
            
            if (val.trim().length > 0) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
                suggestionsEl.classList.add('hidden');
                return;
            }

            const query = removeVietnameseTones(val.trim().toLowerCase());
            const matched = [];

            propertiesData.forEach(p => {
                const combined = removeVietnameseTones(`${p.project} ${p.street} ${p.district} ${p.city} ${p.title}`.toLowerCase());
                if (combined.includes(query)) {
                    matched.push({
                        title: p.project,
                        sub: `${p.street}, ${p.district}`,
                        city: p.city
                    });
                }
            });

            if (matched.length > 0) {
                // Deduplicate by project
                const uniqueMatched = [];
                const seen = new Set();
                matched.forEach(m => {
                    if (!seen.has(m.title)) {
                        seen.add(m.title);
                        uniqueMatched.push(m);
                    }
                });

                suggestionsEl.innerHTML = uniqueMatched.slice(0, 5).map(m => `
                    <button type="button" onclick="selectSuggestion('${m.title}', '${m.city}')" class="w-full text-left px-3.5 py-2 hover:bg-emerald-50 rounded-xl transition flex items-center justify-between group">
                        <div class="flex items-center gap-2.5">
                            <i data-lucide="map-pin" class="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition"></i>
                            <div>
                                <div class="text-xs font-bold text-gray-800 group-hover:text-emerald-700">${m.title}</div>
                                <div class="text-[11px] text-gray-400">${m.sub}</div>
                            </div>
                        </div>
                        <span class="text-[10px] font-semibold bg-gray-100 group-hover:bg-emerald-100 text-gray-600 group-hover:text-emerald-800 px-2 py-0.5 rounded-md">${m.city}</span>
                    </button>
                `).join('');
                suggestionsEl.classList.remove('hidden');
                lucide.createIcons();
            } else {
                suggestionsEl.classList.add('hidden');
            }
        }

        function selectSuggestion(text, city) {
            document.getElementById('search-keyword').value = text;
            document.getElementById('search-suggestions').classList.add('hidden');
            if (city) {
                document.getElementById('selected-location').textContent = city;
            }
            performSearch();
        }

        function clearKeyword() {
            document.getElementById('search-keyword').value = '';
            document.getElementById('btn-clear-search').classList.add('hidden');
            document.getElementById('search-suggestions').classList.add('hidden');
            performSearch();
        }

        // Search Executor
        function performSearch() {
            // Close suggestions & dropdowns
            document.getElementById('search-suggestions').classList.add('hidden');
            document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('show'));

            const rawKeyword = document.getElementById('search-keyword').value.trim();
            const keyword = removeVietnameseTones(rawKeyword.toLowerCase());
            const loc = document.getElementById('selected-location').textContent.trim();
            const type = document.getElementById('selected-type').textContent.trim();
            const price = document.getElementById('selected-price').textContent.trim();

            let results = propertiesData.filter(item => {
                // 0. Purpose check (buy/sale vs rent vs project)
                if (currentPurpose === 'buy' && item.purpose !== 'sale') return false;
                if (currentPurpose === 'rent' && item.purpose !== 'rent') return false;
                if (currentPurpose === 'project' && item.purpose !== 'project') return false;

                // 0.1 Developer filter check
                if (selectedDeveloper !== 'all' && (item.developer || 'Vinhomes') !== selectedDeveloper) return false;

                // 1. Keyword check (Tên đường, tên dự án, khu vực, quận huyện, tiêu đề, chủ đầu tư)
                if (keyword) {
                    const searchable = removeVietnameseTones(`${item.title} ${item.project} ${item.developer || ''} ${item.street} ${item.district} ${item.city} ${item.type}`.toLowerCase());
                    if (!searchable.includes(keyword)) return false;
                }

                // 2. Location check
                if (loc !== 'Tất cả vị trí') {
                    if (item.city !== loc && !item.district.includes(loc)) return false;
                }

                // 3. Property Type check
                if (type !== 'Tất cả loại hình') {
                    if (item.type !== type) return false;
                }

                // 4. Price check
                if (price !== 'Tất cả mức giá') {
                    if (item.purpose === 'rent') {
                        // Prices in millions/month
                        if (price === 'Dưới 2 tỷ' && item.priceRentNum > 10) return false;
                        if (price === '2 tỷ - 6 tỷ' && (item.priceRentNum < 10 || item.priceRentNum > 20)) return false;
                        if (price === '6 tỷ - 12 tỷ' && (item.priceRentNum < 20 || item.priceRentNum > 35)) return false;
                        if (price === 'Trên 12 tỷ' && item.priceRentNum < 35) return false;
                    } else {
                        // Prices in billions
                        if (price === 'Dưới 2 tỷ' && item.priceNum >= 2) return false;
                        if (price === '2 tỷ - 6 tỷ' && (item.priceNum < 2 || item.priceNum > 6)) return false;
                        if (price === '6 tỷ - 12 tỷ' && (item.priceNum < 6 || item.priceNum > 12)) return false;
                        if (price === 'Trên 12 tỷ' && item.priceNum <= 12) return false;
                    }
                }

                return true;
            });

            // Update UI with Results
            renderSearchResults(results, rawKeyword, loc, type, price);
        }

        function renderSearchResults(items, keyword, loc, type, price) {
            const container = document.getElementById('properties-container');
            const banner = document.getElementById('search-status-banner');
            const statusText = document.getElementById('search-status-text');
            const statusTags = document.getElementById('search-status-tags');

            const hasActiveFilter = Boolean(keyword) || loc !== 'Tất cả vị trí' || type !== 'Tất cả loại hình' || price !== 'Tất cả mức giá' || selectedDeveloper !== 'all';

            if (hasActiveFilter) {
                banner.classList.remove('hidden');
                statusText.innerHTML = `Tìm thấy <span class="text-emerald-700 font-black">${items.length}</span> bất động sản phù hợp`;
                
                let tagsHtml = '';
                if (selectedDeveloper !== 'all') tagsHtml += `<span class="inline-flex items-center text-[11px] bg-emerald-800 text-white px-2.5 py-0.5 rounded-full font-bold">CĐT: ${selectedDeveloper}</span>`;
                if (currentPurpose === 'rent') tagsHtml += `<span class="inline-flex items-center text-[11px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold">Chế độ: Cho thuê</span>`;
                if (currentPurpose === 'buy') tagsHtml += `<span class="inline-flex items-center text-[11px] bg-emerald-700 text-white px-2.5 py-0.5 rounded-full font-bold">Chế độ: Mua bán</span>`;
                if (currentPurpose === 'project') tagsHtml += `<span class="inline-flex items-center text-[11px] bg-teal-700 text-white px-2.5 py-0.5 rounded-full font-bold">Chế độ: Dự án mới</span>`;
                if (keyword) tagsHtml += `<span class="inline-flex items-center text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">Từ khóa: "${keyword}"</span>`;
                if (loc !== 'Tất cả vị trí') tagsHtml += `<span class="inline-flex items-center text-[11px] bg-white border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">Khu vực: ${loc}</span>`;
                if (type !== 'Tất cả loại hình') tagsHtml += `<span class="inline-flex items-center text-[11px] bg-white border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">Loại: ${type}</span>`;
                statusTags.innerHTML = tagsHtml;
            } else {
                banner.classList.add('hidden');
            }

            if (items.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="search-x" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-xl font-extrabold text-gray-800 mb-2">Không tìm thấy bất động sản phù hợp</h3>
                        <p class="text-sm text-gray-500 max-w-md mx-auto mb-6">Chưa có BĐS nào khớp với tiêu chí tìm kiếm này trong mục ${currentPurpose === 'rent' ? 'cho thuê' : 'mua bán'}. Bạn hãy thử đổi từ khóa, mở rộng khu vực hoặc xóa bộ lọc nhé!</p>
                        <button onclick="resetSearchFilters()" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                            Xem tất cả bất động sản
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = items.map(p => {
                    // 1. CHO THUÊ (RENTAL PROPERTY)
                    if (p.purpose === 'rent') {
                        return `
                            <div class="interactive-card bg-white rounded-3xl overflow-hidden border border-gray-100 group shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between">
                                <div>
                                    <div class="relative h-64 overflow-hidden">
                                        <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition duration-700 ease-out">
                                        <div class="absolute top-4 left-4 px-3 py-1 rounded-full backdrop-blur-md text-[11px] font-bold border shadow-md ${p.badgeClass}">
                                            ${p.badge}
                                        </div>
                                        <div class="absolute top-4 right-16 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white shadow-md">
                                            CHO THUÊ
                                        </div>
                                        <button onclick="toggleLike(this, event)" class="btn-heart absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-gray-600 flex items-center justify-center shadow-md active:scale-90 transition">
                                            <i data-lucide="heart" class="w-4 h-4"></i>
                                        </button>
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                                            <button onclick="showRentDetailModal(${p.id})" class="w-full py-2 bg-white/95 hover:bg-white text-emerald-800 rounded-xl text-xs font-extrabold shadow-lg transform translate-y-3 group-hover:translate-y-0 transition duration-300">
                                                Xem chi tiết & bảng tính cọc
                                            </button>
                                        </div>
                                    </div>
                                    <div class="p-6">
                                        <div class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">${p.project}</div>
                                        <h3 class="font-extrabold text-gray-900 text-lg group-hover:text-emerald-700 transition duration-300 line-clamp-1" title="${p.title}">
                                            ${p.title}
                                        </h3>
                                        
                                        <!-- Giá thuê & Diện tích -->
                                        <div class="flex items-baseline justify-between mt-3">
                                            <div>
                                                <span class="text-2xl font-black text-emerald-700 tracking-tight">${p.priceRentText}</span>
                                            </div>
                                            <div class="flex items-center gap-3 text-xs font-semibold text-gray-500">
                                                <span class="flex items-center gap-1"><i data-lucide="maximize" class="w-3.5 h-3.5 text-gray-400"></i> ${p.area} m²</span>
                                                <span class="flex items-center gap-1"><i data-lucide="bed" class="w-3.5 h-3.5 text-gray-400"></i> ${p.beds} PN</span>
                                            </div>
                                        </div>

                                        <!-- Highlight Tiền cọc & Nội thất -->
                                        <div class="mt-3 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-between text-xs">
                                            <div class="flex items-center gap-1.5 font-bold text-emerald-800">
                                                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
                                                <span>Tiền cọc:</span>
                                            </div>
                                            <span class="font-extrabold text-emerald-950 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-xs">${p.depositText}</span>
                                        </div>

                                        <div class="mt-2.5 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                                            <span class="truncate max-w-[170px]" title="${p.furniture}"><i data-lucide="armchair" class="w-3.5 h-3.5 inline mr-1 text-gray-400"></i> ${p.furniture}</span>
                                            <span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">${p.rentPeriodMin}</span>
                                        </div>

                                        <div class="flex items-center gap-2 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                            <i data-lucide="map-pin" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                                            <span class="truncate font-medium">${p.street}, ${p.district}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="px-6 pb-6 pt-1 flex items-center gap-2">
                                    <button onclick="showRentDetailModal(${p.id})" class="btn-shimmer flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 group">
                                        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                                        <span>Xem chi tiết căn hộ</span>
                                    </button>
                                    <a href="tel:${p.ownerPhone ? p.ownerPhone.replace(/\s+/g, '') : ''}" class="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center justify-center" title="Gọi cho chủ nhà">
                                        <i data-lucide="phone" class="w-4 h-4"></i>
                                    </a>
                                </div>
                            </div>
                        `;
                    }

                    // 2. MUA BÁN (SALE PROPERTY)
                    if (p.purpose === 'sale') {
                        return `
                            <div class="interactive-card bg-white rounded-3xl overflow-hidden border border-gray-100 group shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between">
                                <div>
                                    <div class="relative h-64 overflow-hidden">
                                        <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition duration-700 ease-out">
                                        <div class="absolute top-4 left-4 px-3 py-1 rounded-full backdrop-blur-md text-[11px] font-bold border shadow-md ${p.badgeClass}">
                                            ${p.badge}
                                        </div>
                                        <div class="absolute top-4 right-16 px-2.5 py-1 rounded-full bg-emerald-800/80 backdrop-blur-md text-[10px] font-bold text-emerald-100 shadow-md">
                                            BÁN ĐỨT
                                        </div>
                                        <button onclick="toggleLike(this, event)" class="btn-heart absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-gray-600 flex items-center justify-center shadow-md active:scale-90 transition">
                                            <i data-lucide="heart" class="w-4 h-4"></i>
                                        </button>
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                                            <button onclick="showRentDetailModal(${p.id})" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transform translate-y-3 group-hover:translate-y-0 transition duration-300">
                                                Xem chi tiết bất động sản
                                            </button>
                                        </div>
                                    </div>
                                    <div class="p-6">
                                        <div class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">${p.project}</div>
                                        <h3 class="font-extrabold text-gray-900 text-lg group-hover:text-emerald-700 transition duration-300 line-clamp-1" title="${p.title}">
                                            ${p.title}
                                        </h3>
                                        <div class="flex items-baseline justify-between mt-3">
                                            <div>
                                                <span class="text-2xl font-black text-emerald-700 tracking-tight">${p.priceSaleText}</span>
                                                ${p.unitPrice ? `<span class="text-[11px] font-semibold text-gray-400 ml-1.5">(${p.unitPrice})</span>` : ''}
                                            </div>
                                            <div class="flex items-center gap-3 text-xs font-semibold text-gray-500">
                                                <span class="flex items-center gap-1"><i data-lucide="maximize" class="w-3.5 h-3.5 text-gray-400"></i> ${p.area} m²</span>
                                                <span class="flex items-center gap-1"><i data-lucide="bed" class="w-3.5 h-3.5 text-gray-400"></i> ${p.beds} PN</span>
                                            </div>
                                        </div>
                                        <div class="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                                            <div class="flex items-center gap-1.5 text-gray-600 font-medium">
                                                <i data-lucide="file-check" class="w-4 h-4 text-emerald-600"></i>
                                                <span>Pháp lý:</span>
                                            </div>
                                            <span class="font-bold text-gray-800">${p.legal || 'Sổ hồng riêng'}</span>
                                        </div>
                                        <div class="flex items-center gap-2 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                            <i data-lucide="map-pin" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                                            <span class="truncate font-medium">${p.street}, ${p.district}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="px-6 pb-6 pt-1 flex items-center gap-2">
                                    <button onclick="showRentDetailModal(${p.id})" class="btn-shimmer flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5">
                                        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                                        <span>Xem chi tiết & liên hệ</span>
                                    </button>
                                    <a href="tel:${p.ownerPhone ? p.ownerPhone.replace(/\s+/g, '') : ''}" class="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center justify-center" title="Gọi tư vấn">
                                        <i data-lucide="phone-call" class="w-4 h-4"></i>
                                    </a>
                                </div>
                            </div>
                        `;
                    }

                    // 3. DỰ ÁN MỚI (PROJECT)
                    return `
                        <div class="interactive-card bg-white rounded-3xl overflow-hidden border border-gray-100 group shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between">
                            <div>
                                <div class="relative h-64 overflow-hidden">
                                    <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition duration-700 ease-out">
                                    <div class="absolute top-4 left-4 px-3 py-1 rounded-full backdrop-blur-md text-[11px] font-bold border shadow-md ${p.badgeClass}">
                                        ${p.badge}
                                    </div>
                                    <div class="absolute top-4 right-16 px-2.5 py-1 rounded-full bg-indigo-900/80 backdrop-blur-md text-[10px] font-bold text-indigo-200 shadow-md">
                                        ĐẠI DỰ ÁN
                                    </div>
                                    <button onclick="toggleLike(this, event)" class="btn-heart absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-gray-600 flex items-center justify-center shadow-md active:scale-90 transition">
                                        <i data-lucide="heart" class="w-4 h-4"></i>
                                    </button>
                                </div>
                                <div class="p-6">
                                    <div class="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">${p.project}</div>
                                    <h3 class="font-extrabold text-gray-900 text-lg group-hover:text-emerald-700 transition duration-300 line-clamp-1" title="${p.title}">
                                        ${p.title}
                                    </h3>
                                    <div class="flex items-baseline justify-between mt-3">
                                        <div>
                                            <span class="text-2xl font-black text-indigo-950 tracking-tight">${p.priceSaleText}</span>
                                        </div>
                                        <div class="text-xs font-semibold text-gray-500">
                                            <span>${p.area} m²</span>
                                        </div>
                                    </div>
                                    <div class="mt-3 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                                        <div class="flex items-center gap-1.5 text-indigo-800 font-medium">
                                            <i data-lucide="building-2" class="w-4 h-4 text-indigo-600"></i>
                                            <span>Chủ đầu tư:</span>
                                        </div>
                                        <span class="font-bold text-indigo-900">${p.ownerName}</span>
                                    </div>
                                    <div class="flex items-center gap-2 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                        <i data-lucide="map-pin" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                                        <span class="truncate font-medium">${p.street}, ${p.city}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="px-6 pb-6 pt-1">
                                <button onclick="showToast('Đăng ký nhận bảng giá & chính sách dự án ${p.project}!')" class="btn-shimmer w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-emerald-600 hover:from-indigo-600 hover:to-teal-600 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5">
                                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                                    <span>Nhận bảng giá & chính sách</span>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            lucide.createIcons();
        }

        // ==============================================
        // RENT DETAIL MODAL CONTROLLER
        // ==============================================
        function showRentDetailModal(propId) {
            const p = propertiesData.find(item => item.id === propId);
            if (!p) return;

            document.getElementById('rent-modal-img').src = p.image;
            document.getElementById('rent-modal-project').textContent = p.project;
            document.getElementById('rent-modal-title').textContent = p.title;
            document.getElementById('rent-modal-address').textContent = `${p.street}, ${p.district}, ${p.city}`;
            document.getElementById('rent-modal-price').textContent = p.priceRentText;
            document.getElementById('rent-modal-deposit').textContent = p.depositText;
            document.getElementById('rent-modal-fee').textContent = p.managementFee || 'Miễn phí';
            document.getElementById('rent-modal-period').textContent = p.rentPeriodMin || '1 năm';
            document.getElementById('rent-modal-furniture').textContent = p.furniture || 'Đầy đủ nội thất';
            document.getElementById('rent-modal-owner').textContent = `${p.ownerName} (${p.ownerPhone})`;
            document.getElementById('rent-modal-phone').textContent = p.ownerPhone;
            
            const cleanPhone = (p.ownerPhone || '').replace(/\s+/g, '');
            document.getElementById('rent-modal-phone-btn').href = `tel:${cleanPhone}`;
            const callBtn = document.getElementById('rent-modal-call-btn');
            if (callBtn) {
                callBtn.href = `tel:${cleanPhone}`;
            }

            document.getElementById('rent-detail-modal').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeRentDetailModal() {
            document.getElementById('rent-detail-modal').classList.add('hidden');
        }

        function resetSearchFilters() {
            document.getElementById('search-keyword').value = '';
            document.getElementById('btn-clear-search').classList.add('hidden');
            document.getElementById('search-suggestions').classList.add('hidden');
            document.getElementById('selected-location').textContent = 'Tất cả vị trí';
            document.getElementById('selected-type').textContent = 'Tất cả loại hình';
            document.getElementById('selected-price').textContent = 'Tất cả mức giá';
            
            selectedDeveloper = 'all';
            const container = document.getElementById('developer-chips-container');
            if (container) {
                container.querySelectorAll('.dev-filter-chip').forEach((btn, idx) => {
                    if (idx === 0) btn.classList.add('active');
                    else btn.classList.remove('active');
                });
            }
            const badge = document.getElementById('developer-count-badge');
            if (badge) badge.textContent = '10 Tập đoàn BĐS';

            performSearch();
            showToast('Đã xóa tất cả bộ lọc tìm kiếm');
        }

        // Remove Vietnamese Tones Helper
        function removeVietnameseTones(str) {
            str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
            str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
            str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
            str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
            str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
            str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
            str = str.replace(/đ/g, "d");
            return str;
        }

        // ==============================================
        // 6. INTERACTIVE LEAFLET MAP ENGINE
        // ==============================================
        let leafletMap = null;
        let selectedMapTarget = null;

        function openMapModal() {
            const modal = document.getElementById('map-modal');
            modal.classList.remove('hidden');

            setTimeout(() => {
                if (!leafletMap) {
                    initLeafletMap();
                } else {
                    leafletMap.invalidateSize();
                }
            }, 100);
        }

        function closeMapModal() {
            const modal = document.getElementById('map-modal');
            modal.classList.add('hidden');
        }

        function initLeafletMap() {
            // Center in Vietnam (Ho Chi Minh City default)
            leafletMap = L.map('interactive-leaflet-map', {
                center: [10.7769, 106.7009],
                zoom: 12,
                zoomControl: true
            });

            // Modern OpenStreetMap Tile Layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(leafletMap);

            // Custom Emerald Marker Icon
            const customIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `
                    <div style="background: linear-gradient(135deg, #059669, #047857); width: 34px; height: 34px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(5,150,105,0.4); display: flex; align-items: center; justify-content: center; color: white;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 34],
                popupAnchor: [0, -32]
            });

            // Add Markers for properties
            propertiesData.forEach(p => {
                if (p.lat && p.lng) {
                    const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(leafletMap);
                    
                    const priceHtml = p.purpose === 'rent'
                        ? `<div style="font-size: 14px; font-weight: 900; color: #047857; margin-top: 2px;">${p.priceRentText}</div><div style="font-size: 11px; font-weight: 800; color: #065f46; background: #ecfdf5; padding: 2px 6px; border-radius: 6px; margin: 3px 0 6px 0; border: 1px solid #a7f3d0;">🛡️ ${p.depositText}</div>`
                        : `<div style="font-size: 14px; font-weight: 900; color: #047857; margin: 3px 0 6px 0;">${p.priceSaleText} • ${p.area}m²</div>`;

                    const popupContent = `
                        <div style="font-family: 'Plus Jakarta Sans', sans-serif; width: 230px; padding: 2px;">
                            <img src="${p.image}" style="width: 100%; height: 115px; object-fit: cover; border-radius: 12px; margin-bottom: 8px;">
                            <div style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">${p.project}</div>
                            <div style="font-size: 13px; font-weight: 800; color: #111827; line-height: 1.3; margin: 2px 0 4px 0;">${p.title}</div>
                            ${priceHtml}
                            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">${p.street}, ${p.district}</div>
                            <div style="display: flex; gap: 4px;">
                                <button onclick="pickFromMap('${p.project}', '${p.city}')" style="flex: 1; padding: 6px 8px; background: #059669; color: white; border: none; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
                                    Chọn vị trí
                                </button>
                                <button onclick="closeMapModal(); showRentDetailModal(${p.id});" style="padding: 6px 10px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    `;
                    marker.bindPopup(popupContent);

                    marker.on('click', () => {
                        selectedMapTarget = { text: p.project, city: p.city, district: p.district };
                        updateMapSelectionUI(p.project, `${p.street}, ${p.district}, ${p.city}`);
                    });
                }
            });

            // Map click listener to pick any custom point
            leafletMap.on('click', (e) => {
                const lat = e.latlng.lat.toFixed(4);
                const lng = e.latlng.lng.toFixed(4);
                selectedMapTarget = { text: `Tọa độ (${lat}, ${lng})`, city: 'Tất cả vị trí' };
                updateMapSelectionUI(`Khu vực đã chọn [${lat}, ${lng}]`, `Tọa độ bản đồ: ${lat}, ${lng}`);
            });
        }

        function updateMapSelectionUI(title, details) {
            const infoEl = document.getElementById('map-selected-info');
            infoEl.innerHTML = `
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                <span class="text-emerald-800 font-bold">${title}</span> 
                <span class="text-gray-400 hidden sm:inline">(${details})</span>
            `;
            lucide.createIcons();
        }

        function pickFromMap(project, city) {
            selectedMapTarget = { text: project, city: city };
            applyMapSelection();
        }

        function applyMapSelection() {
            if (selectedMapTarget) {
                document.getElementById('search-keyword').value = selectedMapTarget.text;
                if (selectedMapTarget.city && selectedMapTarget.city !== 'Tất cả vị trí') {
                    document.getElementById('selected-location').textContent = selectedMapTarget.city;
                }
                closeMapModal();
                performSearch();
                showToast(`Đã chọn khu vực từ bản đồ: ${selectedMapTarget.text}`);
            } else {
                closeMapModal();
            }
        }

        const cityCoords = {
            hcm: { lat: 10.7769, lng: 106.7009, zoom: 12 },
            hanoi: { lat: 21.0285, lng: 105.8542, zoom: 12 },
            danang: { lat: 16.0544, lng: 108.2022, zoom: 13 },
            binhduong: { lat: 10.9804, lng: 106.6519, zoom: 12 },
            phuquoc: { lat: 10.2289, lng: 103.9572, zoom: 11 }
        };

        function flyToCity(cityKey) {
            if (leafletMap && cityCoords[cityKey]) {
                const target = cityCoords[cityKey];
                leafletMap.flyTo([target.lat, target.lng], target.zoom, { duration: 1.5 });
            }
        }

        // Close modal on Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMapModal();
        });

        // Close modal when clicking backdrop
        document.getElementById('map-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'map-modal') closeMapModal();
        });

        // 6. Like / Favorite Toggle
        function toggleLike(btn, event) {
            event.stopPropagation();
            btn.classList.toggle('liked');
            if (btn.classList.contains('liked')) {
                showToast('Đã lưu bất động sản vào danh sách yêu thích! ❤️');
            } else {
                showToast('Đã bỏ khỏi danh sách yêu thích.');
            }
        }

        // 7. Toast Notification Handler
        let toastTimeout;
        function showToast(message) {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toast-message');
            toastMsg.textContent = message;
            toast.classList.add('show');
            
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        // 8. Stats Number Counter Animation
        function initCounters() {
            const counters = document.querySelectorAll('.counter');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const counter = entry.target;
                        const target = parseFloat(counter.getAttribute('data-target'));
                        const decimals = parseInt(counter.getAttribute('data-decimals') || '0');
                        const duration = 1800; // ms
                        const startTime = performance.now();

                        function update(currentTime) {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            // Easing easeOutQuart
                            const ease = 1 - Math.pow(1 - progress, 4);
                            const currentVal = (target * ease);
                            
                            counter.textContent = decimals > 0 ? currentVal.toFixed(decimals) : Math.floor(currentVal).toLocaleString('vi-VN');

                            if (progress < 1) {
                                requestAnimationFrame(update);
                            } else {
                                counter.textContent = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('vi-VN');
                            }
                        }
                        requestAnimationFrame(update);
                        observer.unobserve(counter);
                    }
                });
            }, { threshold: 0.5 });

            counters.forEach(c => observer.observe(c));
        }
    </script>
</body>
</html>
