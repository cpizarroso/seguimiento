<?php

use App\Support\Modo;

it('comparte el modo por defecto en el login', function () {
    config([
        'app.modo' => Modo::DEV,
        'app.nota_capacitacion' => null,
    ]);

    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Auth/Login')
            ->where('sistema.modo', Modo::DEV)
            ->where('sistema.entorno', app()->environment())
            ->where('sistema.etiqueta', 'Desarrollo')
            ->where('sistema.variante', 'warning')
            ->where('sistema.nota', null));
});

it('comparte el modo producción con su etiqueta y variante', function () {
    config([
        'app.modo' => Modo::PROD,
        'app.nota_capacitacion' => null,
    ]);

    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('sistema.modo', Modo::PROD)
            ->where('sistema.etiqueta', 'Producción')
            ->where('sistema.variante', 'success'));
});

it('comparte el modo capacitación junto con la nota opcional', function () {
    config([
        'app.modo' => Modo::CAPACITACION,
        'app.nota_capacitacion' => 'Datos de prueba para el curso de mayo',
    ]);

    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('sistema.modo', Modo::CAPACITACION)
            ->where('sistema.etiqueta', 'Capacitación')
            ->where('sistema.variante', 'info')
            ->where('sistema.nota', 'Datos de prueba para el curso de mayo'));
});
