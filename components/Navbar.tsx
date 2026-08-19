"use client";

import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header>
      <nav>
        <Link href="/" className="logo">
          <Image src="/icons/logo.png" alt="logo" width={24} height={24} />
          <p>DevEvent</p>
        </Link>

        {/* Desktop menu */}
        <ul className="hidden md:flex">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href={"/events" as Route}>Events</Link>
          </li>

          <Show when="signed-out">
            <li>
              <SignInButton>
                <span className="auth-link">Sign In</span>
              </SignInButton>
            </li>
            <li>
              <SignUpButton>
                <span className="auth-link">Sign Up</span>
              </SignUpButton>
            </li>
          </Show>

          <Show when="signed-in">
            <li>
              <Link href={"/admin" as Route}>Manage Events</Link>
            </li>
            <li>
              <Link href={"/admin/create-event" as Route}>Create Event</Link>
            </li>
            <li>
              <UserButton />
            </li>
          </Show>
        </ul>

        {/* Mobile hamburger button */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-white transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-opacity ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>

        {/* Mobile menu */}
        {mobileOpen && (
          <ul className="absolute left-0 top-full z-50 flex w-full flex-col gap-4 border-t border-white/10 bg-[#0d0d12] px-6 py-6 md:hidden">
            <li>
              <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
            </li>
            <li>
              <Link href={"/events" as Route} onClick={() => setMobileOpen(false)}>Events</Link>
            </li>

            <Show when="signed-out">
              <li>
                <SignInButton>
                  <span className="auth-link">Sign In</span>
                </SignInButton>
              </li>
              <li>
                <SignUpButton>
                  <span className="auth-link">Sign Up</span>
                </SignUpButton>
              </li>
            </Show>

            <Show when="signed-in">
              <li>
                <Link href={"/admin" as Route} onClick={() => setMobileOpen(false)}>Manage Events</Link>
              </li>
              <li>
                <Link href={"/admin/create-event" as Route} onClick={() => setMobileOpen(false)}>Create Event</Link>
              </li>
              <li>
                <UserButton />
              </li>
            </Show>
          </ul>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
