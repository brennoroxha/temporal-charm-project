export function lojaImageSrc(path: string): string {
  if (!path) return "";
  // Se já for um caminho absoluto ou data URI, retorna como está
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  // Normaliza o caminho removendo /loja/ ou / inicial
  let cleanPath = path.replace(/^\/?loja\//, "").replace(/^\//, "");
  
  // Se começar com images/, garante que está sob /loja/
  const encodedPath = cleanPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `/loja/${encodedPath}`;
}
