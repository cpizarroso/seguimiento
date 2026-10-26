<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BackupEvento extends Model
{
    public const ACCION_CREACION = 'creacion';

    public const ACCION_CARGA_EXTERNA = 'carga_externa';

    public const ACCION_DESCARGA = 'descarga';

    public const ACCION_RESTAURACION = 'restauracion';

    public const ACCION_ELIMINACION = 'eliminacion';

    public const ACCION_FALLO = 'fallo';

    /**
     * La bitácora es inmutable: solo se escribe created_at.
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'backup_id',
        'backup_nombre',
        'accion',
        'user_id',
        'ip',
        'detalle',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function backup(): BelongsTo
    {
        return $this->belongsTo(Backup::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
