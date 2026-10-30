<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $guarded = [];
    protected function casts(): array
    {
        return ['old_data' => 'array', 'new_data' => 'array'];
    }
    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed()->select(['id', 'name', 'role_id']);
    }
}
