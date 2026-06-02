import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav } from "../(marketing)/components/Nav";
import "../(marketing)/homepage.css";
import "./onboarding.css";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-page="onboarding"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <Nav hideActions />
      {children}
    </div>
  );
}
