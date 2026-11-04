# Informe de Laboratorio: Escalabilidad Serverless con Azure Functions

### Escuela Colombiana de Ingeniería Julio Garavito
### Arquitecturas de Software - ARSW

**Integrantes:**
- Paula Lozano
- Mariana Malagón

**Fecha:** 2026-10-30

---

## Parte 0. Entendiendo el escenario de calidad

**Escenario de escalabilidad planteado:**

> Cuando un conjunto de usuarios consulta un enésimo número (superior a 1.000.000) de la
> secuencia de Fibonacci de forma concurrente y el sistema se encuentra bajo condiciones
> normales de operación, todas las peticiones deben ser respondidas y el consumo de CPU
> del sistema no puede superar el 70%.

| Elemento del escenario | Valor |
|---|---|
| Fuente | Conjunto de usuarios concurrentes |
| Estímulo | Petición del enésimo valor de Fibonacci (n > 1.000.000) |
| Artefacto | Azure Function App (`Fibonacci`) |
| Ambiente | Operación normal |
| Respuesta | Todas las peticiones son respondidas |
| Medida de respuesta | CPU del sistema ≤ 70% |

**Análisis previo:**

_(escribir aquí: por qué el cálculo de Fibonacci para n > 1.000.000 es CPU-bound, y qué
estrategia de escalamiento aplica serverless frente a VMs / Scale Sets)_

---

## Paso 1. Creación de la Function App

**Configuración usada:**

| Parámetro | Valor |
|---|---|
| Suscripción | Azure for Students |
| Resource Group | `SCALABILITY_LAB_II` |
| Function App name | `FunctionProjectFibonacciM` |
| Runtime stack | Node.js (`FUNCTIONS_WORKER_RUNTIME = node`) |
| Versión | 22 LTS (`WEBSITE_NODE_DEFAULT_VERSION = ~22`) |
| Versión del runtime de Functions | v4 (`FUNCTIONS_EXTENSION_VERSION = ~4`) |
| Región | South Central US |
| Sistema operativo | Windows |
| Plan | Consumo / Serverless (SKU `Y1`, tier `Dynamic`) |
| App Service Plan | `ASP-SCALABILITYLABII-a7fb` |
| Storage Account | `scalabilitylabii95ab` |
| Application Insights | `FunctionProjectFibonacciM` |
| Host | `functionprojectfibonaccim-cqaqd4aravgwaeht.southcentralus-01.azurewebsites.net` |

> **Nota sobre la versión de Node:** el enunciado muestra Node.js 12 y la documentación de
> Microsoft indica que la edición en el portal requiere el modelo de programación v3
> (basado en `function.json`), asociado a Node 18/20. Sin embargo, al momento de realizar
> el laboratorio el portal solo ofrece las versiones **22 LTS** y **24 LTS**, por lo que se
> seleccionó 22 LTS por ser la versión LTS estable.

**Incidencia encontrada: región no permitida**

El enunciado del laboratorio indica usar la región **East US 2**. Al intentar crear la
Function App en esa región, el despliegue falló completo con el error:

```
InvalidTemplateDeployment / RequestDisallowedByAzure
Resource 'FunctionProjectFibonacciM' was disallowed by Azure: This policy maintains a set
of best available regions where your subscription can deploy resources.
```

El error afectó a los cuatro recursos de la plantilla (Function App, App Service Plan,
Storage Account y Log Analytics Workspace). La causa es una **Azure Policy** aplicada a las
suscripciones *Azure for Students*, llamada `Allowed resource deployment regions`
(definición `b86dabb9-b578-4d7b-b842-3b45e95769a1`), que restringe las regiones de
despliegue mediante una lista blanca.

Consultando los parámetros de la política asignada a la suscripción:

```bash
az policy assignment list \
  --query "[?displayName=='Allowed resource deployment regions'].parameters" -o json
```

Se obtuvo la lista de regiones permitidas:

| Región permitida | Código |
|---|---|
| South Central US | `southcentralus` |
| North Central US | `northcentralus` |
| Canada Central | `canadacentral` |
| Brazil South | `brazilsouth` |
| Chile Central | `chilecentral` |

Se seleccionó **South Central US** por ser una región madura con disponibilidad completa
del plan de Consumo sobre Windows, y por ser la de menor latencia desde Colombia entre las
cinco opciones, lo cual es relevante para las pruebas de concurrencia del Paso 5.

<!-- ![Error de política de región](images/informe/00-region-policy-error.png) -->

**Capturas:**

<!-- ![Creación de la Function App](images/informe/01-function-app-basics.png) -->
<!-- ![Hosting y storage](images/informe/02-function-app-hosting.png) -->
<!-- ![Recurso creado](images/informe/03-function-app-created.png) -->

