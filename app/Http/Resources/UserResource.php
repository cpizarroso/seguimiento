<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'username' => $this->username,
            'phone' => $this->phone,
            'profesion' => $this->profesion,
            'cargo' => $this->cargo,
            'role' => $this->role,
            'funcionario' => $this->whenLoaded('funcionario', fn () => [
                'id' => $this->funcionario->id,
                'nombre' => $this->funcionario->nombre,
            ]),
        ];
    }
}
