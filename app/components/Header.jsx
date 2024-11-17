"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { ConnectKitButton } from "connectkit";
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            {/* <Swap className="h-6 w-6 text-blue-500" /> */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-500">P2P Swap</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-blue-500">
              Groups
            </Link>
            <Link href="/newgroup" className="text-gray-600 hover:text-blue-500">
              New Group
            </Link>
          </nav>

          {/* Connect Wallet & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <ConnectKitButton />
            </div>
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/markets/popular" 
                className="text-gray-600 hover:text-blue-500 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Popular Pairs
              </Link>
              <Link 
                href="/markets/orders" 
                className="text-gray-600 hover:text-blue-500 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                My Orders
              </Link>
              <Link 
                href="/groups" 
                className="text-gray-600 hover:text-blue-500 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Groups
              </Link>
              <Link 
                href="/swap" 
                className="text-gray-600 hover:text-blue-500 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Swap
              </Link>
              <div className="pt-2">
                <ConnectKitButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;