"use client"
import "./globals.css";
import { Web3Provider,config } from "../scripts/Web3Provider";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "./components/Header"
export default function RootLayout({ children }) {
  const queryClient = new QueryClient();
  return (
    <Web3Provider>
      <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
    <html lang="en">
      <body className={`bg-gray-50`}>
        <Header/>
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
