#!/bin/bash
# SessionStart hook: sincroniza las skills COMPARTIDAS listadas en .claude/skills.txt
# desde el repo central vicentedomus/claude-skills.
#
# Diferencias clave vs. la versión original (que solo hacía un curl al SKILL.md):
#   1. Trae la CARPETA COMPLETA de cada skill (SKILL.md + scripts/ + references/ + …)
#      clonando el repo (shallow) y copiando con `cp -a` → preserva permisos, así los
#      scripts .sh quedan ejecutables. Una skill puede crecer sin tocar este hook.
#   2. Las skills compartidas NO se comitean (van en .gitignore); este hook las
#      materializa en cada sesión. skills.txt es el ÚNICO knob per-repo: lo que no
#      esté listado no existe en disco → no carga en contexto.
#   3. Al terminar emite `reloadSkills: true` para que Claude Code re-escanee y cargue
#      las skills recién creadas en ESTA misma sesión. Sin ese flag solo aparecerían
#      en la siguiente sesión — fatal en Claude Code on the web, que clona el repo
#      limpio en cada sesión (cada sesión es, en la práctica, la "primera").
#
# FALLBACK offline: como las compartidas ya no se comitean, un fallo del `git clone`
# en un contenedor fresco las dejaría ausentes toda la sesión. Por eso, si el clone
# falla, caemos a descargar al menos cada SKILL.md vía curl (comportamiento histórico):
# se pierden los assets (scripts/references) pero la skill sigue cargando y siendo
# invocable. Solo emitimos `reloadSkills` si materializamos al menos una skill.
#
# El JSON del hook debe ser lo ÚNICO en stdout → todos los logs van a stderr.

REPO_URL="https://github.com/vicentedomus/claude-skills.git"
RAW_URL="https://raw.githubusercontent.com/vicentedomus/claude-skills/main"
REF="main"
SKILLS_DIR="$CLAUDE_PROJECT_DIR/.claude/skills"
SKILLS_TXT="$CLAUDE_PROJECT_DIR/.claude/skills.txt"

log() { echo "$@" >&2; }

skills=$(grep -v '^\s*#' "$SKILLS_TXT" 2>/dev/null | grep -v '^\s*$')
[ -z "$skills" ] && exit 0

mkdir -p "$SKILLS_DIR"
materialized=0

# Clona en un tmp efímero (se borra al salir, pase lo que pase).
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

if git clone --quiet --depth 1 --branch "$REF" "$REPO_URL" "$TMP" 2>/dev/null; then
  # Vía preferida: carpeta completa de cada skill, preservando permisos.
  for skill in $skills; do
    if [ -d "$TMP/$skill" ]; then
      rm -rf "$SKILLS_DIR/$skill"           # limpia la versión previa → sin huérfanos
      cp -a "$TMP/$skill" "$SKILLS_DIR/$skill"
      materialized=$((materialized + 1))
      log "✓ $skill"
    else
      log "✗ $skill (no encontrada en claude-skills)"
    fi
  done
else
  # Fallback: el clone falló (red caída / rate-limit / política de red). Bajamos al
  # menos el SKILL.md de cada skill para que siga cargando esta sesión.
  log "⚠ sync-skills: clone falló; fallback a curl de SKILL.md por skill"
  for skill in $skills; do
    tmp="$(mktemp)"
    if curl -sf "$RAW_URL/$skill/SKILL.md" -o "$tmp" && [ -s "$tmp" ]; then
      mkdir -p "$SKILLS_DIR/$skill"
      mv "$tmp" "$SKILLS_DIR/$skill/SKILL.md"
      materialized=$((materialized + 1))
      log "✓ $skill (solo SKILL.md, sin assets)"
    else
      rm -f "$tmp"
      # No hay red NI copia previa en disco: esta skill no estará disponible.
      [ -f "$SKILLS_DIR/$skill/SKILL.md" ] \
        && { materialized=$((materialized + 1)); log "✓ $skill (copia previa en disco)"; } \
        || log "✗ $skill (sin red y sin copia local)"
    fi
  done
fi

# Solo forzamos re-escaneo si materializamos algo nuevo. Único contenido en stdout.
if [ "$materialized" -gt 0 ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","reloadSkills":true}}\n'
fi
exit 0
