"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, HousePlus, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import JoinUsDropdown from "@/components/ui/JoinUsDropdown";
import { useAuth } from "@/providers/AuthProvider";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  // For demo purposes - set to true to see logged in state

  const isHomePage = pathname === "/";
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Career Advice", href: "/carrerAdvice" },
    { name: "Browse Jobs", href: "/jobs" },
    { name: "Community", href: "/community" },
  ];
  const getNavBackground = () => {
    if (isHomePage) {
      return isScrolled ? "bg-[#7670d6] shadow-lg" : "bg-transparent";
    }
    return "bg-[#7670d6] shadow-lg";
  };

  const handleLogout = () => {
    logout();
  };
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-100 transition-all duration-300 ${getNavBackground()}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src="/logo1.png" // Update with your logo path
                alt="Logo"
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors hover:opacity-80 text-white`}
              >
                {link.name}
              </Link>
            ))}

            {/* Conditional rendering based on login status */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center space-x-2 transition-colors hover:opacity-80 text-white`}
                >
                  <span>{`${user?.firstName}`}</span>
                  <ChevronDown size={16} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <a
                      href="/dashboard"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Dashboard
                    </a>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left py-2 text-gray-700 hover:text-[#7670d6] transition-colors"
                    >
                      <span className="ml-3">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <JoinUsDropdown></JoinUsDropdown>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`transition-colors text-white`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-2 text-gray-700 hover:text-[#7670d6] transition-colors"
              >
                {link.name}
              </a>
            ))}

            {user ? (
              <div className=" pt-2 border-t-2 border-primary-lightest bg-primary-dark text-white rounded-2xl px-3 py-2 mt-2">
                <div className="py-2 mb-3 border-b-2 px-4 text-center  text-[22px] tracking-widest border-b-white rounded-2xl  font-bold uppercase  font-mono">
                  {user?.firstName}
                </div>
                <a
                  href="/dashboard"
                  className=" py-2 flex cursor-pointer  duration-700 hover:translate-x-4 hover:font-bold  items-center gap-2 hover   transition-colors"
                ><HousePlus></HousePlus>
                  Dashboard
                </a>
                {/* <button
                                    onClick={() => {
                                        // Sign out logic here
                                        console.log('Sign out clicked');
                                    }}
                                    className="block w-full text-left py-2 text-gray-700 hover:text-[#7670d6] transition-colors"
                                >
                                    Sign Out
                                </button> */}

                <button
                  onClick={handleLogout}
                  className="flex items-center cursor-pointer hover:font-bold  duration-700 hover:translate-x-4  gap-2 w-full text-left py-2  transition-colors"
                ><LogOut></LogOut>
                  <span >Logout</span>
                </button>
              </div>
            ) : (
              <button className="w-full mt-2 px-6 py-2 bg-[#7670d6] text-white rounded-lg font-medium hover:bg-[#6660c6] transition-colors">
                <JoinUsDropdown></JoinUsDropdown>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for dropdown - close on outside click */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </nav>
  );
}
