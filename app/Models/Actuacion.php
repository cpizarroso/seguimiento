<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Actuacion extends Model
{
    use HasFactory;

    protected $table = 'actuaciones';

    protected $fillable = [
        'derivacion_id',
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

    public function derivacion(): BelongsTo
    {
        return $this->belongsTo(Derivacion::class);
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
