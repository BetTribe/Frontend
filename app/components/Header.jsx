"use client"
import React from 'react'
import Link from 'next/link';
import { ConnectKitButton } from "connectkit";
const Header = () => {
  return (
    <div>
      <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="font-bold text-xl text-blue-500">
                P2P Swap
              </Link>
              {/* <div className="flex gap-6 items-center">
                <ConnectKitButton />
              </div> */}
            </div>
          </div>
    </div>
  )
}

export default Header
