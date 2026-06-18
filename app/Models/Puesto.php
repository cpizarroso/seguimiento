<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Puesto extends Model
{
    protected $table = 'puestos';

    protected $fillable = [
        'nombre',
        'descripcion',
        'sigla',
        'estado',
        'area_id',
    ];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function tramites(): HasMany
    {
        return $this->hasMany(Tramite::class);
    }

    public function contador(): HasMany
    {
        return $this->hasMany(ContadorTramite::class);
    }

    public function usuariosHistorial(): HasMany
    {
        return $this->hasMany(UserPuesto::class);
    }
}
