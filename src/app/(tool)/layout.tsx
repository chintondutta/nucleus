import { Navbar } from "~/components/navbar";

export default function AnalyzeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
