<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Modulo extends Model
{
    protected $fillable = ['nombre', 'slug', 'descripcion', 'orden'];

    public function permisos(): HasMany
    {
        return $this->hasMany(Permiso::class);
    }
}
