import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
    title: "FraudShield.AI - Защита от мошенничества",
    description: "ML-powered fraud detection platform for e-commerce",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" className="dark">
            <body className={inter.className}>
                <div className="flex h-screen overflow-hidden bg-background">
                    <Sidebar />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Header />
                        <main className="flex-1 overflow-y-auto p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </body>
        </html>
    );
}
