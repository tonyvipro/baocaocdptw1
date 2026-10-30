<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

final class PropertySearch
{
    public static function apply(Builder $query, Request $request): void
    {
        $request->validate(['search' => 'nullable|string|max:250']);
        $text = Str::lower(Str::ascii(trim((string) $request->input('search', ''))));
        $tokens = array_values(array_unique(preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY)));
        if (!$tokens) return;

        $connection = $query->getConnection();
        $sqlite = $connection->getDriverName() === 'sqlite';
        if ($sqlite) {
            $connection->getPdo()->sqliteCreateFunction('search_normalize',
                fn ($value) => Str::lower(Str::ascii((string) $value)), 1);
        }
        $columns = array_intersect(['title', 'code', 'project', 'address', 'street', 'district', 'city', 'developer', 'type'], Schema::getColumnListing('properties'));
        foreach ($tokens as $token) {
            // Treat SQL wildcard characters as literal user input.
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $token).'%';
            $query->where(function (Builder $group) use ($columns, $pattern, $sqlite, $connection) {
                foreach ($columns as $column) {
                    $wrapped = $connection->getQueryGrammar()->wrap($column);
                    $expression = $sqlite ? "search_normalize($wrapped)" : "CONVERT($wrapped USING utf8mb4) COLLATE utf8mb4_unicode_ci";
                    $group->orWhereRaw("$expression LIKE ? ESCAPE '!'", [$pattern]);
                }
            });
        }
    }
}
