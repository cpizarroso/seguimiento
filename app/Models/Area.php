<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    use HasFactory;

    protected $table = 'areas';

    protected $fillable = [
        'nombre',
        'descripcion',
        'sigla',
        'estado',
    ];

    public function puestos(): HasMany
    {
        return $this->hasMany(Puesto::class);
    }

    public function tramites(): HasMany
    {
        return $this->hasMany(Tramite::class);
    }

    public function contadores(): HasMany
    {
        return $this->hasMany(ContadorTramite::class);
    }
}
