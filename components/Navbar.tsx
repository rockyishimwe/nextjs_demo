import Link from "next/link";
import Image from "next/image";
const Navbar = () => {
    return (
        <header>
            <nav>
                <Link href="/" className="logo">
                <Image src="/icons/logo.png" alt="logo" width={24} height={24}/>
                </Link>
            </nav>
        </header>
    )
}
export default Navbar;