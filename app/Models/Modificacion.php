<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Modificacion extends Model
{
    protected $table = 'modificaciones';

    protected $fillable = [
        'tramite_id',
        'solicitante_id',
        'resuelto_por_id',
        'tipo',
        'motivo',
        'propuesta',
        'estado',
        'glosa_respuesta',
        'fecha_resolucion',
        'fecha_uso',
    ];

    public const TIPO_DESCRIPCION = 'descripcion';

    public const TIPO_BAJA = 'baja';

    public const TIPOS = [
        self::TIPO_DESCRIPCION,
        self::TIPO_BAJA,
    ];

    public const ESTADO_PENDIENTE = 'pendiente';

    public const ESTADO_APROBADA = 'aprobada';

    public const ESTADO_RECHAZADA = 'rechazada';

    public const ESTADO_CANCELADA = 'cancelada';

    public const ESTADO_CONSUMIDA = 'consumida';

    public const ESTADOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_APROBADA,
        self::ESTADO_RECHAZADA,
        self::ESTADO_CANCELADA,
        self::ESTADO_CONSUMIDA,
    ];

    protected function casts(): array
    {
        return [
            'fecha_resolucion' => 'datetime',
            'fecha_uso' => 'datetime',
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

    /**
     * @param  Builder<Modificacion>  $query
     */
    public function scopePendientes(Builder $query): void
    {
        $query->where('estado', self::ESTADO_PENDIENTE);
    }

    /**
     * @param  Builder<Modificacion>  $query
     */
    public function scopeAprobadas(Builder $query): void
    {
        $query->where('estado', self::ESTADO_APROBADA);
    }

    public function estaPendiente(): bool
    {
        return $this->estado === self::ESTADO_PENDIENTE;
    }

    public function estaAprobada(): bool
    {
        return $this->estado === self::ESTADO_APROBADA;
    }
}
