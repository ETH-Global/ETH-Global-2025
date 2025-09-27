"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"

interface WalletContextType {
  account: string | null
  isConnected: boolean
  balance: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnecting: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>("0.0000")
  const [isConnecting, setIsConnecting] = useState(false)

  const isConnected = !!account

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask not detected. Please install MetaMask to continue.")
    }

    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const accounts: string[] = await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const balance = await provider.getBalance(accounts[0])

      setAccount(accounts[0])
      setBalance(ethers.formatEther(balance))

      // Store in localStorage for persistence
      localStorage.setItem("connectedWallet", accounts[0])
      localStorage.setItem("walletBalance", ethers.formatEther(balance))
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setBalance("0.0000")
    localStorage.removeItem("connectedWallet")
    localStorage.removeItem("walletBalance")
  }

  // Check for existing connection on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem("connectedWallet")
    const savedBalance = localStorage.getItem("walletBalance")

    if (savedWallet && savedBalance) {
      setAccount(savedWallet)
      setBalance(savedBalance)
    }
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else if (accounts[0] !== account) {
          setAccount(accounts[0])
          localStorage.setItem("connectedWallet", accounts[0])
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      return () => window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
    }
  }, [account])

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnected,
        balance,
        connectWallet,
        disconnectWallet,
        isConnecting,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
