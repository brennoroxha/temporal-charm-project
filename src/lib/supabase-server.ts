type QueryValue = string | number | boolean | null;
type OrderRow = {
  id: string;
  transaction_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_document: string | null;
  customer_phone: string | null;
  amount: number;
  status: string;
  items: unknown;
  shipping: unknown;
  qrcode: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  event_id?: string;
  purchase_event_sent?: boolean;
  purchase_event_sent_at?: string;
};
type OrderInsert = {
  transaction_id: string;
  customer_name: string;
  customer_email: string;
  customer_document: string | null;
  customer_phone: string | null;
  amount: number;
  status: string;
  items: unknown;
  shipping: unknown;
  qrcode: string;
  metadata: unknown;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  event_id?: string;
};
type OrderStatus = { status: string | null; amount: number | null };

// Server-side REST client using the publishable key. It avoids creating the
// realtime client, which crashes on Node 20 when native WebSocket is absent.
export function getServerSupabase() {
  const { url, key } = getSupabaseConfig();
  return {
    rpc(
      name: "upsert_page_view" | "insert_page_view_event" | "insert_visit_log",
      body: Record<string, unknown>,
    ) {
      return request<void>(url, key, `/rest/v1/rpc/${name}`, {
        method: "POST",
        body,
      });
    },
    from(table: "orders") {
      return createOrdersBuilder(url, key, table);
    },
    storage: {
      from(bucket: "receipts") {
        return createStorageBucket(url, key, bucket);
      },
    },
  };
}

function createOrdersBuilder(url: string, key: string, table: "orders") {
  return {
    select(columns: string = "*") {
      return {
        eq(column: string, value: QueryValue) {
          return {
            async single() {
              const { data, error } = await request<OrderRow[]>(url, key, `/rest/v1/${table}`, {
                method: "GET",
                query: { [column]: `eq.${String(value)}`, select: columns },
                headers: { Accept: "application/vnd.pgrst.object+json" },
              });
              // Note: request returns a single object when Accept is pgrst.object+json
              return { data: data as unknown as OrderRow, error };
            },
          };
        },
      };
    },
    insert(body: OrderInsert) {
      return request<unknown[]>(url, key, `/rest/v1/${table}`, {
        method: "POST",
        body,
        headers: { Prefer: "return=minimal" },
      });
    },
    update(body: Record<string, QueryValue>) {
      return {
        eq(column: string, value: QueryValue) {
          return request<unknown[]>(url, key, `/rest/v1/${table}`, {
            method: "PATCH",
            body,
            query: { [column]: `eq.${String(value)}` },
            headers: { Prefer: "return=minimal" },
          });
        },
      };
    },
  };
}

export async function getOrderStatusByTransactionId(transactionId: string) {
  const { url, key } = getSupabaseConfig();
  const { data, error } = await request<OrderStatus[]>(
    url,
    key,
    "/rest/v1/rpc/get_order_status",
    {
      method: "POST",
      body: { p_transaction_id: transactionId },
    }
  );
  if (error) return { data: null, error };
  const row = data?.[0];
  return {
    data: {
      status: row?.status ?? null,
      amount: row?.amount ?? null,
    },
    error: null,
  };
}

function createStorageBucket(url: string, key: string, bucket: "receipts") {
  return {
    async upload(
      path: string,
      bytes: Buffer,
      options: { contentType: string; upsert: boolean }
    ) {
      const endpoint = `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`;
      const body = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(body).set(bytes);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...authHeaders(key),
          "content-type": options.contentType,
          "x-upsert": options.upsert ? "true" : "false",
        },
        body,
      });
      if (res.ok) return { data: await readResponse(res), error: null };
      return { data: null, error: await responseError(res) };
    },
  };
}

async function request<T>(
  url: string,
  key: string,
  path: string,
  options: {
    method: "GET" | "POST" | "PATCH";
    body?: unknown;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  }
) {
  const endpoint = new URL(`${url}${path}`);
  for (const [name, value] of Object.entries(options.query ?? {})) {
    endpoint.searchParams.set(name, value);
  }

  const res = await fetch(endpoint, {
    method: options.method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (res.ok) return { data: (await readResponse(res)) as T, error: null };
  return { data: null, error: await responseError(res) };
}

async function readResponse(res: Response) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function responseError(res: Response) {
  const payload = await readResponse(res);
  const message =
    typeof payload === "object" && payload && "message" in payload
      ? String((payload as { message?: unknown }).message)
      : `Backend request failed with status ${res.status}`;
  return { message, status: res.status, payload };
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  // Prefer the service role key: checkout writes (orders, receipts) run
  // server-side only, so no anonymous RLS policies are needed for them.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }
  return { url: url.replace(/\/$/, ""), key };
}

// New-style Supabase API keys (sb_secret_/sb_publishable_) are opaque strings,
// not JWTs, so they must not be sent as a bearer token.
function authHeaders(key: string): Record<string, string> {
  if (key.startsWith("sb_")) return { apikey: key };
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}