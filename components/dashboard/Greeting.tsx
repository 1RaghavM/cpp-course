interface GreetingProps {
  displayName: string | null;
  hour: number;
}

function getTimeOfDay(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Greeting({ displayName, hour }: GreetingProps) {
  const timeGreeting = getTimeOfDay(hour);
  const name = displayName?.trim();

  return (
    <h1 className="text-lg font-semibold text-foreground sm:text-xl">
      {name ? `${timeGreeting}, ${name}` : "Welcome back"}
    </h1>
  );
}
