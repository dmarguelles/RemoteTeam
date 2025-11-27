---
description: Git & PR operating model
applyTo: "**"
---
## Branching & History (GitHub Flow)
- Branch prefixes: `feat/`, `fix/`, `refactor/`, `chore/`, `hotfix/` (+ optional JIRA ID).
- Keep `main` protected and **linear**. Update branches by `rebase` on `main`. Avoid `merge main`.
- Force-push **only** with `--force-with-lease` and **never** to protected branches.
- **No direct commits to `main`**. **PRs are mandatory** to merge into `main` (≥1 review approval).

## Commits & PRs
- Conventional Commits (`feat:`, `fix:`, …). Small, cohesive commits.
- PR body must include: **Overview**, **Context/Motivation**, **What changed**, **Why**, **How to test**, **Backward compatibility / Breaking changes**, **Risk & Rollback**, **Checklist**.
- Releases from SemVer tags `vX.Y.Z`. Hotfix from last stable tag → back-merge via PR.

## Troubleshooting Playbooks (PowerShell-safe)
```powershell
# Update your branch with latest main (rebase)
git checkout main; git pull origin main
git checkout <feature>; git rebase main; git push --force-with-lease
# Resolve conflicts
git rebase main
# fix files
git add <file>; git rebase --continue
# Hotfix from tag v1.2.0 → v1.2.1
git checkout tags/v1.2.0 -b hotfix/v1.2.1
# apply fix + tests
git tag v1.2.1; git push origin v1.2.1
# open PR hotfix → main
```
### Reflog & Recovery (rescate de cambios perdidos)
Cuándo usarlo: has hecho un `reset --hard`, un rebase/force-push erróneo, o perdiste una rama/commit.
```powershell
# Ver el historial de HEADs recientes (acciones locales incluidas)
git reflog --date=iso

# Crear una rama de rescate en el commit recuperado
git checkout -b rescue/<ticket-o-descripcion> <commit>

# Alternativa: resetear la rama actual al commit recuperado
git reset --hard <commit>
git push --force-with-lease

# Restaurar una rama borrada si conoces el commit
git branch <restored-branch> <commit>
```

**Notas**:
- Valida el estado del árbol antes de publicar (`git status`, tests).
- Publica con `--force-with-lease` para no pisar trabajo ajeno.
- Si no recuerdas el commit, busca por fecha/autor con `git reflog` o `git fsck --lost-found`.

### Cherry-pick — casos soportados
Para trasladar uno o varios commits específicos entre ramas sin mezclar histories completos.

**A) Un solo commit**
```powershell
git fetch origin
git checkout <target-branch>
git cherry-pick -x <SHA>   # -x añade referencia al commit original
# Resolver conflictos si aparecen
git add <file>; git cherry-pick --continue
# Cancelar si es necesario
git cherry-pick --abort
```

**B) Varios commits (lista o rango)**
```powershell
# Lista explícita
git cherry-pick -x <SHA1> <SHA2> <SHA3>

# Rango continuo (incluye ambos extremos)
git cherry-pick -x <A>^..<B>
```

**C) Hotfix → main (o release) manteniendo trazabilidad**
```powershell
git checkout main
git pull --ff-only
git cherry-pick -x <SHA-del-hotfix>
git push
```

**D) Cherry-pick de commits de merge**
```powershell
# Elegir el parent correcto del merge (habitualmente 1)
git cherry-pick -m 1 <merge-commit-sha>
```
**Checklist tras cherry-pick**: compila, tests verdes, `Conventional Commit` si editas el mensaje y, si la rama es protegida, abre PR.