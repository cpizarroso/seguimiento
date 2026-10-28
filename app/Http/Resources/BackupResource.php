<?php

namespace App\Http\Resources;

use App\Models\Backup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Backup
 */
class BackupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'nombre_original' => $this->nombre_original,
            'tipo' => $this->tipo,
            'estado' => $this->estado,
            'protegido' => (bool) $this->protegido,
            'tamano_bytes' => $this->tamano_bytes,
            'tamano_mb' => $this->tamano_mb,
            'hash_sha256' => $this->hash_sha256,
            'error' => $this->error,
            'autor' => $this->whenLoaded('user', fn () => $this->user?->nombre_completo ?? 'Sistema'),
            'autor_id' => $this->user_id,
            'creado_en' => $this->created_at?->format('d/m/Y H:i'),
            'creado_iso' => $this->created_at?->toIso8601String(),
            'url_descarga' => route('backups.descargar', ['backup' => $this->id]),
            'archivo_existe' => $this->ruta !== null && $this->ruta !== '',
        ];
    }
}
