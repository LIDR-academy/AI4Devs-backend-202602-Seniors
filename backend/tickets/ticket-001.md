## TICKET-001 · 2026-04-30

## Título
Exponer candidatos en proceso con fase actual y puntuación media

## Historia de Usuario
Como **recruiter o hiring manager**, quiero consultar todos los candidatos en proceso para una posición concreta junto con su fase actual de entrevista y su puntuación media acumulada, para **tomar decisiones de avance o descarte de forma rápida y basada en datos**.

## Criterios de Aceptación

**CA-1:**
- **Dado que** existe una posición válida (`positionId`) con al menos una aplicación activa
- **Cuando** se realiza `GET /positions/:id/candidates`
- **Entonces** la respuesta HTTP 200 incluye un array de objetos con los campos `fullName`, `currentInterviewStep` y `averageScore` para cada candidato en proceso

**CA-2:**
- **Dado que** un candidato tiene múltiples entrevistas registradas, cada una con su propio `score`
- **Cuando** el endpoint calcula la puntuación del candidato
- **Entonces** `averageScore` es la media aritmética de todos los `score` de sus entrevistas vinculadas a esa aplicación, redondeada a dos decimales; si no hay entrevistas con score, devuelve `null`

**CA-3:**
- **Dado que** se proporciona un `positionId` válido pero sin aplicaciones, o un `positionId` inexistente
- **Cuando** se realiza `GET /positions/:id/candidates`
- **Entonces** la respuesta devuelve HTTP 200 con un array vacío `[]` en el primer caso, y HTTP 404 con mensaje descriptivo en el segundo

## Estimación de Complejidad

| Campo | Detalle |
|-------|---------|
| **Tamaño** | M |
| **Justificación** | Requiere un JOIN entre tres tablas (`position`, `application`, `candidate`, `interview`) con una agregación (`AVG`) y lógica de manejo de nulos; la incertidumbre es baja porque el esquema está definido, pero el esfuerzo de query + mapeo de respuesta + tests es moderado. |

## Evaluación INVEST

| Criterio | Estado | Observación |
|----------|--------|-------------|
| **I**ndependiente | ✅ | No depende de otras historias en curso; el esquema de tablas ya existe. |
| **N**egociable | ✅ | Los campos de respuesta y el manejo de `averageScore` nulo son ajustables sin romper el valor central. |
| **V**aliosa | ✅ | Permite al recruiter monitorizar el pipeline de una posición en una sola llamada, eliminando consultas manuales. |
| **E**stimable | ✅ | Requisitos de datos claros y esquema conocido; el equipo puede dimensionarla sin ambigüedad. |
| **S**mall | ✅ | Un único endpoint de lectura; cabe cómodamente en un sprint corto. |
| **T**esteable | ✅ | Todos los criterios tienen entradas, acciones y salidas observables y verificables mediante tests de integración. |

> **Leyenda:** ✅ Cumple plenamente · ⚠️ Cumple parcialmente (requiere atención) · ❌ No cumple (bloquea el refinamiento)
