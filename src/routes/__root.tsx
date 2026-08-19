import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          A página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro interno. Você pode tentar atualizar a página ou voltar para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" },
      { title: "Ofertas 25 Anos" },
      { name: "description", content: "Responda e ganhe!" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Ofertas 25 Anos" },
      { property: "og:description", content: "Responda e ganhe!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Ofertas 25 Anos" },
      { name: "twitter:description", content: "Responda e ganhe!" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c73fc6dc-2bb0-48c9-bc95-94bbc5c2b41e/id-preview-25142bca--632e39f9-9ebc-44d3-bde4-453bb406bdef.lovable.app-1783753649852.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c73fc6dc-2bb0-48c9-bc95-94bbc5c2b41e/id-preview-25142bca--632e39f9-9ebc-44d3-bde4-453bb406bdef.lovable.app-1783753649852.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "preconnect", href: "https://www.googletagmanager.com", crossOrigin: "" },
      { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {


    (window as typeof window & { __lojaReactReady?: boolean }).__lojaReactReady = true;
    let lastKey = "";
    const getSid = () => {
      try {
        let sid = localStorage.getItem("lv_sid");
        if (!sid) {
          sid =
            (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
            "_" +
            Date.now().toString(36);
          localStorage.setItem("lv_sid", sid);
        }
        return sid;
      } catch {
        return "anon_" + Date.now().toString(36);
      }
    };
    const send = () => {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      const path = window.location.pathname + window.location.search;
      const title = document.title;
      const key = path + "|" + title;
      if (key === lastKey) return;
      lastKey = key;
      if (typeof w.gtag === "function") {
        w.gtag("event", "page_view", {
          send_to: "G-R1SP4FDD3C",
          page_title: title,
          page_location: window.location.href,
          page_path: path,
        });
      }
      try {
        fetch("/api/public/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            session_id: getSid(),
            path,
            title,
            referrer: document.referrer || null,
          }),
        }).catch(() => {});
      } catch {}
    };
    // Wait for HeadContent to commit the new <title> before reading document.title
    const scheduleSend = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setTimeout(send, 80)),
      );
    scheduleSend();
    const unsub = router.subscribe("onResolved", scheduleSend);
    return unsub;
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
