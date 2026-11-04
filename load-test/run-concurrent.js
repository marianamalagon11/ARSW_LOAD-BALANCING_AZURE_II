/**
 * Lanza N ejecuciones de Newman en paralelo contra la Azure Function de Fibonacci.
 *
 * Newman ejecuta los requests de una coleccion de forma secuencial, de modo que la
 * concurrencia se consigue disparando varias ejecuciones simultaneas de la misma
 * coleccion y esperando a que todas terminen.
 *
 *   node run-concurrent.js [peticiones] [nth]
 *
 * Por defecto: 10 peticiones concurrentes con nth = 1000000.
 */
const newman = require('newman');
const path = require('path');

const COLLECTION = path.join(__dirname, 'Fibonacci.postman_collection.json');
const PETICIONES = Number(process.argv[2] || 10);
const NTH = process.argv[3] || '1000000';

function lanzar(indice) {
    return new Promise((resolve) => {
        newman.run({
            collection: COLLECTION,
            envVar: [{ key: 'nth', value: NTH }],
            reporters: []
        }, (err, summary) => {
            const ejecucion = summary && summary.run.executions[0];
            const respuesta = ejecucion && ejecucion.response;
            resolve({
                indice,
                codigo: respuesta ? respuesta.code : null,
                ms: respuesta ? respuesta.responseTime : null,
                digitos: respuesta ? respuesta.stream.toString().length : 0,
                error: err ? err.message : (ejecucion && ejecucion.requestError) || null
            });
        });
    });
}

(async () => {
    console.log(`\nEnviando ${PETICIONES} peticiones concurrentes con nth = ${NTH}`);
    console.log(`Coleccion: ${path.basename(COLLECTION)}\n`);

    const inicio = Date.now();
    const resultados = await Promise.all(
        Array.from({ length: PETICIONES }, (_, i) => lanzar(i + 1))
    );
    const duracionTotal = Date.now() - inicio;

    console.log('  #   HTTP   tiempo (ms)   digitos de la respuesta');
    console.log('  --  -----  ------------  -----------------------');
    for (const r of resultados) {
        const codigo = r.codigo === null ? 'ERR' : r.codigo;
        const ms = r.ms === null ? '-' : r.ms;
        console.log(
            `  ${String(r.indice).padStart(2)}   ${String(codigo).padStart(3)}   ` +
            `${String(ms).padStart(10)}   ${String(r.digitos).padStart(10)}`
        );
        if (r.error) console.log(`       error: ${r.error}`);
    }

    const ok = resultados.filter((r) => r.codigo === 200);
    const tiempos = ok.map((r) => r.ms);
    const promedio = tiempos.length
        ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
        : 0;

    console.log('\n  Resumen');
    console.log(`  Peticiones enviadas .......... ${PETICIONES}`);
    console.log(`  Respondidas con 200 .......... ${ok.length}`);
    console.log(`  Fallidas ..................... ${PETICIONES - ok.length}`);
    console.log(`  Tiempo promedio .............. ${promedio} ms`);
    console.log(`  Tiempo minimo ................ ${tiempos.length ? Math.min(...tiempos) : 0} ms`);
    console.log(`  Tiempo maximo ................ ${tiempos.length ? Math.max(...tiempos) : 0} ms`);
    console.log(`  Duracion total del lote ...... ${duracionTotal} ms\n`);
})();
