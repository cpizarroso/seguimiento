<?php

namespace Database\Seeders;

use App\Models\Actuacion;
use Illuminate\Database\Seeder;

class ActuacionSeeder extends Seeder
{
    public function run(): void
    {
        Actuacion::factory(500)->create();

        $this->command->info('500 actuaciones creadas exitosamente.');
    }
}
