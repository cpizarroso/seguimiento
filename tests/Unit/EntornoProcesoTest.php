<?php

use App\Support\EntornoProceso;

/*
 * Regresión: en SAPI web, Symfony Process deja el proceso hijo sin SystemRoot
 * ni PATH, y mysqldump falla con "Can't create TCP/IP socket (10106)".
 * El dumper pasa EntornoProceso::paraBinariosMysql() a cada Process.
 */

it('completa el entorno con las variables de Windows', function () {
    if (PHP_OS_FAMILY !== 'Windows') {
        $this->markTestSkipped('Solo aplica a Windows.');
    }

    $entorno = EntornoProceso::paraBinariosMysql();

    expect($entorno)->toHaveKey('SystemRoot')
        ->and($entorno['SystemRoot'])->toBe(getenv('SystemRoot'))
        ->and($entorno)->toHaveKey('PATH')
        ->and($entorno['PATH'])->not->toBe('');
});

it('no devuelve variables fuera de Windows', function () {
    if (PHP_OS_FAMILY === 'Windows') {
        $this->markTestSkipped('Solo aplica a sistemas no Windows.');
    }

    expect(EntornoProceso::paraBinariosMysql())->toBe([]);
});

it('no propaga variables de la peticion HTTP', function () {
    $claves = array_keys(EntornoProceso::paraBinariosMysql());

    expect($claves)->not->toContain('HTTP_COOKIE')
        ->and($claves)->not->toContain('HTTP_AUTHORIZATION');

    foreach ($claves as $clave) {
        expect($clave)->not->toStartWith('HTTP_');
    }
});
