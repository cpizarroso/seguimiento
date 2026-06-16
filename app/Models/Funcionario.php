<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Funcionario extends Model
{
    protected $table = 'funcionarios';

    protected $fillable = [
        'nombre',
        'email',
        'puesto_id',
    ];

    public function puesto(): BelongsTo
    {
        return $this->belongsTo(Puesto::class);
    }

    public function historialPuestos(): HasMany
    {
        return $this->hasMany(FuncionarioPuesto::class);
    }

    public function tramitesCreados(): HasMany
    {
        return $this->hasMany(Tramite::class, 'creado_por');
    }

    public function tramitesAsignados(): HasMany
    {
        return $this->hasMany(Tramite::class, 'derivado_a');
    }

    public function derivacionesEnviadas(): HasMany
    {
        return $this->hasMany(Derivacion::class, 'derivado_de');
    }

    public function derivacionesRecibidas(): HasMany
    {
        return $this->hasMany(Derivacion::class, 'derivado_a');
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }
}
