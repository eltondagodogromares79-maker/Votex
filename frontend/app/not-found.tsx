 import Link from "next/link";
import { Button } from "@/src/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center text-center px-4">
      <p className="text-display font-serif text-gold/30 mb-0 leading-none select-none" aria-hidden="true">
        404
      </p>
      <h1 className="text-h1 font-serif text-gold mt-2 mb-3">Page Not Found</h1>
      <p className="text-body text-white/60 max-w-sm mb-8">
        We couldn&apos;t find what you were looking for. It may have moved or no
        longer exist.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/">
          <Button variant="secondary" size="md">Go to Home</Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost" size="md" className="text-white border-white/30 hover:bg-white/10">
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
