---
name: merge-to-main
description: Flujo completo para mergear una rama feature a main mediante PR con GitHub CLI. Usar cuando el desarrollador diga: mergear a main, mergear mi rama, pull request, PR, mergear cambios, subir cambios a main.
---

# Merge to Main

Flujo para mergear una rama feature a `main` usando PRs y GitHub CLI.

## Prerrequisitos

- GitHub CLI (`gh`) instalado y autenticado:
  ```powershell
  winget install --id GitHub.cli
  gh auth login
  ```

## Flujo

### 1. Verificar estado actual

```powershell
git status
```

- Si hay cambios sin commit, preguntar al usuario si quiere commitearlos con un mensaje descriptivo
- Identificar la rama actual (`git branch`)

### 2. Traer lo último de main

```powershell
git fetch origin
git merge origin/main
```

### 3. Resolver conflictos (si los hay)

Si `git merge` reporta conflictos:

```powershell
git diff --name-only --diff-filter=U
```

Para cada archivo en conflicto:
- Preguntar al usuario cómo resolverlo
- Una vez resuelto: `git add <archivo>`

Cuando todos estén resueltos:

```powershell
git commit -m "merge: resolver conflictos con origin/main"
```

### 4. Push de la rama

```powershell
git push origin <rama-actual>
```

### 5. Crear Pull Request

Preguntar al usuario:
- Título del PR (ej: "feat: filtro de tramites por area de usuario")
- Descripción del PR

```powershell
gh pr create --title "<titulo>" --body "<descripcion>" --base main
```

Mostrar la URL del PR creado.

### 6. Solicitar revisión

Indicar al usuario que le pida al otro desarrollador que revise el PR con:

```powershell
gh pr review <numero-pr> --approve
```

### 7. Mergear a main (después de aprobación)

```powershell
gh pr merge <numero-pr> --squash
git checkout main
git pull origin main
```

## Escenario actual (junio 2026)

- `puestos` ya está en `main` (mergeado)
- `tramites` está atrás de `main` — necesita `git merge origin/main` para recibir áreas
- Al hacer merge en `tramites`, prestar atención a conflictos en:
  - `routes/web.php`
  - `database/seeders/DatabaseSeeder.php`
  - `app/Models/User.php`
