Editor: Visual Studio Code
Herramienta de IA: Claude Caude
Motor de IA: Haiku

Prompts ejecutados en orden:

1. He empezado con el comando por defecto /init para generar un fichero CLAUDE.md

2. Primer prompt

Take the role of a senior backend architect with specialization in NodeJs and Express.
You will be developing features for an ATS project system.

Your first task is to analyze the "/backend" folder and extract the team best practices into a "backend-dev" skill.

In addition, add to the skill:
· Best practices related to creating new endpoints in express infrastructure.
· Mention how to update the swagger
· Discover related mcps that can help with the current project backend development

[Ouput] --> `skills/backend-dev.md`

3. Segundo prompt

Cuál sería un buen prompt para generar un agente en claude code que se encargue del desarrollo de backend para una aplicación hecha con express?
La base de datos está en PostgreSQL con Prisma.
Los tests se lanzan con jest.
Test are launched with jest.
El proyecto usa prettier y linter.

[Ouput] --> `agents/backend-developer.md`

4. Tercer prompt

Asume el rol de un jefe de producto.
En tu opinión, qué requisitos debe contener un ticket para ser desarrollado integramente por una Inteligencia Artificial?
Estructura tu respuesta como una skill "improve-ticket.md"

[Ouput] --> `improve-ticket.md`

5. Cuarto prompt

Aplica tu skill de @.claude/skills/improve-ticket.md para contruir un ticket completo de la siguiente historia de usuario:

```
Copiar pegar de las instrucciones del ejercicio para cada endpoint por separado
```

6. Quinto prompt

@.claude/agents/backend-developer.md implement @prompts/ticket-get-positions-candidates.md

y

@.claude/agents/backend-developer.md implement @prompts/ticket-put-candidates-stage.md
