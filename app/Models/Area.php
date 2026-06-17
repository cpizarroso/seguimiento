<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $table = 'areas';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function puestos(): HasMany
    {
        return $this->hasMany(Puesto::class);
    }
}
