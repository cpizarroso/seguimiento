<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rol extends Model
{
    protected $table = 'roles';
    protected $fillable = ['nombre', 'slug', 'descripcion', 'es_sistema'];

    protected function casts(): array
    {
        return [
            'es_sistema' => 'boolean',
        ];
    }

    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(Permiso::class, 'rol_permiso');
    }

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_user', 'rol_id', 'user_id');
    }

    public function getPermisosArrayAttribute(): array
    {
        return $this->permisos->map(fn ($p) => "{$p->modulo->slug}.{$p->accion->slug}")->toArray();
    }
}
