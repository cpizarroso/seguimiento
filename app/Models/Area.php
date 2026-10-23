<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    use HasFactory;

    protected $table = 'areas';

    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'activo',
        'user_id',
        'area_padre_id',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'area_padre_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Area::class, 'area_padre_id');
    }

    public function puestos(): HasMany
    {
        return $this->hasMany(Puesto::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tramites(): HasMany
    {
        return $this->hasMany(Tramite::class);
    }

    public function contadores(): HasMany
    {
        return $this->hasMany(ContadorTramite::class);
    }

    public function usuariosHabilitados(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'area_user')
            ->withPivot('predeterminada')
            ->withTimestamps();
    }
}
