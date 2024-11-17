"use client"
import "./globals.css";
import { Web3Provider,config } from "../scripts/Web3Provider";
import { ConnectKitButton } from "connectkit";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
export default function RootLayout({ children }) {
  const queryClient = new QueryClient();
  return (
    <Web3Provider>
      <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
    <html lang="en">
      <body className={`bg-gray-50`}>
        <nav className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="font-bold text-xl text-blue-500">
                P2P Swap
              </Link>
              <div className="flex gap-6 items-center">
                <ConnectKitButton />
              </div>
            </div>
          </div>
        </nav>
        <div className="min-h-screen bg-gray-100">
          {children}
        </div>
      </body>
    </html>
    </WagmiProvider>
    </QueryClientProvider>
    </Web3Provider>
  );
}
