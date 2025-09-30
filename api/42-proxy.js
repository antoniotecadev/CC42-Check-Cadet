export default async function handler(req, res) {
  // CORS headers
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  const requestedHeaders = req.headers["access-control-request-headers"];
  res.setHeader(
    "Access-Control-Allow-Headers",
    requestedHeaders || "Content-Type, Authorization"
  );

  // Desabilitar cache do servidor/CDN
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Pega o path via query parameter
  const { path: apiPath } = req.query;

  if (!apiPath) {
    return res.status(400).json({
      error: "Missing 'path' query parameter",
      example: "/api/42-proxy?path=v2/campus/68/cursus/21/events",
    });
  }

  // Remove query 'path' e reconstrói query string sem ele
  const urlParams = new URLSearchParams(req.url.split("?")[1] || "");
  urlParams.delete("path");
  const queryString = urlParams.toString();
  const finalQuery = queryString ? `?${queryString}` : "";

  // URL final para API da 42
  const targetUrl = `https://api.intra.42.fr/${apiPath}${finalQuery}`;

  // Forward headers
  const forwardHeaders = {};
  if (req.headers.authorization) {
    forwardHeaders["Authorization"] = req.headers.authorization;
  }
  if (req.headers["content-type"]) {
    forwardHeaders["Content-Type"] = req.headers["content-type"];
  }

  // Body handling
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

    const contentType = fetchRes.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    
    // Garantir que a resposta não seja cacheada
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const arrayBuffer = await fetchRes.arrayBuffer();
    res.status(fetchRes.status).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("Proxy error:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(502).json({ error: "Bad Gateway", details: String(error) });
  }
}
