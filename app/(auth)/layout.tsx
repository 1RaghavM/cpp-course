import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "../(marketing)/homepage.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-page="homepage"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </div>
  );
}
