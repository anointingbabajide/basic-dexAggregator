import type { Metadata } from "next";
import localFont from "next/font/local";
import RainbowConnect from "@/api/wallet";
import "@/styles/globals.css";
import Web3Modal from "@/context/webModal";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dex Aggregator",
  description: "A decentralized exchange aggregator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <Web3Modal>
          <RainbowConnect>{children}</RainbowConnect>
        </Web3Modal>
      </body>
    </html>
  );
}
