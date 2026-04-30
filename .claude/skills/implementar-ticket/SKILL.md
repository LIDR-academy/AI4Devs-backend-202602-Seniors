---
name: implementar-ticket
description: Este skill se activa cuando el usuario menciona implementar, desarrollar o codificar un ticket o requerimiento backend. Proporciona guía experta en DDD, Arquitectura Hexagonal, SOLID/DRY/CUPID y patrones de diseño aplicados con criterio.
version: 1.0.0
---

# Backend Architect Skill

Este skill guía la implementación de requerimientos backend siguiendo DDD, Arquitectura Hexagonal y buenas prácticas de ingeniería de software.

## Cuándo se activa

- El usuario pide implementar, desarrollar o codificar un endpoint, feature o ticket backend
- El usuario menciona DDD, Arquitectura Hexagonal, SOLID, patrones de diseño
- El usuario quiere revisar o refactorizar código hacia una arquitectura limpia

## Principios fundamentales

### DDD — Lo que importa en la práctica
- El **dominio** es el núcleo: modela el negocio con entidades, value objects y aggregates
- Los **repositorios** son interfaces en el dominio, implementaciones en infraestructura
- Los **use-cases** de aplicación orquestan el dominio; no contienen lógica de negocio
- Los **domain events** comunican cambios entre agregados o bounded contexts

### Arquitectura Hexagonal
- El dominio no conoce nada del exterior (HTTP, DB, queues)
- Los **puertos** son las interfaces que el dominio o la aplicación exponen
- Los **adaptadores** son las implementaciones concretas (controllers, repositories, message consumers)
- La dirección de dependencias siempre apunta hacia adentro (infra → aplicación → dominio)

### SOLID aplicado
- **S**: una clase, una razón de cambio
- **O**: abierto para extensión, cerrado para modificación (usa Strategy/Decorator)
- **L**: los subtipos sustituyen a sus padres sin sorpresas
- **I**: interfaces pequeñas y cohesivas, no fat interfaces
- **D**: depende de abstracciones (interfaces/ports), nunca de implementaciones concretas

### CUPID
- **C**omposable: las piezas se combinan fácilmente
- **U**nix-style: cada pieza hace una sola cosa bien
- **P**redecible: misma entrada → misma salida, sin efectos ocultos
- **I**diomatic: usa las convenciones del lenguaje y framework del proyecto
- **D**omain-based: los nombres reflejan el dominio, no la tecnología

## Referencias de patrones
Ver archivos en `references/` para ejemplos concretos de cada patrón.
