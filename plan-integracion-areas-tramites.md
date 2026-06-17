# Plan de Integración: Áreas + Filtro de Trámites por Área

## Objetivo
Agregar el concepto de "área" a los usuarios y permitir filtrar trámites por el área del usuario creador.

## Orden de ejecución

**Obligatorio:** Primero mergear `puestos` → `main`, luego `tramites` trae esos cambios y agrega filtros.

---

## Rama `puestos` (tu colega)

### Crear migración — tabla `areas`
```php
Schema::create('areas', function (Blueprint $table) {
    $table->id();
    $table->string('nombre');
    $table->text('descripcion')->nullable();
    $table->timestamps();
});
```

### Crear migración — agregar `area_id` a `users`
```php
Schema::table('users', function (Blueprint $table) {
    $table->foreignId('area_id')->nullable()->constrained()->nullOnDelete();
});
```

### Modelo `App\Models\Area`
```php
class Area extends Model
{
    protected $fillable = ['nombre', 'descripcion'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
```

### Actualizar `User.php`
- Agregar `'area_id'` a `$fillable`
- Agregar relación: `public function area(): BelongsTo`

### `AreaSeeder`
Crear áreas y asignar `area_id` a usuarios existentes.

### Comandos
```bash
git checkout puestos
# crear migraciones, modelo, seeder
git add .
git commit -m "feat: modulo areas y relacion con usuarios"
git fetch origin
git merge origin/main
git push origin puestos
# Crear PR puestos → main, el otro revisa y aprueba
git checkout main
git merge puestos
git push origin main
```

---

## Rama `tramites` (tú)

### Traer cambios de `main` (incluye áreas)
```bash
git checkout tramites
git fetch origin
git merge origin/main
```

### Agregar filtro `area_id` en `TramiteService@listar`
```php
->when($filtros['area_id'] ?? null, fn($q, $v) =>
    $q->whereHas('creador', fn($q) => $q->where('area_id', $v))
)
```

### Agregar filtro visual en frontend (`pages/Tramites/Index.tsx`)
- Pasar lista de áreas desde el controlador a la página Inertia
- Agregar `<Select>` de áreas en los filtros
- Al seleccionar, enviar `area_id` al servidor

### Opcional: exponer área en `UserResource`
Si se necesita mostrar el nombre del área en tablas de trámites.

### Comandos
```bash
git checkout tramites
git fetch origin
git merge origin/main
# editar TramiteService, Tramites/Index.tsx
git add .
git commit -m "feat: filtro de tramites por area de usuario"
git push origin tramites
# Crear PR tramites → main, el otro revisa y aprueba
```

---

## Coordinación

| Quién | Qué | Cuándo |
|-------|-----|--------|
| Colega | Termina rama `puestos` | 1ro |
| Colega | Mergea `puestos` → `main` | 2do |
| Tú | Traes `main` a `tramites` | 3ro |
| Tú | Implementas filtros | 4to |
| Tú | Mergeas `tramites` → `main` | 5to |

**Regla:** Cada PR es revisado y aprobado por el otro antes de mergear.
