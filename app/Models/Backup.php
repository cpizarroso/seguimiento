<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Backup extends Model
{
    public const TIPO_MANUAL = 'manual';

    public const TIPO_AUTOMATICO = 'automatico';

    public const TIPO_PRE_RESTAURACION = 'pre_restauracion';

    public const TIPO_IMPORTADO = 'importado';

    public const ESTADO_EN_PROCESO = 'en_proceso';

    public const ESTADO_COMPLETADO = 'completado';

    public const ESTADO_FALLIDO = 'fallido';

    protected $fillable = [
        'nombre',
        'nombre_original',
        'ruta',
        'disco',
        'tipo',
        'estado',
        'tamano_bytes',
        'hash_sha256',
        'protegido',
        'user_id',
        'error',
    ];

    protected function casts(): array
    {
        return [
            'tamano_bytes' => 'integer',
            'protegido' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(BackupEvento::class);
    }

    public function scopeCompletados(Builder $query): Builder
    {
        return $query->where('estado', self::ESTADO_COMPLETADO);
    }

    public function getTamanoMbAttribute(): ?float
    {
        if ($this->tamano_bytes === null) {
            return null;
        }

        return round($this->tamano_bytes / 1048576, 2);
    }
}