**Explicación:**

_(pendiente)_

---

## Paso 2. Creación de la function desde el portal de Azure

El laboratorio original plantea desplegar la function con la extensión de Azure Functions
para Visual Studio Code. En este desarrollo se optó por **crear y editar la function
directamente desde la interfaz web del portal de Azure** (opción *Develop in portal* del
editor *Code + Test*).

Esto impone dos condiciones sobre la Function App, documentadas por Microsoft:

1. El sistema operativo debe ser **Windows** y el plan **Consumption (Serverless)**; la
   edición en el portal no está disponible en el plan *Flex Consumption*.
2. Para JavaScript, la edición en el portal solo es compatible con el **modelo de
   programación v3** de Node.js, que es el que declara los bindings en un archivo
   `function.json`, exactamente el modelo que usa el proyecto entregado.

**Capturas:**

<!-- ![Crear function con plantilla HTTP trigger](images/informe/04-create-function-template.png) -->
<!-- ![Editor Code + Test en el portal](images/informe/05-code-and-test.png) -->

**Explicación:**

_(pendiente)_

---

## Paso 3. Código de la function en el portal

Se reprodujo la lógica iterativa del proyecto entregado
(`FunctionProject/Fibonacci/index.js`) en el editor del portal.

**Adaptación realizada:** el proyecto original usa la dependencia npm `big-integer` para
soportar enteros de precisión arbitraria. Como el editor del portal no permite instalar
paquetes npm, se reemplazó por el tipo **`BigInt` nativo de JavaScript**, que ofrece la
misma precisión arbitraria sin dependencias externas. El algoritmo y los resultados son
equivalentes.

**Capturas:**

<!-- ![index.js en el editor del portal](images/informe/06-index-js-portal.png) -->
<!-- ![function.json en el editor del portal](images/informe/07-function-json-portal.png) -->

**Explicación:**

_(pendiente)_

---

## Paso 4. Prueba de la Function desde el portal de Azure

**Petición enviada:**

```json
{ "nth": 10 }
```

**Capturas:**

<!-- ![Test/Run en el portal](images/informe/08-test-portal.png) -->
<!-- ![Respuesta de la function](images/informe/09-test-response.png) -->

**Resultado:**

_(pendiente)_

---

## Paso 5. Pruebas de carga: 10 peticiones concurrentes con Newman

**Comando ejecutado:**

```bash
(pendiente)
```

**Resultados:**

| Métrica | Valor |
|---|---|
| Peticiones enviadas | |
| Peticiones respondidas | |
| Fallidas | |
| Tiempo de respuesta promedio | |
| Tiempo de respuesta mínimo / máximo | |
| Duración total | |

**Capturas:**

<!-- ![Salida de Newman](images/informe/10-newman-run.png) -->
<!-- ![Métricas de CPU/ejecuciones en Azure](images/informe/11-azure-metrics.png) -->

**Análisis:**

_(pendiente: ¿se respondieron todas las peticiones? ¿cómo se comportó el escalamiento
automático del plan de consumo? ¿se cumple el escenario de calidad?)_

---

## Paso 6. Function recursiva con memoization

**Implementación:** `FunctionProject/FibonacciMemo/index.js`

**Pruebas realizadas:**

| # | `nth` | Momento | Tiempo de respuesta | ¿Cache hit? |
|---|---|---|---|---|
| 1 | | Primera ejecución | | |
| 2 | | Repetición inmediata | | |
| 3 | | Después de 5+ min de inactividad | | |

**Capturas:**

<!-- ![Primeras ejecuciones](images/informe/12-memo-first.png) -->
<!-- ![Ejecución después de 5 minutos](images/informe/13-memo-after-idle.png) -->

**Comportamiento observado:**

_(pendiente)_

---

## Preguntas

### 1. ¿Qué es un Azure Function?

_(pendiente)_

### 2. ¿Qué es serverless?

_(pendiente)_

### 3. ¿Qué es el runtime y qué implica seleccionarlo al momento de crear el Function App?

_(pendiente)_

### 4. ¿Por qué es necesario crear un Storage Account de la mano de un Function App?

_(pendiente)_

### 5. ¿Cuáles son los tipos de planes para un Function App? ¿En qué se diferencian? Ventajas y desventajas de cada uno

_(pendiente)_

### 6. ¿Por qué la memoization falla o no funciona de forma correcta?

_(pendiente)_

### 7. ¿Cómo funciona el sistema de facturación de las Function App?

_(pendiente)_

---

## Conclusiones

_(pendiente)_
