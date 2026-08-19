import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { Socket } from "node:net";
import { Readable } from "node:stream";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || key in process.env) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(resolve(".env"));

const port = process.env.APP_PORT || process.env.NITRO_PORT || process.env.PORT || "5007";
const host = process.env.APP_HOST || process.env.NITRO_HOST || process.env.HOST || "0.0.0.0";
const startupTimeoutMs = Number(process.env.STARTUP_TIMEOUT_MS || "15000");

process.env.NODE_ENV ||= "production";
process.env.PORT = port;
process.env.NITRO_PORT = port;
process.env.HOST = host;
process.env.NITRO_HOST = host;

const nodeServerEntry = resolve(".output/server/index.mjs");
const fetchHandlerEntry = resolve("dist/server/index.mjs");
const serverEntryCandidates = [fetchHandlerEntry, nodeServerEntry];
const existingServerEntries = serverEntryCandidates.filter((candidate) => existsSync(candidate));

let activeServer;

process.on("unhandledRejection", (error) => {
  console.error("Falha assíncrona sem tratamento:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Falha não tratada:", error);
  process.exit(1);
});

function shutdown() {
  if (!activeServer) {
    process.exit(0);
    return;
  }

  activeServer.close(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

function canConnect(targetHost, targetPort) {
  return new Promise((resolveConnect) => {
    const socket = new Socket();
    let settled = false;

    const done = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolveConnect(result);
    };

    socket.setTimeout(500);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
    socket.connect(Number(targetPort), targetHost === "0.0.0.0" ? "127.0.0.1" : targetHost);
  });
}

async function isPortListening() {
  const attempts = Math.max(1, Math.ceil(startupTimeoutMs / 250));
  const probeHosts = host === "0.0.0.0" ? ["127.0.0.1", "localhost", "::1"] : [host];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    for (const probeHost of probeHosts) {
      if (await canConnect(probeHost, port)) return true;
    }
    await wait(250);
  }

  return false;
}

function notifyPm2Ready() {
  if (typeof process.send === "function") {
    process.send("ready");
  }
}

async function assertPortIsListening() {
  if (await isPortListening()) {
    notifyPm2Ready();
    return true;
  }

  console.error(`porta ${port} nao escutando`);
  console.error("O build foi encontrado, mas o servidor Node nao abriu a porta esperada.");
  console.error("Verifique se a VPS rodou bun run build e se o PM2 usa este diretorio como cwd.");
  return false;
}

if (existingServerEntries.length === 0) {
  console.error(
    "Build não encontrado: rode bun install && bun run build antes de iniciar o PM2.",
  );
  console.error("Entradas procuradas:");
  for (const candidate of serverEntryCandidates) {
    console.error(`- ${candidate}`);
  }
  process.exit(1);
}

console.log(`Starting ember-glow-nest on http://${host}:${port}`);
console.log(`Server entries found: ${existingServerEntries.join(", ")}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

function createNodeServerFromFetch(fetchHandler) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(
        request.url || "/",
        `http://${request.headers.host || `${host}:${port}`}`,
      );
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) {
          for (const item of value) headers.append(key, item);
        } else if (typeof value === "string") {
          headers.set(key, value);
        }
      }
      const body = ["GET", "HEAD"].includes(request.method || "GET")
        ? undefined
        : Readable.toWeb(request);
      const webRequest = new Request(requestUrl, {
        method: request.method,
        headers,
        body,
        duplex: body ? "half" : undefined,
      });
      const webResponse = await fetchHandler(webRequest, process.env, {
        waitUntil: () => undefined,
        passThroughOnException: () => undefined,
      });

      response.statusCode = webResponse.status;
      response.statusMessage = webResponse.statusText;
      webResponse.headers.forEach((value, key) => {
        response.setHeader(key, value);
      });

      if (!webResponse.body) {
        response.end();
        return;
      }

      Readable.fromWeb(webResponse.body).pipe(response);
    } catch (error) {
      console.error("Falha ao responder requisição:", error);
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("content-type", "text/plain; charset=utf-8");
      }
      response.end("Erro interno do servidor");
    }
  });

  server.once("error", (error) => {
    console.error(`Falha ao abrir http://${host}:${port}/:`, error);
    process.exit(1);
  });

  server.listen(Number(port), host, () => {
    console.log(`Listening on: http://${host}:${port}/`);
  });

  activeServer = server;
  return server;
}

async function startFromEntry(serverEntry) {
  console.log(`Using server entry: ${serverEntry}`);

  const serverModule = await import(`${serverEntry}?startedAt=${Date.now()}`);
  const app = serverModule.default;

  if (app && typeof app.fetch === "function") {
    createNodeServerFromFetch(app.fetch.bind(app));
    return await assertPortIsListening();
  }

  // Builds with preset node-server start listening during import and export an empty default.
  return await assertPortIsListening();
}

let started = false;

for (const serverEntry of existingServerEntries) {
  try {
    started = await startFromEntry(serverEntry);
    if (started) break;

    console.error(`A entrada ${serverEntry} nao abriu a porta ${port}. Tentando a proxima entrada.`);
  } catch (error) {
    console.error(`Falha ao iniciar usando ${serverEntry}:`);
    console.error(error);
  }
}

if (!started) {
  console.error("Falha ao iniciar o servidor de produção: nenhuma entrada abriu a porta esperada.");
  process.exit(1);
}