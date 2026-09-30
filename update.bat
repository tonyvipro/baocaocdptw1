@echo off
cls
echo [1/4] Dang keo code moi nhat tu GitHub...
git pull origin master

echo.
echo [2/4] Dang build va khoi dong lai Docker...
docker-compose down
docker-compose up -d --build

echo.
echo [3/4] Dang kiem tra va cai dat Composer...
docker-compose exec -T web composer install --no-interaction --prefer-dist
docker-compose exec -T web php artisan key:generate --force
docker-compose exec -T web chmod -R 777 storage bootstrap/cache

echo.
echo [4/4] Hoan tat cap nhat thanh cong!
echo Mo trinh duyet va truy cap: http://localhost:8080
echo.
pause
