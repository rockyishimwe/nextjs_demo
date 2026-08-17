import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const Navbar = () => {
    return (
        <header>
            <nav>
                <Link href='/' className="logo">
                    <Image src="/icons/logo.png" alt="logo" width={24} height={24} />

                    <p>DevEvent</p>
                </Link>

                <ul>
                    <li><Link href="/">Home</Link></li>

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
                        <li><Link href={"/events" as Route}>Events</Link></li>
                        <li><Link href={"/admin/create-event" as Route}>Create Event</Link></li>
                        <li><UserButton /></li>
                    </Show>
                </ul>
            </nav>
        </header>
    )
}

export default Navbar
