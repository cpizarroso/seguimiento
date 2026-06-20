<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tramite extends Model
{
    use HasFactory;

    protected $table = 'tramites';

    protected $fillable = [
        'numero_tramite',
        'year',
        'fecha',
        'descripcion',
        'numero_diamante',
        'estado',
        'area_id',
        'creado_por',
        'derivado_a',
        'ultima_respuesta',
        'glosa_finalizacion',
        'fecha_finalizacion',
        'finalizado_por',
    ];

    public const ESTADOS = [
        'iniciado',
        'proceso',
        'observado',
        'finalizado',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'datetime',
            'fecha_finalizacion' => 'datetime',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function asignado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'derivado_a');
    }

    public function derivaciones(): HasMany
    {
        return $this->hasMany(Derivacion::class)->orderBy('numero_derivacion');
    }

    public function getNumeroFormateadoAttribute(): string
    {
        return str_pad((string) $this->numero_tramite, 4, '0', STR_PAD_LEFT);
    }

    public function getNumeroCompletoAttribute(): string
    {
        return ($this->area?->sigla ?? '?').'-'.$this->numero_formateado.'/'.$this->year;
    }

    public function finalizadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalizado_por');
    }
}
