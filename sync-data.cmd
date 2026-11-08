@echo off
chcp 65001 > nul
echo ========================================================
echo   3TV LAND - ĐỒNG BỘ DỮ LIỆU & ELASTICSEARCH TỰ ĐỘNG
echo ========================================================
echo.

docker ps >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/2] Phat hien Docker dang chay. Tien hanh dong bo trong Docker container...
    docker exec baocaocdptw1_backend php artisan migrate --force
    docker exec baocaocdptw1_backend php artisan data:sync-all
    goto :done
)

echo [1/2] Docker khong chay hoac khong the ket noi. Su dung PHP tren may local...
set "PHP_EXE=C:\wamp64\bin\php\php8.4.25\php.exe"
if not exist "%PHP_EXE%" set "PHP_EXE=C:\wamp64\bin\php\php8.4.15\php.exe"
if not exist "%PHP_EXE%" (
    where php >nul 2>&1
    if %errorlevel% equ 0 (
        set "PHP_EXE=php"
    ) else (
        echo [LOI] Khong tim thay PHP 8.4 hoac Docker de chay lenh!
        pause
        exit /b 1
    )
)

echo Dang su dung: %PHP_EXE%
cd /d "%~dp0backend"
"%PHP_EXE%" artisan migrate --force
"%PHP_EXE%" artisan data:sync-all

:done
echo.
echo ========================================================
echo   DONG BO HOAN TAT!
echo ========================================================
pause

