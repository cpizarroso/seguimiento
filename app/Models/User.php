<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROL_ADMIN = 'admin';

    protected $fillable = [
        'username',
        'email',
        'password',
        'persona_id',
        'activo',
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
            'activo' => 'boolean',
            'settings' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (blank($user->username) && filled($user->email)) {
                $user->username = self::usernameDesdeEmail((string) $user->email);
            }
        });
    }

    public static function usernameDesdeEmail(string $email): string
    {
        $base = strtolower((string) Str::before($email, '@'));
        $base = preg_replace('/[^a-z0-9._-]/', '', $base) ?? '';
        $base = trim($base, '.-_');

        return $base !== '' ? $base : 'usuario';
    }

    public function getNombreCompletoAttribute(): string
    {
        return $this->persona?->nombre_completo ?? $this->email;
    }

    /**
     * Alias de compatibilidad para vistas y componentes que ya usaban $user->name.
     */
    public function getNameAttribute(): string
    {
        return $this->nombre_completo;
    }

    public function tramitesCreados(): HasMany
    {
        return $this->hasMany(Tramite::class, 'creado_por');
    }

    public function reportes(): HasMany
    {
        return $this->hasMany(Reporte::class, 'user_id');
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

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class);
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

    /**
     * Áreas habilitadas para crear trámites.
     */
    public function areasHabilitadas(): BelongsToMany
    {
        return $this->belongsToMany(Area::class, 'area_user')
            ->withPivot('predeterminada')
            ->withTimestamps();
    }

    public function areaPredeterminada(): ?Area
    {
        return $this->areasHabilitadas->first(fn (Area $area) => (bool) $area->pivot->predeterminada);
    }

    public function esAdmin(): bool
    {
        return $this->hasAnyRole([self::ROL_ADMIN]);
    }

    public function tieneAreaHabilitada(int $areaId): bool
    {
        if ($this->esAdmin()) {
            return true;
        }

        return $this->areasHabilitadas->contains('id', $areaId);
    }

    /**
     * Permisos concedidos o denegados explícitamente a este usuario, por
     * encima de lo que aportan sus roles.
     */
    public function permisosDirectos(): BelongsToMany
    {
        return $this->belongsToMany(Permiso::class, 'permiso_user')
            ->withPivot('permitido')
            ->withTimestamps();
    }

    /**
     * Overrides del usuario como mapa "modulo.accion" => permitido.
     *
     * @return array<string, bool>
     */
    public function overridesPermisos(): array
    {
        return $this->permisosDirectos
            ->mapWithKeys(fn (Permiso $permiso) => [
                "{$permiso->modulo->slug}.{$permiso->accion->slug}" => (bool) $permiso->pivot->permitido,
            ])
            ->all();
    }

    public function permisos(): Collection
    {
        return $this->roles->flatMap(fn ($rol) => $rol->permisos);
    }

    /**
     * Resolución: un override explícito gana siempre (incluso para admin),
     * luego el bypass de admin y, por último, los permisos del rol.
     */
    public function hasPermission(string $module, string $action): bool
    {
        $slug = "{$module}.{$action}";
        $overrides = $this->overridesPermisos();

        if (array_key_exists($slug, $overrides)) {
            return $overrides[$slug];
        }

        if ($this->hasAnyRole([self::ROL_ADMIN])) {
            return true;
        }

        return $this->permisos()->contains(fn ($permiso) => $permiso->modulo->slug === $module && $permiso->accion->slug === $action
        );
    }

    public function hasAnyRole(array $slugs): bool
    {
        return $this->roles->contains(fn ($rol) => in_array($rol->slug, $slugs, true));
    }

    public function getPermisosSlugAttribute(): array
    {
        $base = $this->hasAnyRole([self::ROL_ADMIN])
            ? Permiso::with(['modulo', 'accion'])->get()
            : $this->permisos();

        $slugs = $base
            ->map(fn ($p) => "{$p->modulo->slug}.{$p->accion->slug}")
            ->flip();

        foreach ($this->overridesPermisos() as $slug => $permitido) {
            if ($permitido) {
                $slugs[$slug] = true;
            } else {
                $slugs->forget($slug);
            }
        }

        return $slugs->keys()->values()->toArray();
    }
}
