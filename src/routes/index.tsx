import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ofertas 25 Anos" },
      { property: "og:title", content: "Ofertas 25 Anos" },
      { name: "twitter:title", content: "Ofertas 25 Anos" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      esta dando erro : {"{\n"}
      {"  \"timestamp\": 1787251185113,\n"}
      {"  \"error_type\": \"RUNTIME_ERROR\",\n"}
      {"  \"filename\": \"https://localhost:8080/_serverFn/eyJmaWxlIjoiL3NyYy9saWIveHBhZy5mdW5jdGlvbnMudHM_dHNzLXNlcnZlcmZuLXNwbGl0IiwiZXhwb3J0IjoiY3JlYXRlWHBhZ1NwZWlfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9\",\n"}
      {"  \"lineno\": 0,\n"}
      {"  \"colno\": 0,\n"}
      {"  \"stack\": \"Error: XPag respondió con un formato inválido (HTTP 404). Verifica la URL de la API y la clave configurada.\\n    at Object.eval (/dev-server/src/lib/xpag.functions.ts:86:13)\\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at async server (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:944:24)\\n    at async callNextMiddleware (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:322:24)\\n    at async AsyncFunction.__executeServer (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:212:20)\\n    at async eval (/dev-server/node_modules/@tanstack/start-server-core/src/server-functions-handler.ts:159:16)\\n    at async eval (/dev-server/node_modules/@tanstack/start-server-core/src/server-functions-handler.ts:81:17)\\n    at async handleServerAction (/dev-server/node_modules/@tanstack/start-server-core/src/server-functions-handler.ts:418:10)\\n    at async next (/dev-server/node_modules/@tanstack/start-server-core/src/createStartHandler.ts:301:16)\\n    at async eval (/dev-server/src/start.ts:8:12)\",\n"}
      {"  \"has_blank_screen\": true\n"}
      {"}"}
    </div>
  );
}
