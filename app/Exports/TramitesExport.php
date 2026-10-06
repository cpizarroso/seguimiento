<?php

namespace App\Exports;

use App\Models\Tramite;
use App\Services\TramiteService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TramitesExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStrictNullComparison, WithStyles
{
    public function __construct(
        private readonly TramiteService $tramiteService,
        private readonly array $filtros = [],
    ) {}

    public function collection(): Collection
    {
        return $this->tramiteService->coleccionParaExportar($this->filtros);
    }

    public function headings(): array
    {
        return [
            'N° Trámite',
            'Urgente',
            'Fecha creación',
            'N° Diamante',
            'Área',
            'Descripción',
            'Días',
            'Estado',
        ];
    }

    /**
     * @param  Tramite  $tramite
     */
    public function map($tramite): array
    {
        return [
            $tramite->numero_tramite,
            $tramite->urgente ? 'Sí' : 'No',
            $tramite->created_at?->format('d/m/Y H:i'),
            $tramite->numero_diamante,
            $tramite->area?->sigla,
            $tramite->descripcion,
            $tramite->dias_transcurridos,
            $tramite->estado,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
