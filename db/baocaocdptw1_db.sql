-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Oct 27, 2026 at 02:01 PM
-- Server version: 8.0.46
-- PHP Version: 8.3.35

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `baocaocdptw1_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` bigint UNSIGNED NOT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `table_name`, `record_id`, `old_data`, `new_data`, `ip_address`, `created_at`, `updated_at`) VALUES
(1, 1, 'VIEW', 'properties', 1, NULL, '{\"id\": 1, \"lat\": \"10.8415000\", \"lng\": \"106.8402000\", \"area\": 69.2, \"city\": \"TP. Hồ Chí Minh\", \"code\": \"VH-GP-R01\", \"type\": \"Căn hộ cao cấp\", \"badge\": \"Cho thuê gấp\", \"image\": \"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80\", \"legal\": \"Sổ hồng riêng\", \"price\": \"12000000.00\", \"title\": \"Căn hộ 2PN The Origami - Vinhomes Grand Park đầy đủ nội thất cao cấp\", \"floors\": 1, \"status\": 1, \"street\": \"Nguyễn Xiển & Phước Thiện\", \"address\": \"Nguyễn Xiển & Phước Thiện, TP. Thủ Đức, TP. Hồ Chí Minh\", \"deposit\": \"24000000.00\", \"project\": \"Vinhomes Grand Park\", \"purpose\": \"rent\", \"user_id\": null, \"ward_id\": null, \"bedrooms\": 2, \"district\": \"TP. Thủ Đức\", \"latitude\": null, \"amenities\": null, \"bathrooms\": 2, \"developer\": \"Vinhomes\", \"direction\": null, \"furniture\": \"Full nội thất hiện đại, máy giặt, tủ lạnh, tivi, sofa, giường tủ\", \"longitude\": null, \"build_year\": null, \"created_at\": \"2026-10-15T06:56:16.000000Z\", \"deleted_at\": null, \"owner_name\": \"Nguyễn Hoàng Nam\", \"price_rent\": \"12000000.00\", \"price_sale\": null, \"unit_price\": \"173.000 đ/m²\", \"updated_at\": \"2026-10-15T06:56:16.000000Z\", \"badge_class\": \"bg-emerald-500\", \"description\": \"Căn hộ 2PN The Origami - Vinhomes Grand Park đầy đủ nội thất cao cấp - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.\", \"district_id\": null, \"expire_date\": null, \"owner_phone\": \"0912.888.777\", \"province_id\": null, \"deposit_text\": \"24 triệu (Cọc 2 tháng)\", \"legal_status\": null, \"available_date\": \"Dọn vào ở ngay\", \"management_fee\": \"8.800 đ/m²/tháng\", \"price_rent_text\": \"12 triệu/tháng\", \"price_sale_text\": null, \"rent_period_min\": \"Tối thiểu 1 năm\", \"property_type_id\": null}', '172.20.0.1', '2026-10-21 07:03:03', '2026-10-21 07:03:03'),
(2, 1, 'EXTEND', 'properties', 1, '{\"id\": 1, \"lat\": \"10.8415000\", \"lng\": \"106.8402000\", \"area\": 69.2, \"city\": \"TP. Hồ Chí Minh\", \"code\": \"VH-GP-R01\", \"type\": \"Căn hộ cao cấp\", \"badge\": \"Cho thuê gấp\", \"image\": \"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80\", \"legal\": \"Sổ hồng riêng\", \"price\": \"12000000.00\", \"title\": \"Căn hộ 2PN The Origami - Vinhomes Grand Park đầy đủ nội thất cao cấp\", \"floors\": 1, \"status\": 1, \"street\": \"Nguyễn Xiển & Phước Thiện\", \"address\": \"Nguyễn Xiển & Phước Thiện, TP. Thủ Đức, TP. Hồ Chí Minh\", \"deposit\": \"24000000.00\", \"project\": \"Vinhomes Grand Park\", \"purpose\": \"rent\", \"user_id\": null, \"ward_id\": null, \"bedrooms\": 2, \"district\": \"TP. Thủ Đức\", \"latitude\": null, \"amenities\": null, \"bathrooms\": 2, \"developer\": \"Vinhomes\", \"direction\": null, \"furniture\": \"Full nội thất hiện đại, máy giặt, tủ lạnh, tivi, sofa, giường tủ\", \"longitude\": null, \"build_year\": null, \"created_at\": \"2026-10-15T06:56:16.000000Z\", \"deleted_at\": null, \"owner_name\": \"Nguyễn Hoàng Nam\", \"price_rent\": \"12000000.00\", \"price_sale\": null, \"unit_price\": \"173.000 đ/m²\", \"updated_at\": \"2026-10-15T06:56:16.000000Z\", \"badge_class\": \"bg-emerald-500\", \"description\": \"Căn hộ 2PN The Origami - Vinhomes Grand Park đầy đủ nội thất cao cấp - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.\", \"district_id\": null, \"expire_date\": null, \"owner_phone\": \"0912.888.777\", \"province_id\": null, \"deposit_text\": \"24 triệu (Cọc 2 tháng)\", \"legal_status\": null, \"available_date\": \"Dọn vào ở ngay\", \"management_fee\": \"8.800 đ/m²/tháng\", \"price_rent_text\": \"12 triệu/tháng\", \"price_sale_text\": null, \"rent_period_min\": \"Tối thiểu 1 năm\", \"property_type_id\": null}', '{\"id\": 1, \"lat\": \"10.8415000\", \"lng\": \"106.8402000\", \"area\": 69.2, \"city\": \"TP. Hồ Chí Minh\", \"code\": \"VH-GP-R01\", \"days\": 30, \"type\": \"Căn hộ cao cấp\", \"badge\": \"Cho thuê gấp\", \"image\": \"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80\", \"legal\": \"Sổ hồng riêng\", \"price\": \"12000000.00\", \"title\": \"Căn hộ 2PN The Origami - Vinhomes Grand Park đầy đủ nội thất cao cấp\", \"floors\": 1, \"status\": 1, \"street\": \"Nguyễn Xiển & Phước Thiện\", \"address\": \"Nguyễn Xiển & Phước Thiện, TP. Thủ Đức, TP. Hồ Chí Minh\", \"deposit\": \"24000000.00\", \"project\": \"Vinhomes Grand Park\", \"purpose\": \"rent\", \"user_id\": null, \"ward_id\": null, \"bedrooms\": 2, \"district\": \"TP. Thủ Đức\", \"latitude\": null, \"amenities\": null, \"bathrooms\": 2, \"developer\": \"Vinhomes\", \"direction\": null, \"furniture\": \"Full nội thất hiện đại, máy giặt, tủ lạnh, tivi, sofa, giường tủ\", \"longitude\": null, \"build_year\": null, \"created_at\": \"2026-10-15T06:56:16.000000Z\", \"deleted_at\": null, \"owner_name\": \"Nguyễn Hoàng Nam\", \"price_rent\": \"12000000.00\", \"price_sale\": null, \"unit_price\": \"173.000 đ/m²\", \"updated_at\": \"2026-10-21T07:03:28.000000Z\", \"badge_class\": \"bg-emerald-500\", \"description\": \"Căn hộ 2PN The Origami - Vinhomes Grand Park đầy đủ nội thất cao cấp - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.\", \"district_id\": null, \"expire_date\": \"2026-11-20T07:03:28.109296Z\", \"owner_phone\": \"0912.888.777\", \"province_id\": null, \"deposit_text\": \"24 triệu (Cọc 2 tháng)\", \"legal_status\": null, \"available_date\": \"Dọn vào ở ngay\", \"management_fee\": \"8.800 đ/m²/tháng\", \"price_rent_text\": \"12 triệu/tháng\", \"price_sale_text\": null, \"rent_period_min\": \"Tối thiểu 1 năm\", \"property_type_id\": null}', '172.20.0.1', '2026-10-21 07:03:28', '2026-10-21 07:03:28'),
(3, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-21 07:23:01', '2026-10-21 07:23:01'),
(4, 1, 'CREATE_INVOICE', 'invoices', 70, NULL, '{\"amount\": \"10000000.00\", \"invoice_no\": \"QLTT-INV-202610-VHGPR01-11\", \"contract_id\": 13}', '172.19.0.1', '2026-10-23 08:15:29', '2026-10-23 08:15:29'),
(5, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 08:18:40', '2026-10-23 08:18:40'),
(6, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 08:19:04', '2026-10-23 08:19:04'),
(7, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 08:35:50', '2026-10-23 08:35:50'),
(8, 16, 'LOGIN', 'users', 16, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 08:36:00', '2026-10-23 08:36:00'),
(9, 16, 'LOGOUT', 'users', 16, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 09:13:50', '2026-10-23 09:13:50'),
(10, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 09:13:55', '2026-10-23 09:13:55'),
(11, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 09:21:55', '2026-10-23 09:21:55'),
(12, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 09:22:00', '2026-10-23 09:22:00'),
(13, 16, 'LOGIN', 'users', 16, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 09:22:12', '2026-10-23 09:22:12'),
(14, 16, 'LOGOUT', 'users', 16, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 09:41:52', '2026-10-23 09:41:52'),
(15, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 09:42:09', '2026-10-23 09:42:09'),
(16, 1, 'VIEW', 'properties', 5, NULL, '{\"id\": 5, \"lat\": \"10.8732000\", \"lng\": \"106.8845000\", \"area\": 120, \"city\": \"Đồng Nai\", \"code\": \"NOVA-AQUA-S01\", \"type\": \"Nhà phố / Liền kề\", \"badge\": \"Đô thị sinh thái\", \"image\": \"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80\", \"legal\": \"HĐMB Novaland, pháp lý chuẩn chỉnh\", \"price\": \"7800000000.00\", \"title\": \"Nhà phố ven sông Đảo Phượng Hoàng - Aqua City Biên Hòa\", \"floors\": 1, \"status\": 1, \"street\": \"Đường Hương Lộ 2, Xã Long Hưng\", \"address\": \"Đường Hương Lộ 2, Xã Long Hưng, TP. Biên Hòa, Đồng Nai\", \"deposit\": \"200000000.00\", \"project\": \"Aqua City\", \"purpose\": \"sale\", \"user_id\": null, \"ward_id\": null, \"bedrooms\": 4, \"district\": \"TP. Biên Hòa\", \"latitude\": null, \"amenities\": null, \"bathrooms\": 5, \"developer\": \"Novaland\", \"direction\": null, \"furniture\": \"Nhà thô hoàn thiện mặt ngoài 1 trệt 2 lầu\", \"longitude\": null, \"build_year\": null, \"created_at\": \"2026-10-15T06:56:16.000000Z\", \"deleted_at\": null, \"owner_name\": \"Hoàng Minh Đức\", \"price_rent\": null, \"price_sale\": \"7800000000.00\", \"unit_price\": \"65 triệu/m² đất\", \"updated_at\": \"2026-10-15T06:56:16.000000Z\", \"badge_class\": \"bg-teal-600\", \"description\": \"Nhà phố ven sông Đảo Phượng Hoàng - Aqua City Biên Hòa - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.\", \"district_id\": null, \"expire_date\": null, \"owner_phone\": \"0977.889.900\", \"province_id\": null, \"deposit_text\": \"200 triệu (Cọc mua)\", \"legal_status\": null, \"available_date\": \"Bàn giao nhà ngay\", \"management_fee\": \"12.000 đ/m²\", \"price_rent_text\": null, \"price_sale_text\": \"7.8 tỷ\", \"rent_period_min\": null, \"property_type_id\": null}', '172.19.0.1', '2026-10-23 09:53:17', '2026-10-23 09:53:17'),
(17, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 17:24:38', '2026-10-23 17:24:38'),
(18, 16, 'LOGIN', 'users', 16, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 17:24:52', '2026-10-23 17:24:52'),
(19, 16, 'LOGOUT', 'users', 16, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 17:51:27', '2026-10-23 17:51:27'),
(20, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 17:51:36', '2026-10-23 17:51:36'),
(21, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 18:11:45', '2026-10-23 18:11:45'),
(22, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 18:11:45', '2026-10-23 18:11:45'),
(23, 16, 'LOGIN', 'users', 16, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:12:02', '2026-10-23 18:12:02'),
(24, 16, 'LOGOUT', 'users', 16, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 18:12:50', '2026-10-23 18:12:50'),
(25, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:13:01', '2026-10-23 18:13:01'),
(26, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 18:32:12', '2026-10-23 18:32:12'),
(27, 16, 'LOGIN', 'users', 16, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:32:27', '2026-10-23 18:32:27'),
(28, 16, 'LOGOUT', 'users', 16, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 18:33:19', '2026-10-23 18:33:19'),
(29, 16, 'LOGIN', 'users', 16, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:37:30', '2026-10-23 18:37:30'),
(30, 16, 'LOGIN', 'users', 16, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:37:58', '2026-10-23 18:37:58'),
(31, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:38:33', '2026-10-23 18:38:33'),
(32, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:39:10', '2026-10-23 18:39:10'),
(33, 1, 'LOGOUT', 'users', 1, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 18:39:46', '2026-10-23 18:39:46'),
(34, 16, 'LOGIN', 'users', 16, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:40:09', '2026-10-23 18:40:09'),
(35, 16, 'LOGOUT', 'users', 16, NULL, '{\"description\": \"Đăng xuất hệ thống\"}', '172.19.0.1', '2026-10-23 18:42:02', '2026-10-23 18:42:02'),
(36, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.19.0.1', '2026-10-23 18:42:25', '2026-10-23 18:42:25'),
(37, 1, 'SUBMIT_CONTRACT_EXTENSION', 'contract_extensions', 1, NULL, '{\"contract_id\": 30, \"new_end_date\": \"2028-07-26\", \"extension_type\": 1, \"duration_months\": 12, \"new_rental_price\": \"30000000.00\"}', '172.19.0.1', '2026-10-26 14:23:59', '2026-10-26 14:23:59'),
(38, 1, 'APPROVE_CONTRACT_EXTENSION', 'contract_extensions', 1, '{\"end_date\": \"2027-07-26\", \"rental_price\": 30000000}', '{\"end_date\": \"2028-07-26\", \"approved_at\": \"2026-10-26 14:28:44\", \"rental_price\": 30000000}', '172.19.0.1', '2026-10-26 14:28:44', '2026-10-26 14:28:44'),
(39, 1, 'CONTRACT_DOCUMENT_VIEW', 'contract_documents', 1, NULL, '{\"role_id\": 1, \"original_name\": \"1_Đăng Ký-đăng Nhập.png\"}', '172.19.0.1', '2026-10-26 15:01:16', '2026-10-26 15:01:16'),
(40, 1, 'CONTRACT_DOCUMENT_VIEW', 'contract_documents', 1, NULL, '{\"role_id\": 1, \"original_name\": \"1_Đăng Ký-đăng Nhập.png\"}', '172.19.0.1', '2026-10-26 15:01:21', '2026-10-26 15:01:21'),
(41, 1, 'CONTRACT_DOCUMENT_VIEW', 'contract_documents', 1, NULL, '{\"role_id\": 1, \"original_name\": \"1_Đăng Ký-đăng Nhập.png\"}', '172.19.0.1', '2026-10-26 15:12:32', '2026-10-26 15:12:32'),
(42, 1, 'LOGIN', 'users', 1, NULL, '{\"description\": \"Đăng nhập hệ thống\"}', '172.20.0.1', '2026-10-26 15:38:24', '2026-10-26 15:38:24'),
(43, 1, 'VIEW', 'properties', 35, NULL, '{\"id\": 35, \"lat\": null, \"lng\": null, \"area\": 75, \"city\": \"TP. Hồ Chí Minh\", \"code\": \"GV-502\", \"type\": \"Căn hộ cao cấp\", \"badge\": null, \"image\": null, \"legal\": null, \"price\": \"11000000.00\", \"title\": \"P.502 The Gold View\", \"floors\": 1, \"status\": 1, \"street\": null, \"address\": \"346 Bến Vân Đồn, Phường 1, Quận 4, TP.HCM\", \"deposit\": \"22000000.00\", \"project\": null, \"purpose\": \"rent\", \"user_id\": null, \"ward_id\": null, \"bedrooms\": 0, \"district\": null, \"latitude\": null, \"amenities\": null, \"bathrooms\": 0, \"developer\": null, \"direction\": null, \"furniture\": null, \"longitude\": null, \"build_year\": null, \"created_at\": \"2026-10-26T06:51:30.000000Z\", \"deleted_at\": null, \"owner_name\": null, \"price_rent\": \"11000000.00\", \"price_sale\": null, \"unit_price\": null, \"updated_at\": \"2026-10-26T06:51:30.000000Z\", \"badge_class\": null, \"description\": null, \"district_id\": null, \"expire_date\": null, \"owner_phone\": null, \"province_id\": null, \"deposit_text\": null, \"legal_status\": null, \"available_date\": null, \"management_fee\": null, \"price_rent_text\": null, \"price_sale_text\": null, \"rent_period_min\": null, \"property_type_id\": null}', '172.20.0.1', '2026-10-26 15:39:26', '2026-10-26 15:39:26'),
(44, 1, 'CUSTOMER_UPDATE', 'customers', 1, NULL, '{\"description\": \"Khách hàng #1\"}', '172.20.0.1', '2026-10-27 19:21:26', '2026-10-27 19:21:26'),
(45, 1, 'CUSTOMER_UPDATE', 'customers', 1, NULL, '{\"description\": \"Khách hàng #1\"}', '172.20.0.1', '2026-10-27 19:23:16', '2026-10-27 19:23:16'),
(46, 1, 'CUSTOMER_UPDATE', 'customers', 1, NULL, '{\"description\": \"Khách hàng #1\"}', '172.20.0.1', '2026-10-27 19:23:32', '2026-10-27 19:23:32'),
(47, 1, 'DEMAND_CREATE', 'customer_demands', 11, NULL, '{\"description\": \"Nhu cầu ND-1011\"}', '172.20.0.1', '2026-10-27 19:26:36', '2026-10-27 19:26:36'),
(49, 1, 'UPDATE', 'users', 11, NULL, '{\"changes\": [{\"after\": \"BĐS (#2)\", \"field\": \"role_id\", \"label\": \"Vai trò\", \"before\": \"Staff (#4)\"}, {\"after\": \"Tắt\", \"field\": \"dark_mode\", \"label\": \"Giao diện tối\", \"before\": \"Tắt\"}], \"description\": \"Tài khoản “Người Dùng Mẫu 6” (#11): Vai trò: “Staff (#4)” → “BĐS (#2)”; Giao diện tối: “Tắt” → “Tắt”\"}', '172.20.0.1', '2026-10-27 20:22:06', '2026-10-27 20:22:06');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `broker_id` bigint UNSIGNED DEFAULT NULL,
  `property_id` bigint UNSIGNED NOT NULL,
  `appointment_time` datetime NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `customer_id`, `broker_id`, `property_id`, `appointment_time`, `status`, `note`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 5, 2, 14, '2026-10-11 20:56:16', 3, 'Khách muốn thương lượng lại giá thuê.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(2, 5, 4, 11, '2026-10-14 15:56:16', 3, 'Khách VIP, cần chuẩn bị kỹ hợp đồng.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(3, 5, 4, 15, '2026-10-20 23:56:16', 1, 'Khách VIP, cần chuẩn bị kỹ hợp đồng.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(4, 5, 3, 20, '2026-10-13 14:56:16', 1, 'Khách hàng muốn xem thực tế nội thất căn hộ.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(5, 5, 2, 20, '2026-10-24 19:56:16', 0, 'Khách VIP, cần chuẩn bị kỹ hợp đồng.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(6, 5, 4, 7, '2026-10-21 22:56:16', 3, 'Cần check lại giấy tờ pháp lý sổ hồng.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(7, 5, 3, 9, '2026-10-20 23:56:16', 2, 'Khách hàng muốn xem thực tế nội thất căn hộ.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(8, 5, 2, 9, '2026-10-21 21:56:16', 0, 'Cần check lại giấy tờ pháp lý sổ hồng.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(9, 5, 2, 7, '2026-10-10 22:56:16', 2, 'Cần check lại giấy tờ pháp lý sổ hồng.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(10, 5, 3, 2, '2026-10-22 22:56:16', 2, 'Khách muốn thương lượng lại giá thuê.', NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16');

-- --------------------------------------------------------

--
-- Table structure for table `brokers`
--

CREATE TABLE `brokers` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Chuyên viên',
  `deals_count` int NOT NULL DEFAULT '0',
  `total_commission` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `avatar` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `version` int UNSIGNED NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brokers`
--

INSERT INTO `brokers` (`id`, `user_id`, `code`, `name`, `phone`, `email`, `level`, `deals_count`, `total_commission`, `status`, `avatar`, `notes`, `created_at`, `updated_at`, `deleted_at`, `version`) VALUES
(1, 2, 'MG-001', 'Trường Giang', '0901234567', 'giang.nguyen@3tvland.vn', 'Trưởng nhóm', 24, 185000000.00, 'active', NULL, 'Chuyên căn hộ cao cấp khu vực Bình Thạnh và Quận 2.', '2026-10-15 15:02:22', '2026-10-16 06:05:58', NULL, 1),
(2, 3, 'MG-002', 'Phạm Lê Hoàng Hảo', '0902345678', 'hao.pham@3tvland.vn', 'Chuyên viên', 18, 120000000.00, 'active', NULL, 'Thế mạnh khu vực Thảo Điền và TP. Thủ Đức.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(3, 4, 'MG-003', 'Phạm Đoàn Tony Quyền', '0903456789', 'tony.pham@3tvland.vn', 'Giám đốc kinh doanh', 35, 320000000.00, 'active', NULL, 'Quản lý dự án biệt thự, nhà phố trung tâm Quận 1 và Quận 3.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(4, NULL, 'MG-004', 'Trần Văn Nam', '0904567890', 'nam.tran@3tvland.vn', 'Chuyên viên', 12, 75000000.00, 'active', NULL, 'Chuyên shophouse và mặt bằng thương mại Gò Vấp, Phú Nhuận.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(5, NULL, 'MG-005', 'Lê Thị Mai', '0905678901', 'mai.le@3tvland.vn', 'Tập sự', 4, 22000000.00, 'busy', NULL, 'Đang phụ trách dẫn khách dự án The Sun Avenue.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(6, NULL, 'MG-006', 'Hoàng Minh Trí', '0906789012', 'tri.hoang@3tvland.vn', 'Chuyên viên', 15, 95000000.00, 'active', NULL, 'Chuyên phân khúc đất nền và dự án vùng ven.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(7, NULL, 'MG-007', 'Đỗ Quỳnh Như', '0907890123', 'nhu.do@3tvland.vn', 'Trưởng nhóm', 20, 150000000.00, 'inactive', NULL, 'Tạm nghỉ phép cá nhân.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(8, NULL, 'MG-008', 'Vũ Anh Khoa', '0908901234', 'khoa.vu@3tvland.vn', 'Tập sự', 2, 10000000.00, 'active', NULL, 'Tập sự bán hàng phân khúc chung cư tầm trung.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `broker_assignments`
--

CREATE TABLE `broker_assignments` (
  `id` bigint UNSIGNED NOT NULL,
  `request_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_email` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_location` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `broker_id` bigint UNSIGNED NOT NULL,
  `assigned_date` date NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `version` int UNSIGNED NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `broker_assignments`
--

INSERT INTO `broker_assignments` (`id`, `request_code`, `customer_name`, `customer_phone`, `customer_email`, `property_location`, `broker_id`, `assigned_date`, `status`, `notes`, `created_at`, `updated_at`, `deleted_at`, `version`) VALUES
(1, 'YC-2026-001', 'Nguyễn Thu Thảo', '0912345678', 'thuthao.ng@gmail.com', 'Vinhomes Central Park, Bình Thạnh, TP.HCM', 1, '2026-10-10', 'processing', 'Khách cần xem căn hộ 2PN Landmark 81 cuối tuần.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(2, 'YC-2026-002', 'Trần Văn Bình', '0923456789', 'binhtran.bds@gmail.com', 'Masteri Thảo Điền, TP. Thủ Đức, TP.HCM', 2, '2026-10-11', 'completed', 'Đã ký hợp đồng đặt cọc thành công ngày 14/10.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(3, 'YC-2026-003', 'Lê Hoàng Yến', '0934567890', 'yenhoang.le@gmail.com', 'The Sun Avenue, Quận 2, TP.HCM', 3, '2026-10-12', 'pending', 'Khách tìm căn officetel để mở văn phòng thiết kế.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(4, 'YC-2026-004', 'Đặng Quốc Hưng', '0945678901', 'hung.dang@gmail.com', 'Khu đô thị Sala, Quận 2, TP.HCM', 1, '2026-10-13', 'processing', 'Khách VIP tìm biệt thự Saroma khu Sala.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(5, 'YC-2026-005', 'Vũ Bích Ngọc', '0956789012', 'ngocvu@gmail.com', 'Đất nền dự án Long Thành, Đồng Nai', 6, '2026-10-14', 'cancelled', 'Khách dời kế hoạch đầu tư sang quý 1 năm sau.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1),
(6, 'YC-2026-006', 'Ngô Hải Đăng', '0967890123', 'haidang.ngo@gmail.com', 'Nhà phố Cityland Park Hills, Gò Vấp, TP.HCM', 4, '2026-10-15', 'pending', 'Khách cần xem nhà vào 9h sáng thứ Bảy tuần này.', '2026-10-15 15:02:22', '2026-10-15 15:02:22', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-261252177a836f8c9cb2961f5f2fd3128da6f62f', 'i:1;', 1793106898),
('laravel-cache-261252177a836f8c9cb2961f5f2fd3128da6f62f:timer', 'i:1793106898;', 1793106898),
('laravel-cache-412a22b0c80fea47c7a2ea2dda96bab6357db455', 'i:2;', 1793106873),
('laravel-cache-412a22b0c80fea47c7a2ea2dda96bab6357db455:timer', 'i:1793106873;', 1793106873),
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba', 'i:1;', 1793102888),
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba:timer', 'i:1793102888;', 1793102888),
('laravel-cache-756b59625a6462ad6f4d581c0bd514e2c6fa39eb', 'i:1;', 1793007896),
('laravel-cache-756b59625a6462ad6f4d581c0bd514e2c6fa39eb:timer', 'i:1793007896;', 1793007896),
('laravel-cache-dashboard_overview_data', 'a:3:{s:5:\"cards\";a:6:{s:6:\"rented\";a:4:{s:12:\"rented_count\";i:12;s:11:\"total_count\";i:47;s:12:\"vacant_count\";i:35;s:7:\"display\";s:24:\"12 / Tổng số 47 căn\";}s:9:\"occupancy\";a:3:{s:4:\"rate\";d:25.5;s:7:\"display\";s:5:\"25.5%\";s:18:\"types_distribution\";O:29:\"Illuminate\\Support\\Collection\":2:{s:8:\"\0*\0items\";a:5:{i:0;O:8:\"stdClass\":2:{s:4:\"name\";s:19:\"Căn hộ cao cấp\";s:5:\"total\";i:3;}i:1;O:8:\"stdClass\":2:{s:4:\"name\";s:22:\"Nhà phố liền kề\";s:5:\"total\";i:3;}i:2;O:8:\"stdClass\":2:{s:4:\"name\";s:24:\"Biệt thự đơn lập\";s:5:\"total\";i:3;}i:3;O:8:\"stdClass\":2:{s:4:\"name\";s:24:\"Shophouse thương mại\";s:5:\"total\";i:2;}i:4;O:8:\"stdClass\":2:{s:4:\"name\";s:21:\"Đất nền dự án\";s:5:\"total\";i:2;}}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:7:\"revenue\";a:3:{s:6:\"amount\";d:410700000;s:7:\"display\";s:16:\"410.700.000 VNĐ\";s:11:\"month_label\";s:14:\"Tháng 10/2026\";}s:6:\"growth\";a:5:{s:4:\"rate\";d:30.8;s:11:\"is_positive\";b:1;s:7:\"display\";s:6:\"+30.8%\";s:16:\"sparkline_labels\";a:6:{i:0;s:3:\"T05\";i:1;s:3:\"T06\";i:2;s:3:\"T07\";i:3;s:3:\"T08\";i:4;s:3:\"T09\";i:5;s:3:\"T10\";}s:14:\"sparkline_data\";a:6:{i:0;d:0;i:1;d:0;i:2;d:0;i:3;d:0;i:4;d:314000000;i:5;d:410700000;}}s:18:\"expiring_contracts\";a:3:{s:5:\"count\";i:10;s:7:\"display\";s:2:\"10\";s:14:\"threshold_days\";i:30;}s:11:\"maintenance\";a:3:{s:11:\"in_progress\";i:3;s:5:\"total\";i:8;s:7:\"display\";s:1:\"3\";}}s:17:\"recent_activities\";a:10:{i:0;a:7:{s:4:\"type\";s:8:\"CONTRACT\";s:5:\"badge\";s:19:\"Hợp đồng mới\";s:11:\"badge_color\";s:4:\"blue\";s:7:\"content\";s:64:\"Hợp đồng mới: P.1508 Feliz En Vista (Trần Mai Phương)\";s:6:\"detail\";s:22:\"22.000.000 VNĐ/tháng\";s:10:\"created_at\";s:19:\"2026-10-26 13:51:30\";s:14:\"time_formatted\";s:16:\"26/10/2026 13:51\";}i:1;a:7:{s:4:\"type\";s:8:\"CONTRACT\";s:5:\"badge\";s:19:\"Hợp đồng mới\";s:11:\"badge_color\";s:4:\"blue\";s:7:\"content\";s:70:\"Hợp đồng mới: P.1102 Gateway Thảo Điền (Đặng Khánh Ly)\";s:6:\"detail\";s:22:\"30.000.000 VNĐ/tháng\";s:10:\"created_at\";s:19:\"2026-10-26 13:51:30\";s:14:\"time_formatted\";s:16:\"26/10/2026 13:51\";}i:2;a:7:{s:4:\"type\";s:8:\"CONTRACT\";s:5:\"badge\";s:19:\"Hợp đồng mới\";s:11:\"badge_color\";s:4:\"blue\";s:7:\"content\";s:58:\"Hợp đồng mới: P.901 The Sun Avenue (Bùi Anh Quân)\";s:6:\"detail\";s:22:\"13.000.000 VNĐ/tháng\";s:10:\"created_at\";s:19:\"2026-10-26 13:51:30\";s:14:\"time_formatted\";s:16:\"26/10/2026 13:51\";}i:3;a:7:{s:4:\"type\";s:8:\"CONTRACT\";s:5:\"badge\";s:19:\"Hợp đồng mới\";s:11:\"badge_color\";s:4:\"blue\";s:7:\"content\";s:59:\"Hợp đồng mới: P.502 The Gold View (Ngô Trí Đức)\";s:6:\"detail\";s:22:\"11.000.000 VNĐ/tháng\";s:10:\"created_at\";s:19:\"2026-10-26 13:51:30\";s:14:\"time_formatted\";s:16:\"26/10/2026 13:51\";}i:4;a:7:{s:4:\"type\";s:8:\"CONTRACT\";s:5:\"badge\";s:19:\"Hợp đồng mới\";s:11:\"badge_color\";s:4:\"blue\";s:7:\"content\";s:60:\"Hợp đồng mới: P.303 Botanica Premier (Võ Thùy Linh)\";s:6:\"detail\";s:22:\"12.500.000 VNĐ/tháng\";s:10:\"created_at\";s:19:\"2026-10-26 13:51:30\";s:14:\"time_formatted\";s:16:\"26/10/2026 13:51\";}i:5;a:7:{s:4:\"type\";s:7:\"PAYMENT\";s:5:\"badge\";s:18:\"Thanh toán nhận\";s:11:\"badge_color\";s:7:\"emerald\";s:7:\"content\";s:104:\"Thanh toán nhận: Đặng Khánh Ly - Tiền thuê nhà tháng 10/2026 - P.1102 Gateway Thảo Điền\";s:6:\"detail\";s:15:\"30.000.000 VNĐ\";s:10:\"created_at\";s:19:\"2026-10-26 13:51:30\";s:14:\"time_formatted\";s:16:\"26/10/2026 13:51\";}i:6;a:7:{s:4:\"type\";s:7:\"PAYMENT\";s:5:\"badge\";s:18:\"Thanh toán nhận\";s:11:\"badge_color\";s:7:\"emerald\";s:7:\"content\";s:99:\"Thanh toán nhận: Nguyễn Văn Hùng - Tiền thuê nhà tháng 10/2026 - P.402 Tòa Landmark 81\";s:6:\"detail\";s:15:\"25.000.000 VNĐ\";s:10:\"created_at\";s:19:\"2026-10-26 13:51:29\";s:14:\"time_formatted\";s:16:\"26/10/2026 13:51\";}i:7;a:7:{s:4:\"type\";s:7:\"PAYMENT\";s:5:\"badge\";s:18:\"Thanh toán nhận\";s:11:\"badge_color\";s:7:\"emerald\";s:7:\"content\";s:99:\"Thanh toán nhận: Lê Thị Thu - Tiền thuê nhà tháng 10/2026 - P.1205 Vinhomes Central Park\";s:6:\"detail\";s:15:\"18.000.000 VNĐ\";s:10:\"created_at\";s:19:\"2026-10-26 13:51:29\";s:14:\"time_formatted\";s:16:\"26/10/2026 13:51\";}i:8;a:7:{s:4:\"type\";s:7:\"PAYMENT\";s:5:\"badge\";s:18:\"Thanh toán nhận\";s:11:\"badge_color\";s:7:\"emerald\";s:7:\"content\";s:91:\"Thanh toán nhận: Nguyễn Văn Khách Hàng - Tiền thuê tháng 08/2026 - HD-2023-0002\";s:6:\"detail\";s:15:\"22.000.000 VNĐ\";s:10:\"created_at\";s:19:\"2026-10-23 07:20:35\";s:14:\"time_formatted\";s:16:\"23/10/2026 07:20\";}i:9;a:7:{s:4:\"type\";s:7:\"PAYMENT\";s:5:\"badge\";s:18:\"Thanh toán nhận\";s:11:\"badge_color\";s:7:\"emerald\";s:7:\"content\";s:91:\"Thanh toán nhận: Nguyễn Văn Khách Hàng - Tiền thuê tháng 08/2026 - HD-2023-0003\";s:6:\"detail\";s:15:\"17.000.000 VNĐ\";s:10:\"created_at\";s:19:\"2026-10-23 07:20:35\";s:14:\"time_formatted\";s:16:\"23/10/2026 07:20\";}}s:4:\"meta\";a:2:{s:10:\"updated_at\";s:19:\"27/10/2026 20:59:20\";s:12:\"current_date\";s:10:\"27/10/2026\";}}', 1793109570),
('laravel-cache-meta_field_limits', 'a:7:{s:6:\"search\";a:1:{s:3:\"max\";i:100;}s:5:\"month\";a:2:{s:6:\"format\";s:3:\"Y-m\";s:15:\"allowed_special\";a:1:{i:0;s:3:\"all\";}}s:6:\"status\";a:1:{s:7:\"allowed\";a:5:{i:0;s:4:\"paid\";i:1;s:7:\"partial\";i:2;s:7:\"overdue\";i:3;s:6:\"unpaid\";i:4;s:9:\"cancelled\";}}s:4:\"sort\";a:1:{s:7:\"allowed\";a:5:{i:0;s:13:\"overdue_first\";i:1;s:12:\"due_date_asc\";i:2;s:13:\"due_date_desc\";i:3;s:10:\"amount_asc\";i:4;s:11:\"amount_desc\";}}s:8:\"per_page\";a:2:{s:7:\"allowed\";a:3:{i:0;i:10;i:1;i:20;i:2;i:50;}s:7:\"default\";i:10;}s:7:\"payment\";a:3:{s:6:\"amount\";a:3:{s:3:\"min\";d:0.01;s:3:\"max\";d:999999999999.99;s:14:\"decimal_places\";i:2;}s:14:\"reference_code\";a:2:{s:3:\"max\";i:100;s:5:\"regex\";s:25:\"/^[a-zA-Z0-9_\\-\\/\\.\\s]+$/\";}s:4:\"note\";a:1:{s:3:\"max\";i:500;}}s:7:\"invoice\";a:4:{s:5:\"title\";a:1:{s:3:\"max\";i:255;}s:4:\"note\";a:1:{s:3:\"max\";i:2000;}s:13:\"cancel_reason\";a:2:{s:3:\"min\";i:3;s:3:\"max\";i:1000;}s:5:\"items\";a:5:{s:9:\"max_items\";i:50;s:9:\"item_name\";a:1:{s:3:\"max\";i:255;}s:11:\"description\";a:1:{s:3:\"max\";i:255;}s:8:\"quantity\";a:2:{s:3:\"min\";d:0.01;s:3:\"max\";i:100000;}s:10:\"unit_price\";a:2:{s:3:\"min\";i:0;s:3:\"max\";d:999999999999.99;}}}}', 1793107207),
('laravel-cache-report_stat_overview_this_month_20261001_20261031', 'a:8:{s:6:\"status\";s:7:\"success\";s:4:\"meta\";a:8:{s:11:\"report_type\";s:8:\"overview\";s:13:\"report_period\";s:10:\"this_month\";s:10:\"start_date\";s:10:\"2026-10-01\";s:8:\"end_date\";s:10:\"2026-10-31\";s:20:\"start_date_formatted\";s:10:\"01/10/2026\";s:18:\"end_date_formatted\";s:10:\"31/10/2026\";s:12:\"period_label\";s:23:\"01/10/2026 - 31/10/2026\";s:12:\"generated_at\";s:19:\"27/10/2026 19:25:19\";}s:4:\"kpis\";a:9:{s:13:\"total_revenue\";d:410700000;s:14:\"revenue_change\";d:30.8;s:14:\"occupancy_rate\";d:25.5;s:16:\"occupancy_change\";d:0;s:20:\"maintenance_requests\";i:3;s:18:\"maintenance_change\";d:-40;s:16:\"total_properties\";i:47;s:17:\"rented_properties\";i:12;s:17:\"vacant_properties\";i:35;}s:13:\"total_revenue\";d:410700000;s:14:\"occupancy_rate\";d:25.5;s:20:\"maintenance_requests\";i:3;s:10:\"table_data\";a:5:{i:0;a:4:{s:6:\"metric\";s:26:\"Tổng Hợp đồng mới\";s:5:\"value\";s:2:\"19\";s:6:\"change\";d:171.4;s:5:\"trend\";s:2:\"up\";}i:1;a:4:{s:6:\"metric\";s:27:\"Tổng Người thuê mới\";s:5:\"value\";s:2:\"13\";s:6:\"change\";d:100;s:5:\"trend\";s:2:\"up\";}i:2;a:4:{s:6:\"metric\";s:31:\"Hợp đồng sắp hết hạn\";s:5:\"value\";s:2:\"10\";s:6:\"change\";d:0;s:5:\"trend\";s:7:\"neutral\";}i:3;a:4:{s:6:\"metric\";s:25:\"Yêu cầu đang xử lý\";s:5:\"value\";s:1:\"1\";s:6:\"change\";d:-50;s:5:\"trend\";s:2:\"up\";}i:4;a:4:{s:6:\"metric\";s:28:\"Yêu cầu đã hoàn thành\";s:5:\"value\";s:1:\"2\";s:6:\"change\";d:-33.3;s:5:\"trend\";s:4:\"down\";}}s:6:\"charts\";a:3:{s:8:\"timeline\";a:3:{s:6:\"labels\";a:31:{i:0;s:5:\"01/10\";i:1;s:5:\"02/10\";i:2;s:5:\"03/10\";i:3;s:5:\"04/10\";i:4;s:5:\"05/10\";i:5;s:5:\"06/10\";i:6;s:5:\"07/10\";i:7;s:5:\"08/10\";i:8;s:5:\"09/10\";i:9;s:5:\"10/10\";i:10;s:5:\"11/10\";i:11;s:5:\"12/10\";i:12;s:5:\"13/10\";i:13;s:5:\"14/10\";i:14;s:5:\"15/10\";i:15;s:5:\"16/10\";i:16;s:5:\"17/10\";i:17;s:5:\"18/10\";i:18;s:5:\"19/10\";i:19;s:5:\"20/10\";i:20;s:5:\"21/10\";i:21;s:5:\"22/10\";i:22;s:5:\"23/10\";i:23;s:5:\"24/10\";i:24;s:5:\"25/10\";i:25;s:5:\"26/10\";i:26;s:5:\"27/10\";i:27;s:5:\"28/10\";i:28;s:5:\"29/10\";i:29;s:5:\"30/10\";i:30;s:5:\"31/10\";}s:7:\"revenue\";a:31:{i:0;d:0;i:1;d:0;i:2;d:72000000;i:3;d:0;i:4;d:22000000;i:5;d:0;i:6;d:0;i:7;d:0;i:8;d:0;i:9;d:0;i:10;d:0;i:11;d:25000000;i:12;d:23000000;i:13;d:0;i:14;d:0;i:15;d:0;i:16;d:0;i:17;d:0;i:18;d:0;i:19;d:0;i:20;d:0;i:21;d:0;i:22;d:195700000;i:23;d:0;i:24;d:0;i:25;d:73000000;i:26;d:0;i:27;d:0;i:28;d:0;i:29;d:0;i:30;d:0;}s:9:\"contracts\";a:31:{i:0;i:0;i:1;i:0;i:2;i:1;i:3;i:0;i:4;i:2;i:5;i:0;i:6;i:0;i:7;i:0;i:8;i:0;i:9;i:2;i:10;i:1;i:11;i:0;i:12;i:0;i:13;i:2;i:14;i:0;i:15;i:0;i:16;i:0;i:17;i:0;i:18;i:0;i:19;i:0;i:20;i:0;i:21;i:0;i:22;i:1;i:23;i:0;i:24;i:0;i:25;i:10;i:26;i:0;i:27;i:0;i:28;i:0;i:29;i:0;i:30;i:0;}}s:18:\"maintenance_status\";a:2:{s:6:\"labels\";a:3:{i:0;s:14:\"Chờ xử lý\";i:1;s:14:\"Đang xử lý\";i:2;s:17:\"Đã hoàn thành\";}s:4:\"data\";a:3:{i:0;i:0;i:1;i:1;i:2;i:2;}}s:14:\"property_types\";a:2:{s:6:\"labels\";a:6:{i:0;s:19:\"Căn hộ cao cấp\";i:1;s:22:\"Nhà phố liền kề\";i:2;s:24:\"Biệt thự đơn lập\";i:3;s:24:\"Shophouse thương mại\";i:4;s:21:\"Đất nền dự án\";i:5;s:19:\"Penthouse Sky Villa\";}s:4:\"data\";a:6:{i:0;i:3;i:1;i:3;i:2;i:3;i:3;i:2;i:4;i:2;i:5;i:2;}}}}', 1793103939);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Building2',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `version` int UNSIGNED NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `status`, `icon`, `display_order`, `created_at`, `updated_at`, `deleted_at`, `version`) VALUES
(1, 'Căn hộ chung cư', 'can-ho-chung-cu', 'Căn hộ cao cấp, chung cư dịch vụ, officetel và studio tiện nghi tại các đô thị lớn.', 'active', 'Building2', 1, '2026-10-15 10:29:46', '2026-10-15 10:29:46', NULL, 1),
(2, 'Nhà phố liền kề', 'nha-pho-lien-ke', 'Nhà phố thương mại, nhà riêng, nhà liền kề mặt tiền đường lớn thuận tiện kinh doanh.', 'active', 'Home', 2, '2026-10-15 10:29:46', '2026-10-15 10:29:46', NULL, 1),
(3, 'Biệt thự nghỉ dưỡng', 'biet-thu-nghi-duong', 'Biệt thự đơn lập, song lập sinh thái, biệt thự ven sông với không gian sống biệt lập đẳng cấp.', 'active', 'Castle', 3, '2026-10-15 10:29:46', '2026-10-15 10:29:46', NULL, 1),
(4, 'Shophouse thương mại', 'shophouse-thuong-mai', 'Mặt bằng nhà phố thương mại khối đế chung cư, vị trí đắc địa kinh doanh sầm uất.', 'active', 'Store', 4, '2026-10-15 10:29:46', '2026-10-15 10:29:46', NULL, 1),
(5, 'Đất nền dự án', 'dat-nen-du-an', 'Đất nền phân lô quy hoạch đồng bộ, sổ đỏ pháp lý minh bạch sẵn sàng bàn giao.', 'active', 'LandPlot', 5, '2026-10-15 10:29:46', '2026-10-15 10:29:46', NULL, 1),
(6, 'Văn phòng cho thuê', 'van-phong-cho-thue', 'Mặt bằng văn phòng hạng A/B, sàn thương mại và không gian làm việc chia sẻ hiện đại.', 'active', 'Briefcase', 6, '2026-10-15 10:29:46', '2026-10-15 10:29:46', NULL, 1),
(7, 'Phòng trọ sinh viên', 'phong-tro-sinh-vien', 'Căn hộ mini, phòng trọ cao cấp khép kín đầy đủ tiện nghi với mức giá thuê hợp lý.', 'active', 'Key', 7, '2026-10-15 10:29:46', '2026-10-16 07:50:21', NULL, 1),
(8, 'Bất động sản công nghiệp', 'bat-dong-san-cong-nghiep', 'Kho bãi, nhà xưởng tiêu chuẩn và đất khu công nghiệp trọng điểm.', 'active', 'Factory', 8, '2026-10-15 10:29:46', '2026-10-15 10:29:46', NULL, 1),
(9, 'Khu nghỉ dưỡng sinh thái', 'khu-nghi-duong-sinh-thai', 'Resort ven biển cao cấp', 'active', 'Palmtree', 9, '2026-10-15 10:35:14', '2026-10-15 10:35:57', '2026-10-15 10:35:57', 1),
(10, 'Can ho sync test', 'can-ho-sync-test', '', 'active', 'Building2', 1, '2026-10-15 11:41:50', '2026-10-21 06:54:37', '2026-10-21 06:54:37', 1);

-- --------------------------------------------------------

--
-- Table structure for table `contracts`
--

CREATE TABLE `contracts` (
  `id` bigint UNSIGNED NOT NULL,
  `property_id` bigint UNSIGNED NOT NULL,
  `broker_id` bigint UNSIGNED DEFAULT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `contract_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contract_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `party_a_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `party_b_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tax_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `deposit_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `rental_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` tinyint NOT NULL DEFAULT '0',
  `signing_method` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ONLINE',
  `meeting_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_time` datetime DEFAULT NULL,
  `notary_office` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_high_value` tinyint(1) NOT NULL DEFAULT '0',
  `billing_cycle` int NOT NULL DEFAULT '1',
  `next_billing_date` date DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`id`, `property_id`, `broker_id`, `customer_id`, `contract_code`, `contract_name`, `party_a_info`, `party_b_info`, `tax_code`, `terms`, `currency`, `start_date`, `end_date`, `deposit_amount`, `rental_price`, `status`, `signing_method`, `meeting_location`, `meeting_time`, `notary_office`, `is_high_value`, `billing_cycle`, `next_billing_date`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 5, 'HD-2023-0001', 'Hợp đồng thuê BĐS số 1', NULL, NULL, NULL, NULL, 'VND', '2026-09-24', '2026-11-07', 0.00, 28000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-11 06:56:19', '2026-10-23 07:24:07'),
(2, 1, NULL, 5, 'HD-2023-0002', 'Hợp đồng thuê BĐS số 2', NULL, NULL, NULL, NULL, 'VND', '2026-09-24', '2026-12-11', 0.00, 22000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-09-15 06:56:19', '2026-10-23 07:24:07'),
(3, 1, NULL, 5, 'HD-2023-0003', 'Hợp đồng thuê BĐS số 3', NULL, NULL, NULL, NULL, 'VND', '2026-09-22', '2026-11-04', 0.00, 17000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-14 06:56:19', '2026-10-23 07:24:07'),
(4, 1, NULL, 5, 'HD-2023-0004', 'Hợp đồng thuê BĐS số 4', NULL, NULL, NULL, NULL, 'VND', '2026-10-13', '2026-12-11', 0.00, 22000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-05 06:56:19', '2026-10-23 07:24:07'),
(5, 1, NULL, 5, 'HD-2023-0005', 'Hợp đồng thuê BĐS số 5', NULL, NULL, NULL, NULL, 'VND', '2026-09-18', '2026-12-14', 0.00, 18000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-10-10 06:56:19', '2026-10-15 06:56:19'),
(6, 1, NULL, 5, 'HD-2023-0006', 'Hợp đồng thuê BĐS số 6', NULL, NULL, NULL, NULL, 'VND', '2026-09-27', '2026-11-11', 0.00, 16000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-10-05 06:56:19', '2026-10-15 06:56:19'),
(7, 1, NULL, 5, 'HD-2023-0007', 'Hợp đồng thuê BĐS số 7', NULL, NULL, NULL, NULL, 'VND', '2026-09-23', '2026-11-08', 0.00, 20000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-09-29 06:56:19', '2026-10-15 06:56:19'),
(8, 1, NULL, 5, 'HD-2023-0008', 'Hợp đồng thuê BĐS số 8', NULL, NULL, NULL, NULL, 'VND', '2026-09-25', '2026-11-26', 0.00, 30000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-09-29 06:56:19', '2026-10-15 06:56:19'),
(9, 1, NULL, 5, 'HD-2023-0009', 'Hợp đồng thuê BĐS số 9', NULL, NULL, NULL, NULL, 'VND', '2026-10-11', '2026-11-25', 0.00, 25000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-10-03 06:56:19', '2026-10-15 06:56:19'),
(10, 1, NULL, 5, 'HD-2023-0010', 'Hợp đồng thuê BĐS số 10', NULL, NULL, NULL, NULL, 'VND', '2026-10-14', '2026-12-03', 0.00, 29000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-09-29 06:56:19', '2026-10-15 06:56:19'),
(11, 1, NULL, 5, 'HD-2023-0011', 'Hợp đồng thuê BĐS số 11', NULL, NULL, NULL, NULL, 'VND', '2026-09-29', '2026-10-30', 0.00, 21000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-09-20 06:56:19', '2026-10-15 06:56:19'),
(12, 1, NULL, 5, 'HD-2023-0012', 'Hợp đồng thuê BĐS số 12', NULL, NULL, NULL, NULL, 'VND', '2026-10-02', '2026-11-15', 0.00, 24000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-09-16 06:56:19', '2026-10-15 06:56:19'),
(13, 1, NULL, 5, 'HD-2023-0013', 'Hợp đồng thuê BĐS số 13', NULL, NULL, NULL, NULL, 'VND', '2026-09-30', '2026-10-26', 0.00, 21000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-10-14 06:56:19', '2026-10-15 06:56:19'),
(14, 1, NULL, 5, 'HD-2023-0014', 'Hợp đồng thuê BĐS số 14', NULL, NULL, NULL, NULL, 'VND', '2026-10-14', '2026-11-24', 0.00, 24000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-10-10 06:56:19', '2026-10-15 06:56:19'),
(15, 1, NULL, 5, 'HD-2023-0015', 'Hợp đồng thuê BĐS số 15', NULL, NULL, NULL, NULL, 'VND', '2026-09-16', '2026-11-04', 0.00, 18000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-09-27 06:56:19', '2026-10-15 06:56:19'),
(16, 22, 2, 16, 'SEED-HD-A101', 'Hợp đồng thuê căn hộ A101 Landmark Plus', NULL, NULL, NULL, NULL, 'VND', '2026-04-23', '2027-04-23', 30000000.00, 15000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(21, 27, 2, 21, 'SEED-RENT-LM81-402', 'Hợp đồng thuê căn hộ P.402 Tòa Landmark 81', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 50000000.00, 25000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(22, 28, 2, 22, 'SEED-RENT-VHCP-1205', 'Hợp đồng thuê căn hộ P.1205 Vinhomes Central Park', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 36000000.00, 18000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(23, 29, 2, 23, 'SEED-RENT-MTD-A108', 'Hợp đồng thuê căn hộ Căn A1-08 Masteri Thảo Điền', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 32000000.00, 16000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(24, 30, 2, 24, 'SEED-RENT-SRC-704', 'Hợp đồng thuê căn hộ P.704 Sunrise City Quận 7', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 40000000.00, 20000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(25, 31, 2, 25, 'SEED-RENT-MAP-1802', 'Hợp đồng thuê căn hộ P.1802 Masteri An Phú', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 28000000.00, 14000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(26, 32, 2, 26, 'SEED-RENT-BTP-303', 'Hợp đồng thuê căn hộ P.303 Botanica Premier', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 25000000.00, 12500000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30'),
(27, 33, 2, 27, 'SEED-RENT-TSA-901', 'Hợp đồng thuê căn hộ P.901 The Sun Avenue', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 26000000.00, 13000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30'),
(28, 34, 2, 28, 'SEED-RENT-FEV-1508', 'Hợp đồng thuê căn hộ P.1508 Feliz En Vista', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 44000000.00, 22000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30'),
(29, 35, 2, 29, 'SEED-RENT-GV-502', 'Hợp đồng thuê căn hộ P.502 The Gold View', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2027-07-26', 22000000.00, 11000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2026-11-01', NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30'),
(30, 36, 2, 30, 'SEED-RENT-GWT-1102', 'Hợp đồng thuê căn hộ P.1102 Gateway Thảo Điền', NULL, NULL, NULL, NULL, 'VND', '2026-07-26', '2028-07-26', 60000000.00, 30000000.00, 1, 'ONLINE', NULL, NULL, NULL, 0, 1, '2027-07-27', NULL, '2026-10-26 13:51:30', '2026-10-26 14:28:44');

-- --------------------------------------------------------

--
-- Table structure for table `contract_documents`
--

CREATE TABLE `contract_documents` (
  `id` bigint UNSIGNED NOT NULL,
  `contract_id` bigint UNSIGNED NOT NULL,
  `extension_id` bigint UNSIGNED DEFAULT NULL,
  `document_type` tinyint NOT NULL DEFAULT '5',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL COMMENT 'Kích thước file tính bằng bytes',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `uploaded_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contract_documents`
--

INSERT INTO `contract_documents` (`id`, `contract_id`, `extension_id`, `document_type`, `title`, `file_url`, `original_name`, `file_size`, `mime_type`, `description`, `uploaded_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 30, 1, 5, NULL, '/storage/contract_documents/30/5lRAy0piuoPCHBIyMHg2EWpnGmOzrwxJFnhr1zPx.png', '1_Đăng Ký-đăng Nhập.png', 325955, 'image/png', NULL, NULL, '2026-10-26 14:23:59', '2026-10-26 14:23:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `contract_extensions`
--

CREATE TABLE `contract_extensions` (
  `id` bigint UNSIGNED NOT NULL,
  `contract_id` bigint UNSIGNED NOT NULL,
  `extension_type` tinyint NOT NULL DEFAULT '1' COMMENT '0: Tự động, 1: Thủ công, 2: Theo điều khoản mới',
  `duration_months` int NOT NULL DEFAULT '12' COMMENT 'Số tháng gia hạn: 3, 6, 12',
  `new_start_date` date DEFAULT NULL,
  `extension_date` date DEFAULT NULL,
  `new_end_date` date NOT NULL,
  `old_end_date` date DEFAULT NULL COMMENT 'Ngày kết thúc cũ để đối soát/rollback',
  `new_rental_price` decimal(15,2) DEFAULT NULL,
  `old_rental_price` decimal(15,2) DEFAULT NULL COMMENT 'Giá thuê cũ để đối soát/rollback',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0: Nháp, 1: Chờ duyệt, 2: Đã duyệt, 3: Từ chối, 4: Đã hủy',
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reject_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contract_extensions`
--

INSERT INTO `contract_extensions` (`id`, `contract_id`, `extension_type`, `duration_months`, `new_start_date`, `extension_date`, `new_end_date`, `old_end_date`, `new_rental_price`, `old_rental_price`, `note`, `reason`, `status`, `created_by`, `approved_by`, `approved_at`, `reject_reason`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 30, 1, 12, '2027-07-27', '2026-10-26', '2028-07-26', '2027-07-26', 30000000.00, 30000000.00, NULL, 'tao thích, được không ?', 2, 1, 1, '2026-10-26 14:28:44', NULL, '2026-10-26 14:23:59', '2026-10-26 14:28:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_group` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `notes` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_to` bigint UNSIGNED DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `version` int UNSIGNED NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_tracked` tinyint(1) NOT NULL DEFAULT '1',
  `seed_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `name`, `company`, `source`, `email`, `phone`, `customer_group`, `status`, `notes`, `assigned_to`, `created_by`, `version`, `created_at`, `updated_at`, `deleted_at`, `is_tracked`, `seed_key`) VALUES
(1, 'Quyền', NULL, 'aaaaaaaaaa', 'Quyen@gmail.com', '03567889845', 'potential', 'interested', NULL, 3, 1, 4, '2026-10-19 08:32:05', '2026-10-27 19:23:32', NULL, 1, NULL),
(2, 'Phạm Văn E', 'Cty MNO', 'Giới thiệu', 'pham.e@mno.example', '0888123456', 'new', 'new', NULL, 2, 1, 1, '2023-10-25 02:00:00', '2026-10-19 08:49:11', NULL, 1, 'reference:pham-van-e'),
(3, 'Lê Thị C', NULL, 'Tự do', 'le.c@example.com', '0901234567', 'potential', 'contacted', NULL, 3, 1, 1, '2023-10-11 02:00:00', '2026-10-19 08:49:11', NULL, 1, 'reference:le-thi-c'),
(4, 'Nguyễn Văn Khách Hàng', NULL, 'Website', 'khachhang@gmail.com', '0987654321', 'new', 'new', NULL, 4, 1, 1, '2026-10-15 06:56:16', '2026-10-19 08:49:11', NULL, 1, 'user:5'),
(5, 'Người Dùng Mẫu 10', NULL, 'Website', 'user10@demo.com', '0902174019', 'new', 'new', NULL, 7, 1, 1, '2026-10-15 06:56:18', '2026-10-19 08:49:11', NULL, 1, 'user:15'),
(6, 'Nguyễn Thu Thảo', NULL, 'Phân công môi giới', 'thuthao.ng@gmail.com', '0912345678', 'potential', 'contacted', NULL, 2, 1, 1, '2026-10-15 15:02:22', '2026-10-19 08:49:11', NULL, 1, 'assignment:1'),
(7, 'Trần Văn Bình', NULL, 'Phân công môi giới', 'binhtran.bds@gmail.com', '0923456789', 'potential', 'won', NULL, 3, 1, 1, '2026-10-15 15:02:22', '2026-10-19 08:49:11', NULL, 1, 'assignment:2'),
(8, 'Lê Hoàng Yến', NULL, 'Phân công môi giới', 'yenhoang.le@gmail.com', '0934567890', 'potential', 'new', NULL, 4, 1, 1, '2026-10-15 15:02:22', '2026-10-19 08:49:11', NULL, 1, 'assignment:3'),
(9, 'Đặng Quốc Hưng', NULL, 'Phân công môi giới', 'hung.dang@gmail.com', '0945678901', 'potential', 'contacted', NULL, 2, 1, 1, '2026-10-15 15:02:22', '2026-10-19 08:49:11', NULL, 1, 'assignment:4'),
(10, 'Vũ Bích Ngọc', NULL, 'Phân công môi giới', 'ngocvu@gmail.com', '0956789012', 'potential', 'lost', NULL, 2, 1, 1, '2026-10-15 15:02:22', '2026-10-19 08:49:11', NULL, 1, 'assignment:5'),
(11, 'Ngô Hải Đăng', NULL, 'Phân công môi giới', 'haidang.ngo@gmail.com', '0967890123', 'potential', 'new', NULL, 3, 1, 1, '2026-10-15 15:02:22', '2026-10-19 08:49:11', NULL, 1, 'assignment:6');

-- --------------------------------------------------------

--
-- Table structure for table `customer_activities`
--

CREATE TABLE `customer_activities` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_activities`
--

INSERT INTO `customer_activities` (`id`, `customer_id`, `created_by`, `type`, `title`, `scheduled_at`, `status`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 3, 3, 'email', 'Gửi báo giá bất động sản phù hợp', '2026-10-21 02:00:00', 'pending', NULL, '2026-10-19 08:49:11', '2026-10-19 08:49:11');

-- --------------------------------------------------------

--
-- Table structure for table `customer_demands`
--

CREATE TABLE `customer_demands` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `property_type_id` int UNSIGNED NOT NULL,
  `budget_min` decimal(15,0) NOT NULL,
  `budget_max` decimal(15,0) NOT NULL,
  `area` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'processing',
  `notes` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `version` int UNSIGNED NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `seed_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_demands`
--

INSERT INTO `customer_demands` (`id`, `customer_id`, `property_type_id`, `budget_min`, `budget_max`, `area`, `status`, `notes`, `created_by`, `version`, `created_at`, `updated_at`, `deleted_at`, `seed_key`) VALUES
(1, 1, 1, 1000000000, 2000000000, 'Thủ Đức, TP.HCM', 'processing', '[DEMO-NHU-CAU-01] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:1'),
(2, 2, 2, 1250000000, 2350000000, 'Quận 7, TP.HCM', 'consulting', '[DEMO-NHU-CAU-02] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:2'),
(3, 3, 3, 1500000000, 2700000000, 'Bình Thạnh, TP.HCM', 'matched', '[DEMO-NHU-CAU-03] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:3'),
(4, 4, 4, 1750000000, 3050000000, 'Quận 1, TP.HCM', 'completed', '[DEMO-NHU-CAU-04] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:4'),
(5, 5, 5, 2000000000, 3400000000, 'Bình Chánh, TP.HCM', 'cancelled', '[DEMO-NHU-CAU-05] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:5'),
(6, 6, 6, 2250000000, 3750000000, 'Dĩ An, Bình Dương', 'processing', '[DEMO-NHU-CAU-06] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:6'),
(7, 7, 1, 2500000000, 4100000000, 'Hải Châu, Đà Nẵng', 'consulting', '[DEMO-NHU-CAU-07] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:7'),
(8, 8, 2, 2750000000, 4450000000, 'Nam Từ Liêm, Hà Nội', 'matched', '[DEMO-NHU-CAU-08] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:8'),
(9, 9, 3, 3000000000, 4800000000, 'Cầu Giấy, Hà Nội', 'completed', '[DEMO-NHU-CAU-09] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:9'),
(10, 10, 4, 3250000000, 5150000000, 'Biên Hòa, Đồng Nai', 'cancelled', '[DEMO-NHU-CAU-10] Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 1, 1, '2026-10-26 16:38:59', '2026-10-26 16:38:59', NULL, 'demo-demand:10'),
(11, 1, 1, 2000, 100000, 'thủ đức', 'consulting', 'càng to càng tốt', 1, 1, '2026-10-27 19:26:36', '2026-10-27 19:26:36', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `customer_interactions`
--

CREATE TABLE `customer_interactions` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `actor_id` bigint UNSIGNED DEFAULT NULL,
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `occurred_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_interactions`
--

INSERT INTO `customer_interactions` (`id`, `customer_id`, `actor_id`, `type`, `summary`, `occurred_at`, `created_at`, `updated_at`) VALUES
(1, 3, 3, 'call', 'Trao đổi nhu cầu và tư vấn bất động sản phù hợp.', '2026-10-18 08:49:11', '2026-10-19 08:49:11', '2026-10-19 08:49:11');

-- --------------------------------------------------------

--
-- Table structure for table `customer_needs`
--

CREATE TABLE `customer_needs` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `broker_id` bigint UNSIGNED DEFAULT NULL,
  `property_type_id` int UNSIGNED DEFAULT NULL,
  `environmental_preferences` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `budget_min` decimal(15,2) NOT NULL DEFAULT '0.00',
  `budget_max` decimal(15,2) NOT NULL DEFAULT '0.00',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_need_locations`
--

CREATE TABLE `customer_need_locations` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_need_id` bigint UNSIGNED NOT NULL,
  `province_id` int UNSIGNED NOT NULL,
  `district_id` int UNSIGNED DEFAULT NULL,
  `ward_id` int UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE `districts` (
  `id` int UNSIGNED NOT NULL,
  `province_id` int UNSIGNED NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `districts`
--

INSERT INTO `districts` (`id`, `province_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 1, 'Quận 1', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 1, 'Quận Bình Thạnh', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(3, 1, 'TP. Thủ Đức', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(4, 1, 'Quận 7', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(5, 2, 'Quận Nam Từ Liêm', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(6, 2, 'Quận Cầu Giấy', '2026-10-15 06:56:15', '2026-10-15 06:56:15');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `property_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint UNSIGNED NOT NULL,
  `invoice_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contract_id` bigint UNSIGNED NOT NULL,
  `issue_date` date NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `paid_at` datetime DEFAULT NULL,
  `email_sent_at` datetime DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `updated_by` bigint UNSIGNED DEFAULT NULL,
  `due_date` date NOT NULL,
  `billing_period_start` date DEFAULT NULL,
  `billing_period_end` date DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `version` int UNSIGNED NOT NULL DEFAULT '1',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancel_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoice_no`, `contract_id`, `issue_date`, `title`, `type`, `amount`, `paid_amount`, `paid_at`, `email_sent_at`, `created_by`, `updated_by`, `due_date`, `billing_period_start`, `billing_period_end`, `status`, `version`, `note`, `cancel_reason`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'QLTT-INV-202609-VHGPR01-01', 9, '2026-09-20', 'Hóa đơn tiền thuê tháng 9', 'RENT', 29000000.00, 29000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-18', NULL, NULL, 1, 1, NULL, NULL, '2026-09-20 06:56:19', '2026-10-15 06:56:19', NULL),
(2, 'QLTT-INV-202609-VHGPR01-02', 4, '2026-09-19', 'Hóa đơn tiền thuê tháng 10', 'RENT', 22000000.00, 22000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-16', NULL, NULL, 1, 1, NULL, NULL, '2026-09-19 06:56:19', '2026-10-15 06:56:19', NULL),
(3, 'QLTT-INV-202610-VHGPR01-01', 5, '2026-10-12', 'Hóa đơn tiền thuê tháng 7', 'RENT', 25000000.00, 25000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-24', NULL, NULL, 1, 1, NULL, NULL, '2026-10-12 06:56:19', '2026-10-15 06:56:19', NULL),
(4, 'QLTT-INV-202609-VHGPR01-03', 2, '2026-09-16', 'Hóa đơn tiền thuê tháng 2', 'RENT', 15000000.00, 15000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-21', NULL, NULL, 1, 1, NULL, NULL, '2026-09-16 06:56:19', '2026-10-15 06:56:19', NULL),
(5, 'QLTT-INV-202610-VHGPR01-02', 3, '2026-10-13', 'Hóa đơn tiền thuê tháng 9', 'RENT', 23000000.00, 23000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-18', NULL, NULL, 1, 1, NULL, NULL, '2026-10-13 06:56:19', '2026-10-15 06:56:19', NULL),
(6, 'QLTT-INV-202609-VHGPR01-04', 2, '2026-09-17', 'Hóa đơn tiền thuê tháng 3', 'RENT', 18000000.00, 18000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-21', NULL, NULL, 1, 1, NULL, NULL, '2026-09-17 06:56:19', '2026-10-15 06:56:19', NULL),
(7, 'QLTT-INV-202609-VHGPR01-05', 7, '2026-09-22', 'Hóa đơn tiền thuê tháng 3', 'RENT', 22000000.00, 22000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-25', NULL, NULL, 1, 1, NULL, NULL, '2026-09-22 06:56:19', '2026-10-15 06:56:19', NULL),
(8, 'QLTT-INV-202609-VHGPR01-06', 6, '2026-09-19', 'Hóa đơn tiền thuê tháng 3', 'RENT', 20000000.00, 20000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-18', NULL, NULL, 1, 1, NULL, NULL, '2026-09-19 06:56:19', '2026-10-15 06:56:19', NULL),
(9, 'QLTT-INV-202609-VHGPR01-07', 11, '2026-09-18', 'Hóa đơn tiền thuê tháng 1', 'RENT', 24000000.00, 24000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-18', NULL, NULL, 1, 1, NULL, NULL, '2026-09-18 06:56:19', '2026-10-15 06:56:19', NULL),
(10, 'QLTT-INV-202609-VHGPR01-08', 15, '2026-09-26', 'Hóa đơn tiền thuê tháng 1', 'RENT', 19000000.00, 19000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-17', NULL, NULL, 1, 1, NULL, NULL, '2026-09-26 06:56:19', '2026-10-15 06:56:19', NULL),
(11, 'QLTT-INV-202609-VHGPR01-09', 13, '2026-09-22', 'Hóa đơn tiền thuê tháng 12', 'RENT', 27000000.00, 27000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-25', NULL, NULL, 1, 1, NULL, NULL, '2026-09-22 06:56:19', '2026-10-15 06:56:19', NULL),
(12, 'QLTT-INV-202610-VHGPR01-03', 11, '2026-10-03', 'Hóa đơn tiền thuê tháng 7', 'RENT', 27000000.00, 27000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-18', NULL, NULL, 1, 1, NULL, NULL, '2026-10-03 06:56:19', '2026-10-15 06:56:19', NULL),
(13, 'QLTT-INV-202609-VHGPR01-10', 13, '2026-09-27', 'Hóa đơn tiền thuê tháng 2', 'RENT', 24000000.00, 24000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-17', NULL, NULL, 1, 1, NULL, NULL, '2026-09-27 06:56:19', '2026-10-15 06:56:19', NULL),
(14, 'QLTT-INV-202609-VHGPR01-11', 13, '2026-09-25', 'Hóa đơn tiền thuê tháng 9', 'RENT', 17000000.00, 17000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-20', NULL, NULL, 1, 1, NULL, NULL, '2026-09-25 06:56:19', '2026-10-15 06:56:19', NULL),
(15, 'QLTT-INV-202609-VHGPR01-12', 12, '2026-09-15', 'Hóa đơn tiền thuê tháng 1', 'RENT', 24000000.00, 24000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-23', NULL, NULL, 1, 1, NULL, NULL, '2026-09-15 06:56:19', '2026-10-15 06:56:19', NULL),
(16, 'QLTT-INV-202609-VHGPR01-13', 11, '2026-09-23', 'Hóa đơn tiền thuê tháng 8', 'RENT', 30000000.00, 30000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-16', NULL, NULL, 1, 1, NULL, NULL, '2026-09-23 06:56:19', '2026-10-15 06:56:19', NULL),
(17, 'QLTT-INV-202610-VHGPR01-04', 6, '2026-10-03', 'Hóa đơn tiền thuê tháng 3', 'RENT', 25000000.00, 25000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-21', NULL, NULL, 1, 1, NULL, NULL, '2026-10-03 06:56:19', '2026-10-15 06:56:19', NULL),
(18, 'QLTT-INV-202610-VHGPR01-05', 1, '2026-10-05', 'Hóa đơn tiền thuê tháng 1', 'RENT', 22000000.00, 22000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-20', NULL, NULL, 1, 1, NULL, NULL, '2026-10-05 06:56:19', '2026-10-15 06:56:19', NULL),
(19, 'QLTT-INV-202609-VHGPR01-14', 3, '2026-09-19', 'Hóa đơn tiền thuê tháng 11', 'RENT', 23000000.00, 23000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-17', NULL, NULL, 1, 1, NULL, NULL, '2026-09-19 06:56:19', '2026-10-15 06:56:19', NULL),
(20, 'QLTT-INV-202610-VHGPR01-06', 6, '2026-10-03', 'Hóa đơn tiền thuê tháng 12', 'RENT', 20000000.00, 20000000.00, '2026-10-15 06:56:19', NULL, NULL, NULL, '2026-10-21', NULL, NULL, 1, 1, NULL, NULL, '2026-10-03 06:56:19', '2026-10-15 06:56:19', NULL),
(21, 'QLTT-INV-202610-A101-01', 16, '2026-10-18', 'Hóa đơn tổng hợp dịch vụ & tiền thuê tháng 10/2026', 'rent', 16700000.00, 16700000.00, '2026-10-20 14:30:00', NULL, 2, NULL, '2026-10-28', '2026-10-01', '2026-10-31', 1, 1, '[Dữ liệu mẫu] Hóa đơn trình diễn chuẩn Hình 46', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(22, 'QLTT-INV-202607-A101-DEP1', 16, '2026-07-23', 'Tiền đặt cọc hợp đồng thuê SEED-HD-A101', 'deposit', 30000000.00, 30000000.00, '2026-07-24 10:00:00', NULL, 2, NULL, '2026-07-26', NULL, NULL, 1, 1, '[Dữ liệu mẫu] Tiền cọc đã thanh toán đủ', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(23, 'QLTT-INV-202610-A101-DEP2', 16, '2026-10-23', 'Thu bổ sung tiền cọc bảo đảm tài sản', 'deposit', 10000000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-28', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Tiền cọc chưa thanh toán', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(24, 'QLTT-INV-202608-A101-02', 16, '2026-08-01', 'Tiền thuê tháng 08/2026 - SEED-HD-A101', 'rent', 15000000.00, 15000000.00, '2026-08-04 09:15:00', NULL, 2, NULL, '2026-08-08', '2026-08-01', '2026-08-31', 1, 1, '[Dữ liệu mẫu] Đã thanh toán đúng hạn', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(25, 'QLTT-INV-202609-A101-03', 16, '2026-09-01', 'Tiền thuê tháng 09/2026 - SEED-HD-A101', 'rent', 15000000.00, 15000000.00, '2026-09-04 09:15:00', NULL, 2, NULL, '2026-09-08', '2026-09-01', '2026-09-30', 1, 1, '[Dữ liệu mẫu] Đã thanh toán đúng hạn', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(26, 'QLTT-INV-202610-A101-UF16', 16, '2026-10-23', 'Phí dịch vụ & tiện ích tháng 10/2026', 'service', 1200000.00, 0.00, NULL, NULL, 2, NULL, '2026-11-07', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Chưa đến hạn thanh toán (còn 15 ngày)', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(27, 'QLTT-INV-202610-A101-UN16', 16, '2026-10-18', 'Tiền điện & nước tháng 10/2026', 'service', 850000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-25', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Sắp đến hạn thanh toán (còn 2 ngày)', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(28, 'QLTT-INV-202609-A101-OD16', 16, '2026-09-28', 'Khoản thu phụ phí tháng trước (Quá hạn)', 'other', 500000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-13', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Quá hạn thanh toán 10 ngày', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(29, 'QLTT-INV-202610-A101-P116', 16, '2026-10-20', 'Tiền thuê & dịch vụ tổng hợp kỳ hiện tại', 'rent', 15000000.00, 5000000.00, NULL, NULL, 2, NULL, '2026-10-30', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Khách đã trả trước 5.000.000đ, còn nợ 10.000.000đ', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(30, 'QLTT-INV-202609-A101-P216', 16, '2026-10-03', 'Tiền thuê kỳ trước nợ đọng', 'rent', 12000000.00, 4000000.00, NULL, NULL, 2, NULL, '2026-10-18', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Trả 4.000.000đ, quá hạn thanh toán phần còn lại 5 ngày', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(31, 'QLTT-INV-202610-A101-CAN16', 16, '2026-10-13', 'Hóa đơn lập nhầm thông tin dịch vụ', 'service', 2000000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-21', NULL, NULL, 3, 1, '[Dữ liệu mẫu] Hóa đơn đã bị hủy', 'Nhân viên nhập sai chỉ số công tơ điện nước, lập lại hóa đơn mới theo yêu cầu khách.', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(32, 'QLTT-INV-202607-VHGPR01-DEP1', 1, '2026-07-23', 'Tiền đặt cọc hợp đồng thuê HD-2023-0001', 'deposit', 30000000.00, 30000000.00, '2026-07-24 10:00:00', NULL, 2, NULL, '2026-07-26', NULL, NULL, 1, 1, '[Dữ liệu mẫu] Tiền cọc đã thanh toán đủ', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(33, 'QLTT-INV-202610-VHGPR01-DEP2', 1, '2026-10-23', 'Thu bổ sung tiền cọc bảo đảm tài sản', 'deposit', 10000000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-28', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Tiền cọc chưa thanh toán', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(34, 'QLTT-INV-202608-VHGPR01-04', 1, '2026-08-01', 'Tiền thuê tháng 08/2026 - HD-2023-0001', 'rent', 28000000.00, 28000000.00, '2026-08-04 09:15:00', NULL, 2, NULL, '2026-08-08', '2026-08-01', '2026-08-31', 1, 1, '[Dữ liệu mẫu] Đã thanh toán đúng hạn', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(35, 'QLTT-INV-202610-VHGPR01-UF1', 1, '2026-10-23', 'Phí dịch vụ & tiện ích tháng 10/2026', 'service', 1200000.00, 0.00, NULL, NULL, 2, NULL, '2026-11-07', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Chưa đến hạn thanh toán (còn 15 ngày)', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(36, 'QLTT-INV-202610-VHGPR01-UN1', 1, '2026-10-18', 'Tiền điện & nước tháng 10/2026', 'service', 850000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-25', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Sắp đến hạn thanh toán (còn 2 ngày)', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(37, 'QLTT-INV-202609-VHGPR01-OD1', 1, '2026-09-28', 'Khoản thu phụ phí tháng trước (Quá hạn)', 'other', 500000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-13', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Quá hạn thanh toán 10 ngày', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(38, 'QLTT-INV-202610-VHGPR01-P11', 1, '2026-10-20', 'Tiền thuê & dịch vụ tổng hợp kỳ hiện tại', 'rent', 15000000.00, 5000000.00, NULL, NULL, 2, NULL, '2026-10-30', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Khách đã trả trước 5.000.000đ, còn nợ 10.000.000đ', NULL, '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(39, 'QLTT-INV-202609-VHGPR01-P21', 1, '2026-10-03', 'Tiền thuê kỳ trước nợ đọng', 'rent', 12000000.00, 4000000.00, NULL, NULL, 2, NULL, '2026-10-18', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Trả 4.000.000đ, quá hạn thanh toán phần còn lại 5 ngày', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(40, 'QLTT-INV-202610-VHGPR01-CAN1', 1, '2026-10-13', 'Hóa đơn lập nhầm thông tin dịch vụ', 'service', 2000000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-21', NULL, NULL, 3, 1, '[Dữ liệu mẫu] Hóa đơn đã bị hủy', 'Nhân viên nhập sai chỉ số công tơ điện nước, lập lại hóa đơn mới theo yêu cầu khách.', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(41, 'QLTT-INV-202608-VHGPR01-06', 2, '2026-08-01', 'Tiền thuê tháng 08/2026 - HD-2023-0002', 'rent', 22000000.00, 22000000.00, '2026-08-04 09:15:00', NULL, 2, NULL, '2026-08-08', '2026-08-01', '2026-08-31', 1, 1, '[Dữ liệu mẫu] Đã thanh toán đúng hạn', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(42, 'QLTT-INV-202610-VHGPR01-UF2', 2, '2026-10-23', 'Phí dịch vụ & tiện ích tháng 10/2026', 'service', 1200000.00, 0.00, NULL, NULL, 2, NULL, '2026-11-07', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Chưa đến hạn thanh toán (còn 15 ngày)', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(43, 'QLTT-INV-202610-VHGPR01-UN2', 2, '2026-10-18', 'Tiền điện & nước tháng 10/2026', 'service', 850000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-25', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Sắp đến hạn thanh toán (còn 2 ngày)', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(44, 'QLTT-INV-202609-VHGPR01-OD2', 2, '2026-09-28', 'Khoản thu phụ phí tháng trước (Quá hạn)', 'other', 500000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-13', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Quá hạn thanh toán 10 ngày', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(45, 'QLTT-INV-202610-VHGPR01-P12', 2, '2026-10-20', 'Tiền thuê & dịch vụ tổng hợp kỳ hiện tại', 'rent', 15000000.00, 5000000.00, NULL, NULL, 2, NULL, '2026-10-30', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Khách đã trả trước 5.000.000đ, còn nợ 10.000.000đ', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(46, 'QLTT-INV-202609-VHGPR01-P22', 2, '2026-10-03', 'Tiền thuê kỳ trước nợ đọng', 'rent', 12000000.00, 4000000.00, NULL, NULL, 2, NULL, '2026-10-18', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Trả 4.000.000đ, quá hạn thanh toán phần còn lại 5 ngày', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(47, 'QLTT-INV-202610-VHGPR01-CAN2', 2, '2026-10-13', 'Hóa đơn lập nhầm thông tin dịch vụ', 'service', 2000000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-21', NULL, NULL, 3, 1, '[Dữ liệu mẫu] Hóa đơn đã bị hủy', 'Nhân viên nhập sai chỉ số công tơ điện nước, lập lại hóa đơn mới theo yêu cầu khách.', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(48, 'QLTT-INV-202608-VHGPR01-08', 3, '2026-08-01', 'Tiền thuê tháng 08/2026 - HD-2023-0003', 'rent', 17000000.00, 17000000.00, '2026-08-04 09:15:00', NULL, 2, NULL, '2026-08-08', '2026-08-01', '2026-08-31', 1, 1, '[Dữ liệu mẫu] Đã thanh toán đúng hạn', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(49, 'QLTT-INV-202610-VHGPR01-UF3', 3, '2026-10-23', 'Phí dịch vụ & tiện ích tháng 10/2026', 'service', 1200000.00, 0.00, NULL, NULL, 2, NULL, '2026-11-07', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Chưa đến hạn thanh toán (còn 15 ngày)', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(50, 'QLTT-INV-202610-VHGPR01-UN3', 3, '2026-10-18', 'Tiền điện & nước tháng 10/2026', 'service', 850000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-25', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Sắp đến hạn thanh toán (còn 2 ngày)', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(51, 'QLTT-INV-202609-VHGPR01-OD3', 3, '2026-09-28', 'Khoản thu phụ phí tháng trước (Quá hạn)', 'other', 500000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-13', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Quá hạn thanh toán 10 ngày', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(52, 'QLTT-INV-202610-VHGPR01-P13', 3, '2026-10-20', 'Tiền thuê & dịch vụ tổng hợp kỳ hiện tại', 'rent', 15000000.00, 5000000.00, NULL, NULL, 2, NULL, '2026-10-30', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Khách đã trả trước 5.000.000đ, còn nợ 10.000.000đ', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(53, 'QLTT-INV-202609-VHGPR01-P23', 3, '2026-10-03', 'Tiền thuê kỳ trước nợ đọng', 'rent', 12000000.00, 4000000.00, NULL, NULL, 2, NULL, '2026-10-18', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Trả 4.000.000đ, quá hạn thanh toán phần còn lại 5 ngày', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(54, 'QLTT-INV-202610-VHGPR01-CAN3', 3, '2026-10-13', 'Hóa đơn lập nhầm thông tin dịch vụ', 'service', 2000000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-21', NULL, NULL, 3, 1, '[Dữ liệu mẫu] Hóa đơn đã bị hủy', 'Nhân viên nhập sai chỉ số công tơ điện nước, lập lại hóa đơn mới theo yêu cầu khách.', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(55, 'QLTT-INV-202608-VHGPR01-10', 4, '2026-08-01', 'Tiền thuê tháng 08/2026 - HD-2023-0004', 'rent', 22000000.00, 22000000.00, '2026-08-04 09:15:00', NULL, 2, NULL, '2026-08-08', '2026-08-01', '2026-08-31', 1, 1, '[Dữ liệu mẫu] Đã thanh toán đúng hạn', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(56, 'QLTT-INV-202610-VHGPR01-UF4', 4, '2026-10-23', 'Phí dịch vụ & tiện ích tháng 10/2026', 'service', 1200000.00, 0.00, NULL, NULL, 2, NULL, '2026-11-07', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Chưa đến hạn thanh toán (còn 15 ngày)', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(57, 'QLTT-INV-202610-VHGPR01-UN4', 4, '2026-10-18', 'Tiền điện & nước tháng 10/2026', 'service', 850000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-25', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Sắp đến hạn thanh toán (còn 2 ngày)', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(58, 'QLTT-INV-202609-VHGPR01-OD4', 4, '2026-09-28', 'Khoản thu phụ phí tháng trước (Quá hạn)', 'other', 500000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-13', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Quá hạn thanh toán 10 ngày', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(59, 'QLTT-INV-202610-VHGPR01-P14', 4, '2026-10-20', 'Tiền thuê & dịch vụ tổng hợp kỳ hiện tại', 'rent', 15000000.00, 5000000.00, NULL, NULL, 2, NULL, '2026-10-30', NULL, NULL, 0, 1, '[Dữ liệu mẫu] Khách đã trả trước 5.000.000đ, còn nợ 10.000.000đ', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(60, 'QLTT-INV-202609-VHGPR01-P24', 4, '2026-10-03', 'Tiền thuê kỳ trước nợ đọng', 'rent', 12000000.00, 4000000.00, NULL, NULL, 2, NULL, '2026-10-18', NULL, NULL, 2, 1, '[Dữ liệu mẫu] Trả 4.000.000đ, quá hạn thanh toán phần còn lại 5 ngày', NULL, '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(61, 'QLTT-INV-202610-VHGPR01-CAN4', 4, '2026-10-13', 'Hóa đơn lập nhầm thông tin dịch vụ', 'service', 2000000.00, 0.00, NULL, NULL, 2, NULL, '2026-10-21', NULL, NULL, 3, 1, '[Dữ liệu mẫu] Hóa đơn đã bị hủy', 'Nhân viên nhập sai chỉ số công tơ điện nước, lập lại hóa đơn mới theo yêu cầu khách.', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(62, 'QLTT-INV-202609-VHGPR01-15', 1, '2026-10-23', 'Tiền thuê tháng 09/2026 - HD-2023-0001', 'rent', 28000000.00, 0.00, NULL, NULL, NULL, NULL, '2026-09-06', '2026-09-01', '2026-09-30', 2, 1, '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống', NULL, '2026-10-23 07:24:06', '2026-10-23 07:24:49', NULL),
(63, 'QLTT-INV-202610-VHGPR01-07', 1, '2026-10-23', 'Tiền thuê tháng 10/2026 - HD-2023-0001', 'rent', 28000000.00, 0.00, NULL, NULL, NULL, NULL, '2026-10-06', '2026-10-01', '2026-10-31', 2, 1, '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:49', NULL),
(64, 'QLTT-INV-202609-VHGPR01-16', 2, '2026-10-23', 'Tiền thuê tháng 09/2026 - HD-2023-0002', 'rent', 22000000.00, 0.00, NULL, NULL, NULL, NULL, '2026-09-06', '2026-09-01', '2026-09-30', 2, 1, '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:49', NULL),
(65, 'QLTT-INV-202610-VHGPR01-08', 2, '2026-10-23', 'Tiền thuê tháng 10/2026 - HD-2023-0002', 'rent', 22000000.00, 0.00, NULL, NULL, NULL, NULL, '2026-10-06', '2026-10-01', '2026-10-31', 2, 1, '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:49', NULL),
(66, 'QLTT-INV-202609-VHGPR01-17', 3, '2026-10-23', 'Tiền thuê tháng 09/2026 - HD-2023-0003', 'rent', 17000000.00, 0.00, NULL, NULL, NULL, NULL, '2026-09-06', '2026-09-01', '2026-09-30', 2, 1, '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:49', NULL),
(67, 'QLTT-INV-202610-VHGPR01-09', 3, '2026-10-23', 'Tiền thuê tháng 10/2026 - HD-2023-0003', 'rent', 17000000.00, 0.00, NULL, NULL, NULL, NULL, '2026-10-06', '2026-10-01', '2026-10-31', 2, 1, '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:49', NULL),
(68, 'QLTT-INV-202609-VHGPR01-18', 4, '2026-10-23', 'Tiền thuê tháng 09/2026 - HD-2023-0004', 'rent', 22000000.00, 0.00, NULL, NULL, NULL, NULL, '2026-09-06', '2026-09-01', '2026-09-30', 2, 1, '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:49', NULL),
(69, 'QLTT-INV-202610-VHGPR01-10', 4, '2026-10-23', 'Tiền thuê tháng 10/2026 - HD-2023-0004', 'rent', 22000000.00, 0.00, NULL, NULL, NULL, NULL, '2026-10-06', '2026-10-01', '2026-10-31', 2, 1, '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:49', NULL),
(70, 'QLTT-INV-202610-VHGPR01-11', 13, '2026-10-23', 'Tiền thuê tháng 9', 'service', 10000000.00, 0.00, NULL, NULL, 1, NULL, '2026-10-28', '2026-10-23', '2026-11-22', 0, 1, 'êrwerw', NULL, '2026-10-23 08:15:29', '2026-10-23 08:15:29', NULL),
(73, 'SEED-INV-202610-LM81-402', 21, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.402 Tòa Landmark 81', 'rent', 25000000.00, 25000000.00, '2026-10-23 00:00:00', NULL, 2, 2, '2026-10-24', '2026-10-01', '2026-10-31', 1, 1, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(74, 'SEED-INV-202610-VHCP-1205', 22, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.1205 Vinhomes Central Park', 'rent', 18000000.00, 18000000.00, '2026-10-22 00:00:00', NULL, 2, 2, '2026-10-22', '2026-10-01', '2026-10-31', 1, 1, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(75, 'SEED-INV-202610-MTD-A108', 23, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - Căn A1-08 Masteri Thảo Điền', 'rent', 16000000.00, 0.00, NULL, NULL, 2, 2, '2026-10-18', '2026-10-01', '2026-10-31', 2, 1, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(76, 'SEED-INV-202610-SRC-704', 24, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.704 Sunrise City Quận 7', 'rent', 20000000.00, 5000000.00, NULL, NULL, 2, 2, '2026-10-20', '2026-10-01', '2026-10-31', 2, 1, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(77, 'SEED-INV-202610-MAP-1802', 25, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.1802 Masteri An Phú', 'rent', 14000000.00, 6000000.00, NULL, NULL, 2, 2, '2026-11-02', '2026-10-01', '2026-10-31', 0, 1, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(78, 'SEED-INV-202610-BTP-303', 26, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.303 Botanica Premier', 'rent', 12500000.00, 5000000.00, NULL, NULL, 2, 2, '2026-10-31', '2026-10-01', '2026-10-31', 0, 1, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', NULL),
(79, 'SEED-INV-202610-TSA-901', 27, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.901 The Sun Avenue', 'rent', 13000000.00, 0.00, NULL, NULL, 2, 2, '2026-11-01', '2026-10-01', '2026-10-31', 0, 1, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', NULL),
(80, 'SEED-INV-202610-FEV-1508', 28, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.1508 Feliz En Vista', 'rent', 22000000.00, 0.00, NULL, NULL, 2, 2, '2026-11-05', '2026-10-01', '2026-10-31', 0, 1, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', NULL),
(81, 'SEED-INV-202610-GV-502', 29, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.502 The Gold View', 'rent', 11000000.00, 0.00, NULL, NULL, 2, 2, '2026-11-07', '2026-10-01', '2026-10-31', 0, 1, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', NULL),
(82, 'SEED-INV-202610-GWT-1102', 30, '2026-10-01', 'Tiền thuê nhà tháng 10/2026 - P.1102 Gateway Thảo Điền', 'rent', 30000000.00, 30000000.00, '2026-10-24 00:00:00', NULL, 2, 2, '2026-10-25', '2026-10-01', '2026-10-31', 1, 1, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` bigint UNSIGNED NOT NULL,
  `invoice_id` bigint UNSIGNED NOT NULL,
  `item_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) DEFAULT '1.00',
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `item_name`, `quantity`, `unit_price`, `total_price`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 21, 'Tiền thuê nhà', 1.00, 15000000.00, 15000000.00, 'Kỳ thanh toán 01/10 đến 31/10/2026', 1, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(2, 21, 'Phí dịch vụ', 1.00, 800000.00, 800000.00, 'Phí quản lý vận hành tòa nhà tháng 10/2026', 2, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(3, 21, 'Điện sinh hoạt', 120.00, 3500.00, 420000.00, '120 kWh x 3.500đ/kWh', 3, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(4, 21, 'Nước sinh hoạt', 10.00, 15000.00, 150000.00, '10 m3 x 15.000đ/m3', 4, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(5, 21, 'Internet cáp quang', 1.00, 330000.00, 330000.00, 'Gói cước băng thông rộng 150Mbps', 5, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(6, 22, 'Tiền đặt cọc giữ chỗ & bảo đảm hợp đồng', 1.00, 30000000.00, 30000000.00, '2 tháng tiền nhà', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(7, 23, 'Tiền cọc bổ sung bảo đảm trang thiết bị', 1.00, 10000000.00, 10000000.00, 'Cọc thiết bị điện tử mới', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(8, 24, 'Tiền thuê nhà tháng 08/2026', 1.00, 15000000.00, 15000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(9, 25, 'Tiền thuê nhà tháng 09/2026', 1.00, 15000000.00, 15000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(10, 26, 'Phí bảo trì & vệ sinh chung', 1.00, 1200000.00, 1200000.00, 'Định kỳ tháng', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(11, 27, 'Tiền điện sinh hoạt', 150.00, 3500.00, 525000.00, '150 kWh', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(12, 27, 'Tiền nước sinh hoạt', 20.00, 16250.00, 325000.00, '20 m3', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(13, 28, 'Phí thay khóa cửa thông minh theo yêu cầu', 1.00, 500000.00, 500000.00, 'Khóa vân tay mã số', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(14, 29, 'Tiền thuê căn hộ', 1.00, 15000000.00, 15000000.00, NULL, 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(15, 30, 'Tiền thuê phòng', 1.00, 12000000.00, 12000000.00, NULL, 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(16, 31, 'Phí dịch vụ đặc biệt (nhập nhầm)', 1.00, 2000000.00, 2000000.00, NULL, 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(17, 32, 'Tiền đặt cọc giữ chỗ & bảo đảm hợp đồng', 1.00, 30000000.00, 30000000.00, '2 tháng tiền nhà', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(18, 33, 'Tiền cọc bổ sung bảo đảm trang thiết bị', 1.00, 10000000.00, 10000000.00, 'Cọc thiết bị điện tử mới', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(19, 34, 'Tiền thuê nhà tháng 08/2026', 1.00, 28000000.00, 28000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(20, 7, 'Tiền thuê nhà tháng 09/2026', 1.00, 22000000.00, 22000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(21, 35, 'Phí bảo trì & vệ sinh chung', 1.00, 1200000.00, 1200000.00, 'Định kỳ tháng', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(22, 36, 'Tiền điện sinh hoạt', 150.00, 3500.00, 525000.00, '150 kWh', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(23, 36, 'Tiền nước sinh hoạt', 20.00, 16250.00, 325000.00, '20 m3', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(24, 37, 'Phí thay khóa cửa thông minh theo yêu cầu', 1.00, 500000.00, 500000.00, 'Khóa vân tay mã số', 0, '2026-10-23 07:20:34', '2026-10-23 07:20:34'),
(25, 38, 'Tiền thuê căn hộ', 1.00, 15000000.00, 15000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(26, 39, 'Tiền thuê phòng', 1.00, 12000000.00, 12000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(27, 40, 'Phí dịch vụ đặc biệt (nhập nhầm)', 1.00, 2000000.00, 2000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(28, 41, 'Tiền thuê nhà tháng 08/2026', 1.00, 22000000.00, 22000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(29, 9, 'Tiền thuê nhà tháng 09/2026', 1.00, 24000000.00, 24000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(30, 42, 'Phí bảo trì & vệ sinh chung', 1.00, 1200000.00, 1200000.00, 'Định kỳ tháng', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(31, 43, 'Tiền điện sinh hoạt', 150.00, 3500.00, 525000.00, '150 kWh', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(32, 43, 'Tiền nước sinh hoạt', 20.00, 16250.00, 325000.00, '20 m3', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(33, 44, 'Phí thay khóa cửa thông minh theo yêu cầu', 1.00, 500000.00, 500000.00, 'Khóa vân tay mã số', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(34, 45, 'Tiền thuê căn hộ', 1.00, 15000000.00, 15000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(35, 46, 'Tiền thuê phòng', 1.00, 12000000.00, 12000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(36, 47, 'Phí dịch vụ đặc biệt (nhập nhầm)', 1.00, 2000000.00, 2000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(37, 48, 'Tiền thuê nhà tháng 08/2026', 1.00, 17000000.00, 17000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(38, 11, 'Tiền thuê nhà tháng 09/2026', 1.00, 27000000.00, 27000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(39, 49, 'Phí bảo trì & vệ sinh chung', 1.00, 1200000.00, 1200000.00, 'Định kỳ tháng', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(40, 50, 'Tiền điện sinh hoạt', 150.00, 3500.00, 525000.00, '150 kWh', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(41, 50, 'Tiền nước sinh hoạt', 20.00, 16250.00, 325000.00, '20 m3', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(42, 51, 'Phí thay khóa cửa thông minh theo yêu cầu', 1.00, 500000.00, 500000.00, 'Khóa vân tay mã số', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(43, 52, 'Tiền thuê căn hộ', 1.00, 15000000.00, 15000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(44, 53, 'Tiền thuê phòng', 1.00, 12000000.00, 12000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(45, 54, 'Phí dịch vụ đặc biệt (nhập nhầm)', 1.00, 2000000.00, 2000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(46, 55, 'Tiền thuê nhà tháng 08/2026', 1.00, 22000000.00, 22000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(47, 14, 'Tiền thuê nhà tháng 09/2026', 1.00, 17000000.00, 17000000.00, '1 tháng thuê', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(48, 56, 'Phí bảo trì & vệ sinh chung', 1.00, 1200000.00, 1200000.00, 'Định kỳ tháng', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(49, 57, 'Tiền điện sinh hoạt', 150.00, 3500.00, 525000.00, '150 kWh', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(50, 57, 'Tiền nước sinh hoạt', 20.00, 16250.00, 325000.00, '20 m3', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(51, 58, 'Phí thay khóa cửa thông minh theo yêu cầu', 1.00, 500000.00, 500000.00, 'Khóa vân tay mã số', 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(52, 59, 'Tiền thuê căn hộ', 1.00, 15000000.00, 15000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(53, 60, 'Tiền thuê phòng', 1.00, 12000000.00, 12000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(54, 61, 'Phí dịch vụ đặc biệt (nhập nhầm)', 1.00, 2000000.00, 2000000.00, NULL, 0, '2026-10-23 07:20:35', '2026-10-23 07:20:35'),
(55, 62, 'Tiền thuê nhà', 1.00, 28000000.00, 28000000.00, 'Tiền thuê 1 tháng (từ 01/09/2026 đến 30/09/2026)', 1, '2026-10-23 07:24:06', '2026-10-23 07:24:06'),
(56, 63, 'Tiền thuê nhà', 1.00, 28000000.00, 28000000.00, 'Tiền thuê 1 tháng (từ 01/10/2026 đến 31/10/2026)', 1, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
(57, 64, 'Tiền thuê nhà', 1.00, 22000000.00, 22000000.00, 'Tiền thuê 1 tháng (từ 01/09/2026 đến 30/09/2026)', 1, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
(58, 65, 'Tiền thuê nhà', 1.00, 22000000.00, 22000000.00, 'Tiền thuê 1 tháng (từ 01/10/2026 đến 31/10/2026)', 1, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
(59, 66, 'Tiền thuê nhà', 1.00, 17000000.00, 17000000.00, 'Tiền thuê 1 tháng (từ 01/09/2026 đến 30/09/2026)', 1, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
(60, 67, 'Tiền thuê nhà', 1.00, 17000000.00, 17000000.00, 'Tiền thuê 1 tháng (từ 01/10/2026 đến 31/10/2026)', 1, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
(61, 68, 'Tiền thuê nhà', 1.00, 22000000.00, 22000000.00, 'Tiền thuê 1 tháng (từ 01/09/2026 đến 30/09/2026)', 1, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
(62, 69, 'Tiền thuê nhà', 1.00, 22000000.00, 22000000.00, 'Tiền thuê 1 tháng (từ 01/10/2026 đến 31/10/2026)', 1, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
(63, 70, 'Tiền thuê nhà', 1.00, 10000000.00, 10000000.00, '1 tháng', 1, '2026-10-23 08:15:29', '2026-10-23 08:15:29'),
(65, 73, 'Tiền thuê nhà kỳ 10/2026', 1.00, 25000000.00, 25000000.00, 'Tiền thuê nhà kỳ 10/2026 - P.402 Tòa Landmark 81', 1, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(66, 74, 'Tiền thuê nhà kỳ 10/2026', 1.00, 18000000.00, 18000000.00, 'Tiền thuê nhà kỳ 10/2026 - P.1205 Vinhomes Central Park', 1, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(67, 75, 'Tiền thuê nhà kỳ 10/2026', 1.00, 16000000.00, 16000000.00, 'Tiền thuê nhà kỳ 10/2026 - Căn A1-08 Masteri Thảo Điền', 1, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(68, 76, 'Tiền thuê nhà kỳ 10/2026', 1.00, 20000000.00, 20000000.00, 'Tiền thuê nhà kỳ 10/2026 - P.704 Sunrise City Quận 7', 1, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(69, 77, 'Tiền thuê nhà kỳ 10/2026', 1.00, 14000000.00, 14000000.00, 'Tiền thuê nhà kỳ 10/2026 - P.1802 Masteri An Phú', 1, '2026-10-26 13:51:29', '2026-10-26 13:51:29'),
(70, 78, 'Tiền thuê nhà kỳ 10/2026', 1.00, 12500000.00, 12500000.00, 'Tiền thuê nhà kỳ 10/2026 - P.303 Botanica Premier', 1, '2026-10-26 13:51:30', '2026-10-26 13:51:30'),
(71, 79, 'Tiền thuê nhà kỳ 10/2026', 1.00, 13000000.00, 13000000.00, 'Tiền thuê nhà kỳ 10/2026 - P.901 The Sun Avenue', 1, '2026-10-26 13:51:30', '2026-10-26 13:51:30'),
(72, 80, 'Tiền thuê nhà kỳ 10/2026', 1.00, 22000000.00, 22000000.00, 'Tiền thuê nhà kỳ 10/2026 - P.1508 Feliz En Vista', 1, '2026-10-26 13:51:30', '2026-10-26 13:51:30'),
(73, 81, 'Tiền thuê nhà kỳ 10/2026', 1.00, 11000000.00, 11000000.00, 'Tiền thuê nhà kỳ 10/2026 - P.502 The Gold View', 1, '2026-10-26 13:51:30', '2026-10-26 13:51:30'),
(74, 82, 'Tiền thuê nhà kỳ 10/2026', 1.00, 30000000.00, 30000000.00, 'Tiền thuê nhà kỳ 10/2026 - P.1102 Gateway Thảo Điền', 1, '2026-10-26 13:51:30', '2026-10-26 13:51:30');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_requests`
--

CREATE TABLE `maintenance_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `property_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `priority` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `cost` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `maintenance_requests`
--

INSERT INTO `maintenance_requests` (`id`, `property_id`, `user_id`, `title`, `description`, `status`, `priority`, `cost`, `created_at`, `updated_at`) VALUES
(1, 1, 5, 'Bảo trì hệ thống 1', 'Chi tiết bảo trì 1', 'IN_PROGRESS', 'MEDIUM', NULL, '2026-10-06 06:56:19', '2026-10-15 06:56:19'),
(2, 1, 5, 'Bảo trì hệ thống 2', 'Chi tiết bảo trì 2', 'IN_PROGRESS', 'MEDIUM', NULL, '2026-09-16 06:56:19', '2026-10-15 06:56:19'),
(3, 1, 5, 'Bảo trì hệ thống 3', 'Chi tiết bảo trì 3', 'IN_PROGRESS', 'MEDIUM', NULL, '2026-09-25 06:56:19', '2026-10-15 06:56:19'),
(4, 1, 5, 'Bảo trì hệ thống 4', 'Chi tiết bảo trì 4', 'COMPLETED', 'MEDIUM', NULL, '2026-10-07 06:56:19', '2026-10-15 06:56:19'),
(5, 1, 5, 'Bảo trì hệ thống 5', 'Chi tiết bảo trì 5', 'COMPLETED', 'MEDIUM', NULL, '2026-09-23 06:56:19', '2026-10-15 06:56:19'),
(6, 1, 5, 'Bảo trì hệ thống 6', 'Chi tiết bảo trì 6', 'COMPLETED', 'MEDIUM', NULL, '2026-09-17 06:56:19', '2026-10-15 06:56:19'),
(7, 1, 5, 'Bảo trì hệ thống 7', 'Chi tiết bảo trì 7', 'COMPLETED', 'MEDIUM', NULL, '2026-09-18 06:56:19', '2026-10-15 06:56:19'),
(8, 1, 5, 'Bảo trì hệ thống 8', 'Chi tiết bảo trì 8', 'COMPLETED', 'MEDIUM', NULL, '2026-10-07 06:56:19', '2026-10-15 06:56:19');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000001_create_roles_table', 1),
(2, '0001_01_01_000002_create_permissions_table', 1),
(3, '0001_01_01_000003_create_role_permissions_table', 1),
(4, '0001_01_01_000004_create_users_table', 1),
(5, '0001_01_01_000005_create_password_reset_tokens_table', 1),
(6, '0001_01_01_000006_create_sessions_table', 1),
(7, '0001_01_01_000007_create_cache_table', 1),
(8, '0001_01_01_000008_create_cache_locks_table', 1),
(9, '0001_01_01_000009_create_jobs_table', 1),
(10, '0001_01_01_000010_create_job_batches_table', 1),
(11, '0001_01_01_000011_create_failed_jobs_table', 1),
(12, '2026_09_30_000001_create_provinces_table', 1),
(13, '2026_09_30_000002_create_districts_table', 1),
(14, '2026_09_30_000003_create_wards_table', 1),
(15, '2026_09_30_000004_create_property_types_table', 1),
(16, '2026_09_30_000005_create_properties_table', 1),
(17, '2026_09_30_000006_create_property_images_table', 1),
(18, '2026_09_30_000007_create_favorites_table', 1),
(19, '2026_09_30_000008_create_appointments_table', 1),
(20, '2026_09_30_000009_create_customer_needs_table', 1),
(21, '2026_09_30_000010_create_customer_need_locations_table', 1),
(22, '2026_09_30_000011_create_maintenance_requests_table', 1),
(23, '2026_09_30_000012_create_contracts_table', 1),
(24, '2026_09_30_000013_create_contract_documents_table', 1),
(25, '2026_09_30_000014_create_contract_extensions_table', 1),
(26, '2026_09_30_000015_create_invoices_table', 1),
(27, '2026_09_30_000016_create_invoice_items_table', 1),
(28, '2026_09_30_000017_create_transactions_table', 1),
(29, '2026_09_30_000018_create_service_packages_table', 1),
(30, '2026_09_30_000019_create_user_packages_table', 1),
(31, '2026_09_30_000020_create_notifications_table', 1),
(32, '2026_09_30_000021_create_activity_logs_table', 1),
(33, '2026_10_09_002159_create_personal_access_tokens_table', 1),
(34, '2026_10_14_000001_add_signing_method_to_contracts_table', 2),
(35, '2026_10_15_000001_create_categories_table', 2),
(36, '2026_10_15_000001_create_brokers_and_assignments_tables', 3),
(37, '2026_10_19_150000_create_customer_crm_tables', 4),
(38, '2026_10_19_160000_add_customer_tracking_flag', 5),
(39, '2026_10_19_000001_extend_property_types_table', 6),
(40, '2026_10_20_120000_create_customer_demands_table', 6),
(41, '2026_10_15_000002_add_fields_to_property_types_table', 7),
(42, '2026_10_19_000002_create_categories_table', 7),
(43, '2026_10_21_000001_update_contract_extensions_table', 7),
(44, '2026_10_21_000002_update_contract_documents_table', 7),
(45, '2026_10_21_000003_add_contract_extension_permissions', 7),
(46, '2026_10_21_000004_update_contract_documents_metadata_table', 7),
(47, '2026_10_21_000005_add_contract_document_permissions', 7),
(51, '2026_10_23_000001_update_invoices_table_for_billing', 8),
(52, '2026_10_23_000002_update_invoice_items_table', 8),
(53, '2026_10_23_000003_add_invoice_permissions', 8),
(57, '2026_10_26_000001_update_transactions_table_for_rent_management', 9),
(58, '2026_10_26_000002_add_version_and_updated_by_to_invoices_table', 9),
(59, '2026_10_26_000003_add_rent_management_permissions', 9),
(60, '2026_10_26_160000_add_seed_key_to_customer_demands', 10),
(61, '2026_10_27_000001_add_management_record_versions', 11);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint UNSIGNED NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `notifiable_type`, `notifiable_id`, `type`, `data`, `read_at`, `created_at`, `updated_at`) VALUES
('006a50d8-44d4-4086-a947-499c57db5d94', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 9 (HD-2023-0003) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":5}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('014205e6-782c-40b4-a10c-9fb059f4cd5c', 'App\\Models\\User', 1, 'system.warning', '{\"category\":\"warning\",\"message\":\"Hóa đơn Tiền điện & nước tháng 10\\/2026 (HD-2023-0003) đã quá hạn thanh toán ngày 2026-10-25.\",\"target\":{\"table\":\"invoices\",\"id\":50}}', '2026-10-27 20:22:40', '2026-10-26 05:35:54', '2026-10-27 20:22:40'),
('144309b5-87a2-43be-9f96-9b6a384d477a', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":69,\"invoice_no\":\"QLTT-INV-202610-VHGPR01-10\",\"contract_id\":4,\"amount\":22000000,\"due_date\":\"2026-10-06\",\"title\":\"C\\u1ea3nh b\\u00e1o h\\u00f3a \\u0111\\u01a1n qu\\u00e1 h\\u1ea1n: QLTT-INV-202610-VHGPR01-10\",\"message\":\"H\\u00f3a \\u0111\\u01a1n QLTT-INV-202610-VHGPR01-10 \\u0111\\u00e3 qu\\u00e1 h\\u1ea1n thanh to\\u00e1n t\\u1eeb ng\\u00e0y 06\\/10\\/2026. S\\u1ed1 ti\\u1ec1n c\\u00f2n n\\u1ee3: 22.000.000 VN\\u0110. Vui l\\u00f2ng thanh to\\u00e1n s\\u1edbm.\",\"type\":\"invoice_overdue\"}', NULL, '2026-10-23 07:24:49', '2026-10-23 07:24:49'),
('144f0974-b106-4195-877c-5db778b1b13c', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":68,\"invoice_no\":\"QLTT-INV-202609-VHGPR01-18\",\"contract_id\":4,\"amount\":22000000,\"due_date\":\"2026-09-06\",\"title\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea m\\u1edbi: QLTT-INV-202609-VHGPR01-18\",\"message\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea k\\u1ef3 09\\/2026 cho c\\u0103n h\\u1ed9 c\\u1ee7a b\\u1ea1n \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c kh\\u1edfi t\\u1ea1o. H\\u1ea1n thanh to\\u00e1n: 06\\/09\\/2026\",\"type\":\"invoice_generated\"}', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
('17e733b3-1878-44a7-a4e8-7cc4db4bdb44', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 12 (HD-2023-0006) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":20}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('1884537e-729d-40eb-af57-e1473d1515d0', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 9 (HD-2023-0013) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":14}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('1c47d6df-890d-43c5-92a0-3eeed7112fda', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":67,\"invoice_no\":\"QLTT-INV-202610-VHGPR01-09\",\"contract_id\":3,\"amount\":17000000,\"due_date\":\"2026-10-06\",\"title\":\"C\\u1ea3nh b\\u00e1o h\\u00f3a \\u0111\\u01a1n qu\\u00e1 h\\u1ea1n: QLTT-INV-202610-VHGPR01-09\",\"message\":\"H\\u00f3a \\u0111\\u01a1n QLTT-INV-202610-VHGPR01-09 \\u0111\\u00e3 qu\\u00e1 h\\u1ea1n thanh to\\u00e1n t\\u1eeb ng\\u00e0y 06\\/10\\/2026. S\\u1ed1 ti\\u1ec1n c\\u00f2n n\\u1ee3: 17.000.000 VN\\u0110. Vui l\\u00f2ng thanh to\\u00e1n s\\u1edbm.\",\"type\":\"invoice_overdue\"}', NULL, '2026-10-23 07:24:49', '2026-10-23 07:24:49'),
('20f8a967-c6a5-4c67-b4cc-289503ed99c9', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":62,\"invoice_no\":\"QLTT-INV-202609-VHGPR01-15\",\"contract_id\":1,\"amount\":28000000,\"due_date\":\"2026-09-06\",\"title\":\"C\\u1ea3nh b\\u00e1o h\\u00f3a \\u0111\\u01a1n qu\\u00e1 h\\u1ea1n: QLTT-INV-202609-VHGPR01-15\",\"message\":\"H\\u00f3a \\u0111\\u01a1n QLTT-INV-202609-VHGPR01-15 \\u0111\\u00e3 qu\\u00e1 h\\u1ea1n thanh to\\u00e1n t\\u1eeb ng\\u00e0y 06\\/09\\/2026. S\\u1ed1 ti\\u1ec1n c\\u00f2n n\\u1ee3: 28.000.000 VN\\u0110. Vui l\\u00f2ng thanh to\\u00e1n s\\u1edbm.\",\"type\":\"invoice_overdue\"}', NULL, '2026-10-23 07:24:49', '2026-10-23 07:24:49'),
('22d2e865-9fbe-4a47-aa02-19995ecad34c', 'App\\Models\\User', 1, 'system.warning', '{\"category\":\"warning\",\"message\":\"Hóa đơn Tiền điện & nước tháng 10\\/2026 (HD-2023-0004) đã quá hạn thanh toán ngày 2026-10-25.\",\"target\":{\"table\":\"invoices\",\"id\":57}}', '2026-10-27 20:22:40', '2026-10-26 05:35:54', '2026-10-27 20:22:40'),
('244451c3-f486-4f7e-864e-2eff72780c2e', 'App\\Models\\User', 1, 'App\\Notifications\\ContractExtensionNotification', '{\"extension_id\":1,\"contract_id\":30,\"contract_code\":\"SEED-RENT-GWT-1102\",\"title\":\"Y\\u00eau c\\u1ea7u gia h\\u1ea1n h\\u1ee3p \\u0111\\u1ed3ng \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c ph\\u00ea duy\\u1ec7t\",\"message\":\"H\\u1ee3p \\u0111\\u1ed3ng SEED-RENT-GWT-1102 \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c gia h\\u1ea1n th\\u00e0nh c\\u00f4ng \\u0111\\u1ebfn ng\\u00e0y 26\\/07\\/2028.\",\"status\":2,\"type\":\"extension_approved\"}', '2026-10-27 20:22:40', '2026-10-26 14:28:44', '2026-10-27 20:22:40'),
('38a1be89-c232-478b-9e82-e5b275b2e980', 'App\\Models\\User', 30, 'App\\Notifications\\ContractExtensionNotification', '{\"extension_id\":1,\"contract_id\":30,\"contract_code\":\"SEED-RENT-GWT-1102\",\"title\":\"Y\\u00eau c\\u1ea7u gia h\\u1ea1n h\\u1ee3p \\u0111\\u1ed3ng \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c ph\\u00ea duy\\u1ec7t\",\"message\":\"H\\u1ee3p \\u0111\\u1ed3ng SEED-RENT-GWT-1102 \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c gia h\\u1ea1n th\\u00e0nh c\\u00f4ng \\u0111\\u1ebfn ng\\u00e0y 26\\/07\\/2028.\",\"status\":2,\"type\":\"extension_approved\"}', NULL, '2026-10-26 14:28:44', '2026-10-26 14:28:44'),
('3f26365b-7878-4878-ab6a-f8bc4ac75a58', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 10 (HD-2023-0004) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":2}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('4340ed4a-4c11-4060-931a-5d566f355eaa', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":65,\"invoice_no\":\"QLTT-INV-202610-VHGPR01-08\",\"contract_id\":2,\"amount\":22000000,\"due_date\":\"2026-10-06\",\"title\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea m\\u1edbi: QLTT-INV-202610-VHGPR01-08\",\"message\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea k\\u1ef3 10\\/2026 cho c\\u0103n h\\u1ed9 c\\u1ee7a b\\u1ea1n \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c kh\\u1edfi t\\u1ea1o. H\\u1ea1n thanh to\\u00e1n: 06\\/10\\/2026\",\"type\":\"invoice_generated\"}', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
('46502f5d-63e5-494d-a7ec-1805c97f978c', 'App\\Models\\User', 1, 'system.warning', '{\"category\":\"warning\",\"message\":\"Hóa đơn Tiền điện & nước tháng 10\\/2026 (SEED-HD-A101) đã quá hạn thanh toán ngày 2026-10-25.\",\"target\":{\"table\":\"invoices\",\"id\":27}}', '2026-10-27 20:22:40', '2026-10-26 05:35:54', '2026-10-27 20:22:40'),
('4a1b3593-d8e3-4af8-ac33-17042696d5af', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 3 (HD-2023-0006) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":8}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('4a611dc5-babb-473e-8832-e396e42eb627', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":62,\"invoice_no\":\"QLTT-INV-202609-VHGPR01-15\",\"contract_id\":1,\"amount\":28000000,\"due_date\":\"2026-09-06\",\"title\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea m\\u1edbi: QLTT-INV-202609-VHGPR01-15\",\"message\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea k\\u1ef3 09\\/2026 cho c\\u0103n h\\u1ed9 c\\u1ee7a b\\u1ea1n \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c kh\\u1edfi t\\u1ea1o. H\\u1ea1n thanh to\\u00e1n: 06\\/09\\/2026\",\"type\":\"invoice_generated\"}', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
('4c4850c2-f3f8-4142-a842-97b0f9a16301', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 9 (HD-2023-0009) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":1}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('51f3c6de-7740-49f3-abb6-260bb6157a82', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 11 (HD-2023-0003) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":19}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('52b6834e-bd0c-4efc-9357-2464223e4a2c', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":66,\"invoice_no\":\"QLTT-INV-202609-VHGPR01-17\",\"contract_id\":3,\"amount\":17000000,\"due_date\":\"2026-09-06\",\"title\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea m\\u1edbi: QLTT-INV-202609-VHGPR01-17\",\"message\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea k\\u1ef3 09\\/2026 cho c\\u0103n h\\u1ed9 c\\u1ee7a b\\u1ea1n \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c kh\\u1edfi t\\u1ea1o. H\\u1ea1n thanh to\\u00e1n: 06\\/09\\/2026\",\"type\":\"invoice_generated\"}', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
('58bf80c2-cca9-4dd6-a258-186557538a39', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 7 (HD-2023-0011) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":12}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('5e3a6937-b455-4d8d-a188-9910ed291e66', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 12 (HD-2023-0013) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":11}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('612e663b-c412-433b-aa04-d5143b585555', 'App\\Models\\User', 16, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê tháng 09\\/2026 - SEED-HD-A101 (SEED-HD-A101) đã được xác nhận.\"}', NULL, '2026-10-23 07:20:34', '2026-10-23 08:36:01'),
('61b1518e-1acf-4146-acf4-db30179ac03a', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":67,\"invoice_no\":\"QLTT-INV-202610-VHGPR01-09\",\"contract_id\":3,\"amount\":17000000,\"due_date\":\"2026-10-06\",\"title\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea m\\u1edbi: QLTT-INV-202610-VHGPR01-09\",\"message\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea k\\u1ef3 10\\/2026 cho c\\u0103n h\\u1ed9 c\\u1ee7a b\\u1ea1n \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c kh\\u1edfi t\\u1ea1o. H\\u1ea1n thanh to\\u00e1n: 06\\/10\\/2026\",\"type\":\"invoice_generated\"}', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
('629c65b9-73c2-4137-ae50-93ff5d2cff69', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 3 (HD-2023-0007) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":7}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('63906f85-fec8-46f1-abf6-84c44bdc6f5e', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 3 (HD-2023-0002) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":6}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('67950ab9-c646-4720-946e-103bb35eb013', 'App\\Models\\User', 2, 'App\\Notifications\\ContractExtensionNotification', '{\"extension_id\":1,\"contract_id\":30,\"contract_code\":\"SEED-RENT-GWT-1102\",\"title\":\"Y\\u00eau c\\u1ea7u gia h\\u1ea1n h\\u1ee3p \\u0111\\u1ed3ng \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c ph\\u00ea duy\\u1ec7t\",\"message\":\"H\\u1ee3p \\u0111\\u1ed3ng SEED-RENT-GWT-1102 \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c gia h\\u1ea1n th\\u00e0nh c\\u00f4ng \\u0111\\u1ebfn ng\\u00e0y 26\\/07\\/2028.\",\"status\":2,\"type\":\"extension_approved\"}', NULL, '2026-10-26 14:28:44', '2026-10-26 14:28:44'),
('6ab7c611-332d-4727-aab3-657922d05a8f', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 2 (HD-2023-0002) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":4}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('74cefba4-7749-43d3-a10e-ce42c4c5ceab', 'App\\Models\\User', 16, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê tháng 08\\/2026 - SEED-HD-A101 (SEED-HD-A101) đã được xác nhận.\"}', NULL, '2026-10-23 07:20:34', '2026-10-23 08:36:01'),
('7b2f357d-3d6d-4239-abc5-820a3f27fcca', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":65,\"invoice_no\":\"QLTT-INV-202610-VHGPR01-08\",\"contract_id\":2,\"amount\":22000000,\"due_date\":\"2026-10-06\",\"title\":\"C\\u1ea3nh b\\u00e1o h\\u00f3a \\u0111\\u01a1n qu\\u00e1 h\\u1ea1n: QLTT-INV-202610-VHGPR01-08\",\"message\":\"H\\u00f3a \\u0111\\u01a1n QLTT-INV-202610-VHGPR01-08 \\u0111\\u00e3 qu\\u00e1 h\\u1ea1n thanh to\\u00e1n t\\u1eeb ng\\u00e0y 06\\/10\\/2026. S\\u1ed1 ti\\u1ec1n c\\u00f2n n\\u1ee3: 22.000.000 VN\\u0110. Vui l\\u00f2ng thanh to\\u00e1n s\\u1edbm.\",\"type\":\"invoice_overdue\"}', NULL, '2026-10-23 07:24:49', '2026-10-23 07:24:49'),
('7d545721-2d32-490b-8fe7-a920a96d57e8', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":69,\"invoice_no\":\"QLTT-INV-202610-VHGPR01-10\",\"contract_id\":4,\"amount\":22000000,\"due_date\":\"2026-10-06\",\"title\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea m\\u1edbi: QLTT-INV-202610-VHGPR01-10\",\"message\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea k\\u1ef3 10\\/2026 cho c\\u0103n h\\u1ed9 c\\u1ee7a b\\u1ea1n \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c kh\\u1edfi t\\u1ea1o. H\\u1ea1n thanh to\\u00e1n: 06\\/10\\/2026\",\"type\":\"invoice_generated\"}', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
('8076393b-f3ed-49ac-8322-3cccdea2561c', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":66,\"invoice_no\":\"QLTT-INV-202609-VHGPR01-17\",\"contract_id\":3,\"amount\":17000000,\"due_date\":\"2026-09-06\",\"title\":\"C\\u1ea3nh b\\u00e1o h\\u00f3a \\u0111\\u01a1n qu\\u00e1 h\\u1ea1n: QLTT-INV-202609-VHGPR01-17\",\"message\":\"H\\u00f3a \\u0111\\u01a1n QLTT-INV-202609-VHGPR01-17 \\u0111\\u00e3 qu\\u00e1 h\\u1ea1n thanh to\\u00e1n t\\u1eeb ng\\u00e0y 06\\/09\\/2026. S\\u1ed1 ti\\u1ec1n c\\u00f2n n\\u1ee3: 17.000.000 VN\\u0110. Vui l\\u00f2ng thanh to\\u00e1n s\\u1edbm.\",\"type\":\"invoice_overdue\"}', NULL, '2026-10-23 07:24:49', '2026-10-23 07:24:49'),
('8343d94e-2f29-4950-ad5e-715c1a7f43f9', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê tháng 08\\/2026 - HD-2023-0003 (HD-2023-0003) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":48}}', '2026-10-27 20:22:40', '2026-10-23 07:20:35', '2026-10-27 20:22:40'),
('8349f31d-3379-4ec6-a869-6e142aae15a6', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 2 (HD-2023-0013) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":13}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('86dd3e82-4935-40fe-a9f0-5e8fea900509', 'App\\Models\\User', 16, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tổng hợp dịch vụ & tiền thuê tháng 10\\/2026 (SEED-HD-A101) đã được xác nhận.\"}', NULL, '2026-10-23 07:20:34', '2026-10-23 08:36:01'),
('87b0be5a-3192-4cd1-a4c8-e74ec75d4505', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê tháng 08\\/2026 - HD-2023-0004 (HD-2023-0004) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":55}}', '2026-10-27 20:22:40', '2026-10-23 07:20:35', '2026-10-27 20:22:40'),
('9235be27-05e1-41ae-a130-4c16e48aa1d1', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 1 (HD-2023-0012) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":15}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('94e3abec-5da9-43f7-ae68-0fc5ec580008', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền đặt cọc hợp đồng thuê SEED-HD-A101 (SEED-HD-A101) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":22}}', '2026-10-27 20:22:40', '2026-10-23 07:20:34', '2026-10-27 20:22:40'),
('95ed5f1d-1309-41c6-a624-d2661d567bfa', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 1 (HD-2023-0015) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":10}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('9c3da626-3fd8-4f8b-a7fb-d2d83d821f70', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":64,\"invoice_no\":\"QLTT-INV-202609-VHGPR01-16\",\"contract_id\":2,\"amount\":22000000,\"due_date\":\"2026-09-06\",\"title\":\"C\\u1ea3nh b\\u00e1o h\\u00f3a \\u0111\\u01a1n qu\\u00e1 h\\u1ea1n: QLTT-INV-202609-VHGPR01-16\",\"message\":\"H\\u00f3a \\u0111\\u01a1n QLTT-INV-202609-VHGPR01-16 \\u0111\\u00e3 qu\\u00e1 h\\u1ea1n thanh to\\u00e1n t\\u1eeb ng\\u00e0y 06\\/09\\/2026. S\\u1ed1 ti\\u1ec1n c\\u00f2n n\\u1ee3: 22.000.000 VN\\u0110. Vui l\\u00f2ng thanh to\\u00e1n s\\u1edbm.\",\"type\":\"invoice_overdue\"}', NULL, '2026-10-23 07:24:49', '2026-10-23 07:24:49'),
('a87e4b99-4054-49e6-a153-e30fe0444c10', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 1 (HD-2023-0011) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":9}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('ad3132e9-4758-4679-aea3-ca16b4f2c88f', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê tháng 08\\/2026 - HD-2023-0002 (HD-2023-0002) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":41}}', '2026-10-27 20:22:40', '2026-10-23 07:20:35', '2026-10-27 20:22:40'),
('add98a07-ffe7-4638-a79f-0ac4a67b879a', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 3 (HD-2023-0006) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":17}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('b46ee47b-114a-4171-8b22-fd220e580559', 'App\\Models\\User', 14, 'App\\Notifications\\ContractExtensionNotification', '{\"extension_id\":1,\"contract_id\":30,\"contract_code\":\"SEED-RENT-GWT-1102\",\"title\":\"Y\\u00eau c\\u1ea7u gia h\\u1ea1n h\\u1ee3p \\u0111\\u1ed3ng m\\u1edbi c\\u1ea7n duy\\u1ec7t\",\"message\":\"M\\u00f4i gi\\u1edbi Admin v\\u1eeba g\\u1eedi y\\u00eau c\\u1ea7u gia h\\u1ea1n cho h\\u1ee3p \\u0111\\u1ed3ng SEED-RENT-GWT-1102.\",\"status\":1,\"type\":\"extension_submitted\"}', NULL, '2026-10-26 14:23:59', '2026-10-26 14:23:59'),
('b71df6b9-a62a-47f1-aaa1-1b241b78353b', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê nhà tháng 10\\/2026 - P.1102 Gateway Thảo Điền (SEED-RENT-GWT-1102) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":82}}', '2026-10-27 20:22:40', '2026-10-26 13:51:30', '2026-10-27 20:22:40'),
('bc00eb2f-95c0-4bad-9f97-3d0ea69a3eb2', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":63,\"invoice_no\":\"QLTT-INV-202610-VHGPR01-07\",\"contract_id\":1,\"amount\":28000000,\"due_date\":\"2026-10-06\",\"title\":\"C\\u1ea3nh b\\u00e1o h\\u00f3a \\u0111\\u01a1n qu\\u00e1 h\\u1ea1n: QLTT-INV-202610-VHGPR01-07\",\"message\":\"H\\u00f3a \\u0111\\u01a1n QLTT-INV-202610-VHGPR01-07 \\u0111\\u00e3 qu\\u00e1 h\\u1ea1n thanh to\\u00e1n t\\u1eeb ng\\u00e0y 06\\/10\\/2026. S\\u1ed1 ti\\u1ec1n c\\u00f2n n\\u1ee3: 28.000.000 VN\\u0110. Vui l\\u00f2ng thanh to\\u00e1n s\\u1edbm.\",\"type\":\"invoice_overdue\"}', NULL, '2026-10-23 07:24:49', '2026-10-23 07:24:49'),
('c3b070aa-750e-4277-ad91-0b99e1aa38b8', 'App\\Models\\User', 16, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền đặt cọc hợp đồng thuê SEED-HD-A101 (SEED-HD-A101) đã được xác nhận.\"}', NULL, '2026-10-23 07:20:34', '2026-10-23 08:36:01'),
('c3cd606d-2a83-4837-a0aa-0c02b0f538a1', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 8 (HD-2023-0011) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":16}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('c76e8964-289e-4545-ac78-eacf4b5ec641', 'App\\Models\\User', 10, 'App\\Notifications\\ContractExtensionNotification', '{\"extension_id\":1,\"contract_id\":30,\"contract_code\":\"SEED-RENT-GWT-1102\",\"title\":\"Y\\u00eau c\\u1ea7u gia h\\u1ea1n h\\u1ee3p \\u0111\\u1ed3ng m\\u1edbi c\\u1ea7n duy\\u1ec7t\",\"message\":\"M\\u00f4i gi\\u1edbi Admin v\\u1eeba g\\u1eedi y\\u00eau c\\u1ea7u gia h\\u1ea1n cho h\\u1ee3p \\u0111\\u1ed3ng SEED-RENT-GWT-1102.\",\"status\":1,\"type\":\"extension_submitted\"}', NULL, '2026-10-26 14:23:59', '2026-10-26 14:23:59'),
('c87c5e71-8dad-449d-a471-15ad8fa30f14', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 7 (HD-2023-0005) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":3}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('ce6e215d-4945-4309-a0b5-e2c0796f5637', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền đặt cọc hợp đồng thuê HD-2023-0001 (HD-2023-0001) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":32}}', '2026-10-27 20:22:40', '2026-10-23 07:20:34', '2026-10-27 20:22:40'),
('cf663193-252a-4778-ae2a-f9f2ce7a1f81', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê tháng 08\\/2026 - SEED-HD-A101 (SEED-HD-A101) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":24}}', '2026-10-27 20:22:40', '2026-10-23 07:20:34', '2026-10-27 20:22:40'),
('d09dfc4e-1631-454a-a10f-997347257509', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê nhà tháng 10\\/2026 - P.402 Tòa Landmark 81 (SEED-RENT-LM81-402) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":73}}', '2026-10-27 20:22:40', '2026-10-26 13:51:29', '2026-10-27 20:22:40'),
('d4c9f9ed-8fd3-49e4-a6aa-dfc36e7ff5d8', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê tháng 08\\/2026 - HD-2023-0001 (HD-2023-0001) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":34}}', '2026-10-27 20:22:40', '2026-10-23 07:20:34', '2026-10-27 20:22:40'),
('d8ae089a-e3ac-4a43-aa6f-09acf038da4f', 'App\\Models\\User', 1, 'system.warning', '{\"category\":\"warning\",\"message\":\"Hợp đồng HD-2023-0013 sắp hết hạn ngày 2026-10-26.\",\"target\":{\"table\":\"contracts\",\"id\":13}}', '2026-10-27 20:22:40', '2026-10-23 05:44:53', '2026-10-27 20:22:40'),
('e04e577d-acf8-4cec-abdf-23fc1f88402e', 'App\\Models\\User', 1, 'system.warning', '{\"category\":\"warning\",\"message\":\"Hóa đơn Tiền điện & nước tháng 10\\/2026 (HD-2023-0001) đã quá hạn thanh toán ngày 2026-10-25.\",\"target\":{\"table\":\"invoices\",\"id\":36}}', '2026-10-27 20:22:40', '2026-10-26 05:35:54', '2026-10-27 20:22:40'),
('e52f0d12-a279-4ffc-acf9-af7a1eb00db2', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê nhà tháng 10\\/2026 - P.1205 Vinhomes Central Park (SEED-RENT-VHCP-1205) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":74}}', '2026-10-27 20:22:40', '2026-10-26 13:51:29', '2026-10-27 20:22:40'),
('e5451018-ccc4-4577-8547-c44208dee44f', 'App\\Models\\User', 1, 'App\\Notifications\\ContractExtensionNotification', '{\"extension_id\":1,\"contract_id\":30,\"contract_code\":\"SEED-RENT-GWT-1102\",\"title\":\"Y\\u00eau c\\u1ea7u gia h\\u1ea1n h\\u1ee3p \\u0111\\u1ed3ng m\\u1edbi c\\u1ea7n duy\\u1ec7t\",\"message\":\"M\\u00f4i gi\\u1edbi Admin v\\u1eeba g\\u1eedi y\\u00eau c\\u1ea7u gia h\\u1ea1n cho h\\u1ee3p \\u0111\\u1ed3ng SEED-RENT-GWT-1102.\",\"status\":1,\"type\":\"extension_submitted\"}', '2026-10-27 20:22:40', '2026-10-26 14:23:59', '2026-10-27 20:22:40'),
('ec5a7fb5-2453-4030-ae77-d619f62e355b', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Tiền thuê tháng 09\\/2026 - SEED-HD-A101 (SEED-HD-A101) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":25}}', '2026-10-27 20:22:40', '2026-10-23 07:20:34', '2026-10-27 20:22:40'),
('ec639157-6d38-4e10-a615-554144b5971c', 'App\\Models\\User', 1, 'system.warning', '{\"category\":\"warning\",\"message\":\"Hóa đơn Tiền điện & nước tháng 10\\/2026 (HD-2023-0002) đã quá hạn thanh toán ngày 2026-10-25.\",\"target\":{\"table\":\"invoices\",\"id\":43}}', '2026-10-27 20:22:40', '2026-10-26 05:35:54', '2026-10-27 20:22:40'),
('ef593074-096a-4b1c-8e54-a52ecbbf448e', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":68,\"invoice_no\":\"QLTT-INV-202609-VHGPR01-18\",\"contract_id\":4,\"amount\":22000000,\"due_date\":\"2026-09-06\",\"title\":\"C\\u1ea3nh b\\u00e1o h\\u00f3a \\u0111\\u01a1n qu\\u00e1 h\\u1ea1n: QLTT-INV-202609-VHGPR01-18\",\"message\":\"H\\u00f3a \\u0111\\u01a1n QLTT-INV-202609-VHGPR01-18 \\u0111\\u00e3 qu\\u00e1 h\\u1ea1n thanh to\\u00e1n t\\u1eeb ng\\u00e0y 06\\/09\\/2026. S\\u1ed1 ti\\u1ec1n c\\u00f2n n\\u1ee3: 22.000.000 VN\\u0110. Vui l\\u00f2ng thanh to\\u00e1n s\\u1edbm.\",\"type\":\"invoice_overdue\"}', NULL, '2026-10-23 07:24:49', '2026-10-23 07:24:49'),
('f3c886c6-dbba-4bed-9b3e-2fd2f0f83112', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":64,\"invoice_no\":\"QLTT-INV-202609-VHGPR01-16\",\"contract_id\":2,\"amount\":22000000,\"due_date\":\"2026-09-06\",\"title\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea m\\u1edbi: QLTT-INV-202609-VHGPR01-16\",\"message\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea k\\u1ef3 09\\/2026 cho c\\u0103n h\\u1ed9 c\\u1ee7a b\\u1ea1n \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c kh\\u1edfi t\\u1ea1o. H\\u1ea1n thanh to\\u00e1n: 06\\/09\\/2026\",\"type\":\"invoice_generated\"}', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
('f89e0a6f-aabb-4fc7-a992-2eeac795e00b', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tiền thuê tháng 1 (HD-2023-0001) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":18}}', '2026-10-20 03:52:24', '2026-10-15 06:56:19', '2026-10-20 03:52:24'),
('f97f081d-2fef-4d7c-a69a-6fdcd527668f', 'App\\Models\\User', 1, 'system.payment', '{\"category\":\"payment\",\"message\":\"Thanh toán Hóa đơn tổng hợp dịch vụ & tiền thuê tháng 10\\/2026 (SEED-HD-A101) đã được xác nhận.\",\"target\":{\"table\":\"invoices\",\"id\":21}}', '2026-10-27 20:22:40', '2026-10-23 07:20:34', '2026-10-27 20:22:40'),
('f9eb4f14-e27f-4b16-b7c6-97bc4b315541', 'App\\Models\\User', 5, 'App\\Notifications\\InvoiceNotification', '{\"invoice_id\":63,\"invoice_no\":\"QLTT-INV-202610-VHGPR01-07\",\"contract_id\":1,\"amount\":28000000,\"due_date\":\"2026-10-06\",\"title\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea m\\u1edbi: QLTT-INV-202610-VHGPR01-07\",\"message\":\"H\\u00f3a \\u0111\\u01a1n ti\\u1ec1n thu\\u00ea k\\u1ef3 10\\/2026 cho c\\u0103n h\\u1ed9 c\\u1ee7a b\\u1ea1n \\u0111\\u00e3 \\u0111\\u01b0\\u1ee3c kh\\u1edfi t\\u1ea1o. H\\u1ea1n thanh to\\u00e1n: 06\\/10\\/2026\",\"type\":\"invoice_generated\"}', NULL, '2026-10-23 07:24:07', '2026-10-23 07:24:07'),
('fec7e3f4-6d7f-4dd3-a590-d408a3e58828', 'App\\Models\\User', 1, 'system.warning', '{\"category\":\"warning\",\"message\":\"Hợp đồng HD-2023-0011 sắp hết hạn ngày 2026-10-30.\",\"target\":{\"table\":\"contracts\",\"id\":11}}', '2026-10-27 20:22:40', '2026-10-27 18:29:12', '2026-10-27 20:22:40');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'view_dashboard', 'Xem bảng điều khiển', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 'manage_properties', 'Quản lý tin đăng bất động sản', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(3, 'approve_properties', 'Kiểm duyệt tin đăng BĐS', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(4, 'manage_appointments', 'Quản lý lịch hẹn xem nhà', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(5, 'manage_contracts', 'Quản lý hợp đồng & pháp lý', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(6, 'manage_finance', 'Quản lý hóa đơn & thanh toán', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(7, 'manage_users', 'Quản lý tài khoản & phân quyền', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(8, 'contract_extension.view', 'Xem danh sách và lịch sử gia hạn hợp đồng', '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(9, 'contract_extension.create', 'Tạo và chỉnh sửa bản nháp gia hạn hợp đồng', '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(10, 'contract_extension.submit', 'Gửi yêu cầu gia hạn hợp đồng lên cấp trên duyệt', '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(11, 'contract_extension.approve', 'Phê duyệt hoặc từ chối yêu cầu gia hạn hợp đồng', '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(12, 'contract_document.view', 'Xem danh sách và chi tiết tài liệu hợp đồng', '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(13, 'contract_document.upload', 'Tải lên tài liệu hợp đồng', '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(14, 'contract_document.update', 'Chỉnh sửa thông tin tài liệu hợp đồng', '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(15, 'contract_document.delete', 'Xóa mềm tài liệu hợp đồng', '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(16, 'contract_document.download', 'Tải xuống tài liệu hợp đồng', '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(17, 'contract_document.view_own', 'Khách hàng xem danh sách hợp đồng và tài liệu của chính mình', '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(18, 'contract_document.download_own', 'Khách hàng tải xuống tài liệu hợp đồng của chính mình', '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(27, 'invoice.view', 'Xem danh sách và chi tiết hóa đơn tài chính', '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(28, 'invoice.create', 'Lập hóa đơn thanh toán mới', '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(29, 'invoice.update', 'Chỉnh sửa thông tin hóa đơn chưa thanh toán', '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(30, 'invoice.cancel', 'Hủy hóa đơn thanh toán (nhập lý do hủy)', '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(31, 'invoice.send', 'Gửi hóa đơn thanh toán qua email khách hàng', '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(32, 'invoice.download', 'Tải xuống hóa đơn thanh toán dưới dạng PDF', '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(33, 'invoice.view_own', 'Khách hàng xem hóa đơn thuộc hợp đồng của chính mình', '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(34, 'invoice.download_own', 'Khách hàng tải xuống PDF hóa đơn của chính mình', '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(37, 'rent.view', 'Xem danh sách và thống kê quản lý tiền thuê hàng tháng', '2026-10-26 06:22:34', '2026-10-26 06:22:34'),
(38, 'payment.record', 'Ghi nhận thanh toán thu tiền thuê nhà thủ công hoặc qua cổng', '2026-10-26 06:22:34', '2026-10-26 06:22:34');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'auth_token', '17c478b80f03e131ecead180dd7f160952176f9e776f906525b8ea1cdd92718a', '[\"*\"]', NULL, NULL, '2026-10-15 09:40:13', '2026-10-15 09:40:13'),
(2, 'App\\Models\\User', 1, 'auth_token', '322a9d2f9a07ebfe4c416bc72593074343e459553bd1eb8aa45d7ed9a81c0d67', '[\"*\"]', NULL, NULL, '2026-10-19 06:06:21', '2026-10-19 06:06:21'),
(3, 'App\\Models\\User', 1, 'auth_token', 'c3ba88b70c58a16ba7418d10cf491f9080cb3c26d348f92b07081baa208527b4', '[\"*\"]', NULL, NULL, '2026-10-19 06:06:21', '2026-10-19 06:06:21'),
(4, 'App\\Models\\User', 1, 'auth_token', 'e946f1817bd1ffb193e3c716487038fc44a4428914832a8587aa2ede772c4517', '[\"*\"]', NULL, NULL, '2026-10-19 06:27:13', '2026-10-19 06:27:13'),
(5, 'App\\Models\\User', 1, 'auth_token', 'e02d32e91e49af7d8d90251f631c2f68b241503517745b0c2c2982f7f8633f03', '[\"*\"]', NULL, NULL, '2026-10-19 06:27:15', '2026-10-19 06:27:15'),
(6, 'App\\Models\\User', 1, 'auth_token', '5b4dbdd6c9b4ae9d6d522e3f4c2bd8ebfdb0b3433aa98474e65e836505661112', '[\"*\"]', NULL, NULL, '2026-10-19 06:49:30', '2026-10-19 06:49:30'),
(7, 'App\\Models\\User', 1, 'auth_token', 'c30fda80d2d053a57f0b79517a08e11aca48df56f0507ddb5bf70112dfcba095', '[\"*\"]', NULL, NULL, '2026-10-19 07:02:17', '2026-10-19 07:02:17'),
(8, 'App\\Models\\User', 1, 'auth_token', 'e8d4daf03c1a04fc75e7ef7b5132f41eefec073da51c2de169e80b1b1d28d16e', '[\"*\"]', NULL, NULL, '2026-10-19 07:06:01', '2026-10-19 07:06:01'),
(9, 'App\\Models\\User', 1, 'auth_token', 'a69dd5f44cd8a0a784c274c0de47940c61bcc2376a6db044427ebbd17b3d2f5c', '[\"*\"]', '2026-10-23 08:17:58', NULL, '2026-10-21 07:23:01', '2026-10-23 08:17:58'),
(10, 'App\\Models\\User', 1, 'auth_token', '4c1eaa9e463fcd3507bf915e8c5bafcf16d0a16c65b439e28fe8b720d46edfcf', '[\"*\"]', '2026-10-23 08:30:05', NULL, '2026-10-23 08:19:04', '2026-10-23 08:30:05'),
(11, 'App\\Models\\User', 16, 'auth_token', '5d04d31bbec5f1c231ed7e4eba9fcc24196f7bbcf4fcb797018725e760cfab19', '[\"*\"]', '2026-10-23 09:13:45', NULL, '2026-10-23 08:36:00', '2026-10-23 09:13:45'),
(12, 'App\\Models\\User', 1, 'auth_token', '547d52905901eb1006d379c3d25b2dd427dd3739399c3e6fa09d2f12a985473a', '[\"*\"]', '2026-10-23 09:22:00', NULL, '2026-10-23 09:13:54', '2026-10-23 09:22:00'),
(13, 'App\\Models\\User', 16, 'auth_token', '9b482a862bdf0f4de22d3afaca1be8efeb11dba0cc5132774cfd84c274d272da', '[\"*\"]', NULL, NULL, '2026-10-23 09:22:12', '2026-10-23 09:22:12'),
(14, 'App\\Models\\User', 1, 'auth_token', '68ac71cee989cc1195ce9e6dbcd3f606cdedce82f372cd7d030c94200e3fc145', '[\"*\"]', '2026-10-23 17:24:43', NULL, '2026-10-23 09:42:08', '2026-10-23 17:24:43'),
(15, 'App\\Models\\User', 16, 'auth_token', '4fee264fda6e9480d6f6353e438d50fbfd14146d66e84947d45e7fdb159ed1e3', '[\"*\"]', '2026-10-23 17:50:53', NULL, '2026-10-23 17:24:52', '2026-10-23 17:50:53'),
(16, 'App\\Models\\User', 1, 'auth_token', '8e8f8ac5e9db171d68b0326e9c95cacdcdeb9cb180e783185fe5af9f1ba491eb', '[\"*\"]', '2026-10-23 18:11:36', NULL, '2026-10-23 17:51:36', '2026-10-23 18:11:36'),
(17, 'App\\Models\\User', 16, 'auth_token', '855a97fa5fdfc7326c9f20e2df91679dc88829218db02eef68cc37bf010d2da9', '[\"*\"]', '2026-10-23 18:12:57', NULL, '2026-10-23 18:12:02', '2026-10-23 18:12:57'),
(18, 'App\\Models\\User', 1, 'auth_token', '165eae0669bd09c572e1d4e80a9fb727e148d75d99574bc85dd5e9377d909ce4', '[\"*\"]', '2026-10-23 18:31:42', NULL, '2026-10-23 18:13:01', '2026-10-23 18:31:42'),
(19, 'App\\Models\\User', 16, 'auth_token', '11c34dac34fa85651216e2aa233d90e136e4f379a118b725c54bc09b8969f9f2', '[\"*\"]', '2026-10-23 18:33:03', NULL, '2026-10-23 18:32:27', '2026-10-23 18:33:03'),
(20, 'App\\Models\\User', 16, 'auth_token', '42ee50a7a9f16d0ef28f525b7c3d8e65cfd6d64407f2baf96e0cbd92ade0f061', '[\"*\"]', NULL, NULL, '2026-10-23 18:37:29', '2026-10-23 18:37:29'),
(21, 'App\\Models\\User', 16, 'auth_token', 'd41f8cc83787eb93b88ea15b5c9ab234e774805b5299603be537ddd633b2636a', '[\"*\"]', NULL, NULL, '2026-10-23 18:37:57', '2026-10-23 18:37:57'),
(22, 'App\\Models\\User', 1, 'auth_token', '3e427987f307cb05e5fd42888bc8b2b1b0203fcb338e93d63d4c37fbe2d8995a', '[\"*\"]', NULL, NULL, '2026-10-23 18:38:33', '2026-10-23 18:38:33'),
(23, 'App\\Models\\User', 1, 'auth_token', 'a978971fc49106bb1be435ab9bdb6541f559223fbd4d450f2b3f0221c0c37382', '[\"*\"]', '2026-10-23 18:39:56', NULL, '2026-10-23 18:39:10', '2026-10-23 18:39:56'),
(24, 'App\\Models\\User', 16, 'auth_token', '46d2f430d397e05e430795e863c4d8e4cf58e85e9065591fd1cc47e7bad4dd8e', '[\"*\"]', '2026-10-23 18:42:09', NULL, '2026-10-23 18:40:09', '2026-10-23 18:42:09'),
(25, 'App\\Models\\User', 1, 'auth_token', '7d4d26422ce4f9e3fb7889683562b36d8bf0c123785e4b097577d5283cb25f23', '[\"*\"]', '2026-10-26 15:12:19', NULL, '2026-10-23 18:42:25', '2026-10-26 15:12:19'),
(26, 'App\\Models\\User', 1, 'auth_token', 'b25bd6637d08317f435c45a26870b9de2acaee245de6e81671d0e920ff265690', '[\"*\"]', '2026-10-27 20:14:44', NULL, '2026-10-26 15:38:24', '2026-10-27 20:14:44');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` bigint UNSIGNED NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `property_type_id` int UNSIGNED DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `area` double NOT NULL DEFAULT '0',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province_id` int UNSIGNED DEFAULT NULL,
  `district_id` int UNSIGNED DEFAULT NULL,
  `ward_id` int UNSIGNED DEFAULT NULL,
  `bedrooms` int DEFAULT '0',
  `bathrooms` int DEFAULT '0',
  `floors` int DEFAULT '1',
  `direction` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `legal_status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `build_year` int DEFAULT NULL,
  `amenities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `expire_date` datetime DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `developer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purpose` enum('sale','rent','project') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sale',
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Căn hộ cao cấp',
  `price_sale` decimal(15,2) DEFAULT NULL,
  `price_sale_text` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_rent` decimal(15,2) DEFAULT NULL,
  `price_rent_text` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit` decimal(15,2) DEFAULT NULL,
  `deposit_text` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `legal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rent_period_min` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `furniture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `management_fee` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `available_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `street` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TP. Hồ Chí Minh',
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `image` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `badge` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `badge_class` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `code`, `user_id`, `property_type_id`, `title`, `description`, `price`, `area`, `address`, `province_id`, `district_id`, `ward_id`, `bedrooms`, `bathrooms`, `floors`, `direction`, `legal_status`, `build_year`, `amenities`, `latitude`, `longitude`, `status`, `expire_date`, `deleted_at`, `developer`, `project`, `purpose`, `type`, `price_sale`, `price_sale_text`, `price_rent`, `price_rent_text`, `deposit`, `deposit_text`, `unit_price`, `legal`, `rent_period_min`, `furniture`, `management_fee`, `available_date`, `street`, `district`, `city`, `lat`, `lng`, `image`, `badge`, `badge_class`, `owner_name`, `owner_phone`, `created_at`, `updated_at`) VALUES
(1, 'VH-GP-R01', NULL, NULL, 'Căn hộ 2PN The Origami - Vinhomes Grand Park đầy đủ nội thất cao cấp', 'Căn hộ 2PN The Origami - Vinhomes Grand Park đầy đủ nội thất cao cấp - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 12000000.00, 69.2, 'Nguyễn Xiển & Phước Thiện, TP. Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-11-20 07:03:28', NULL, 'Vinhomes', 'Vinhomes Grand Park', 'rent', 'Căn hộ cao cấp', NULL, NULL, 12000000.00, '12 triệu/tháng', 24000000.00, '24 triệu (Cọc 2 tháng)', '173.000 đ/m²', 'Sổ hồng riêng', 'Tối thiểu 1 năm', 'Full nội thất hiện đại, máy giặt, tủ lạnh, tivi, sofa, giường tủ', '8.800 đ/m²/tháng', 'Dọn vào ở ngay', 'Nguyễn Xiển & Phước Thiện', 'TP. Thủ Đức', 'TP. Hồ Chí Minh', 10.8415000, 106.8402000, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80', 'Cho thuê gấp', 'bg-emerald-500', 'Nguyễn Hoàng Nam', '0912.888.777', '2026-10-15 06:56:16', '2026-10-21 07:03:28'),
(2, 'VH-OCP-S01', NULL, NULL, 'Căn hộ 2PN2WC Masteri Waterfront - Vinhomes Ocean Park 1', 'Căn hộ 2PN2WC Masteri Waterfront - Vinhomes Ocean Park 1 - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 3250000000.00, 64, 'Đa Tốn, Gia Lâm, Huyện Gia Lâm, Hà Nội', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Vinhomes', 'Vinhomes Ocean Park 1', 'sale', 'Căn hộ cao cấp', 3250000000.00, '3.25 tỷ', NULL, NULL, 100000000.00, '100 triệu (Đặt cọc giữ chỗ mua)', '51 triệu/m²', 'HĐMB trực tiếp CĐT, sẵn sàng cấp sổ', NULL, 'Bàn giao cơ bản cao cấp Kohler, Hafele', '14.000 đ/m²/tháng', 'Bàn giao ngay', 'Đa Tốn, Gia Lâm', 'Huyện Gia Lâm', 'Hà Nội', 20.9932000, 105.9436000, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', 'Giá đầu tư', 'bg-blue-600', 'Lê Văn Hùng', '0989.123.456', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(3, 'NOVA-SUN-R01', NULL, NULL, 'Căn hộ 3PN The Sun Avenue Mai Chí Thọ view sông Giồng Ông Tố', 'Căn hộ 3PN The Sun Avenue Mai Chí Thọ view sông Giồng Ông Tố - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 19000000.00, 90, '28 Mai Chí Thọ, Phường An Phú, TP. Thủ Đức (Quận 2 cũ), TP. Hồ Chí Minh', NULL, NULL, NULL, 3, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Novaland', 'The Sun Avenue', 'rent', 'Căn hộ cao cấp', NULL, NULL, 19000000.00, '19 triệu/tháng', 38000000.00, '38 triệu (Cọc 2 tháng)', '211.000 đ/m²', 'HĐMB Novaland', '1 năm', 'Đầy đủ nội thất gỗ An Cường, 4 máy lạnh Inverter, ban công thoáng', '13.200 đ/m²/tháng', 'Đầu tháng tới', '28 Mai Chí Thọ, Phường An Phú', 'TP. Thủ Đức (Quận 2 cũ)', 'TP. Hồ Chí Minh', 10.7852000, 106.7583000, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80', 'Novaland Cho thuê', 'bg-amber-600', 'Phạm Quốc Tuấn', '0934.567.890', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(4, 'NOVA-SRC-R02', NULL, NULL, 'Căn hộ Sunrise City Central Quận 7 đối diện Lotte Mart', 'Căn hộ Sunrise City Central Quận 7 đối diện Lotte Mart - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 17500000.00, 76, '25 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Novaland', 'Sunrise City', 'rent', 'Căn hộ cao cấp', NULL, NULL, 17500000.00, '17.5 triệu/tháng', 35000000.00, '35 triệu (Cọc 2 tháng)', '230.000 đ/m²', 'Sổ hồng chính chủ', '1 năm', 'Full nội thất nhập khẩu, bếp điện từ, lò nướng, smart TV 65 inch', '14.500 đ/m²/tháng', 'Ở ngay', '25 Nguyễn Hữu Thọ, Phường Tân Hưng', 'Quận 7', 'TP. Hồ Chí Minh', 10.7483000, 106.7022000, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80', 'View đẹp tầng cao', 'bg-emerald-600', 'Ngô Bích Thủy', '0918.333.222', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(5, 'NOVA-AQUA-S01', NULL, NULL, 'Nhà phố ven sông Đảo Phượng Hoàng - Aqua City Biên Hòa', 'Nhà phố ven sông Đảo Phượng Hoàng - Aqua City Biên Hòa - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 7800000000.00, 120, 'Đường Hương Lộ 2, Xã Long Hưng, TP. Biên Hòa, Đồng Nai', NULL, NULL, NULL, 4, 5, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Novaland', 'Aqua City', 'sale', 'Nhà phố / Liền kề', 7800000000.00, '7.8 tỷ', NULL, NULL, 200000000.00, '200 triệu (Cọc mua)', '65 triệu/m² đất', 'HĐMB Novaland, pháp lý chuẩn chỉnh', NULL, 'Nhà thô hoàn thiện mặt ngoài 1 trệt 2 lầu', '12.000 đ/m²', 'Bàn giao nhà ngay', 'Đường Hương Lộ 2, Xã Long Hưng', 'TP. Biên Hòa', 'Đồng Nai', 10.8732000, 106.8845000, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80', 'Đô thị sinh thái', 'bg-teal-600', 'Hoàng Minh Đức', '0977.889.900', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(6, 'KD-SAF-R01', NULL, NULL, 'Căn hộ Safira Khang Điền 2PN view hồ bơi xanh mát', 'Căn hộ Safira Khang Điền 2PN view hồ bơi xanh mát - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 9500000.00, 67, 'Võ Chí Công, Phường Phú Hữu, TP. Thủ Đức (Quận 9 cũ), TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Khang Điền', 'Safira Khang Điền', 'rent', 'Căn hộ cao cấp', NULL, NULL, 9500000.00, '9.5 triệu/tháng', 19000000.00, '19 triệu (Cọc 2 tháng)', '141.000 đ/m²', 'Sổ hồng trao tay', '1 năm', 'Full nội thất xách vali vào ở, rèm cửa, máy lạnh, giàn phơi', '11.000 đ/m²/tháng', 'Vào ở ngay', 'Võ Chí Công, Phường Phú Hữu', 'TP. Thủ Đức (Quận 9 cũ)', 'TP. Hồ Chí Minh', 10.8035000, 106.7892000, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80', 'Giá tốt nhất', 'bg-green-600', 'Đặng Thị Thảo', '0909.112.233', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(7, 'KD-PRIV-S01', NULL, NULL, 'Căn hộ The Privia Khang Điền bàn giao mới 100% An Dương Vương', 'Căn hộ The Privia Khang Điền bàn giao mới 100% An Dương Vương - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 3100000000.00, 67, '158 An Dương Vương, Phường An Lạc, Quận Bình Tân, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Khang Điền', 'The Privia', 'sale', 'Căn hộ cao cấp', 3100000000.00, '3.1 tỷ', NULL, NULL, 100000000.00, '100 triệu (Cọc thỏa thuận mua)', '46.2 triệu/m²', 'Sổ hồng sở hữu lâu dài', NULL, 'Nội thất bàn giao CĐT An Cường & Hafele', '12.000 đ/m²/tháng', 'Nhận nhà ở ngay', '158 An Dương Vương, Phường An Lạc', 'Quận Bình Tân', 'TP. Hồ Chí Minh', 10.7329000, 106.6198000, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80', 'Khang Điền Bàn Giao', 'bg-emerald-600', 'Vũ Anh Dũng', '0945.678.910', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(8, 'NL-AK-R01', NULL, NULL, 'Cho thuê căn hộ Akari City Nam Long phong cách Nhật Bản', 'Cho thuê căn hộ Akari City Nam Long phong cách Nhật Bản - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 10000000.00, 69.5, 'Đại lộ Võ Văn Kiệt, Phường An Lạc, Quận Bình Tân, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Nam Long', 'Akari City', 'rent', 'Căn hộ cao cấp', NULL, NULL, 10000000.00, '10 triệu/tháng', 20000000.00, '20 triệu (Cọc 2 tháng)', '144.000 đ/m²', 'Sổ hồng riêng', '1 năm', 'Đầy đủ nội thất tối giản phong cách Muji Nhật Bản', '10.000 đ/m²/tháng', 'Ở ngay', 'Đại lộ Võ Văn Kiệt, Phường An Lạc', 'Quận Bình Tân', 'TP. Hồ Chí Minh', 10.7225000, 106.6212000, 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&auto=format&fit=crop&q=80', 'Chuẩn Nhật Bản', 'bg-rose-600', 'Bùi Văn Quang', '0902.445.566', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(9, 'NL-MIZ-S01', NULL, NULL, 'Căn hộ Mizuki Park Bình Chánh khu đô thị kênh đào xanh mát', 'Căn hộ Mizuki Park Bình Chánh khu đô thị kênh đào xanh mát - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 2850000000.00, 71, 'Đại lộ Nguyễn Văn Linh, Xã Bình Hưng, Huyện Bình Chánh, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Nam Long', 'Mizuki Park', 'sale', 'Căn hộ cao cấp', 2850000000.00, '2.85 tỷ', NULL, NULL, 50000000.00, '50 triệu (Cọc giữ chỗ)', '40 triệu/m²', 'Đã có sổ hồng', NULL, 'Nội thất cơ bản, hệ thống tủ bếp, sàn gỗ phòng ngủ', '11.500 đ/m²/tháng', 'Công chứng ngay', 'Đại lộ Nguyễn Văn Linh, Xã Bình Hưng', 'Huyện Bình Chánh', 'TP. Hồ Chí Minh', 10.7188000, 106.6698000, 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&auto=format&fit=crop&q=80', 'Đã có sổ hồng', 'bg-indigo-600', 'Nguyễn Thị Kim Chi', '0938.990.112', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(10, 'SUN-TC-R01', NULL, NULL, 'Căn hộ Sun Grand City 69 Thụy Khuê view trọn Hồ Tây lộng gió', 'Căn hộ Sun Grand City 69 Thụy Khuê view trọn Hồ Tây lộng gió - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 28000000.00, 90, '69 Thụy Khuê, Phường Thụy Khuê, Quận Tây Hồ, Hà Nội', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Sun Group', 'Sun Grand City Thụy Khuê', 'rent', 'Căn hộ cao cấp', NULL, NULL, 28000000.00, '28 triệu/tháng', 56000000.00, '56 triệu (Cọc 2 tháng)', '311.000 đ/m²', 'Sổ hồng sở hữu lâu dài', '1 năm', 'Nội thất quý tộc châu Âu, máy sấy, lò vi sóng, bếp từ Bosch', '18.000 đ/m²/tháng', 'Nhận nhà lập tức', '69 Thụy Khuê, Phường Thụy Khuê', 'Quận Tây Hồ', 'Hà Nội', 21.0436000, 105.8247000, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80', 'View Hồ Tây Đỉnh', 'bg-blue-600', 'Đỗ Quang Vinh', '0982.777.666', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(11, 'SUN-CSM-S01', NULL, NULL, 'Căn hộ Sun Cosmo Residence bên cầu Trần Thị Lý - Sun Group Đà Nẵng', 'Căn hộ Sun Cosmo Residence bên cầu Trần Thị Lý - Sun Group Đà Nẵng - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 4200000000.00, 70, 'Đường Trần Hưng Đạo, Phường An Hải Tây, Quận Sơn Trà, Đà Nẵng', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Sun Group', 'Sun Cosmo Residence', 'sale', 'Căn hộ cao cấp', 4200000000.00, '4.2 tỷ', NULL, NULL, 100000000.00, '100 triệu (Cọc giữ căn view sông Hàn)', '60 triệu/m²', 'Sở hữu lâu dài, ký HĐMB', NULL, 'Bàn giao full nội thất liền tường chuẩn resort Sun Group', '15.000 đ/m²/tháng', 'Bàn giao quý 4', 'Đường Trần Hưng Đạo, Phường An Hải Tây', 'Quận Sơn Trà', 'Đà Nẵng', 16.0538000, 108.2324000, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80', 'Sun Group Đà Nẵng', 'bg-cyan-600', 'Phan Anh Tuấn', '0915.234.567', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(12, 'HT-Q7-R01', NULL, NULL, 'Căn hộ Q7 Saigon Riverside Đào Trí view sông Sài Gòn thoáng mát', 'Căn hộ Q7 Saigon Riverside Đào Trí view sông Sài Gòn thoáng mát - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 8500000.00, 67.3, '04 Đào Trí, Phường Phú Thuận, Quận 7, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Hưng Thịnh', 'Q7 Saigon Riverside', 'rent', 'Căn hộ cao cấp', NULL, NULL, 8500000.00, '8.5 triệu/tháng', 17000000.00, '17 triệu (Cọc 2 tháng)', '126.000 đ/m²', 'HĐMB Hưng Thịnh', '1 năm', 'Full nội thất sofa, tivi, giường, nệm, tủ quần áo, máy lạnh', '11.000 đ/m²/tháng', 'Dọn vào ở ngay', '04 Đào Trí, Phường Phú Thuận', 'Quận 7', 'TP. Hồ Chí Minh', 10.7289000, 106.7412000, '/property-images/photo-1522708323590-d24dbb6b0267.jpg', 'Hưng Thịnh Giá Tốt', 'bg-sky-600', 'Lê Thanh Hằng', '0937.123.789', '2026-10-15 06:56:16', '2026-10-27 18:55:05'),
(13, 'HT-ML-S01', NULL, NULL, 'Căn hộ Moonlight Residences Đặng Văn Bi Thủ Đức ngay ga Metro', 'Căn hộ Moonlight Residences Đặng Văn Bi Thủ Đức ngay ga Metro - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 2700000000.00, 65, '102 Đặng Văn Bi, Phường Bình Thọ, TP. Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Hưng Thịnh', 'Moonlight Residences', 'sale', 'Căn hộ cao cấp', 2700000000.00, '2.7 tỷ', NULL, NULL, 50000000.00, '50 triệu (Cọc mua)', '41.5 triệu/m²', 'Đã có sổ hồng riêng', NULL, 'Để lại toàn bộ nội thất cao cấp', '9.500 đ/m²/tháng', 'Công chứng trong ngày', '102 Đặng Văn Bi, Phường Bình Thọ', 'TP. Thủ Đức', 'TP. Hồ Chí Minh', 10.8427000, 106.7663000, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80', 'Cạnh Ga Metro', 'bg-emerald-600', 'Trương Quốc Bảo', '0908.456.789', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(14, 'HL-CL-R01', NULL, NULL, 'Căn hộ Him Lam Chợ Lớn Quận 6 diện tích lớn 84m² 2PN', 'Căn hộ Him Lam Chợ Lớn Quận 6 diện tích lớn 84m² 2PN - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 11500000.00, 84, '491 Hậu Giang, Phường 11, Quận 6, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Him Lam', 'Him Lam Chợ Lớn', 'rent', 'Căn hộ cao cấp', NULL, NULL, 11500000.00, '11.5 triệu/tháng', 23000000.00, '23 triệu (Cọc 2 tháng)', '136.000 đ/m²', 'Sổ hồng vĩnh viễn', '1 năm', 'Đầy đủ nội thất gỗ tự nhiên sang trọng, máy lạnh đầy đủ', '7.000 đ/m²/tháng (Rất rẻ)', 'Nhận nhà ngay', '491 Hậu Giang, Phường 11', 'Quận 6', 'TP. Hồ Chí Minh', 10.7487000, 106.6341000, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80', 'Him Lam Chất Lượng', 'bg-teal-600', 'Lâm Quốc Cường', '0913.987.654', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(15, 'HL-RS-S01', NULL, NULL, 'Căn hộ Him Lam Riverside Quận 7 khu đô thị Him Lam Tân Hưng', 'Căn hộ Him Lam Riverside Quận 7 khu đô thị Him Lam Tân Hưng - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 4600000000.00, 100, 'Đường D1, Khu đô thị Him Lam, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh', NULL, NULL, NULL, 3, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Him Lam', 'Him Lam Riverside', 'sale', 'Căn hộ cao cấp', 4600000000.00, '4.6 tỷ', NULL, NULL, 100000000.00, '100 triệu (Cọc mua)', '46 triệu/m²', 'Sổ hồng cầm tay', NULL, 'Nội thất cao cấp, sàn gỗ, thiết bị vệ sinh TOTO', '12.000 đ/m²/tháng', 'Sang tên ngay', 'Đường D1, Khu đô thị Him Lam, Phường Tân Hưng', 'Quận 7', 'TP. Hồ Chí Minh', 10.7495000, 106.6961000, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', 'Sổ hồng trao tay', 'bg-blue-600', 'Nguyễn Hoàng Minh', '0903.889.900', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(16, 'FLC-TW-R01', NULL, NULL, 'Căn hộ FLC Twin Towers 265 Cầu Giấy trung tâm Hà Nội', 'Căn hộ FLC Twin Towers 265 Cầu Giấy trung tâm Hà Nội - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 16000000.00, 97, '265 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội', NULL, NULL, NULL, 3, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'FLC', 'FLC Twin Towers', 'rent', 'Căn hộ cao cấp', NULL, NULL, 16000000.00, '16 triệu/tháng', 32000000.00, '32 triệu (Cọc 2 tháng)', '165.000 đ/m²', 'Sổ đỏ lâu dài', '1 năm', 'Full nội thất nhập khẩu, 3 điều hòa Daikin, máy rửa bát', '12.000 đ/m²/tháng', 'Ở ngay', '265 Cầu Giấy, Phường Dịch Vọng', 'Quận Cầu Giấy', 'Hà Nội', 21.0335000, 105.7951000, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80', 'FLC Cầu Giấy', 'bg-indigo-600', 'Trịnh Mai Lan', '0971.222.333', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(17, 'FLC-PRE-S01', NULL, NULL, 'Liền kề shophouse FLC Premier Parc Đại Mỗ Nam Từ Liêm', 'Liền kề shophouse FLC Premier Parc Đại Mỗ Nam Từ Liêm - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 9500000000.00, 90, 'Đường 70 mới, Phường Đại Mỗ, Quận Nam Từ Liêm, Hà Nội', NULL, NULL, NULL, 4, 4, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'FLC', 'FLC Premier Parc', 'sale', 'Nhà phố / Liền kề', 9500000000.00, '9.5 tỷ', NULL, NULL, 200000000.00, '200 triệu (Cọc mua)', '105 triệu/m²', 'Sổ đỏ lâu dài', NULL, 'Xây thô hoàn thiện mặt ngoài 4 tầng 1 tum', '10.000 đ/m²', 'Bàn giao ngay', 'Đường 70 mới, Phường Đại Mỗ', 'Quận Nam Từ Liêm', 'Hà Nội', 20.9882000, 105.7593000, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80', 'Kiến trúc Pháp', 'bg-amber-600', 'Hoàng Khắc Tiệp', '0988.765.432', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(18, 'BIM-MRN-R01', NULL, NULL, 'Căn hộ Green Bay Towers Halong Marina view trọn vịnh Hạ Long', 'Căn hộ Green Bay Towers Halong Marina view trọn vịnh Hạ Long - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 10500000.00, 75, 'Đường Hoàng Quốc Việt, Phường Hùng Thắng, TP. Hạ Long, Quảng Ninh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'BIM Group', 'Halong Marina', 'rent', 'Căn hộ cao cấp', NULL, NULL, 10500000.00, '10.5 triệu/tháng', 21000000.00, '21 triệu (Cọc 2 tháng)', '140.000 đ/m²', 'Sổ đỏ sở hữu lâu dài', '1 năm', 'Đầy đủ tiện nghi nội thất nghỉ dưỡng, view biển Bãi Cháy', '10.000 đ/m²/tháng', 'Vào ở ngay', 'Đường Hoàng Quốc Việt, Phường Hùng Thắng', 'TP. Hạ Long', 'Quảng Ninh', 20.9498000, 107.0112000, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80', 'View Vịnh Hạ Long', 'bg-cyan-600', 'Đoàn Hải Long', '0936.111.444', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(19, 'BIM-ICPQ-S01', NULL, NULL, 'Biệt thự biển InterContinental Phu Quoc Long Beach Resort', 'Biệt thự biển InterContinental Phu Quoc Long Beach Resort - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 22000000000.00, 300, 'Bãi Trường, Xã Dương Tơ, TP. Phú Quốc, Kiên Giang', NULL, NULL, NULL, 3, 4, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'BIM Group', 'InterContinental Phu Quoc', 'sale', 'Biệt thự nghỉ dưỡng', 22000000000.00, '22 tỷ', NULL, NULL, 500000000.00, '500 triệu (Cọc giữ căn)', '73 triệu/m²', 'Sổ hồng sở hữu nghỉ dưỡng', NULL, 'Full nội thất chuẩn 5 sao quốc tế IHG', 'Chia sẻ doanh thu 85/15', 'Đang vận hành khai thác', 'Bãi Trường, Xã Dương Tơ', 'TP. Phú Quốc', 'Kiên Giang', 10.1472000, 103.9781000, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80', 'Resort 5 Sao', 'bg-purple-600', 'BIM Land Investment', '0909.888.999', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(20, 'KO-LP-R01', NULL, NULL, 'Căn hộ Legacy Prime Thuận An Bình Dương giá thuê sinh viên', 'Căn hộ Legacy Prime Thuận An Bình Dương giá thuê sinh viên - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 6500000.00, 45, 'Đường Thuận Giao 25, Phường Thuận Giao, TP. Thuận An, Bình Dương', NULL, NULL, NULL, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Kim Oanh', 'Legacy Prime', 'rent', 'Căn hộ cao cấp', NULL, NULL, 6500000.00, '6.5 triệu/tháng', 13000000.00, '13 triệu (Cọc 2 tháng)', '144.000 đ/m²', 'HĐMB Kim Oanh Group', '1 năm', 'Nội thất cơ bản, rèm, tủ bếp, 2 máy lạnh', '8.000 đ/m²/tháng', 'Ở ngay', 'Đường Thuận Giao 25, Phường Thuận Giao', 'TP. Thuận An', 'Bình Dương', 10.9523000, 106.7118000, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80', 'Giá siêu mềm', 'bg-green-600', 'Lê Thị Thúy Nga', '0963.888.111', '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(21, 'KO-CC-S01', NULL, NULL, 'Đất nền sổ đỏ Century City Long Thành đón đầu sân bay quốc tế', 'Đất nền sổ đỏ Century City Long Thành đón đầu sân bay quốc tế - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.', 2200000000.00, 100, 'Đường ĐT 769, Xã Bình Sơn, Huyện Long Thành, Đồng Nai', NULL, NULL, NULL, 1, 1, 1, 'Đông Nam', 'Sổ hồng', NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Kim Oanh', 'Century City', 'sale', 'Nhà phố liền kề', 2200000000.00, '2.2 tỷ', NULL, NULL, 50000000.00, '50 triệu (Cọc công chứng)', '22 triệu/m²', 'Sổ đỏ riêng từng nền, xây dựng ngay', NULL, 'Đất nền hạ tầng đồng bộ điện âm nước máy', 'Miễn phí', 'Xây nhà ngay', 'Đường ĐT 769, Xã Bình Sơn', 'Huyện Long Thành', 'Đồng Nai', 10.8123000, 107.0192000, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80', 'Sát Sân Bay Long Thành', 'bg-orange-600', 'Nguyễn Văn Toàn', '0944.555.666', '2026-10-15 06:56:16', '2026-10-16 06:07:20'),
(22, 'A101', NULL, NULL, 'Căn hộ chung cư cao cấp A101', NULL, 15000000.00, 75.5, 'Phòng A101, Tầng 10, Tòa Landmark Plus, 208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 15000000.00, NULL, 30000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1502672260266-1c1ef2d93688.jpg', NULL, NULL, NULL, NULL, '2026-10-23 07:20:34', '2026-10-27 18:55:07'),
(27, 'LM81-402', NULL, NULL, 'P.402 Tòa Landmark 81', NULL, 25000000.00, 75, 'Tòa Landmark 81, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, P.22, Bình Thạnh', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 25000000.00, NULL, 50000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:29', '2026-10-27 18:55:07'),
(28, 'VHCP-1205', NULL, NULL, 'P.1205 Vinhomes Central Park', NULL, 18000000.00, 75, 'Tòa Park 5, Vinhomes Central Park, Bình Thạnh, TP.HCM', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 18000000.00, NULL, 36000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1502672260266-1c1ef2d93688.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:29', '2026-10-27 18:55:07'),
(29, 'MTD-A108', NULL, NULL, 'Căn A1-08 Masteri Thảo Điền', NULL, 16000000.00, 75, 'Tháp T1, Masteri Thảo Điền, 159 Xa lộ Hà Nội, Thảo Điền, TP. Thủ Đức', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 16000000.00, NULL, 32000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:29', '2026-10-27 18:55:07'),
(30, 'SRC-704', NULL, NULL, 'P.704 Sunrise City Quận 7', NULL, 20000000.00, 75, 'Tháp V3, Sunrise City, 23 Nguyễn Hữu Thọ, Tân Hưng, Quận 7', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 20000000.00, NULL, 40000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1522708323590-d24dbb6b0267.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:29', '2026-10-27 18:55:07'),
(31, 'MAP-1802', NULL, NULL, 'P.1802 Masteri An Phú', NULL, 14000000.00, 75, '179 Xa lộ Hà Nội, An Phú, TP. Thủ Đức, TP.HCM', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 14000000.00, NULL, 28000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1522708323590-d24dbb6b0267.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:29', '2026-10-27 18:55:07'),
(32, 'BTP-303', NULL, NULL, 'P.303 Botanica Premier', NULL, 12500000.00, 75, '108 Hồng Hà, Phường 2, Tân Bình, TP.HCM', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 12500000.00, NULL, 25000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1560448204-e02f11c3d0e2.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:30', '2026-10-27 18:55:07'),
(33, 'TSA-901', NULL, NULL, 'P.901 The Sun Avenue', NULL, 13000000.00, 75, '28 Mai Chí Thọ, An Phú, TP. Thủ Đức, TP.HCM', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 13000000.00, NULL, 26000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1560448204-e02f11c3d0e2.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:30', '2026-10-27 18:55:07'),
(34, 'FEV-1508', NULL, NULL, 'P.1508 Feliz En Vista', NULL, 22000000.00, 75, '01 Phan Văn Đáng, Thạnh Mỹ Lợi, TP. Thủ Đức, TP.HCM', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 22000000.00, NULL, 44000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:30', '2026-10-27 18:55:07'),
(35, 'GV-502', NULL, NULL, 'P.502 The Gold View', NULL, 11000000.00, 75, '346 Bến Vân Đồn, Phường 1, Quận 4, TP.HCM', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 11000000.00, NULL, 22000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1560448204-e02f11c3d0e2.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:30', '2026-10-27 18:55:07'),
(36, 'GWT-1102', NULL, NULL, 'P.1102 Gateway Thảo Điền', NULL, 30000000.00, 75, '02 Lê Thước, Thảo Điền, TP. Thủ Đức, TP.HCM', NULL, NULL, NULL, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'rent', 'Căn hộ cao cấp', NULL, NULL, 30000000.00, NULL, 60000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TP. Hồ Chí Minh', NULL, NULL, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 13:51:30', '2026-10-27 18:55:07'),
(37, 'DEMO-GIA-001', 1, 1, 'BĐS mẫu 01 — Căn hộ cao cấp', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 1000.00, 50, '10 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:10', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Căn hộ cao cấp', 1000.00, '1.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '10 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8201000, 106.7301000, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:10', '2026-10-26 16:39:10'),
(38, 'DEMO-GIA-002', 1, 2, 'BĐS mẫu 02 — Nhà phố liền kề', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 2000.00, 55, '20 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 3, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Nhà phố liền kề', 2000.00, '2.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '20 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8202000, 106.7302000, '/property-images/photo-1600585154340-be6161a56a0c.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(39, 'DEMO-GIA-003', 1, 3, 'BĐS mẫu 03 — Biệt thự đơn lập', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 3000.00, 60, '30 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Biệt thự đơn lập', 3000.00, '3.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '30 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8203000, 106.7303000, '/property-images/photo-1522708323590-d24dbb6b0267.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(40, 'DEMO-GIA-004', 1, 4, 'BĐS mẫu 04 — Shophouse thương mại', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 4000.00, 65, '40 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Shophouse thương mại', 4000.00, '4.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '40 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8204000, 106.7304000, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(41, 'DEMO-GIA-005', 1, 5, 'BĐS mẫu 05 — Đất nền dự án', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 5000.00, 70, '50 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 3, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Đất nền dự án', 5000.00, '5.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '50 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8205000, 106.7305000, '/property-images/photo-1600585154340-be6161a56a0c.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(42, 'DEMO-GIA-006', 1, 6, 'BĐS mẫu 06 — Penthouse Sky Villa', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 1000.00, 75, '60 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Penthouse Sky Villa', 1000.00, '1.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '60 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8206000, 106.7306000, '/property-images/photo-1522708323590-d24dbb6b0267.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(43, 'DEMO-GIA-007', 1, 1, 'BĐS mẫu 07 — Căn hộ cao cấp', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 2000.00, 80, '70 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Căn hộ cao cấp', 2000.00, '2.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '70 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8207000, 106.7307000, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(44, 'DEMO-GIA-008', 1, 2, 'BĐS mẫu 08 — Nhà phố liền kề', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 3000.00, 85, '80 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 3, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Nhà phố liền kề', 3000.00, '3.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '80 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8208000, 106.7308000, '/property-images/photo-1600585154340-be6161a56a0c.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(45, 'DEMO-GIA-009', 1, 3, 'BĐS mẫu 09 — Biệt thự đơn lập', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 4000.00, 90, '90 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Biệt thự đơn lập', 4000.00, '4.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '90 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8209000, 106.7309000, '/property-images/photo-1522708323590-d24dbb6b0267.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(46, 'DEMO-GIA-010', 1, 4, 'BĐS mẫu 10 — Shophouse thương mại', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 5000.00, 95, '100 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Shophouse thương mại', 5000.00, '5.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '100 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8210000, 106.7310000, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(47, 'DEMO-GIA-011', 1, 5, 'BĐS mẫu 11 — Đất nền dự án', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 1000.00, 100, '110 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 3, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Đất nền dự án', 1000.00, '1.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '110 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8211000, 106.7311000, '/property-images/photo-1600585154340-be6161a56a0c.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(48, 'DEMO-GIA-012', 1, 6, 'BĐS mẫu 12 — Penthouse Sky Villa', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 2000.00, 105, '120 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Penthouse Sky Villa', 2000.00, '2.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '120 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8212000, 106.7312000, '/property-images/photo-1522708323590-d24dbb6b0267.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(49, 'DEMO-GIA-013', 1, 1, 'BĐS mẫu 13 — Căn hộ cao cấp', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 3000.00, 110, '130 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Căn hộ cao cấp', 3000.00, '3.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '130 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8213000, 106.7313000, '/property-images/photo-1545324418-cc1a3fa10c00.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(50, 'DEMO-GIA-014', 1, 2, 'BĐS mẫu 14 — Nhà phố liền kề', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 4000.00, 115, '140 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 3, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Nhà phố liền kề', 4000.00, '4.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '140 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8214000, 106.7314000, '/property-images/photo-1600585154340-be6161a56a0c.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11'),
(51, 'DEMO-GIA-015', 1, 3, 'BĐS mẫu 15 — Biệt thự đơn lập', 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.', 5000.00, 120, '150 Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2027-10-26 16:39:11', NULL, NULL, 'Dự án mẫu kiểm thử', 'sale', 'Biệt thự đơn lập', 5000.00, '5.000 đồng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '150 Đường Mẫu', 'Thủ Đức', 'TP. Hồ Chí Minh', 10.8215000, 106.7315000, '/property-images/photo-1522708323590-d24dbb6b0267.jpg', NULL, NULL, NULL, NULL, '2026-10-26 16:39:11', '2026-10-26 16:39:11');

-- --------------------------------------------------------

--
-- Table structure for table `property_images`
--

CREATE TABLE `property_images` (
  `id` bigint UNSIGNED NOT NULL,
  `property_id` bigint UNSIGNED NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_thumbnail` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `property_types`
--

CREATE TABLE `property_types` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `parent_id` int UNSIGNED DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_types`
--

INSERT INTO `property_types` (`id`, `name`, `slug`, `created_at`, `updated_at`, `parent_id`, `description`, `status`) VALUES
(1, 'Căn hộ cao cấp', 'can-ho-cao-cap', '2026-10-15 06:56:15', '2026-10-15 06:56:15', NULL, NULL, 1),
(2, 'Nhà phố liền kề', 'nha-pho-lien-ke', '2026-10-15 06:56:15', '2026-10-15 06:56:15', NULL, NULL, 1),
(3, 'Biệt thự đơn lập', 'biet-thu-don-lap', '2026-10-15 06:56:15', '2026-10-15 06:56:15', NULL, NULL, 1),
(4, 'Shophouse thương mại', 'shophouse-thuong-mai', '2026-10-15 06:56:15', '2026-10-15 06:56:15', NULL, NULL, 1),
(5, 'Đất nền dự án', 'dat-nen-du-an', '2026-10-15 06:56:15', '2026-10-15 06:56:15', NULL, NULL, 1),
(6, 'Penthouse Sky Villa', 'penthouse-sky-villa', '2026-10-15 06:56:15', '2026-10-15 06:56:15', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `provinces`
--

CREATE TABLE `provinces` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `provinces`
--

INSERT INTO `provinces` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'TP. Hồ Chí Minh', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 'TP. Hà Nội', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(3, 'TP. Đà Nẵng', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(4, 'Bình Dương', '2026-10-15 06:56:15', '2026-10-15 06:56:15');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'Quản trị viên toàn quyền hệ thống', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 'BĐS', 'Môi giới BĐS - Quyền đăng và quản lý tin', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(3, 'Owner', 'Chủ sở hữu - Quyền sở hữu và xem báo cáo', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(4, 'Staff', 'Nhân viên - Quyền quản lý hệ thống hạn chế', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(5, 'Customer', 'Khách hàng - Xem, tìm kiếm, lưu tin, đặt lịch hẹn', '2026-10-15 06:56:15', '2026-10-15 06:56:15');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int UNSIGNED NOT NULL,
  `permission_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(1, 2, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(1, 3, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(1, 4, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(1, 5, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(1, 6, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(1, 7, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(1, 8, '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(1, 9, '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(1, 10, '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(1, 11, '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(1, 12, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(1, 13, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(1, 14, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(1, 15, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(1, 16, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(1, 17, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(1, 18, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(1, 27, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(1, 28, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(1, 29, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(1, 30, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(1, 31, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(1, 32, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(1, 33, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(1, 34, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(1, 37, '2026-10-26 06:22:34', '2026-10-26 06:22:34'),
(1, 38, '2026-10-26 06:22:34', '2026-10-26 06:22:34'),
(2, 1, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 2, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 4, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 5, '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 8, '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(2, 9, '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(2, 10, '2026-10-21 07:32:07', '2026-10-21 07:32:07'),
(2, 12, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(2, 13, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(2, 14, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(2, 15, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(2, 16, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(2, 27, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(2, 28, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(2, 29, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(2, 30, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(2, 31, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(2, 32, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(2, 37, '2026-10-26 06:22:34', '2026-10-26 06:22:34'),
(2, 38, '2026-10-26 06:22:34', '2026-10-26 06:22:34'),
(4, 12, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(4, 13, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(4, 14, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(4, 16, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(4, 27, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(4, 28, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(4, 29, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(4, 30, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(4, 31, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(4, 32, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(4, 37, '2026-10-26 06:22:34', '2026-10-26 06:22:34'),
(4, 38, '2026-10-26 06:22:34', '2026-10-26 06:22:34'),
(5, 17, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(5, 18, '2026-10-21 07:32:08', '2026-10-21 07:32:08'),
(5, 33, '2026-10-23 07:11:53', '2026-10-23 07:11:53'),
(5, 34, '2026-10-23 07:11:53', '2026-10-23 07:11:53');

-- --------------------------------------------------------

--
-- Table structure for table `service_packages`
--

CREATE TABLE `service_packages` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `duration_days` int NOT NULL DEFAULT '30',
  `post_limit` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_packages`
--

INSERT INTO `service_packages` (`id`, `name`, `price`, `duration_days`, `post_limit`, `created_at`, `updated_at`) VALUES
(1, 'Gói Cơ Bản (Standard)', 299000.00, 30, 5, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(2, 'Gói Chuyên Nghiệp (VIP)', 799000.00, 30, 20, '2026-10-15 06:56:16', '2026-10-15 06:56:16'),
(3, 'Gói Doanh Nghiệp (Enterprise)', 1999000.00, 60, 100, '2026-10-15 06:56:16', '2026-10-15 06:56:16');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('2IqCFqn5wWXdMjDAFL3BChASD298UHMdh7BZP5XF', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJhRFhBQUs3cWY0VUtvSHR4dzM3dFpIcFF5c29EUzhCN0pmNW14WXhJIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9ub3RpZmljYXRpb25zIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102468),
('43gucgfBjI9nJp09Oacu2d3Z23cbllAJdYWFj6IL', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJCU1B4aFd4WTJoSVhBblAyVlZDRGlKcVkxN3dTUmREU1Q0ZFpTZ1M5IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9jYXRlZ29yaWVzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102801),
('5IeLtVJQ99qrcvvOf5MWab3TzUBBD6aXOGRRpMzR', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJNekNFM0RGSUhSVUZYUTNuSlZEdEF3S2pCdXR5Z3Zkc0w2alZCd2FHIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9icm9rZXItYXNzaWdubWVudHMiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1793102440),
('5KuU7cOQTbWthdRSe7lc9CsjddWl2Q3z2Ofq2iMI', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJSZUlMbUhUS3hOZlVJRGl4czZheWJVOG50M3pnZ3FtMjVzTld2eGhWIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793106438),
('bv2EAoAHxT90EJlg0qKUOrnTLKDK4wXzncSI3NzM', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJybVVaeFpaYzRPTENFc2NIUkROcjlBeDRZdmswYzl3WW5ZVmY4bExCIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC91c2VycyIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793106029),
('cAVbYjtpcA0jSNrPsY2Jok7ZPPbXVygy40z02jTL', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJUTzB3eWRlWGdOcUx5UU85dVd5TUpxMXN0T3NzNW9LSm05eFFFekR2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9yZXBvcnRzXC9zdGF0aXN0aWNzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102817),
('cs4jO6VMixi2tULaIQQIAWEa68v8gR3AwB50Vznk', NULL, '172.20.0.6', 'node', 'eyJfdG9rZW4iOiJrNlNzZk5oTkx1RWVnaWZNWGhEcGRoMWdkM2tWNUVoYkZzVGF2aWN1IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdFwvYXBpXC9wcm9wZXJ0aWVzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793106593),
('DTNpnyiRWGn7VaHTimMMV3C0CzmQby87vI2I1gDj', NULL, '172.20.0.1', 'node', 'eyJfdG9rZW4iOiJmbnBXcjJXd3Vkc3ZWVjZXT0dOMFhvY0FvYzM5aTFLOTFDdE5oWkplIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDgwXC9hcGlcL3Byb3BlcnRpZXMiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1793102487),
('DWNflrQEVBkDlfgkJH90PMvena9BSa7ZtmAC9F1c', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiI4dW1sSFB3WTQycUZEUFBZZ0djbkhuTVNlanlPWmxEeDcza0NBWmx6IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9kYXNoYm9hcmRcL292ZXJ2aWV3Iiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102446),
('e0EKeErkvQqFl3aUs42aGHUfOOAGmanZITxIYwej', 1, '172.20.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiI2QkxKczdOeEhWUjhQc3g1RnlxVnJYblN4YjhIR2ZXbnA2SUt0a1kzIiwibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiOjEsIl9wcmV2aW91cyI6eyJ1cmwiOiJodHRwOlwvXC8xMjcuMC4wLjE6ODA4MFwvYXBpXC9wcm9wZXJ0aWVzP190PTE3OTMxMDk2NzA2NTEiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1793109676),
('ECw5HXww6RdLpXazgN007XKL8LwbA207pF2JsOf0', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJWSkVKNnlNRnF5WEJPMWNuTU5lZFRrQklwSTFDeGNoekFzYzNKZDU2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9kZW1hbmRzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102465),
('FKZv9jCdgyP5ijBU0YFemAkYNCC4TKGXJJxo25ok', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJYdmdNSHBKY2FxcE44UmdFR1VmTDZBRUV2emo4dkNnYkw2Z1o2b0ZhIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9kYXNoYm9hcmRcL292ZXJ2aWV3Iiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102814),
('HdBrOnB7E7JvUH5JdLOjGjtaYBN1AEbAU2xI9Y8L', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJqaFF0Z0ZjcUtpYmowSGxONjI5U1pDbWxoRklkTFZHdDFqNGdxelcwIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9jdXN0b21lcnMiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1793102459),
('iGhIRoxShXmU5vt1ej4TjEsfbK7pKvfhLr46n1Ms', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJ5dXFyaVVOVmN3THZxWEpsM1J5SzNpNGhnUVdqZG9PamtmSFZDQTR1IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9icm9rZXItYXNzaWdubWVudHMiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1793102809),
('kR5EHjtXD1pZrw8TzRRNqulKRTThtFABanMWGbBk', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJKeUoyWk90c1hBdTRlNlJXZ1N0ckV0RHdOU3pxNmtsUjRsSnF1VW1KIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9tZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793102793),
('MkmtQ67EC1VgPUpWcqoyEix2m119NqhH9OMqsIIe', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJ0Mkx3RWt5TGJOYnQzcGpTSnFKZ2EwWnVGOVBYaDM4MVZtTFNUV2NKIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9tZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793106433),
('MtA2OLHLriwu4dxkLc1JsC1Y92pyxITJDi4fpFOW', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJ1VWpPN3FuOWZIUDZaRFZ3bU5Ta0E5eUtKWXB2czFSTzlVTlFSMWFtIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9jYXRlZ29yaWVzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102427),
('NOZLwH59qpH8YgJGQd3Cqx5YsWJ6BEndJ6N5tqxo', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJFUDlKeXVGS2I2Rk93Z1E0ZmRnRHZEY082TE81V2xCaWtZUHI0eGJ5IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9jdXN0b21lcnMiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1793102820),
('Ns6PKGTJ4UsacJYxGTYrXnokBtbDi4qP9yjMXJil', NULL, '172.20.0.6', 'node', 'eyJfdG9rZW4iOiJ1b1FkQk9uSzJSNFBGdVVUOWp3dGQzckdSMlR0V2RwdHZYZ0JJdTg2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdFwvYXBpXC9wcm9wZXJ0aWVzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102485),
('NYJFixWc7wkJD64IwdFU2QVm5vp0YMTbYNAV6Sdj', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiIwcWxhaWVvMHFnUjRqZjVtN1NYTkJrWXhSeTRzM2x3eWVuN2tBUnVkIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9icm9rZXJzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102433),
('OJ46UlY88ZaJES378X2XxYVYpSIuSKDiD758MlBM', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJwa2RzTGNPc29RRVRCOE01QThnTkUwRjN1R2dTVVEzdWpNSFJxNDBLIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9icm9rZXJzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102806),
('rKo8Kx9iHF6CqjH3wLBz2tSHtZ6axu5XnqBU7ofz', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJwc0NqVXdBTXF4ZkYxYjdNYkdMUmJpN1dqTnRXeFZyNzJIOGRnNXZDIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC91c2VycyIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793102795),
('S1QvYuKXU80lQRwOWWC8eCN6VyA6nC9n38t8pyDC', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJlam1Xa0o4cHRUbFM5a2Fyb1d4MjhoUDVGdVpDelhoc0JRWDF3WDhhIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9tZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793102411),
('TvNFH8k9lenUtv8Hh1Paptcgyqja1lMbmkv8rRT9', NULL, '172.20.0.6', 'node', 'eyJfdG9rZW4iOiJlN0NXSG9XTzU4NHlrUHd3VW0wSzRiVzJJNFptYXNyVGxYRG9pN2NMIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdFwvYXBpXC9wcm9wZXJ0aWVzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102795),
('TYv3djaId3yhGC3OlMRF5CBnYZMo0yMXg3YeMSL0', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiI3OENVTHB3c2VBR0R3Wk82RVpyQnpyQXB6aTZDRFU3ZlZCVmd1ck05IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9kZW1hbmRzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102825),
('u0M4DlsrU1k4JEPQqtO8tZGslA1Eim5m6LZglIQk', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJDVWI4MkVJczJzMTdHSkk0UVZsSHNtWFUzeTF1TEdDODR5NHJBTDNJIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC91c2VycyIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793102417),
('u1AoBTBOlvjZJFuEP1jwp4bvdomFkmMEQXY5lfAt', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJ2elBac3p6ZjV4WXg2R1VKQW1iSmdxOW5RbkNwMWhhR0dBSWxJSE5lIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9tZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793105921),
('UZvuBYUfts0fl6CT30TPqp15FYb9d5vdDiILd3rz', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJjSWJuOGg5TWRoYkZRRmpGckxueDZJU1hRYXp1WWRseU5lNmdBMnkzIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9yb2xlcyIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793102422),
('wjQTpzzlkH4tBkCnqQcHTksekpL4H1c28hZDf6mR', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJIRk9hbUdveHBQaGhaSGNVSVRjN1ltcHVESFVUQ3BKc2UwYWlNdFdQIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9ub3RpZmljYXRpb25zIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102827),
('xbkBUSFxYpTnKgICYNmCnmWLoCnmfvQklWeyz5Jv', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJkNGVzcXc3VmZDbmhoMmtWdXBQcVR3ektmRDNqTHUyd0tIc2NTR1JXIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9yb2xlcyIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793102796),
('z7LA00X6YtO4vwXioSjOSLAYPNRyXFWXAiFqqb9J', NULL, '127.0.0.1', 'GuzzleHttp/8', 'eyJfdG9rZW4iOiJYV1Q0VndsblhvazYyNGVDTG1aU2JsdlU5UlVVSW4wNEVmdXRJN0N0IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMVwvYXBpXC9yZXBvcnRzXC9zdGF0aXN0aWNzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793102453);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `transaction_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `source` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `status` tinyint NOT NULL DEFAULT '1',
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `recorded_by` bigint UNSIGNED DEFAULT NULL,
  `client_token` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `transaction_code`, `invoice_id`, `amount`, `source`, `status`, `payment_method`, `reference_code`, `note`, `recorded_by`, `client_token`, `paid_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'TXN-20261020-000001', 21, 16700000.00, 'manual', 1, 'bank_transfer', NULL, NULL, NULL, NULL, '2026-10-20 14:30:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(2, 'TXN-20260724-000001', 22, 30000000.00, 'manual', 1, 'bank_transfer', NULL, NULL, NULL, NULL, '2026-07-24 10:00:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(3, 'TXN-20260804-000001', 24, 15000000.00, 'manual', 1, 'momo', NULL, NULL, NULL, NULL, '2026-08-04 09:15:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(4, 'TXN-20260904-000001', 25, 15000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-09-04 09:15:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(5, 'TXN-20261022-000001', 29, 5000000.00, 'manual', 1, 'zalopay', NULL, NULL, NULL, NULL, '2026-10-22 16:20:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(6, 'TXN-20261013-000001', 30, 4000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-10-13 11:00:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(7, 'TXN-20260724-000002', 32, 30000000.00, 'manual', 1, 'bank_transfer', NULL, NULL, NULL, NULL, '2026-07-24 10:00:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(8, 'TXN-20260804-000002', 34, 28000000.00, 'manual', 1, 'momo', NULL, NULL, NULL, NULL, '2026-08-04 09:15:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(9, 'TXN-20260904-000002', 7, 22000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-09-04 09:15:00', '2026-10-23 07:20:34', '2026-10-23 07:20:34', NULL),
(10, 'TXN-20261022-000002', 38, 5000000.00, 'manual', 1, 'zalopay', NULL, NULL, NULL, NULL, '2026-10-22 16:20:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(11, 'TXN-20261013-000002', 39, 4000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-10-13 11:00:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(12, 'TXN-20260804-000003', 41, 22000000.00, 'manual', 1, 'momo', NULL, NULL, NULL, NULL, '2026-08-04 09:15:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(13, 'TXN-20260904-000003', 9, 24000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-09-04 09:15:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(14, 'TXN-20261022-000003', 45, 5000000.00, 'manual', 1, 'zalopay', NULL, NULL, NULL, NULL, '2026-10-22 16:20:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(15, 'TXN-20261013-000003', 46, 4000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-10-13 11:00:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(16, 'TXN-20260804-000004', 48, 17000000.00, 'manual', 1, 'momo', NULL, NULL, NULL, NULL, '2026-08-04 09:15:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(17, 'TXN-20260904-000004', 11, 27000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-09-04 09:15:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(18, 'TXN-20261022-000004', 52, 5000000.00, 'manual', 1, 'zalopay', NULL, NULL, NULL, NULL, '2026-10-22 16:20:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(19, 'TXN-20261013-000004', 53, 4000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-10-13 11:00:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(20, 'TXN-20260804-000005', 55, 22000000.00, 'manual', 1, 'momo', NULL, NULL, NULL, NULL, '2026-08-04 09:15:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(21, 'TXN-20260904-000005', 14, 17000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-09-04 09:15:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(22, 'TXN-20261022-000005', 59, 5000000.00, 'manual', 1, 'zalopay', NULL, NULL, NULL, NULL, '2026-10-22 16:20:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(23, 'TXN-20261013-000005', 60, 4000000.00, 'manual', 1, 'cash', NULL, NULL, NULL, NULL, '2026-10-13 11:00:00', '2026-10-23 07:20:35', '2026-10-23 07:20:35', NULL),
(24, 'SEED-TXN-202610-LM81-402-01', 73, 25000000.00, 'manual', 1, 'bank_transfer', NULL, '[Dữ liệu mẫu] Chuyển khoản Vietcombank đủ tiền thuê tháng', 2, 'aa2d21e6b85f2b87b2fd8e52e077b3c0', '2026-10-23 00:00:00', '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(25, 'SEED-TXN-202610-VHCP-1205-01', 74, 10000000.00, 'manual', 1, 'bank_transfer', NULL, '[Dữ liệu mẫu] Chuyển khoản đợt 1', 2, 'c0719b17410317a80fd35f6e8fa72822', '2026-10-21 00:00:00', '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(26, 'SEED-TXN-202610-VHCP-1205-02', 74, 8000000.00, 'manual', 1, 'cash', NULL, '[Dữ liệu mẫu] Tiền mặt đợt 2 thanh toán đủ', 2, '9d50448391e9ca162c7ca8c3173643f7', '2026-10-22 00:00:00', '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(27, 'SEED-TXN-202610-SRC-704-01', 76, 5000000.00, 'manual', 1, 'bank_transfer', NULL, '[Dữ liệu mẫu] Chuyển tạm 5 triệu', 2, 'c454b2bca1ef78a5999fcc7cb248197b', '2026-10-19 00:00:00', '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(28, 'SEED-TXN-202610-MAP-1802-01', 77, 6000000.00, 'manual', 1, 'bank_transfer', NULL, '[Dữ liệu mẫu] Đã thanh toán tạm 6 triệu, hẹn ngày 25 trả nốt', 2, '82e195b4316a30c7f3b6571dc7a68e20', '2026-10-25 00:00:00', '2026-10-26 13:51:29', '2026-10-26 13:51:29', NULL),
(29, 'SEED-TXN-202610-BTP-303-01', 78, 5000000.00, 'manual', 1, 'cash', NULL, '[Dữ liệu mẫu] Nộp tiền mặt tại văn phòng 5 triệu', 2, '5b0407d347c18a09dbb7dc745d21bf2a', '2026-10-24 00:00:00', '2026-10-26 13:51:30', '2026-10-26 13:51:30', NULL),
(30, 'SEED-TXN-202610-GWT-1102-01', 82, 30000000.00, 'manual', 1, 'bank_transfer', NULL, '[Dữ liệu mẫu] Chuyển khoản đủ tiền thuê', 2, '41e0b549f863dca81d5f0a963f56e204', '2026-10-24 00:00:00', '2026-10-26 13:51:30', '2026-10-26 13:51:30', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `role_id` int UNSIGNED DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `dark_mode` tinyint NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `version` int UNSIGNED NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `name`, `email`, `password`, `phone`, `avatar`, `is_active`, `dark_mode`, `deleted_at`, `remember_token`, `created_at`, `updated_at`, `version`) VALUES
(1, 1, 'Admin', 'admin@3tvland.vn', '$2y$12$ZhmeGWIq/goc5dl/II6Qj.F0rFOvrbWbj0FOMXxVOCglWFAuj1wbq', '0123456789', '/uploads/avatars/avatar_1_1792392459.jpg', 1, 0, NULL, 'prXFFoZzB6KLmK8vC0E2F6QbNRkXLW46dl3E0mFCiPhgWmia5fsBXTbrLBGf', '2026-10-15 06:56:16', '2026-10-19 06:47:39', 1),
(2, 2, 'Nguyễn Đặng Trường Giang', 'giang.nguyen@3tvland.vn', '$2y$12$4HCK4J/lprTXkRDkwxWzoeN4CmH2qzfd4mdTOIfxB9ZfZe9p1FjHS', '0912345678', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', 1, 0, NULL, NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16', 1),
(3, 2, 'Phạm Lê Hoàng Hào', 'hao.pham@3tvland.vn', '$2y$12$A5sB/SlnZdhVVgAT5.bh4.vBPqbzAAfd3ToPZYI7p3sf10WIozg6S', '0923456789', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', 1, 0, NULL, NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16', 1),
(4, 2, 'Phạm Đoàn Tony Quyền', 'tony.pham@3tvland.vn', '$2y$12$ZJEbyQWiPk/FKdH0uN/Yc.VYCBCZps0Mdn7IblLh5lxHsb4TQN2RS', '0934567890', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80', 1, 0, NULL, NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16', 1),
(5, 5, 'Nguyễn Văn Khách Hàng', 'khachhang@gmail.com', '$2y$12$GcqK2hZovL6tg2HubrP3CeosM.Y.dBguAF/rydtGWe1uBlIO7i8/.', '0987654321', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', 1, 0, NULL, NULL, '2026-10-15 06:56:16', '2026-10-15 06:56:16', 1),
(6, 3, 'Người Dùng Mẫu 1', 'user1@demo.com', '$2y$12$J2WqO7BvvcrR/puTPFfMHe5wuEsaCh5i7TfvzQfJNiuHGVLhR3HTm', '0903630210', 'https://ui-avatars.com/api/?name=User+1&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:17', '2026-10-15 13:37:44', 1),
(7, 2, 'Người Dùng Mẫu 2', 'user2@demo.com', '$2y$12$cL5x3bV3Bxv9tbiGGwkyEeVmKzuLElM4B8FzO1pVu/jFb1ov1JnTC', '0902702873', 'https://ui-avatars.com/api/?name=User+2&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:17', '2026-10-15 06:56:17', 1),
(8, 4, 'Người Dùng Mẫu 3', 'user3@demo.com', '$2y$12$CA5RUdq2dvDXKCnf.G6sC.v.hj6G/ipu0YJHxaMxVO8UUUCmw5Jqm', '0909031179', 'https://ui-avatars.com/api/?name=User+3&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:17', '2026-10-15 06:56:17', 1),
(9, 2, 'Người Dùng Mẫu 4', 'user4@demo.com', '$2y$12$dqVOGWlgM.VdhAkZeobKe.efU9OBnEOdKou528gHFoOfl72HzkVLK', '0908346000', 'https://ui-avatars.com/api/?name=User+4&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:17', '2026-10-15 06:56:17', 1),
(10, 1, 'Người Dùng Mẫu 5', 'user5@demo.com', '$2y$12$v2libDa5bzlEtgg1n7FyPO5qMdlWWyNvew6SDJ/hT6Vd9euH0xDEe', '0905687855', 'https://ui-avatars.com/api/?name=User+5&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:17', '2026-10-15 06:56:17', 1),
(11, 2, 'Người Dùng Mẫu 6', 'user6@demo.com', '$2y$12$j47fyPf/Hv0TmIV4rTkqCOCxU82w6R.4Mf42HiYvENfXRe1hiy1WW', '0901643319', 'https://ui-avatars.com/api/?name=User+6&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:18', '2026-10-27 20:22:06', 2),
(12, 4, 'Người Dùng Mẫu 7', 'user7@demo.com', '$2y$12$epjBSzfzFL7fnY5zsyGd.Ovdu7Yc5t3K8NUpqK2M2M5wVNovEgfia', '0904930990', 'https://ui-avatars.com/api/?name=User+7&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:18', '2026-10-15 06:56:18', 1),
(13, 4, 'Người Dùng Mẫu 8', 'user8@demo.com', '$2y$12$VQHYXq56p4.s9lRXuqLaAus.4cpsW7/LHZx0cqRB7Ik6aQp5E4uka', '0905966986', 'https://ui-avatars.com/api/?name=User+8&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:18', '2026-10-15 06:56:18', 1),
(14, 1, 'Người Dùng Mẫu 9', 'user9@demo.com', '$2y$12$lJUFnRlcapiNg7joI6RhJOgS9mZFdpc965FcPBWckWCAop645CfF2', '0901898843', 'https://ui-avatars.com/api/?name=User+9&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:18', '2026-10-15 06:56:18', 1),
(15, 5, 'Người Dùng Mẫu 10', 'user10@demo.com', '$2y$12$cqDuIiuKqYffANsYufCE3eCXwJgK2aZC0IunPsXJLr0cpKK9.JJOG', '0902174019', 'https://ui-avatars.com/api/?name=User+10&background=random', 1, 0, NULL, NULL, '2026-10-15 06:56:18', '2026-10-15 06:56:18', 1),
(16, 5, 'Nguyễn Văn A', 'nguyenvana@gmail.com', '$2y$12$HWbIhYw0QNRf4AM1ecgmEOadY2osDNSRland0S16H1Z0FvGELugF6', '0912345678', NULL, 1, 0, NULL, 'ig8cMTbd6rIwTCoAs3tYvXhwrWTc09wCvMimtFeJejUL3n3XPhkRur781VwD', '2026-10-23 07:20:34', '2026-10-23 08:34:47', 1),
(21, 5, 'Nguyễn Văn Hùng', 'hung.nguyen.demo@gmail.com', '$2y$12$xsnH6ebxpi3E6EGU0svmtuDnw.s.GXGhGRhPbH4ghCWkQtNgNa3RC', '0901111222', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', 1),
(22, 5, 'Lê Thị Thu', 'thu.le.demo@gmail.com', '$2y$12$mxztZRDHVA.PBDGfzoepP.VUjc2nKxpXSC3qNzvAH/aiR.jtbv7sC', '0902222333', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', 1),
(23, 5, 'Phạm Quốc Dũng', 'dung.pham.demo@gmail.com', '$2y$12$FBzU8DDXN9.qibpIkXyuWu4L6hqRKEXpi9cUFBRRhNTAiOvIkKy4u', '0903333444', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', 1),
(24, 5, 'Đỗ Minh Tuấn', 'tuan.do.demo@gmail.com', '$2y$12$V1gGx7M0qp.vOfwxCQmPHuf7oqgnAAdST66v2YU.uV/NaPJhJT0t2', '0904444555', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', 1),
(25, 5, 'Hoàng Gia Bảo', 'bao.hoang.demo@gmail.com', '$2y$12$JchoY8DheTNccKXNvKRvIez434Wpd0Vgooac/jijK60nDRBCWiX3K', '0905555666', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:29', '2026-10-26 13:51:29', 1),
(26, 5, 'Võ Thùy Linh', 'linh.vo.demo@gmail.com', '$2y$12$.0760Pm5qNhJazprgYjbZ.gjZKrOF8rDzWBZ6xuoKNXu.gPr3QhMq', '0906666777', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', 1),
(27, 5, 'Bùi Anh Quân', 'quan.bui.demo@gmail.com', '$2y$12$chqv4oe2Lyxip..zRuZMpeB3chhqbMi.xmD.LHc6MFtr08gEIqbQ6', '0907777888', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', 1),
(28, 5, 'Trần Mai Phương', 'phuong.tran.demo@gmail.com', '$2y$12$lctngfH4vP6tjCcOy5OuauQx09TcLlWxyAkZNNJxQ.uXKfNWwwkqO', '0908888999', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', 1),
(29, 5, 'Ngô Trí Đức', 'duc.ngo.demo@gmail.com', '$2y$12$gt/Oz2Os8HvajA1VlfUSS./UgdMk8Iq2Knf.N83ZCd2uy9mFX4Ffu', '0909999000', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', 1),
(30, 5, 'Đặng Khánh Ly', 'ly.dang.demo@gmail.com', '$2y$12$l6xzF0Y/nXgc6EZQcs9js.U.epuCfHS19qHo4kWPVgwrlPw5lqsre', '0910000111', NULL, 1, 0, NULL, NULL, '2026-10-26 13:51:30', '2026-10-26 13:51:30', 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_packages`
--

CREATE TABLE `user_packages` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `package_id` bigint UNSIGNED NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wards`
--

CREATE TABLE `wards` (
  `id` int UNSIGNED NOT NULL,
  `district_id` int UNSIGNED NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wards`
--

INSERT INTO `wards` (`id`, `district_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 1, 'Phường Bến Nghé', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(2, 1, 'Phường Đa Kao', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(3, 2, 'Phường 22', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(4, 3, 'Phường Long Thạnh Mỹ', '2026-10-15 06:56:15', '2026-10-15 06:56:15'),
(5, 4, 'Phường Tân Phong', '2026-10-15 06:56:15', '2026-10-15 06:56:15');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_user_id_foreign` (`user_id`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointments_customer_id_foreign` (`customer_id`),
  ADD KEY `appointments_broker_id_foreign` (`broker_id`),
  ADD KEY `appointments_property_id_foreign` (`property_id`);

--
-- Indexes for table `brokers`
--
ALTER TABLE `brokers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `brokers_code_unique` (`code`),
  ADD KEY `brokers_user_id_foreign` (`user_id`),
  ADD KEY `brokers_name_code_index` (`name`,`code`),
  ADD KEY `brokers_status_index` (`status`);

--
-- Indexes for table `broker_assignments`
--
ALTER TABLE `broker_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `broker_assignments_broker_id_foreign` (`broker_id`),
  ADD KEY `broker_assignments_request_code_customer_name_index` (`request_code`,`customer_name`),
  ADD KEY `broker_assignments_status_index` (`status`),
  ADD KEY `broker_assignments_assigned_date_index` (`assigned_date`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_slug_unique` (`slug`);

--
-- Indexes for table `contracts`
--
ALTER TABLE `contracts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `contracts_contract_code_unique` (`contract_code`),
  ADD KEY `contracts_property_id_foreign` (`property_id`),
  ADD KEY `contracts_broker_id_foreign` (`broker_id`),
  ADD KEY `contracts_customer_id_foreign` (`customer_id`),
  ADD KEY `contracts_customer_id_status_index` (`customer_id`,`status`);

--
-- Indexes for table `contract_documents`
--
ALTER TABLE `contract_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contract_documents_contract_id_foreign` (`contract_id`),
  ADD KEY `idx_cd_extension_id` (`extension_id`),
  ADD KEY `contract_documents_uploaded_by_foreign` (`uploaded_by`),
  ADD KEY `contract_documents_contract_id_document_type_index` (`contract_id`,`document_type`),
  ADD KEY `contract_documents_contract_id_deleted_at_index` (`contract_id`,`deleted_at`);

--
-- Indexes for table `contract_extensions`
--
ALTER TABLE `contract_extensions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contract_extensions_contract_id_foreign` (`contract_id`),
  ADD KEY `contract_extensions_created_by_foreign` (`created_by`),
  ADD KEY `contract_extensions_approved_by_foreign` (`approved_by`),
  ADD KEY `idx_ce_contract_status` (`contract_id`,`status`),
  ADD KEY `idx_ce_status_created_at` (`status`,`created_at`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customers_seed_key_unique` (`seed_key`),
  ADD KEY `customers_created_by_foreign` (`created_by`),
  ADD KEY `customers_assigned_to_status_deleted_at_index` (`assigned_to`,`status`,`deleted_at`),
  ADD KEY `customers_is_tracked_index` (`is_tracked`);

--
-- Indexes for table `customer_activities`
--
ALTER TABLE `customer_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_activities_created_by_foreign` (`created_by`),
  ADD KEY `customer_activities_customer_id_status_scheduled_at_index` (`customer_id`,`status`,`scheduled_at`);

--
-- Indexes for table `customer_demands`
--
ALTER TABLE `customer_demands`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customer_demands_seed_key_unique` (`seed_key`),
  ADD KEY `customer_demands_created_by_foreign` (`created_by`),
  ADD KEY `customer_demands_customer_id_deleted_at_index` (`customer_id`,`deleted_at`),
  ADD KEY `customer_demands_property_type_id_status_deleted_at_index` (`property_type_id`,`status`,`deleted_at`);

--
-- Indexes for table `customer_interactions`
--
ALTER TABLE `customer_interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_interactions_actor_id_foreign` (`actor_id`),
  ADD KEY `customer_interactions_customer_id_occurred_at_index` (`customer_id`,`occurred_at`);

--
-- Indexes for table `customer_needs`
--
ALTER TABLE `customer_needs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_needs_customer_id_foreign` (`customer_id`),
  ADD KEY `customer_needs_broker_id_foreign` (`broker_id`),
  ADD KEY `customer_needs_property_type_id_foreign` (`property_type_id`);

--
-- Indexes for table `customer_need_locations`
--
ALTER TABLE `customer_need_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_need_locations_customer_need_id_foreign` (`customer_need_id`),
  ADD KEY `customer_need_locations_province_id_foreign` (`province_id`),
  ADD KEY `customer_need_locations_district_id_foreign` (`district_id`),
  ADD KEY `customer_need_locations_ward_id_foreign` (`ward_id`);

--
-- Indexes for table `districts`
--
ALTER TABLE `districts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `districts_province_id_foreign` (`province_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `favorites_user_id_foreign` (`user_id`),
  ADD KEY `favorites_property_id_foreign` (`property_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoice_no_unique` (`invoice_no`),
  ADD UNIQUE KEY `invoices_contract_type_period_unique` (`contract_id`,`type`,`billing_period_start`),
  ADD KEY `invoices_contract_id_foreign` (`contract_id`),
  ADD KEY `invoices_created_by_foreign` (`created_by`),
  ADD KEY `invoices_contract_id_status_index` (`contract_id`,`status`),
  ADD KEY `invoices_status_due_date_index` (`status`,`due_date`),
  ADD KEY `invoices_contract_id_issue_date_index` (`contract_id`,`issue_date`),
  ADD KEY `invoices_updated_by_foreign` (`updated_by`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_items_invoice_id_foreign` (`invoice_id`),
  ADD KEY `invoice_items_invoice_id_index` (`invoice_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `maintenance_requests_property_id_foreign` (`property_id`),
  ADD KEY `maintenance_requests_user_id_foreign` (`user_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_unique` (`name`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `properties_code_unique` (`code`),
  ADD KEY `properties_user_id_foreign` (`user_id`),
  ADD KEY `properties_property_type_id_foreign` (`property_type_id`),
  ADD KEY `properties_province_id_foreign` (`province_id`),
  ADD KEY `properties_district_id_foreign` (`district_id`),
  ADD KEY `properties_ward_id_foreign` (`ward_id`);

--
-- Indexes for table `property_images`
--
ALTER TABLE `property_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_images_property_id_foreign` (`property_id`);

--
-- Indexes for table `property_types`
--
ALTER TABLE `property_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `property_types_slug_unique` (`slug`),
  ADD KEY `property_types_parent_id_index` (`parent_id`);

--
-- Indexes for table `provinces`
--
ALTER TABLE `provinces`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `role_permissions_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `service_packages`
--
ALTER TABLE `service_packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transactions_transaction_code_unique` (`transaction_code`),
  ADD UNIQUE KEY `transactions_client_token_unique` (`client_token`),
  ADD UNIQUE KEY `transactions_invoice_reference_unique` (`invoice_id`,`reference_code`),
  ADD KEY `transactions_invoice_id_foreign` (`invoice_id`),
  ADD KEY `transactions_recorded_by_foreign` (`recorded_by`),
  ADD KEY `transactions_invoice_id_status_index` (`invoice_id`,`status`),
  ADD KEY `transactions_paid_at_index` (`paid_at`),
  ADD KEY `transactions_status_paid_at_index` (`status`,`paid_at`),
  ADD KEY `transactions_invoice_amount_paid_at_index` (`invoice_id`,`amount`,`paid_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_role_id_foreign` (`role_id`);

--
-- Indexes for table `user_packages`
--
ALTER TABLE `user_packages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_packages_user_id_foreign` (`user_id`),
  ADD KEY `user_packages_package_id_foreign` (`package_id`);

--
-- Indexes for table `wards`
--
ALTER TABLE `wards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wards_district_id_foreign` (`district_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `brokers`
--
ALTER TABLE `brokers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `broker_assignments`
--
ALTER TABLE `broker_assignments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `contracts`
--
ALTER TABLE `contracts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `contract_documents`
--
ALTER TABLE `contract_documents`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `contract_extensions`
--
ALTER TABLE `contract_extensions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `customer_activities`
--
ALTER TABLE `customer_activities`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customer_demands`
--
ALTER TABLE `customer_demands`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `customer_interactions`
--
ALTER TABLE `customer_interactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customer_needs`
--
ALTER TABLE `customer_needs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_need_locations`
--
ALTER TABLE `customer_need_locations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `property_images`
--
ALTER TABLE `property_images`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `property_types`
--
ALTER TABLE `property_types`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `provinces`
--
ALTER TABLE `provinces`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `service_packages`
--
ALTER TABLE `service_packages`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `user_packages`
--
ALTER TABLE `user_packages`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wards`
--
ALTER TABLE `wards`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_property_id_foreign` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `brokers`
--
ALTER TABLE `brokers`
  ADD CONSTRAINT `brokers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `broker_assignments`
--
ALTER TABLE `broker_assignments`
  ADD CONSTRAINT `broker_assignments_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contracts_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contracts_property_id_foreign` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contract_documents`
--
ALTER TABLE `contract_documents`
  ADD CONSTRAINT `contract_documents_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contract_documents_extension_id_foreign` FOREIGN KEY (`extension_id`) REFERENCES `contract_extensions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contract_documents_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `contract_extensions`
--
ALTER TABLE `contract_extensions`
  ADD CONSTRAINT `contract_extensions_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contract_extensions_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contract_extensions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `customers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `customer_activities`
--
ALTER TABLE `customer_activities`
  ADD CONSTRAINT `customer_activities_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `customer_activities_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_demands`
--
ALTER TABLE `customer_demands`
  ADD CONSTRAINT `customer_demands_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `customer_demands_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `customer_demands_property_type_id_foreign` FOREIGN KEY (`property_type_id`) REFERENCES `property_types` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `customer_interactions`
--
ALTER TABLE `customer_interactions`
  ADD CONSTRAINT `customer_interactions_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `customer_interactions_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_needs`
--
ALTER TABLE `customer_needs`
  ADD CONSTRAINT `customer_needs_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `customer_needs_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_needs_property_type_id_foreign` FOREIGN KEY (`property_type_id`) REFERENCES `property_types` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `customer_need_locations`
--
ALTER TABLE `customer_need_locations`
  ADD CONSTRAINT `customer_need_locations_customer_need_id_foreign` FOREIGN KEY (`customer_need_id`) REFERENCES `customer_needs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_need_locations_district_id_foreign` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `customer_need_locations_province_id_foreign` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_need_locations_ward_id_foreign` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `districts`
--
ALTER TABLE `districts`
  ADD CONSTRAINT `districts_province_id_foreign` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_property_id_foreign` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `invoices_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  ADD CONSTRAINT `maintenance_requests_property_id_foreign` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `maintenance_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_district_id_foreign` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `properties_property_type_id_foreign` FOREIGN KEY (`property_type_id`) REFERENCES `property_types` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `properties_province_id_foreign` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `properties_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `properties_ward_id_foreign` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `property_images`
--
ALTER TABLE `property_images`
  ADD CONSTRAINT `property_images_property_id_foreign` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_recorded_by_foreign` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_packages`
--
ALTER TABLE `user_packages`
  ADD CONSTRAINT `user_packages_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `service_packages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_packages_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wards`
--
ALTER TABLE `wards`
  ADD CONSTRAINT `wards_district_id_foreign` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
