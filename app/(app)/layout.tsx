export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      <main className="flex-1 min-h-0 overflow-auto">{children}</main>
    </div>
  );
}
