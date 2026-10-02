<?php

use App\Models\Area;
use App\Models\Funcionario;
use App\Models\FuncionarioPuesto;
use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create(['name' => 'Admin', 'email' => 'admin@historial.test']);
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
    $this->actingAs($this->admin);

    $this->area = Area::factory()->create(['nombre' => 'Dirección de Legal']);
    $this->puestoViejo = Puesto::factory()->create(['area_id' => $this->area->id, 'nombre' => 'Abogado']);
    $this->puestoNuevo = Puesto::factory()->create(['area_id' => $this->area->id, 'nombre' => 'Jefe de Legal']);
});

it('registra el puesto inicial al crear un funcionario', function () {
    $this->post(route('funcionarios.store'), [
        'cedula_identidad' => '1111111',
        'nombre' => 'María',
        'apellidos' => 'Quispe',
        'area_id' => $this->area->id,
        'puesto_id' => $this->puestoViejo->id,
    ])->assertRedirect();

    $funcionario = Funcionario::where('cedula_identidad', '1111111')->firstOrFail();

    $registro = FuncionarioPuesto::where('funcionario_id', $funcionario->id)->sole();

    expect($registro->puesto_id)->toBe($this->puestoViejo->id)
        ->and($registro->area_id)->toBe($this->area->id)
        ->and($registro->fecha_inicio->toDateString())->toBe(now()->toDateString())
        ->and($registro->fecha_fin)->toBeNull()
        ->and($registro->creado_por)->toBe($this->admin->id)
        ->and($registro->esVigente())->toBeTrue();
});

it('cierra el registro vigente y abre uno nuevo al cambiar el puesto', function () {
    $funcionario = Funcionario::factory()->create(['puesto_id' => $this->puestoViejo->id]);

    $this->put(route('funcionarios.puesto.update', $funcionario), [
        'puesto_id' => $this->puestoNuevo->id,
    ])->assertRedirect();

    $historial = FuncionarioPuesto::where('funcionario_id', $funcionario->id)->orderBy('id')->get();

    expect($historial)->toHaveCount(2)
        ->and($historial[0]->puesto_id)->toBe($this->puestoViejo->id)
        ->and($historial[0]->fecha_fin?->toDateString())->toBe(now()->toDateString())
        ->and($historial[1]->puesto_id)->toBe($this->puestoNuevo->id)
        ->and($historial[1]->fecha_fin)->toBeNull()
        ->and($historial[1]->creado_por)->toBe($this->admin->id)
        ->and($funcionario->fresh()->puesto_id)->toBe($this->puestoNuevo->id);
});

it('mantiene el historial cuando el puesto se modifica desde la pagina de edicion', function () {
    $funcionario = Funcionario::factory()->create(['puesto_id' => $this->puestoViejo->id]);

    $this->put(route('funcionarios.update', $funcionario), [
        'nombre' => $funcionario->nombre,
        'apellidos' => $funcionario->apellidos,
        'cedula_identidad' => $funcionario->cedula_identidad,
        'area_id' => $this->area->id,
        'puesto_id' => $this->puestoNuevo->id,
    ])->assertRedirect(route('funcionarios.show', $funcionario));

    expect(FuncionarioPuesto::where('funcionario_id', $funcionario->id)->count())->toBe(2);
    expect(
        FuncionarioPuesto::where('funcionario_id', $funcionario->id)->whereNull('fecha_fin')->count(),
    )->toBe(1);
});

it('no crea registros duplicados si el puesto no cambia', function () {
    $funcionario = Funcionario::factory()->create(['puesto_id' => $this->puestoViejo->id]);

    $this->put(route('funcionarios.update', $funcionario), [
        'nombre' => $funcionario->nombre,
        'apellidos' => $funcionario->apellidos,
        'cedula_identidad' => $funcionario->cedula_identidad,
        'area_id' => $this->area->id,
        'puesto_id' => $this->puestoViejo->id,
    ])->assertRedirect(route('funcionarios.show', $funcionario));

    expect(FuncionarioPuesto::where('funcionario_id', $funcionario->id)->count())->toBe(1);
    expect(
        FuncionarioPuesto::where('funcionario_id', $funcionario->id)->whereNull('fecha_fin')->count(),
    )->toBe(1);
});

it('rechaza asignar el mismo puesto actual', function () {
    $funcionario = Funcionario::factory()->create(['puesto_id' => $this->puestoViejo->id]);

    $this->put(route('funcionarios.puesto.update', $funcionario), [
        'puesto_id' => $this->puestoViejo->id,
    ])->assertSessionHasErrors('puesto_id');
});

it('valida que el puesto exista', function () {
    $funcionario = Funcionario::factory()->create(['puesto_id' => $this->puestoViejo->id]);

    $this->put(route('funcionarios.puesto.update', $funcionario), [
        'puesto_id' => 99999,
    ])->assertSessionHasErrors('puesto_id');
});

it('no permite cambiar el puesto sin permiso de edicion', function () {
    $funcionario = Funcionario::factory()->create(['puesto_id' => $this->puestoViejo->id]);
    $consultor = User::factory()->create(['email' => 'consultor@historial.test']);
    $consultor->roles()->sync([Rol::where('slug', 'jefe')->first()->id]);

    $this->actingAs($consultor)
        ->put(route('funcionarios.puesto.update', $funcionario), ['puesto_id' => $this->puestoNuevo->id]);

    expect($funcionario->fresh()->puesto_id)->toBe($this->puestoViejo->id);
});

it('el detalle entrega el historial de puestos y los puestos disponibles', function () {
    $funcionario = Funcionario::factory()->create(['puesto_id' => $this->puestoViejo->id]);

    $this->put(route('funcionarios.puesto.update', $funcionario), [
        'puesto_id' => $this->puestoNuevo->id,
    ]);

    $response = $this->get(route('funcionarios.show', $funcionario));

    $response
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Funcionarios/Show')
            ->has('puestos.data')
            ->has('historial_puestos.data', 2)
            ->where('historial_puestos.data.0.es_vigente', true)
            ->where('historial_puestos.data.1.es_vigente', false)
            ->where('historial_puestos.data.0.puesto.nombre', 'Jefe de Legal'),
        );
});
