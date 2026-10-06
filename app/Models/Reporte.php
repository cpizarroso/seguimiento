<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reporte extends Model
{
    use HasFactory;

    protected $table = 'reportes';

    protected $fillable = [
        'user_id',
        'ruta',
        'nombre',
        'fecha_desde',
        'fecha_hasta',
        'hoy',
        'total_registros',
    ];

    protected function casts(): array
    {
        return [
            'fecha_desde' => 'date',
            'fecha_hasta' => 'date',
            'hoy' => 'boolean',
            'total_registros' => 'integer',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
