import type { Metadata } from "next";
import { Inter, Young_Serif } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-logo",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Bernabé Personas – Cuidado de las personas en tu iglesia",
  description:
    "Acompaña a miembros, visitantes, grupos y líderes desde un solo lugar: seguimiento pastoral claro, sin que nadie quede invisible.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${youngSerif.variable} scrollbar-brand`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
