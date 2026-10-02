<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Funcionario extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'funcionarios';

    protected $fillable = [
        'nombre',
        'apellidos',
        'email',
        'direccion',
        'nro_telefono',
        'cedula_identidad',
        'tipo_funcionario',
        'nivel',
        'area_id',
        'puesto_id',
        'creado_por',
        'fecha_ingreso',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_ingreso' => 'date',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function puesto(): BelongsTo
    {
        return $this->belongsTo(Puesto::class);
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function usuario(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function historialPuestos(): HasMany
    {
        return $this->hasMany(FuncionarioPuesto::class)
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id');
    }

    public function puestoVigente(): ?FuncionarioPuesto
    {
        return $this->historialPuestos()
            ->whereNull('fecha_fin')
            ->where('puesto_id', $this->puesto_id)
            ->first();
    }
}
