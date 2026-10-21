<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class RequestDiagnostics
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->is('api/*')) return $next($request);
        $id = (string) Str::uuid();
        $request->attributes->set('request_id', $id);
        Log::withContext(['request_id' => $id]);
        $started = hrtime(true);
        try {
            $response = $next($request);
        } catch (\Throwable $error) {
            $handler = app(\Illuminate\Contracts\Debug\ExceptionHandler::class);
            $handler->report($error);
            $response = $handler->render($request, $error);
        }
        $response->headers->set('X-Request-ID', $id);
        if (config('app.debug') && app()->environment('local')) {
            $response->headers->set('Server-Timing', 'app;dur='.round((hrtime(true) - $started) / 1e6, 2));
        }
        if ($response->getStatusCode() >= 500) {
            Log::error('API request failed', ['method' => $request->method(), 'path' => $request->path(), 'status' => $response->getStatusCode()]);
        }
        return $response;
    }
}
