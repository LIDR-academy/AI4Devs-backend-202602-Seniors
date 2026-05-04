1.
Generate the data model of the current project on docs/data-model.md
2.
Create a backend-developer subagent
3.
Create a test subagent
4.
Create caracterization tests
5.
/plan-backend-ticket

GET /positions/:id/candidates
Este endpoint recogerá todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones para un determinado positionID. Debe proporcionar la siguiente información básica:

Nombre completo del candidato (de la tabla candidate).

current_interview_step: en qué fase del proceso está el candidato (de la tabla application).

La puntuación media del candidato. Recuerda que cada entrevist (interview) realizada por el candidato tiene un score


6.
/plan-backend-ticket

PUT /candidates/:id/stage
Este endpoint actualizará la etapa del candidato movido. Permite modificar la fase actual del proceso de entrevista en la que se encuentra un candidato específico.

7.
create a subagent expert on analising plans based on the goal and the current base code, and that is completly aware to best code practices, and test practices. A plan is form example @docs/plans/GET-positions-id-candidates_backend.md

8.
@plan-analyst @docs/plans/GET-positions-id-candidates_backend.md

9.
Update the plan based on the findings

10.
@plan-analyst @docs/plans/PUT-candidates-id-stage_backend.md

11.
Update the plan based on the findings

12.
@backend-developer @docs/plans/GET-positions-id-candidates_backend.md

13.
@backend-developer @docs/plans/PUT-candidates-id-stage_backend.md

14.
create a documenter subagent that must update outdated schemas and documentation, including readme file

15.
@documenter update outdated documentation

16. (Based on Code rabbit feedback)
Verify each finding against the current code and only fix it if needed.

In `@backend/src/application/services/candidateStageService.ts` around lines 8 -
83, The code has a TOCTOU risk because it reads candidate, application, and
interviewStep with plain prisma calls then calls Application.save() and
re-fetches with prisma.findUnique outside a transaction; wrap the entire
critical flow (the reads, validation, save, and re-fetch) in a single
prisma.$transaction to make it atomic, replacing
prisma.findUnique/findFirst/interviewStep reads with the transaction client
(tx.findUnique/tx.findFirst) and pass that tx into the domain save so
Application.save(tx) uses the same transaction client; ensure the final re-fetch
of the updated application also uses tx.findUnique so the returned Application
is the result of the same transaction and adjust the Application.save signature
to accept an optional prisma client for this transaction.


17. (Based on Code Rabbit documentation)
Verify each finding against the current code and only fix it if needed.

In `@backend/eslint.config.js` around lines 1 - 8, The current config imports only
eslint-config-prettier/flat (eslintConfigPrettier) which disables conflicting
rules but does not run Prettier as a lint rule; replace or augment that export
to use the eslint-plugin-prettier flat preset (import from
'eslint-plugin-prettier/flat' and include it in the exported array instead of or
in addition to eslintConfigPrettier) so Prettier runs as an ESLint rule (the
equivalent of the old plugin:prettier/recommended) and formatting errors are
reported by ESLint (update the exported array that currently references
eslintConfigPrettier).


18. (Based on Code Rabbit documentation)
Verify each finding against the current code and only fix it if needed.

In `@backend/package.json` at line 5, Remove the "type": "module" entry from
package.json to restore CommonJS mode so existing tooling works: this will fix
the dev script using ts-node-dev/ts-node v9 (avoid ERR_UNKNOWN_FILE_EXTENSION),
allow jest test runs without experimental VM flags, and make production JS
emitted by tsconfig.json ("module": "commonjs") run correctly; if you truly need
ESM instead, update ts-node, ts-node-dev, ts-jest/jest configuration, and
tsconfig to fully support ESM before re-adding "type": "module".
