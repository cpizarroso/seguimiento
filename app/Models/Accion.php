<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Accion extends Model
{
    protected $table = 'acciones';
    protected $fillable = ['nombre', 'slug'];

    public function permisos(): HasMany
    {
        return $this->hasMany(Permiso::class);
    }
}
