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
  title: "Bernabé – Organiza tu iglesia y cuida a cada persona",
  description:
    "Gestiona grupos, células y líderes. Haz seguimiento a visitantes y asegúrate de que nadie se pierda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${youngSerif.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
