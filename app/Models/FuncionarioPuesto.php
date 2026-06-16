<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuncionarioPuesto extends Model
{
    protected $table = 'funcionario_puesto';

    protected $fillable = [
        'funcionario_id',
        'puesto_id',
        'fecha_inicio',
        'fecha_fin',
    ];

    public function funcionario(): BelongsTo
    {
        return $this->belongsTo(Funcionario::class);
    }

    public function puesto(): BelongsTo
    {
        return $this->belongsTo(Puesto::class);
    }
}
