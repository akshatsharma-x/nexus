import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";
import { OnboardingContextProvider } from "@/lib/context/OnboardingContext";
import { JourneyProgressProvider } from "@/lib/context/JourneyProgressContext";
import { MasteryProvider } from "@/lib/context/MasteryContext";
import { AssessmentProvider } from "@/lib/context/AssessmentContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <OnboardingContextProvider>
          <JourneyProgressProvider>
            <MasteryProvider>
              <AssessmentProvider>
                <Shell>{children}</Shell>
              </AssessmentProvider>
            </MasteryProvider>
          </JourneyProgressProvider>
        </OnboardingContextProvider>
      </body>
    </html>
  );
}
