<?php

namespace App\Casts;

use DateTimeInterface;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/** CRM scheduled/history columns are stored as UTC, independent of APP_TIMEZONE. */
class UtcDateTime implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Carbon
    {
        return $value === null ? null : Carbon::parse($value, 'UTC');
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) return null;
        $date = $value instanceof DateTimeInterface ? Carbon::instance($value) : Carbon::parse($value);
        return $date->utc()->format('Y-m-d H:i:s');
    }
}
