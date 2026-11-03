<?php

use App\Support\NormalizadorFechaExcel;

it('interpreta los seriales de excel', function (int $serial, string $esperado) {
    expect(NormalizadorFechaExcel::desdeCelda($serial)->format('Y-m-d'))->toBe($esperado);
})->with([
    [46161, '2026-05-19'],
    [46170, '2026-05-28'],
]);

it('descarta seriales fuera de la gestion y los recupera con la fila vecina', function () {
    expect(NormalizadorFechaExcel::desdeCelda(16))->toBeNull();
    expect(NormalizadorFechaExcel::desdeCelda(57219))->toBeNull();
});

it('corrige las fechas escritas a mano', function (string $texto, ?string $esperado) {
    expect(NormalizadorFechaExcel::desdeCelda($texto)?->format('Y-m-d'))->toBe($esperado);
})->with([
    ['03/006/2026', '2026-06-03'],
    ['03//06/2026', '2026-06-03'],
    ['19/06/206', '2026-06-19'],
    ['03/07/25026', '2026-07-03'],
    ['270/07/2026', '2026-07-27'],
    ['2707/2026', '2026-07-27'],
    ['29/0/07/2026', '2026-07-29'],
    ['30/07/206', '2026-07-30'],
    ['1308/2026', '2026-08-13'],
    ['28/082026', '2026-08-28'],
    ['09/09/20269', '2026-09-09'],
    ['14/10/1026', '2026-10-14'],
    ['2810/2026', '2026-10-28'],
    ['14/0/2026', null],
    ['108/08/2026', null],
]);

it('extrae la fecha del texto libre de una derivacion', function (string $texto, ?string $esperado) {
    expect(NormalizadorFechaExcel::fechaEnTexto($texto)?->format('Y-m-d'))->toBe($esperado);
})->with([
    ['A. ABOG SOCRATES CABALLERO EL 28/05/2026', '2026-05-28'],
    ['REVISANDO DRA LILIANE SEOANE EL26/06/2026', '2026-06-26'],
    ['A. ADM ARQ ROSA ELENA BARRIENTOS 10/09//2026', '2026-09-10'],
    ['A. ABOG M.JOSE HERRERA 2209/2026', '2026-09-22'],
    ['REMITIO A DOT CON CI DLA Nº 12/2026', null],
    ['SE REMITIO A LAS DIRECCIONES SEMPLADYMA CON CI DLA Nº 01/2026', null],
]);
