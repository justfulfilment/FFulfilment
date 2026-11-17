import { ContrastField } from "@/components/motion/ContrastField";
import { FIELD_SETTINGS } from "@/lib/field-settings";
import { AccountAccess } from "@/components/welcome/AccountAccess";
import { Footer } from "@/components/welcome/Footer";
import { Hero } from "@/components/welcome/Hero";
import { Loader } from "@/components/Loader";

/**
 * Desktop / Welcome, Figma 1:1366.
 *
 * The frame is locked to the viewport: no page scroll at any window size.
 * The two columns carry the Figma ratio (677 : 649) as flex-grow rather than
 * fixed widths, so they split the full width on any monitor and still measure
 * exactly 677 and 649 at a 1440 viewport.
 *
 * Vertical rhythm is driven by --col-h (the real height of the main row), so
 * the composition keeps its Figma proportions as the window gets shorter
 * instead of overflowing.
 */
export default function WelcomePage() {
  return (
    <>
      <Loader />
      <div
        className={
          "flex min-h-dvh flex-col bg-surface-chip-dark p-2 lg:h-dvh lg:overflow-hidden lg:p-6 " +
          "pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] " +
          "pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]"
        }
      >
        <div
          className={
            "relative isolate flex min-h-0 flex-1 flex-col overflow-hidden " +
            "rounded-[15px] bg-surface-page p-4 lg:rounded-panel lg:p-[33px]"
          }
        >
          <ContrastField settings={FIELD_SETTINGS} backdropB="#231a34" />

          <main
            className={
              "relative z-10 flex min-h-0 flex-1 flex-col items-center gap-4 " +
              "lg:flex-row lg:items-stretch lg:gap-0"
            }
          >
            {/* Mobile puts the artwork first (Figma 8:1189); desktop puts it right. */}
            <Hero className="order-1 min-h-0 w-full flex-[4_1_0%] lg:order-2 lg:h-full lg:flex-[649_1_0%]" />
            <div
              data-field-region="show"
              className="order-2 flex min-h-0 w-full flex-[6_1_0%] justify-center lg:order-1 lg:h-full lg:flex-[677_1_0%]"
            >
              <AccountAccess />
            </div>
          </main>

          <div className="relative z-10 mt-3 shrink-0 lg:mt-12">
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
