import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AuthShellProps = {
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-both motion-safe:duration-500 motion-safe:ease-out">
        <Card>
          <CardHeader className="items-center text-center">
            <Link href="/" className="mb-2 inline-block no-underline">
              <Image
                src="/fulllogo-Photoroom.png"
                alt="cpproad"
                width={192}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </CardHeader>

          <CardContent>{children}</CardContent>

          {footer ? (
            <CardFooter className="flex-col gap-4">
              <Separator />
              {footer}
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
