"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/wallet-provider";
import { Wallet, Database, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { account, isConnected, connectWallet, disconnectWallet, balance } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center pulse-glow">
            <Database className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text">DataChain</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </a>
          <a href="/tenders" className="text-muted-foreground hover:text-foreground transition-colors">
            Tenders
          </a>
          <a href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
            Search your product
          </a>
        </nav>

        {/* Wallet + Mobile menu */}
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <div className="text-sm text-muted-foreground">
                <div className="font-mono">{balance.slice(0, 6)} ETH</div>
                <div className="text-xs">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectWallet}
                className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connectWallet} className="bg-primary hover:bg-primary/90">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}

          {/* Mobile menu button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <a href="#" className="block py-2 text-muted-foreground hover:text-foreground">
              Home
            </a>
            <a href="#tenders" className="block py-2 text-muted-foreground hover:text-foreground">
              Tenders
            </a>
            <a href="#search" className="block py-2 text-muted-foreground hover:text-foreground">
              Search your product
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
