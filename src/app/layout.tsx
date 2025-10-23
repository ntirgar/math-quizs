import type { Metadata } from "next";
import { Theme } from '@radix-ui/themes';
import { AuthProvider } from '@/components/AuthContext';
import '@radix-ui/themes/styles.css';
import "./globals.css";

// Fallback system font variables (previously provided by next/font)
const cssVarStyle: React.CSSProperties = {};
// Assign via style attribute to keep variables accessible
// @ts-expect-error custom CSS variable assignment
cssVarStyle['--font-geist-sans'] = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif";
// @ts-expect-error custom CSS variable assignment
cssVarStyle['--font-geist-mono'] = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

export const metadata: Metadata = {
  title: "Addition Quiz - Practice Math Skills",
  description: "A fun and interactive addition quiz to practice your math skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={cssVarStyle}>
        <Theme>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Theme>
      </body>
    </html>
  );
}
