<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NHÀ VIỆT - Nơi hành trình về nhà bắt đầu | Bất động sản cao cấp và uy tín</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
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
                    }
                }
            }
        }
    </script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #fcfdfc;
            color: #1e293b;
        }
        .glass-nav {
            background: rgba(14, 42, 34, 0.45);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }
        .badge-pill {
            background: rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .hero-gradient {
            background: linear-gradient(180deg, rgba(6, 40, 32, 0.75) 0%, rgba(6, 40, 32, 0.35) 45%, rgba(6, 40, 32, 0.8) 100%);
        }
        .card-shadow {
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.03);
        }
        .project-card-overlay {
            background: linear-gradient(to top, rgba(9, 28, 22, 0.95) 0%, rgba(9, 28, 22, 0.4) 50%, rgba(0, 0, 0, 0) 100%);
        }
    </style>
</head>
<body class="antialiased overflow-x-hidden">

    <!-- ============================================== -->
    <!-- 1. HERO SECTION & NAVBAR                       -->
    <!-- ============================================== -->
    <div class="relative min-h-[640px] lg:min-h-[720px] w-full flex flex-col justify-between overflow-hidden">
        <!-- Hero Background Image with Overlay -->
        <div class="absolute inset-0 z-0">
            <img src="{{ asset('images/hero-villa.jpg') }}" alt="Biệt thự nghỉ dưỡng" class="w-full h-full object-cover object-center transform scale-105 duration-1000">
            <div class="absolute inset-0 hero-gradient"></div>
        </div>

        <!-- Navigation Bar -->
        <header class="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <nav class="flex items-center justify-between text-white">
                <!-- Logo -->
                <a href="{{ url('/') }}" class="flex items-center gap-2.5 group">
                    <div class="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center backdrop-blur-sm group-hover:bg-emerald-500/30 transition">
                        <i data-lucide="home" class="w-5 h-5 text-emerald-300"></i>
                    </div>
                    <span class="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                        <span class="text-emerald-400">NHÀ</span>VIỆT
                    </span>
                </a>

                <!-- Nav Links -->
                <div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-200">
                    <a href="#" class="hover:text-emerald-300 transition">Mua bán</a>
                    <a href="#" class="hover:text-emerald-300 transition">Cho thuê</a>
                    <a href="#" class="hover:text-emerald-300 transition">Dự án</a>
                    <a href="#" class="hover:text-emerald-300 transition">Tin tức</a>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-3">
                    <a href="#" class="hidden sm:inline-block px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition">
                        Đăng nhập
                    </a>
                    <a href="#" class="px-4 py-2 text-sm font-medium text-emerald-950 bg-white hover:bg-gray-100 rounded-full transition shadow-sm">
                        Đăng ký
                    </a>
                    <a href="#" class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700/80 hover:bg-emerald-600 rounded-full border border-emerald-500/40 transition shadow-sm backdrop-blur-sm">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Đăng tin</span>
                    </a>
                </div>
            </nav>
        </header>

        <!-- Hero Content & Search Card -->
        <div class="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 my-auto">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-pill text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-6">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                BẤT ĐỘNG SẢN CAO CẤP VÀ UY TÍN
            </div>

            <!-- Main Heading -->
            <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-2xl tracking-tight mb-4">
                Nơi hành trình về nhà bắt đầu.
            </h1>
            
            <p class="text-base sm:text-lg text-emerald-100/90 max-w-xl font-normal leading-relaxed mb-10">
                Khám phá hàng ngàn nhà đẹp, giá chuẩn xác và nơi mọi sự kỳ vọng được gửi gắm trọn vẹn.
            </p>

            <!-- Search Container Box -->
            <div class="glass-card rounded-2xl p-3 sm:p-5 card-shadow max-w-4xl border border-white/60">
                <!-- Search Tabs -->
                <div class="flex items-center gap-6 border-b border-gray-100 pb-3 mb-4 text-sm font-semibold">
                    <button class="text-emerald-700 flex items-center gap-1.5 border-b-2 border-emerald-600 pb-2.5 -mb-3">
                        <i data-lucide="key" class="w-4 h-4"></i> Mua
                    </button>
                    <button class="text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5 pb-2.5">
                        <i data-lucide="home" class="w-4 h-4"></i> Thuê
                    </button>
                    <button class="text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5 pb-2.5">
                        <i data-lucide="building" class="w-4 h-4"></i> Dự án
                    </button>
                </div>

                <!-- Filter Inputs Grid -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <!-- Location Filter -->
                    <div class="md:col-span-4 p-2.5 rounded-xl hover:bg-gray-50/80 transition flex items-center gap-3 border border-transparent hover:border-gray-200 cursor-pointer">
                        <div class="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                            <i data-lucide="map-pin" class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Vị trí</div>
                            <div class="text-sm font-bold text-gray-800 truncate">TP. Hồ Chí Minh</div>
                        </div>
                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 shrink-0"></i>
                    </div>

                    <!-- Property Type Filter -->
                    <div class="md:col-span-3 p-2.5 rounded-xl hover:bg-gray-50/80 transition flex items-center gap-3 border border-transparent hover:border-gray-200 cursor-pointer">
                        <div class="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                            <i data-lucide="building-2" class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Loại BĐS</div>
                            <div class="text-sm font-bold text-gray-800 truncate">Căn hộ cao cấp</div>
                        </div>
                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 shrink-0"></i>
                    </div>

                    <!-- Price Filter -->
                    <div class="md:col-span-3 p-2.5 rounded-xl hover:bg-gray-50/80 transition flex items-center gap-3 border border-transparent hover:border-gray-200 cursor-pointer">
                        <div class="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                            <i data-lucide="tag" class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Mức giá</div>
                            <div class="text-sm font-bold text-gray-800 truncate">2 tỷ - 6 tỷ</div>
                        </div>
                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 shrink-0"></i>
                    </div>

                    <!-- Search Button -->
                    <div class="md:col-span-2">
                        <button class="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition shadow-md flex items-center justify-center gap-2">
                            <i data-lucide="search" class="w-4 h-4"></i>
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
    <section class="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">KHÁM PHÁ THEO NHU CẦU</span>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">Bạn đang tìm loại hình nào?</h2>
                <p class="text-gray-500 text-sm mt-1">Tin bất động sản nổi bật</p>
            </div>
            <a href="#" class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
                <span>Xem tất cả</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
        </div>

        <!-- 3 Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Card 1 -->
            <div class="bg-white rounded-2xl overflow-hidden card-shadow border border-gray-100 group hover:-translate-y-1 transition duration-300">
                <div class="relative h-56 overflow-hidden">
                    <img src="{{ asset('images/prop-apartment.jpg') }}" alt="Căn hộ The River" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div class="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[11px] font-bold text-gray-800 shadow-sm">
                        Đang mở bán
                    </div>
                </div>
                <div class="p-5">
                    <h3 class="font-bold text-gray-900 text-base group-hover:text-emerald-700 transition line-clamp-1">
                        Căn hộ 2PN view sông tại The River
                    </h3>
                    <div class="flex items-baseline justify-between mt-3">
                        <span class="text-lg font-extrabold text-emerald-700">6.8 tỷ</span>
                        <span class="text-xs font-medium text-gray-500">54 m²</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i>
                        <span class="truncate">Thủ Thiêm, TP. Thủ Đức</span>
                    </div>
                </div>
            </div>

            <!-- Card 2 -->
            <div class="bg-white rounded-2xl overflow-hidden card-shadow border border-gray-100 group hover:-translate-y-1 transition duration-300">
                <div class="relative h-56 overflow-hidden">
                    <img src="{{ asset('images/prop-townhouse.jpg') }}" alt="Nhà phố xanh Đà Nẵng" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div class="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[11px] font-bold text-gray-800 shadow-sm">
                        Mới cập nhật
                    </div>
                </div>
                <div class="p-5">
                    <h3 class="font-bold text-gray-900 text-base group-hover:text-emerald-700 transition line-clamp-1">
                        Nhà phố xanh giữa lòng Đà Nẵng
                    </h3>
                    <div class="flex items-baseline justify-between mt-3">
                        <span class="text-lg font-extrabold text-emerald-700">4.2 tỷ</span>
                        <span class="text-xs font-medium text-gray-500">108 m²</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i>
                        <span class="truncate">Hải Châu, TP. Đà Nẵng</span>
                    </div>
                </div>
            </div>

            <!-- Card 3 -->
            <div class="bg-white rounded-2xl overflow-hidden card-shadow border border-gray-100 group hover:-translate-y-1 transition duration-300">
                <div class="relative h-56 overflow-hidden">
                    <img src="{{ asset('images/prop-resort.jpg') }}" alt="Biệt thự ven hồ" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div class="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[11px] font-bold text-gray-800 shadow-sm">
                        Đang hot
                    </div>
                </div>
                <div class="p-5">
                    <h3 class="font-bold text-gray-900 text-base group-hover:text-emerald-700 transition line-clamp-1">
                        Biệt thự nghỉ dưỡng ven hồ
                    </h3>
                    <div class="flex items-baseline justify-between mt-3">
                        <span class="text-lg font-extrabold text-emerald-700">12.5 tỷ</span>
                        <span class="text-xs font-medium text-gray-500">240 m²</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i>
                        <span class="truncate">Sơn Trà, TP. Đà Nẵng</span>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 3. FEATURED PROJECTS (DỰ ÁN NỔI BẬT)            -->
    <!-- ============================================== -->
    <section class="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">DỰ ÁN TIÊU BIỂU</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">Dự án nổi bật</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Project 1 -->
            <div class="relative h-80 rounded-3xl overflow-hidden card-shadow group cursor-pointer">
                <img src="{{ asset('images/project-eaton.jpg') }}" alt="Eaton Park" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
                <div class="absolute inset-0 project-card-overlay flex flex-col justify-between p-6">
                    <div>
                        <span class="inline-block px-3 py-1 rounded-full bg-emerald-800/80 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
                            CĂNG ĐÃ MỞ BÁN
                        </span>
                    </div>
                    <div>
                        <h3 class="text-2xl font-extrabold text-white mb-1">Eaton Park</h3>
                        <p class="text-xs text-emerald-200 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                            TP. Thủ Đức, TP.HCM
                        </p>
                    </div>
                </div>
            </div>

            <!-- Project 2 -->
            <div class="relative h-80 rounded-3xl overflow-hidden card-shadow group cursor-pointer">
                <img src="{{ asset('images/project-sunurban.jpg') }}" alt="Sun Urban City" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
                <div class="absolute inset-0 project-card-overlay flex flex-col justify-between p-6">
                    <div>
                        <span class="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider border border-white/30">
                            SẮP RA MẮT
                        </span>
                    </div>
                    <div>
                        <h3 class="text-2xl font-extrabold text-white mb-1">Sun Urban City</h3>
                        <p class="text-xs text-emerald-200 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                            Hà Nam • Từ 1.5 tỷ
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 4. THREE STEPS / POSTING CATEGORIES            -->
    <!-- ============================================== -->
    <section class="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-left mb-10">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">DÀNH CHO NGƯỜI BÁN & CHO THUÊ</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">Đăng tin dễ dàng trong 3 bước</h2>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <!-- 1. Căn hộ -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 card-shadow hover:border-emerald-300 hover:-translate-y-1 transition duration-200 cursor-pointer text-center">
                <div class="w-11 h-11 mx-auto mb-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <i data-lucide="building" class="w-5 h-5"></i>
                </div>
                <div class="font-bold text-gray-900 text-sm">Căn hộ</div>
                <div class="text-[11px] text-gray-400 mt-1">14,230 tin</div>
            </div>

            <!-- 2. Nhà phố -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 card-shadow hover:border-emerald-300 hover:-translate-y-1 transition duration-200 cursor-pointer text-center">
                <div class="w-11 h-11 mx-auto mb-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <i data-lucide="home" class="w-5 h-5"></i>
                </div>
                <div class="font-bold text-gray-900 text-sm">Nhà phố</div>
                <div class="text-[11px] text-gray-400 mt-1">8,120 tin</div>
            </div>

            <!-- 3. Biệt thự -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 card-shadow hover:border-emerald-300 hover:-translate-y-1 transition duration-200 cursor-pointer text-center">
                <div class="w-11 h-11 mx-auto mb-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <i data-lucide="castle" class="w-5 h-5"></i>
                </div>
                <div class="font-bold text-gray-900 text-sm">Biệt thự</div>
                <div class="text-[11px] text-gray-400 mt-1">2,434 tin</div>
            </div>

            <!-- 4. Đất nền -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 card-shadow hover:border-emerald-300 hover:-translate-y-1 transition duration-200 cursor-pointer text-center">
                <div class="w-11 h-11 mx-auto mb-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <i data-lucide="layers" class="w-5 h-5"></i>
                </div>
                <div class="font-bold text-gray-900 text-sm">Đất nền</div>
                <div class="text-[11px] text-gray-400 mt-1">6,170 tin</div>
            </div>

            <!-- 5. Văn phòng -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 card-shadow hover:border-emerald-300 hover:-translate-y-1 transition duration-200 cursor-pointer text-center">
                <div class="w-11 h-11 mx-auto mb-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <i data-lucide="briefcase" class="w-5 h-5"></i>
                </div>
                <div class="font-bold text-gray-900 text-sm">Văn phòng</div>
                <div class="text-[11px] text-gray-400 mt-1">2,108 tin</div>
            </div>

            <!-- 6. Mặt bằng -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 card-shadow hover:border-emerald-300 hover:-translate-y-1 transition duration-200 cursor-pointer text-center">
                <div class="w-11 h-11 mx-auto mb-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <i data-lucide="store" class="w-5 h-5"></i>
                </div>
                <div class="font-bold text-gray-900 text-sm">Mặt bằng</div>
                <div class="text-[11px] text-gray-400 mt-1">1,450 tin</div>
            </div>
        </div>

        <div>
            <button class="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm transition shadow-md">
                Bắt đầu đăng tin
            </button>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 5. STATS COUNTER STRIP                         -->
    <!-- ============================================== -->
    <section class="bg-[#0f2c23] text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-800/60">
                <div class="pt-4 md:pt-0">
                    <div class="text-3xl sm:text-4xl font-extrabold text-white">80K+</div>
                    <div class="text-xs sm:text-sm text-emerald-200/80 mt-1">Tin đăng kiểm duyệt</div>
                </div>
                <div class="pt-4 md:pt-0">
                    <div class="text-3xl sm:text-4xl font-extrabold text-white">2,4M</div>
                    <div class="text-xs sm:text-sm text-emerald-200/80 mt-1">Lượt truy cập / tháng</div>
                </div>
                <div class="pt-4 md:pt-0">
                    <div class="text-3xl sm:text-4xl font-extrabold text-white">12.000+</div>
                    <div class="text-xs sm:text-sm text-emerald-200/80 mt-1">Môi giới xác thực</div>
                </div>
                <div class="pt-4 md:pt-0">
                    <div class="text-3xl sm:text-4xl font-extrabold text-white">63</div>
                    <div class="text-xs sm:text-sm text-emerald-200/80 mt-1">Tỉnh thành toàn quốc</div>
                </div>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 6. TESTIMONIALS / TRUST                        -->
    <!-- ============================================== -->
    <section class="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <!-- Left Header & Profile -->
            <div class="lg:col-span-5">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">KHÁCH HÀNG NÓI GÌ</span>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 mb-6">
                    An tâm hơn trong mọi quyết định.
                </h2>
                
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800">
                        NA
                    </div>
                    <div>
                        <div class="font-bold text-gray-900 text-sm">Nguyễn Minh Anh</div>
                        <div class="text-xs text-gray-500">Nhà đầu tư cá nhân tại TP.HCM</div>
                    </div>
                </div>
            </div>

            <!-- Right Testimonial Card -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-2xl p-6 sm:p-8 card-shadow border border-gray-100">
                    <div class="flex text-amber-400 gap-1 mb-4 text-sm">
                        ★★★★★
                    </div>
                    <blockquote class="text-gray-700 text-base sm:text-lg leading-relaxed mb-6 font-medium">
                        “Nhà Việt giúp tôi tìm kiếm khu vực mua căn hộ rất nhanh và an toàn. Trải nghiệm minh bạch, thông tin chính xác và môi giới rất tận tâm.”
                    </blockquote>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs">
                            TB
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 text-sm">Trần Quốc Bảo</div>
                            <div class="text-xs text-gray-500">Chuyên viên kinh doanh • Đã mua nhà qua Nhà Việt</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 7. CTA BANNER CARD                             -->
    <!-- ============================================== -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div class="bg-[#1f4a3e] rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 card-shadow">
            <div>
                <h3 class="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                    Bạn đã sẵn sàng cho bước tiếp theo?
                </h3>
                <p class="text-emerald-100/90 text-sm sm:text-base">
                    Tìm ngôi nhà phù hợp hoặc tiếp cận hàng triệu khách hàng ngay hôm nay.
                </p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <a href="#" class="px-5 py-3 rounded-full bg-white text-emerald-950 hover:bg-gray-100 font-bold text-sm transition shadow-sm">
                    Tìm nhà ngay
                </a>
                <a href="#" class="px-5 py-3 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm border border-emerald-500/40 transition shadow-sm">
                    Đăng tin miễn phí
                </a>
            </div>
        </div>
    </section>


    <!-- ============================================== -->
    <!-- 8. FOOTER                                      -->
    <!-- ============================================== -->
    <footer class="bg-[#091c16] text-gray-300 pt-16 pb-12 border-t border-emerald-950">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-emerald-900/60">
                <!-- Brand Info -->
                <div class="md:col-span-4">
                    <a href="{{ url('/') }}" class="flex items-center gap-2.5 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                            <i data-lucide="home" class="w-4 h-4 text-emerald-300"></i>
                        </div>
                        <span class="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                            <span class="text-emerald-400">NHÀ</span>VIỆT
                        </span>
                    </a>
                    <p class="text-xs text-gray-400 leading-relaxed mb-4 max-w-sm">
                        Nền tảng giao dịch bất động sản uy tín hàng đầu Việt Nam. Kết nối khách hàng và môi giới chuyên nghiệp với trải nghiệm minh bạch nhất.
                    </p>
                    <div class="text-xs text-emerald-300 font-medium">
                        Hotline: <strong class="text-white font-bold">1900 6868</strong> • contact@nhaviet.vn
                    </div>
                </div>

                <!-- Column 1 -->
                <div class="md:col-span-3">
                    <h4 class="text-sm font-bold text-white mb-4">Bất động sản</h4>
                    <ul class="space-y-2.5 text-xs text-gray-400">
                        <li><a href="#" class="hover:text-emerald-300 transition">Mua bán nhà đất</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Cho thuê căn hộ</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Dự án bất động sản</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Tin tức thị trường</a></li>
                    </ul>
                </div>

                <!-- Column 2 -->
                <div class="md:col-span-3">
                    <h4 class="text-sm font-bold text-white mb-4">Hỗ trợ</h4>
                    <ul class="space-y-2.5 text-xs text-gray-400">
                        <li><a href="#" class="hover:text-emerald-300 transition">Trung tâm trợ giúp</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Hướng dẫn đăng tin</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Bảng giá dịch vụ</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Quy chế hoạt động</a></li>
                    </ul>
                </div>

                <!-- Column 3 -->
                <div class="md:col-span-2">
                    <h4 class="text-sm font-bold text-white mb-4">Về Nhà Việt</h4>
                    <ul class="space-y-2.5 text-xs text-gray-400">
                        <li><a href="#" class="hover:text-emerald-300 transition">Giới thiệu</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Tuyển dụng</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Liên hệ</a></li>
                        <li><a href="#" class="hover:text-emerald-300 transition">Chính sách bảo mật</a></li>
                    </ul>
                </div>
            </div>

            <!-- Bottom Copyright -->
            <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                <div>
                    © {{ date('Y') }} NHÀ VIỆT. Tất cả các quyền được bảo lưu.
                </div>
                <div class="flex items-center gap-6">
                    <a href="#" class="hover:text-gray-300 transition">Điều khoản</a>
                    <a href="#" class="hover:text-gray-300 transition">Bảo mật</a>
                    <a href="#" class="hover:text-gray-300 transition">Cookies</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Initialize Lucide Icons -->
    <script>
        lucide.createIcons();
    </script>
</body>
</html>
