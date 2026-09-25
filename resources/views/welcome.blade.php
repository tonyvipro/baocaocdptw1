<!DOCTYPE html>
<html lang="vi" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3TV - Nơi hành trình về nhà bắt đầu | Bất động sản cao cấp và uy tín</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
    
    <!-- AOS (Animate On Scroll) CSS -->
    <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />

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
            transform: translateY(10px) scale(0.98);
            transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
        }
        .filter-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
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
    <div class="relative min-h-[660px] lg:min-h-[760px] w-full flex flex-col justify-between overflow-hidden">
        
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
        <div class="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 my-auto">
            
            <!-- Badge with floating animation -->
            <div data-aos="fade-down" data-aos-duration="800" class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-pill text-xs font-bold text-emerald-200 uppercase tracking-wider mb-6 hover:bg-white/25 hover:scale-105 transition duration-300 cursor-default">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-slow"></span>
                <span>BẤT ĐỘNG SẢN CAO CẤP VÀ UY TÍN HÀNG ĐẦU</span>
            </div>

            <!-- Main Heading with Staggered Entrance -->
            <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="900" class="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl tracking-tight mb-4 drop-shadow-md">
                Nơi hành trình về nhà <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">bắt đầu.</span>
            </h1>
            
            <p data-aos="fade-up" data-aos-delay="200" data-aos-duration="900" class="text-base sm:text-lg text-emerald-100/90 max-w-xl font-normal leading-relaxed mb-10">
                Khám phá hàng ngàn ngôi nhà tuyệt mỹ, mức giá chuẩn xác và nơi mọi kỳ vọng an cư được gửi gắm trọn vẹn.
            </p>

            <!-- Search Container Box with Glassmorphism & Micro-interactions -->
            <div data-aos="zoom-in-up" data-aos-delay="300" data-aos-duration="1000" class="glass-card rounded-3xl p-4 sm:p-6 max-w-4xl border border-white/80 shadow-2xl">
                
                <!-- Search Tabs Switcher -->
                <div class="flex items-center gap-8 border-b border-gray-100 pb-3.5 mb-5 text-sm font-semibold">
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

                <!-- Filter Inputs Grid -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative">
                    
                    <!-- Location Filter with Dropdown -->
                    <div class="md:col-span-4 relative">
                        <div onclick="toggleDropdown('dropdown-location')" 
                             class="p-3 rounded-2xl bg-gray-50/70 hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-400/80 transition duration-300 flex items-center gap-3 cursor-pointer group hover:shadow-sm">
                            <div class="w-10 h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
                                <i data-lucide="map-pin" class="w-4 h-4"></i>
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <div class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Vị trí</div>
                                <div id="selected-location" class="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-800 transition">TP. Hồ Chí Minh</div>
                            </div>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:rotate-180 transition duration-300 shrink-0"></i>
                        </div>

                        <!-- Dropdown Menu: Location -->
                        <div id="dropdown-location" class="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                            <div class="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase">Chọn tỉnh / thành phố</div>
                            <button onclick="selectOption('selected-location', 'TP. Hồ Chí Minh', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition flex items-center justify-between">
                                <span>TP. Hồ Chí Minh</span>
                                <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i>
                            </button>
                            <button onclick="selectOption('selected-location', 'Hà Nội', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition flex items-center justify-between">
                                <span>Hà Nội</span>
                            </button>
                            <button onclick="selectOption('selected-location', 'Đà Nẵng', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition flex items-center justify-between">
                                <span>Đà Nẵng</span>
                            </button>
                            <button onclick="selectOption('selected-location', 'Bình Dương', 'dropdown-location')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition flex items-center justify-between">
                                <span>Bình Dương</span>
                            </button>
                        </div>
                    </div>

                    <!-- Property Type Filter with Dropdown -->
                    <div class="md:col-span-3 relative">
                        <div onclick="toggleDropdown('dropdown-type')" 
                             class="p-3 rounded-2xl bg-gray-50/70 hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-400/80 transition duration-300 flex items-center gap-3 cursor-pointer group hover:shadow-sm">
                            <div class="w-10 h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
                                <i data-lucide="building-2" class="w-4 h-4"></i>
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <div class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Loại BĐS</div>
                                <div id="selected-type" class="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-800 transition">Căn hộ cao cấp</div>
                            </div>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:rotate-180 transition duration-300 shrink-0"></i>
                        </div>

                        <!-- Dropdown Menu: Type -->
                        <div id="dropdown-type" class="filter-dropdown absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                            <div class="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase">Loại hình bất động sản</div>
                            <button onclick="selectOption('selected-type', 'Căn hộ cao cấp', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Căn hộ cao cấp</button>
                            <button onclick="selectOption('selected-type', 'Nhà phố / Liền kề', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Nhà phố / Liền kề</button>
                            <button onclick="selectOption('selected-type', 'Biệt thự nghỉ dưỡng', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Biệt thự nghỉ dưỡng</button>
                            <button onclick="selectOption('selected-type', 'Đất nền dự án', 'dropdown-type')" class="w-full text-left px-3 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition">Đất nền dự án</button>
                        </div>
                    </div>

                    <!-- Price Filter with Dropdown -->
                    <div class="md:col-span-3 relative">
                        <div onclick="toggleDropdown('dropdown-price')" 
                             class="p-3 rounded-2xl bg-gray-50/70 hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-400/80 transition duration-300 flex items-center gap-3 cursor-pointer group hover:shadow-sm">
                            <div class="w-10 h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
                                <i data-lucide="tag" class="w-4 h-4"></i>
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <div class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Mức giá</div>
                                <div id="selected-price" class="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-800 transition">2 tỷ - 6 tỷ</div>
                            </div>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:rotate-180 transition duration-300 shrink-0"></i>
                        </div>

                        <!-- Dropdown Menu: Price -->
                        <div id="dropdown-price" class="filter-dropdown absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                            <div class="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase">Khoảng giá phù hợp</div>
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
    <section id="featured-listings" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header with Animation -->
        <div data-aos="fade-up" class="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
                <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> KHÁM PHÁ THEO NHU CẦU
                </span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">
                    Bạn đang tìm loại hình nào?
                </h2>
                <p class="text-gray-500 text-sm mt-1">Tin bất động sản nổi bật được tuyển chọn và xác thực kỹ lưỡng</p>
            </div>
            <a href="#" class="group inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 px-4 py-2 rounded-full transition duration-300">
                <span>Xem tất cả 1,420+ BĐS</span>
                <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition duration-300"></i>
            </a>
        </div>

        <!-- 3 Interactive Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            
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

        // 3. Search Tab Switcher
        function switchSearchTab(tabKey) {
            document.querySelectorAll('.search-tab-btn').forEach(btn => {
                btn.classList.remove('active', 'text-emerald-700');
                btn.classList.add('text-gray-500');
            });
            const activeBtn = document.getElementById(`tab-${tabKey}`);
            if (activeBtn) {
                activeBtn.classList.add('active');
                activeBtn.classList.remove('text-gray-500');
            }
            showToast(`Đã chuyển sang chế độ: ${activeBtn.textContent.trim()}`);
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
            showToast(`Đã chọn: ${value}`);
        }

        // Close dropdowns when clicking outside
        window.addEventListener('click', (e) => {
            if (!e.target.closest('.relative')) {
                document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('show'));
            }
        });

        // 5. Search Action Button
        function performSearch() {
            const loc = document.getElementById('selected-location').textContent;
            const type = document.getElementById('selected-type').textContent;
            const price = document.getElementById('selected-price').textContent;
            showToast(`Đang tìm: ${type} tại ${loc} (${price})`);
        }

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
