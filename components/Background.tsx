export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Layer A: Blueprint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(var(--grid-line) 1px, transparent 1px)",
            "linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Layer B: Ambient orbs */}
      <div
        className="orb-animate absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full blur-[120px]"
        style={{
          background: "var(--glow-blue)",
          animation: "orb-drift 30s ease-in-out infinite",
        }}
      />
      <div
        className="orb-animate absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{
          background: "var(--glow-cyan)",
          animation: "orb-drift 25s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
