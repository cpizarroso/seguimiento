<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'profesion',
        'password',
        'role',
        'funcionario_id',
        'settings',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'settings' => 'array',
        ];
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

    public function funcionario(): BelongsTo
    {
        return $this->belongsTo(Funcionario::class);
    }

    public function historialPuestos(): HasMany
    {
        return $this->hasMany(UserPuesto::class);
    }

    public function puestoActivo(): HasOne
    {
        return $this->hasOne(UserPuesto::class)->whereNull('fecha_fin');
    }

    public function reseteos(): HasMany
    {
        return $this->hasMany(Reseteo::class, 'user_id');
    }

    public function reseteosRealizados(): HasMany
    {
        return $this->hasMany(Reseteo::class, 'reset_por');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'role_user');
    }

    public function permisos(): Collection
    {
        return $this->roles->flatMap(fn ($rol) => $rol->permisos);
    }

    public function hasPermission(string $module, string $action): bool
    {
        return $this->permisos()->contains(fn ($permiso) =>
            $permiso->modulo->slug === $module && $permiso->accion->slug === $action
        );
    }

    public function hasAnyRole(array $slugs): bool
    {
        return $this->roles->contains(fn ($rol) => in_array($rol->slug, $slugs, true));
    }

    public function getPermisosSlugAttribute(): array
    {
        return $this->permisos()
            ->map(fn ($p) => "{$p->modulo->slug}.{$p->accion->slug}")
            ->values()
            ->toArray();
    }
}
