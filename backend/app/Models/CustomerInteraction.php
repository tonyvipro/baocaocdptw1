<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerInteraction extends Model
{
    protected $fillable = ['customer_id', 'actor_id', 'type', 'summary', 'occurred_at'];
    protected function casts(): array
    {
        return ['occurred_at' => \App\Casts\UtcDateTime::class];
    }
    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id')->withTrashed()->select(['id', 'name']);
    }
}
