# Pre-commit Hooks Setup

## ✅ Problema Resuelto
Este proyecto ahora formatea automáticamente el código **antes de cada commit**, evitando errores de CI por formato incorrecto.

## 🚀 Activación (Ya Instalado)
Los hooks ya están activos en tu repositorio. No necesitas hacer nada adicional.

## 🔍 ¿Qué Hace?
Cuando hagas `git commit`, automáticamente:
1. **Formatea código Python** con `ruff format` (ajusta espacios, líneas, etc.)
2. **Verifica archivos** (trailing whitespace, YAML/TOML válidos, no merge conflicts)
3. **Si algo cambia**, el commit se detiene y debes volver a agregar los archivos (`git add`)

## 📝 Flujo de Trabajo
```powershell
# Editas código (puede quedar mal formateado)
# ...

# Intentas commit
git add .
git commit -m "feat: nueva funcionalidad"

# Pre-commit formatea automáticamente
# Si hubo cambios, te avisa:
# "files were modified by this hook"

# Re-agregas los cambios formateados
git add .
git commit -m "feat: nueva funcionalidad"

# Ahora sí pasa ✅
```

## ⚡ Comandos Útiles
```powershell
# Ejecutar hooks manualmente en todos los archivos
C:/Users/David/AppData/Local/pypoetry/Cache/virtualenvs/inmo-pipeline-FAs5UJjc-py3.12/Scripts/pre-commit.exe run --all-files

# Saltarse hooks (emergencias solamente)
git commit --no-verify -m "mensaje"

# Actualizar versiones de hooks
C:/Users/David/AppData/Local/pypoetry/Cache/virtualenvs/inmo-pipeline-FAs5UJjc-py3.12/Scripts/pre-commit.exe autoupdate
```

## 🎯 Beneficios
- ✅ **No más errores de CI por formato** (era nuestro problema recurrente)
- ✅ **Código consistente** sin pensar en ello
- ✅ **Rápido** (solo formatea, no ejecuta tests ni linters pesados)
- ✅ **No bloquea commits** (si algo falla, solo re-agregas archivos)

## 🔧 Configuración
Ver `.pre-commit-config.yaml` para modificar hooks.

**Hooks actuales:**
- `ruff-format`: Formateador Python (crítico para CI)
- `trailing-whitespace`: Limpia espacios al final de líneas
- `end-of-file-fixer`: Asegura salto de línea al final
- `check-yaml`: Valida sintaxis YAML
- `check-toml`: Valida sintaxis TOML
- `check-merge-conflict`: Detecta marcadores de merge sin resolver

## ❓ Troubleshooting

**"pre-commit not found"**
```powershell
C:/Users/David/AppData/Local/pypoetry/Cache/virtualenvs/inmo-pipeline-FAs5UJjc-py3.12/Scripts/python.exe -m pip install pre-commit
C:/Users/David/AppData/Local/pypoetry/Cache/virtualenvs/inmo-pipeline-FAs5UJjc-py3.12/Scripts/pre-commit.exe install
```

**"Hooks take too long"**
- Solo ruff-format corre en commits (muy rápido)
- CI sigue ejecutando tests completos

**"Need to disable temporarily"**
```powershell
git commit --no-verify -m "mensaje"
```
