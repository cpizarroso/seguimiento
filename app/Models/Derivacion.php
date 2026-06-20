<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Derivacion extends Model
{
    protected $table = 'derivaciones';

    protected $fillable = [
        'tramite_id',
        'numero_derivacion',
        'derivado_de',
        'derivado_a',
        'fecha_derivacion',
        'glosa_derivacion',
        'fecha_recepcion',
        'glosa_recepcion',
        'glosa_observacion',
        'estado',
    ];

    public const ESTADOS = [
        'derivado',
        'recepcionado',
        'rechazado',
        'historico',
    ];

    protected function casts(): array
    {
        return [
            'fecha_derivacion' => 'datetime',
            'fecha_recepcion' => 'datetime',
        ];
    }

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class);
    }

    public function de(): BelongsTo
    {
        return $this->belongsTo(User::class, 'derivado_de');
    }

    public function a(): BelongsTo
    {
        return $this->belongsTo(User::class, 'derivado_a');
    }

    public function getDiasEnDerivacionAttribute(): int
    {
        if (! $this->fecha_recepcion) {
            return now()->diffInDays($this->fecha_derivacion);
        }

        return $this->fecha_derivacion->diffInDays($this->fecha_recepcion);
    }
}
