<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContadorTramite extends Model
{
    protected $table = 'contador_tramites';

    protected $fillable = [
        'area_id',
        'year',
        'ultimo_numero',
        'reset_glosa',
        'ultimo_reset_at',
    ];

    protected function casts(): array
    {
        return [
            'ultimo_reset_at' => 'datetime',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }
}
