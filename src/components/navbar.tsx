import Link from "next/link";
import { Dna } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Dna className="size-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            Nucleus
          </span>
        </Link>
      </div>
    </nav>
  );
}
