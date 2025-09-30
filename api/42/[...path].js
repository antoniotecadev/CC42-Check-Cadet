export default async function handler(req, res) {
    // CORS sempre liberado (ajusta para domínio fixo em produção)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    // Preflight (OPTIONS) → responde rápido
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Extrai caminho dinâmico (Next.js → [...path].js)
    let path = "";
    if (Array.isArray(req.query.path)) {
        path = req.query.path.join("/");
    } else if (typeof req.query.path === "string") {
        path = req.query.path;
    }

    // Reconstrói query string
    const qsIndex = req.url.indexOf("?");
    const queryString = qsIndex >= 0 ? req.url.slice(qsIndex) : "";

    // URL final para API da 42
    const targetUrl = `https://api.intra.42.fr/${path}${queryString}`;

    // Encaminhar headers necessários
    const forwardHeaders = {};
    if (req.headers.authorization) {
        forwardHeaders["Authorization"] = req.headers.authorization;
    }
    if (req.headers["content-type"]) {
        forwardHeaders["Content-Type"] = req.headers["content-type"];
    }

    // Body (quando não for GET/HEAD)
    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
        if (
            req.body &&
            typeof req.body === "object" &&
            !(req.body instanceof Buffer)
        ) {
            body = JSON.stringify(req.body);
            if (!forwardHeaders["Content-Type"]) {
                forwardHeaders["Content-Type"] = "application/json";
            }
        } else if (req.body instanceof Buffer) {
            body = req.body;
        } else if (typeof req.body === "string") {
            body = req.body;
        }
    }

    try {
        const fetchRes = await fetch(targetUrl, {
            method: req.method,
            headers: forwardHeaders,
            body,
        });

        // Copia Content-Type da resposta original
        const contentType = fetchRes.headers.get("content-type");
        if (contentType) res.setHeader("Content-Type", contentType);

        // Reaplica CORS (garante aceitação pelo browser)
        res.setHeader("Access-Control-Allow-Origin", "*");

        const arrayBuffer = await fetchRes.arrayBuffer();
        res.status(fetchRes.status).send(Buffer.from(arrayBuffer));
    } catch (error) {
        console.error("Proxy error:", error);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.status(502).json({ error: "Bad Gateway", details: String(error) });
    }
}
