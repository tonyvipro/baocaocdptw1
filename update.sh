#!/bin/bash

echo "==================================================="
echo "[1/4] Đang kéo mã nguồn mới nhất từ GitHub..."
echo "==================================================="
git pull origin master

echo ""
echo "==================================================="
echo "[2/4] Đang build và khởi chạy môi trường Docker..."
echo "==================================================="
docker-compose down
docker-compose up -d --build

echo ""
echo "==================================================="
echo "[3/4] Đang cài đặt thư viện Composer bên trong container..."
echo "==================================================="
docker-compose exec -T web composer install --no-interaction --prefer-dist
docker-compose exec -T web php artisan key:generate --force 2>/dev/null || true
docker-compose exec -T web chmod -R 777 storage bootstrap/cache 2>/dev/null || true

echo ""
echo "==================================================="
echo "[4/4] Hoàn tất cập nhật CI/CD thành công!"
echo "Truy cập ứng dụng tại: http://localhost:8080"
echo "==================================================="
