<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Actuacion extends Model
{
    protected $table = 'actuaciones';

    protected $fillable = [
        'tramite_id',
        'area_id',
        'funcionario_id',
        'glosa',
        'fecha_actuacion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_actuacion' => 'datetime',
        ];
    }

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function funcionario(): BelongsTo
    {
        return $this->belongsTo(Funcionario::class);
    }

    public function getDiasTranscurridosAttribute(): int
    {
        return (int) $this->fecha_actuacion->diffInDays(now());
    }
}
