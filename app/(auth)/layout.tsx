import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 flex items-center justify-center bg-[var(--surface-2)] p-4">
        {children}
      </main>
      <Footer />
    </>
  );
}
