---
description: Revisión pre-commit + commit convencional en español del estado actual de TallerFlow.
agent: tallerflow-lead
---

Prepara y ejecuta un commit seguro del estado actual:

1. Inspecciona `git status`, `git diff` y `git diff --staged` para ver exactamente qué cambiará.
2. Delega la revisión del diff a `code-reviewer`.
3. Si hay hallazgos 🔴 CRÍTICOS: arréglalos (delega a `fullstack-dev` si es necesario) y vuelve a revisar.
4. Stagea SOLO los archivos intencionales — nunca `.env`, `.env.local`, logs (`*.log`), `.next/` ni `node_modules/`.
5. Crea el commit con mensaje convencional en español (feat/fix/chore/docs/refactor + módulo), por ejemplo: `feat(ordenes): ...`.
6. Muestra el `git log --oneline -3` final.

No hagas push a menos que te lo pidan explícitamente.

Instrucciones adicionales: $ARGUMENTS
