<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Persona extends Model
{
    use HasFactory;

    protected $table = 'personas';

    protected $fillable = [
        'nombres',
        'apellidos',
        'ci',
        'telefono',
        'correo',
        'profesion',
        'direccion',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function puestos(): BelongsToMany
    {
        return $this->belongsToMany(Puesto::class, 'persona_puesto')
            ->withPivot(['fecha_inicio', 'fecha_fin'])
            ->withTimestamps();
    }

    public function puestoActivo(): HasOne
    {
        return $this->hasOne(PersonaPuesto::class)->whereNull('fecha_fin');
    }

    public function historialPuestos(): HasMany
    {
        return $this->hasMany(PersonaPuesto::class)
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id');
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    public function getAreaAttribute(): ?Area
    {
        return $this->puestoActivo?->puesto?->area;
    }
}
