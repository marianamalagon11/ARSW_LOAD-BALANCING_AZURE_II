var bigInt = require("big-integer");

/**
 * Cache de resultados. Vive en el ambito del modulo, no dentro del handler, de modo que
 * sobrevive entre invocaciones mientras el mismo proceso de Node siga activo. Esa es
 * justamente la condicion que el laboratorio pone a prueba: la cache no pertenece a la
 * Function App sino al proceso que la ejecuta en una instancia determinada.
 */
var cache = new Map();
cache.set(0, bigInt.zero);
cache.set(1, bigInt.one);

function fibonacci(n) {
    if (cache.has(n)) {
        return cache.get(n);
    }
    var valor = fibonacci(n - 1).add(fibonacci(n - 2));
    cache.set(n, valor);
    return valor;
}

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    var nth = req.body.nth;

    if (nth < 0) {
        throw 'must be greater than 0';
    }

    var estabaEnCache = cache.has(nth);
    var tamanoPrevio = cache.size;
    var inicio = process.hrtime.bigint();

    var answer;
    try {
        answer = fibonacci(nth);
    } catch (error) {
        // La recursion consume un marco de pila por termino no memoizado. Para valores
        // altos sobre una cache fria, Node agota la pila antes de llegar al caso base.
        context.res = {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: {
                nth: nth,
                error: error.message || String(error),
                cacheHit: estabaEnCache,
                cacheSize: cache.size,
                instancia: (process.env.WEBSITE_INSTANCE_ID || 'desconocida').substring(0, 12),
                procesoActivoSegundos: Number(process.uptime().toFixed(1))
            }
        };
        return;
    }

    var transcurridoMs = Number(process.hrtime.bigint() - inicio) / 1e6;
    var resultado = answer.toString();

    context.res = {
        headers: { 'Content-Type': 'application/json' },
        body: {
            nth: nth,
            digitos: resultado.length,
            resultado: resultado.length > 60
                ? resultado.substring(0, 30) + '...' + resultado.substring(resultado.length - 30)
                : resultado,
            cacheHit: estabaEnCache,
            cacheSizePrevio: tamanoPrevio,
            cacheSize: cache.size,
            transcurridoMs: Number(transcurridoMs.toFixed(3)),
            instancia: (process.env.WEBSITE_INSTANCE_ID || 'desconocida').substring(0, 12),
            procesoActivoSegundos: Number(process.uptime().toFixed(1))
        }
    };
};
