export default function AnalyzeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="h-screen">{children}</div>;
}
