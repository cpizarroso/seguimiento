<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'username',
        'phone',
        'profesion',
        'cargo',
        'password',
        'role',
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
}
