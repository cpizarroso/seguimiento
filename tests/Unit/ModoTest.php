<?php

use App\Support\Modo;

it('mapea cada modo a su base de datos', function () {
    expect(Modo::baseDatos(Modo::DEV))->toBe('seguimiento-dev')
        ->and(Modo::baseDatos(Modo::PROD))->toBe('seguimiento-prod')
        ->and(Modo::baseDatos(Modo::CAPACITACION))->toBe('seguimiento-cap');
});

it('rechaza un modo desconocido en lugar de apuntar a otra base', function () {
    Modo::baseDatos('staging');
})->throws(InvalidArgumentException::class);

it('expone la etiqueta y variante del badge', function () {
    expect(Modo::etiqueta(Modo::DEV))->toBe('Desarrollo')
        ->and(Modo::etiqueta(Modo::PROD))->toBe('Producción')
        ->and(Modo::etiqueta(Modo::CAPACITACION))->toBe('Capacitación')
        ->and(Modo::variante(Modo::DEV))->toBe('info')
        ->and(Modo::variante(Modo::PROD))->toBe('success')
        ->and(Modo::variante(Modo::CAPACITACION))->toBe('warning');
});

it('valida los modos permitidos', function () {
    expect(Modo::valido(Modo::DEV))->toBeTrue()
        ->and(Modo::valido(Modo::PROD))->toBeTrue()
        ->and(Modo::valido(Modo::CAPACITACION))->toBeTrue()
        ->and(Modo::valido('staging'))->toBeFalse();
});
