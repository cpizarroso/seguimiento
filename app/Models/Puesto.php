<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Puesto extends Model
{
    protected $table = 'puestos';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function funcionarios(): HasMany
    {
        return $this->hasMany(Funcionario::class);
    }

    public function historialFuncionarios(): HasMany
    {
        return $this->hasMany(FuncionarioPuesto::class);
    }

    public function tramites(): HasMany
    {
        return $this->hasMany(Tramite::class);
    }

    public function contador(): HasMany
    {
        return $this->hasMany(ContadorTramite::class);
    }
}
