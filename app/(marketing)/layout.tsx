import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./homepage.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-page="homepage"
      className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen`}
    >
      {children}
    </div>
  );
}
