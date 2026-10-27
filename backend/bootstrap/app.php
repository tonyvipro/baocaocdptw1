<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(\App\Http\Middleware\RequestDiagnostics::class);
        $middleware->append(\App\Http\Middleware\ValidateInputPolicy::class);
        $middleware->web(append: [\App\Http\Middleware\RecordUserActivity::class]);
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\App\Exceptions\StaleVersionException $e, $request) {
            return $e->render($request);
        });

        $exceptions->render(function (\App\Exceptions\DuplicatePaymentSuspectedException $e, $request) {
            return $e->render($request);
        });

        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                $errorCode = $e->errorInfo[1] ?? 0;
                $message = $e->getMessage();

                // 1406: Data too long
                if ($errorCode == 1406 || str_contains($message, 'Data too long')) {
                    return response()->json([
                        'message' => 'Dữ liệu nhập vượt quá độ dài tối đa cho phép của hệ thống.',
                        'errors' => [
                            'data' => ['Dữ liệu nhập vượt quá độ dài tối đa cho phép.'],
                        ],
                    ], 422);
                }

                // 1048: Column cannot be null
                if ($errorCode == 1048 || str_contains($message, 'cannot be null')) {
                    return response()->json([
                        'message' => 'Dữ liệu bắt buộc không được để trống.',
                        'errors' => [
                            'data' => ['Dữ liệu bắt buộc không được để trống.'],
                        ],
                    ], 422);
                }

                // 1264: Out of range value
                if ($errorCode == 1264 || str_contains($message, 'Out of range')) {
                    return response()->json([
                        'message' => 'Giá trị số vượt quá phạm vi cho phép.',
                        'errors' => [
                            'data' => ['Giá trị số vượt quá phạm vi cho phép.'],
                        ],
                    ], 422);
                }

                // 1213 / 1205: Deadlock / Lock wait timeout
                if (in_array($errorCode, [1213, 1205]) || str_contains($message, 'Deadlock') || str_contains($message, 'Lock wait timeout')) {
                    return response()->json([
                        'code' => 'LOCK_TIMEOUT',
                        'message' => 'Hệ thống đang bận do có nhiều thao tác đồng thời. Vui lòng thử lại sau giây lát.',
                    ], 409);
                }

                // Nếu debug tắt, che giấu SQL
                if (!config('app.debug')) {
                    return response()->json([
                        'message' => 'Đã xảy ra lỗi cơ sở dữ liệu. Vui lòng liên hệ quản trị viên.',
                    ], 500);
                }
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, $request) {
            if ($e->getStatusCode() === 413 && ($request->expectsJson() || $request->is('api/*'))) {
                return response()->json([
                    'message' => 'Dung lượng yêu cầu vượt quá giới hạn tối đa cho phép.',
                ], 413);
            }
        });
    })->create();
