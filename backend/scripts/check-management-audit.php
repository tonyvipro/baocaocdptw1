<?php

// Read-only HTTP smoke checks using an ephemeral token, always revoked on exit.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$admin = App\Models\User::where('role_id', 1)->where('is_active', true)->firstOrFail();
$token = $admin->createToken('management-audit-smoke', ['*'], now()->addMinutes(5));
$failed = false;
$probe = null;
try {
    $paths = in_array('--verify-audit', $argv, true) ? ['me'] : ['me', 'users', 'roles', 'categories', 'brokers', 'broker-assignments', 'dashboard/overview',
        'reports/statistics', 'customers', 'demands', 'notifications', 'search/properties?q=thao%20dien'];
    foreach ($paths as $path) {
        $response = Illuminate\Support\Facades\Http::acceptJson()->withToken($token->plainTextToken)
            ->timeout(60)->get('http://127.0.0.1/api/'.$path);
        echo $path.': '.$response->status().PHP_EOL;
        if (!$response->successful()) {
            $failed = true;
            // Print the friendly message only, never a SQL trace or bearer token.
            echo (string) $response->json('message').PHP_EOL;
        }
    }
    if (in_array('--verify-audit', $argv, true)) {
        if (app()->environment('production')) throw new RuntimeException('Audit write probe is development-only.');
        $probe = App\Models\Category::create(['name' => 'Kiểm thử nhật ký tạm', 'slug' => 'audit-probe-'.Illuminate\Support\Str::uuid(), 'status' => 'active']);
        $response = Illuminate\Support\Facades\Http::acceptJson()->withToken($token->plainTextToken)->timeout(60)
            ->put('http://127.0.0.1/api/categories/'.$probe->id, ['version' => 1, 'name' => 'Kiểm thử nhật ký đã sửa']);
        $log = App\Models\ActivityLog::where('table_name', 'categories')->where('record_id', $probe->id)->latest('id')->first();
        $change = $log?->new_data['changes'][0] ?? null;
        $valid = $response->successful() && ($change['field'] ?? '') === 'name'
            && ($change['before'] ?? '') === 'Kiểm thử nhật ký tạm' && ($change['after'] ?? '') === 'Kiểm thử nhật ký đã sửa';
        echo 'Detailed audit write probe: '.($valid ? 'PASS' : 'FAIL').PHP_EOL;
        if (!$valid) $failed = true;
    }
} catch (Throwable $error) {
    $failed = true;
    echo 'Smoke check failed: '.$error->getMessage().PHP_EOL;
} finally {
    if ($probe) {
        // Only remove the uniquely created probe and its own logs.
        App\Models\ActivityLog::where('table_name', 'categories')->where('record_id', $probe->id)->delete();
        $probe->forceDelete();
    }
    $token->accessToken->delete();
}
exit($failed ? 1 : 0);
