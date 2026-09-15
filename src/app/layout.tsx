import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relatório de Reclamações (RNC) · Alltak",
  description:
    "Relatório analítico de reclamações (RNC) — Alltak, Desenvolvimento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes decide a classe `dark` no
    // cliente antes da hidratação — sem isso, React acusa mismatch entre o
    // HTML gerado no servidor (sem a classe) e o primeiro render no cliente.
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
