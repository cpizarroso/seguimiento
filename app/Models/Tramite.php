<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tramite extends Model
{
    protected $table = 'tramites';

    protected $fillable = [
        'numero_tramite',
        'year',
        'fecha',
        'descripcion',
        'numero_diamante',
        'glosa',
        'estado',
        'puesto_id',
        'creado_por',
        'derivado_a',
        'ultima_respuesta',
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
            'fecha' => 'date',
        ];
    }

    public function puesto(): BelongsTo
    {
        return $this->belongsTo(Puesto::class);
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Funcionario::class, 'creado_por');
    }

    public function asignado(): BelongsTo
    {
        return $this->belongsTo(Funcionario::class, 'derivado_a');
    }

    public function derivaciones(): HasMany
    {
        return $this->hasMany(Derivacion::class)->orderBy('numero_derivacion');
    }

    public function getNumeroFormateadoAttribute(): string
    {
        return str_pad((string) $this->numero_tramite, 4, '0', STR_PAD_LEFT);
    }
}
