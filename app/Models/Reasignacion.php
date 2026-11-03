<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reasignacion extends Model
{
    protected $table = 'reasignaciones';

    protected $fillable = [
        'tramite_id',
        'solicitante_id',
        'resuelto_por_id',
        'motivo',
        'estado',
        'glosa_respuesta',
        'derivacion_id',
        'fecha_resolucion',
    ];

    public const ESTADO_PENDIENTE = 'pendiente';

    public const ESTADO_APROBADA = 'aprobada';

    public const ESTADO_RECHAZADA = 'rechazada';

    public const ESTADO_CANCELADA = 'cancelada';

    public const ESTADOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_APROBADA,
        self::ESTADO_RECHAZADA,
        self::ESTADO_CANCELADA,
    ];

    protected function casts(): array
    {
        return [
            'fecha_resolucion' => 'datetime',
        ];
    }

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class);
    }

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }

    public function resueltoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resuelto_por_id');
    }

    public function derivacion(): BelongsTo
    {
        return $this->belongsTo(Derivacion::class);
    }

    /**
     * @param  Builder<Reasignacion>  $query
     */
    public function scopePendientes(Builder $query): void
    {
        $query->where('estado', self::ESTADO_PENDIENTE);
    }

    public function estaPendiente(): bool
    {
        return $this->estado === self::ESTADO_PENDIENTE;
    }
}
