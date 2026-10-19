<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$base = config('database.connections.mysql');
$base['host'] = '127.0.0.1';
foreach (['quanly_bds', 'baocaocdptw1_db'] as $name) {
    config(['database.connections.'.$name => array_merge($base, ['database' => $name])]);
    $rows[$name] = Illuminate\Support\Facades\DB::connection($name)->table('properties')->orderBy('id')->get()->keyBy('code');
    echo $name.': '.$rows[$name]->count()." properties\n";
}
foreach ($rows['quanly_bds'] as $code => $source) {
    $target = $rows['baocaocdptw1_db'][$code] ?? null;
    if (!$target) { echo 'MISSING IN baocaocdptw1_db: '.$code.' | '.$source->title."\n"; continue; }
    $fields = [];
    foreach ((array) $source as $field => $value) {
        if (!in_array($field, ['id', 'created_at', 'updated_at']) && (string) $value !== (string) ($target->$field ?? null)) $fields[] = $field;
    }
    if ($fields) echo 'DIFFERENT '.$code.': '.implode(', ', $fields).' | updated source='.$source->updated_at.' target='.$target->updated_at."\n";
}

if (in_array('--apply', $argv, true)) {
    $directory = storage_path('app/private');
    if (!is_dir($directory)) mkdir($directory, 0775, true);
    $backup = $directory.'/property-database-sync-'.date('Ymd-His').'.json';
    file_put_contents($backup, json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    $targetConnection = Illuminate\Support\Facades\DB::connection('baocaocdptw1_db');
    $inserted = 0;
    $targetConnection->transaction(function () use ($targetConnection, $rows, &$inserted) {
        foreach ($rows['quanly_bds'] as $code => $source) {
            if ($targetConnection->table('properties')->where('code', $code)->exists()) continue;
            $data = (array) $source;
            unset($data['id']);
            $targetConnection->table('properties')->insert($data);
            $inserted++;
        }
    });
    echo 'Backup: '.$backup."\n";
    echo 'Inserted missing properties: '.$inserted.' | baocaocdptw1_db total: '.$targetConnection->table('properties')->count()."\n";
}
