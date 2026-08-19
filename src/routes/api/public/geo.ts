import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/geo')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                         request.headers.get('cf-connecting-ip') || 
                         '127.0.0.1';
        
        const { getServerSupabase } = await import("@/lib/supabase-server");
        const supabase = getServerSupabase();

        // Verificar se o IP está na whitelist do banco
        let isWhitelisted = false;
        try {
          // @ts-ignore
          const { data: result } = await (supabase as any)
            .from('whitelist_ips')
            .select('ip')
            .eq('ip', clientIp)
            .maybeSingle();
          isWhitelisted = !!result;
        } catch (e) {
          console.error("[Geo API] Whitelist check failed", e);
        }

        // O header 'cf-ipcountry' é injetado pelo Cloudflare Workers
        const country = request.headers.get('cf-ipcountry') || 'BR';

        return new Response(JSON.stringify({
          ip: clientIp,
          whitelisted: isWhitelisted,
          country: country
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
})
