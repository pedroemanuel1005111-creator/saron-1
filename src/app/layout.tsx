import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://saronburguer.vercel.app"
  ),
  title: "SARON BURGUER - O sabor que você merece!",
  description: "Hamburgueria artesanal com os melhores hambúrgueres da cidade. Faça seu pedido online!",
  keywords: "hamburgueria, burguer, lanche, delivery, saron burguer",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo.png",
  },
  openGraph: {
    title: "SARON BURGUER",
    description: "O sabor que você merece! Hamburgueria gourmet.",
    images: ["/images/hero-burger.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/images/logo.png" />
        <meta name="theme-color" content="#C41E2A" />
      </head>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
