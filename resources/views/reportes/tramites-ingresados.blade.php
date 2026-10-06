<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        @page { size: letter; margin: 130px 40px 70px 40px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1f2937; }
        header { position: fixed; top: -115px; left: 0; right: 0; height: 110px; }
        .titulo { text-align: center; font-size: 18px; font-weight: bold; color: #2D6A4F; margin-bottom: 4px; }
        .subtitulo { text-align: center; font-size: 12px; margin: 2px 0; }
        .subtitulo strong { color: #111827; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #2D6A4F; color: #ffffff; font-size: 10px; padding: 6px 4px; text-align: left; }
        th.center, td.center { text-align: center; }
        td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; font-size: 10px; vertical-align: top; }
        tr { page-break-inside: avoid; }
        tr:nth-child(even) td { background-color: #f8fafc; }
    </style>
</head>
<body>
    <header>
        <div class="titulo">REPORTE DE TRAMITES INGRESADOS</div>
        <div class="subtitulo">Desde <strong>{{ $fechaDesde ?? '—' }}</strong> hasta <strong>{{ $fechaHasta ?? '—' }}</strong></div>
        <div class="subtitulo">Usuario: <strong>{{ $usuario }}</strong></div>
        <div class="subtitulo">Área: <strong>{{ $area ?? '—' }}</strong></div>
    </header>

    <table>
        <thead>
            <tr>
                <th class="center" style="width: 8%">NRO</th>
                <th class="center" style="width: 10%">GESTIÓN</th>
                <th>CREADO POR</th>
                <th class="center" style="width: 10%">URGENTE</th>
                <th style="width: 16%">FECHA CREACIÓN</th>
                <th style="width: 16%">NRO DIAMANTE</th>
                <th>DESCRIPCIÓN</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($tramites as $tramite)
                <tr>
                    <td class="center" style="font-size: 18px; font-weight: bold; font-family: Courier, monospace;">{{ $tramite->numero_tramite }}</td>
                    <td class="center">{{ $tramite->year }}</td>
                    <td>{{ $tramite->creador?->name ?? '—' }}</td>
                    <td class="center">{{ $tramite->urgente ? 'Sí' : 'No' }}</td>
                    <td>{{ $tramite->created_at?->format('d/m/Y H:i') }}</td>
                    <td>{{ $tramite->numero_diamante ?? '—' }}</td>
                    <td>{{ $tramite->descripcion }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center">Sin trámites en el rango seleccionado.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <script type="text/php">
        // Al final del documento: al ejecutarse ya existen todas las páginas
        // y el pie se estampa en cada una con su número correcto.
        if (isset($pdf)) {
            $font = $fontMetrics->getFont('Helvetica', 'normal');
            $pdf->page_text(240, 768, 'Página {PAGE_NUM} de {PAGE_COUNT} · {{ $totalRegistros }} registros', $font, 8, array(0.42, 0.45, 0.50));
        }
    </script>
</body>
</html>
