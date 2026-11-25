import type { Metadata } from "next";
import { Geist, Geist_Mono, Azeret_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { OnboardingContextProvider } from "@/lib/context/OnboardingContext";
import { JourneyProgressProvider } from "@/lib/context/JourneyProgressContext";
import { MasteryProvider } from "@/lib/context/MasteryContext";
import { AssessmentProvider } from "@/lib/context/AssessmentContext";
import { ProjectProvider } from "@/lib/context/ProjectContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for slugs, headlines, labels and figures. A heavy geometric
// mono is what makes a headline read as printed matter rather than as a
// marketing hero; body copy stays in Geist Sans, which stays more readable at
// paragraph length than any mono.
const azeretMono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXUS — AI-Powered Learning Intelligence",
  description: "Your personalized learning path to career mastery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The theme is client state — localStorage, or the OS preference — so the
    // server emits the default and the script in <head> corrects the attribute
    // during parsing, before the first paint. suppressHydrationWarning covers
    // exactly that: React finds an attribute on <html> that its own render did
    // not produce and must keep the DOM's. Without it React treats the
    // difference as an error and re-renders from the nearest boundary, which
    // both flashes and throws away the correction.
    // data-scroll-behavior opts back into Next's scroll override. globals.css
    // sets `scroll-behavior: smooth` on <html> for in-page anchors; as of
    // Next 16 the router no longer neutralises that during a route change, so
    // without this attribute every navigation *animates* its scroll to the top
    // instead of landing there. The smooth scroll we want is within a page,
    // never between two.
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${azeretMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <OnboardingContextProvider>
            <JourneyProgressProvider>
              <MasteryProvider>
                <AssessmentProvider>
                  <ProjectProvider>
                    <Shell>{children}</Shell>
                  </ProjectProvider>
                </AssessmentProvider>
              </MasteryProvider>
            </JourneyProgressProvider>
          </OnboardingContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
