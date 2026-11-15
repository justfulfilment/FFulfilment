import { AmbientGlow } from "@/components/motion/AmbientGlow";
import { AccountAccess } from "@/components/welcome/AccountAccess";
import { Footer } from "@/components/welcome/Footer";
import { Hero } from "@/components/welcome/Hero";
import { Loader } from "@/components/Loader";

/**
 * Desktop / Welcome — Figma 1:1366 at 1440px.
 * Page frame 1392x1115 inset 24; 33px inner padding; main content 1326x937
 * (677 left column + 649 hero); 48px gap; 64px footer.
 */
export default function WelcomePage() {
  return (
    <>
      <Loader />
      <div
        className={
          "min-h-dvh bg-surface-chip-dark p-2 lg:p-6 " +
          "pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] " +
          "pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]"
        }
      >
        <div
          className={
            "relative isolate flex min-h-[calc(100dvh-1rem)] flex-col overflow-hidden " +
            "rounded-[15px] bg-surface-page p-4 lg:min-h-[calc(100dvh-3rem)] " +
            "lg:rounded-panel lg:p-[33px]"
          }
        >
          <AmbientGlow />

          <main className="relative z-10 flex flex-1 flex-col items-center gap-10 lg:h-[937px] lg:flex-none lg:flex-row lg:items-stretch lg:gap-0">
            {/* Mobile puts the artwork first (Figma 8:1189); desktop puts it right. */}
            <Hero className="order-1 aspect-[374/458] w-full shrink-0 lg:order-2 lg:aspect-auto lg:h-[937px] lg:w-[649px]" />
            <div className="order-2 flex w-full flex-1 justify-center lg:order-1 lg:w-[677px] lg:flex-none">
              <AccountAccess />
            </div>
          </main>

          <div className="relative z-10 mt-10 lg:mt-12">
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
