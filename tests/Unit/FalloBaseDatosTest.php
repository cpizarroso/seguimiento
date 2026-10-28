<?php

use App\Support\FalloBaseDatos;
use Illuminate\Database\QueryException;

it('reconoce los fallos de conexión a la base de datos', function (string $mensaje) {
    expect(FalloBaseDatos::esConexion(new PDOException($mensaje)))->toBeTrue();
})->with([
    'base inexistente' => ['SQLSTATE[HY000] [1049] Unknown database \'seguimiento-cap\''],
    'servidor caído' => ['SQLSTATE[HY000] [2002] Connection refused'],
    'credenciales inválidas' => ['SQLSTATE[HY000] [1045] Access denied for user \'root\'@\'localhost\''],
    'host desconocido' => ['SQLSTATE[HY000] [2005] Unknown MySQL server host \'db\''],
]);

it('reconoce el fallo dentro de una QueryException', function () {
    $excepcion = new QueryException(
        'mysql',
        'select 1',
        [],
        new PDOException('SQLSTATE[HY000] [1049] Unknown database \'seguimiento-cap\''),
    );

    expect(FalloBaseDatos::esConexion($excepcion))->toBeTrue();
});

it('ignora errores que no son de conexión', function () {
    expect(FalloBaseDatos::esConexion(new PDOException('SQLSTATE[42S02] Table \'tramites\' doesn\'t exist')))
        ->toBeFalse()
        ->and(FalloBaseDatos::esConexion(new RuntimeException('otro error')))
        ->toBeFalse();
});
