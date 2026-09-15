import path from "node:path";
import { defineConfig } from "vitest/config";

// Domain tests (Fase 2) nunca precisaram disso — só usam import relativo
// dentro de src/domain/. A partir da Fase 5, arquivos em src/components/rnc/
// (como estado-pagina.ts) importam o domínio via alias `@/...` (igual ao
// resto do app), então o Vitest precisa do mesmo alias que o Next.js já
// resolve via tsconfig `paths`.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
