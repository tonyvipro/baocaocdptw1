#!/bin/bash

echo "==================================================="
echo "[1/3] Đang kéo mã nguồn mới nhất từ GitHub..."
echo "==================================================="
git pull origin master

echo ""
echo "==================================================="
echo "[2/3] Đang cập nhật và khởi chạy môi trường Docker..."
echo "==================================================="
docker-compose down
docker-compose up -d --build

echo ""
echo "==================================================="
echo "[3/3] Hoàn tất cập nhật CI/CD thành công!"
echo "Truy cập ứng dụng tại: http://localhost:8080"
echo "==================================================="
