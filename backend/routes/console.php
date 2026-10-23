<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('contracts:process-expiry')->dailyAt('00:00');
Schedule::command('invoices:generate-rent')->dailyAt('00:15');
Schedule::command('invoices:mark-overdue')->dailyAt('00:20');

Artisan::command('brokers:sync-users', function () {
    $created = 0;
    \Illuminate\Support\Facades\DB::transaction(function () use (&$created) {
        foreach (\App\Models\User::where('role_id', 2)->get() as $user) {
            if (\App\Models\Broker::withTrashed()->where('user_id', $user->id)->exists()) continue;
            $code = 'MG-U'.$user->id;
            while (\App\Models\Broker::withTrashed()->where('code', $code)->exists()) $code .= '-'.strtolower(\Illuminate\Support\Str::random(4));
            \App\Models\Broker::create([
                'user_id' => $user->id, 'code' => $code, 'name' => $user->name,
                'phone' => $user->phone, 'email' => $user->email,
                'level' => 'Chuyên viên', 'status' => $user->is_active ? 'active' : 'inactive',
            ]);
            $created++;
        }
    });
    $this->info('Đã thêm '.$created.' hồ sơ từ tài khoản môi giới. Giữ nguyên hồ sơ hiện có.');
})->purpose('Bổ sung hồ sơ từ tài khoản môi giới, không ghi đè hoặc khôi phục hồ sơ đã xóa');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('properties:sync {--check : Chỉ đối chiếu, không ghi dữ liệu}', function () {
    $path = database_path('data/all_properties.json');
    $rows = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    $codes = array_column($rows, 'code');
    $existing = \App\Models\Property::withTrashed()->pluck('code')->all();
    $missing = array_values(array_diff($codes, $existing));
    $this->info('Database: '.\Illuminate\Support\Facades\DB::connection()->getDatabaseName());
    $this->line('File: '.count($rows).' | Database (gồm thùng rác): '.count($existing).' | Thiếu từ file: '.count($missing));
    if (!$this->option('check')) {
        \Illuminate\Support\Facades\DB::transaction(fn () => app(\Database\Seeders\PropertySeeder::class)->run());
        $this->info('Đã nhập bản ghi thiếu. Tổng database: '.\App\Models\Property::withTrashed()->count().'. Giữ nguyên các chỉnh sửa và tin đã xóa.');
    }
})->purpose('Nhập BĐS còn thiếu từ file, giữ database làm nguồn chính');

Artisan::command('properties:sync-types', function () {
    \Illuminate\Support\Facades\DB::transaction(function () {
        foreach (\App\Models\Property::withTrashed()->whereNotNull('type')->distinct()->pluck('type') as $name) {
            if (!trim($name)) continue;
            $type = \App\Models\PropertyType::where('name', $name)->first();
            if (!$type) {
                $slug = \Illuminate\Support\Str::slug($name) ?: 'bat-dong-san';
                while (\App\Models\PropertyType::where('slug', $slug)->exists()) $slug .= '-'.strtolower(\Illuminate\Support\Str::random(4));
                $type = \App\Models\PropertyType::create(['name' => $name, 'slug' => $slug, 'status' => 1]);
            }
            \App\Models\Property::withTrashed()->where('type', $name)->update(['property_type_id' => $type->id]);
        }
    });
    $this->info('Database: '.\Illuminate\Support\Facades\DB::connection()->getDatabaseName());
    $this->info('Danh mục: '.\App\Models\PropertyType::count().' | BĐS đã gán loại: '.\App\Models\Property::whereNotNull('property_type_id')->count());
})->purpose('Đồng bộ phân loại SQL với các BĐS hiện có, không xóa danh mục');
