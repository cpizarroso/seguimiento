<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Tramite extends Model
{
    use HasFactory;

    protected $table = 'tramites';

    protected $fillable = [
        'numero_tramite',
        'numero_completo',
        'year',
        'fecha',
        'descripcion',
        'numero_diamante',
        'estado',
        'urgente',
        'area_id',
        'creado_por',
        'derivado_a',
        'ultima_respuesta',
        'glosa_finalizacion',
        'fecha_finalizacion',
        'finalizado_por',
    ];

    public const ESTADOS = [
        'iniciado',
        'proceso',
        'observado',
        'finalizado',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'datetime',
            'fecha_finalizacion' => 'datetime',
            'urgente' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        // Mantiene numero_completo sincronizado: SIGLA-N/YEAR
        static::saving(function (Tramite $tramite) {
            // Si cambió el área, la relación cargada puede estar desactualizada
            $sigla = $tramite->isDirty('area_id') || ! $tramite->relationLoaded('area')
                ? Area::where('id', $tramite->area_id)->value('sigla')
                : $tramite->area?->sigla;

            $tramite->numero_completo = self::generarNumeroCompleto(
                $tramite->area_id,
                (int) $tramite->numero_tramite,
                (int) $tramite->year,
                $sigla,
            );
        });
    }

    /**
     * Genera el nombre completo del trámite: SIGLA-N/YEAR.
     * Reutilizable desde seeders, servicios y controladores.
     */
    public static function generarNumeroCompleto(
        ?int $areaId,
        int $numeroTramite,
        int $year,
        ?string $sigla = null,
    ): string {
        $sigla ??= Area::where('id', $areaId)->value('sigla') ?? '?';

        return sprintf('%s-%d/%d', $sigla, $numeroTramite, $year);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function asignado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'derivado_a');
    }

    public function derivaciones(): HasMany
    {
        return $this->hasMany(Derivacion::class)->orderBy('numero_derivacion');
    }

    /**
     * Crea la primera derivación del trámite (creador -> creador),
     * en estado recepcionado. Idempotente: si ya existe, la retorna.
     * Reutilizable desde observers y seeders.
     */
    public function crearPrimeraDerivacion(): Derivacion
    {
        $existente = $this->derivaciones()->orderBy('numero_derivacion')->first();

        if ($existente) {
            return $existente;
        }

        return $this->derivaciones()->create([
            'numero_derivacion' => ($this->derivaciones()->max('numero_derivacion') ?? 0) + 1,
            'derivado_de' => $this->creado_por,
            'derivado_a' => $this->creado_por,
            'fecha_derivacion' => now(),
            'glosa_derivacion' => 'recepcion tramite',
            'fecha_recepcion' => now(),
            'estado' => 'recepcionado',
        ]);
    }

    public function actuaciones(): HasManyThrough
    {
        return $this->hasManyThrough(Actuacion::class, Derivacion::class)
            ->orderBy('actuaciones.fecha_actuacion');
    }

    public function getNumeroFormateadoAttribute(): string
    {
        return str_pad((string) $this->numero_tramite, 4, '0', STR_PAD_LEFT);
    }

    public function finalizadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalizado_por');
    }

    public function getDiasTranscurridosAttribute(): int
    {
        $desde = $this->fecha ?? $this->created_at;
        $hasta = $this->estado === 'finalizado' && $this->fecha_finalizacion
            ? $this->fecha_finalizacion
            : now();

        return (int) $desde->diffInDays($hasta);
    }
}
