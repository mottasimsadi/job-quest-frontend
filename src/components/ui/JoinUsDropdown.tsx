'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function JoinUsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-dark  dark:bg-primary-dark text-white px-6 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        Join Us
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 text-center mt-2 w-56 bg-primary-dark dark:bg-primary-dark rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
          <Link
            href="/login"
            className="block font-bold font-mono mx-6 py-2 border-b-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-white/10 hover:backdrop-blur-md hover:text-white hover:border-white/30 transition-all duration-300 rounded-md"

            onClick={() => setIsOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/signup/candidate"
            className="block mx-2 font-medium font-mono border-b py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-white/10 hover:backdrop-blur-md hover:text-white hover:border-white/30 transition-all duration-300 rounded-md"

            onClick={() => setIsOpen(false)}
          >
            Sign Up as Candidate
          </Link>
          <Link
            href="/signup/employer"
            className="block px-4 py-2 font-medium font-mono text-sm text-gray-900 dark:text-gray-100 hover:bg-white/10 hover:backdrop-blur-md hover:text-white hover:border-white/30 transition-all duration-300 rounded-md"

            onClick={() => setIsOpen(false)}
          >
            Sign Up as Employer
          </Link>
        </div>
      )}
    </div>
  );
}