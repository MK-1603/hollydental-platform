"use client";

import Link from "next/link";
import { CLINIC } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";

interface LogoProps {
  /** "full" shows mark + wordmark + tagline, "icon" shows the mark only. */
  variant?: "full" | "icon";
  /** Color theme — light is for dark backgrounds, dark is for light backgrounds. */
  theme?: "dark" | "light";
  /** Render as a link (default true). Set false when used inside other Links. */
  asLink?: boolean;
  className?: string;
  /** Pixel height of the logo mark. Defaults to 36. */
  size?: number;
  /** Show the small tagline under the wordmark (only used if variant="full"). */
  showTagline?: boolean;
  /**
   * Override the link target. By default the logo points home for guests
   * and to the role-aware dashboard for signed-in users.
   */
  href?: string;
}

/**
 * Brand logo component for Hollyhill Dental.
 *
 * - icon variant → tooth mark only (used in tight spots, app icons).
 * - full variant → tooth mark + "HollyHill Dental" wordmark with the
 *   accent on "Dental" + "Smile with Confidence" tagline below.
 *
 * Sizing is driven by the `size` prop and everything else scales off it,
 * so a single `size={48}` produces a balanced lockup at any breakpoint.
 */
export default function Logo({
  variant = "icon",
  theme = "dark",
  asLink = true,
  className = "",
  size = 36,
  showTagline = true,
  href,
}: LogoProps) {
  const { user } = useAuthStore();

  const nameColor = theme === "light" ? "text-white" : "text-navy";
  const accentColor = theme === "light" ? "text-sky-300" : "text-[#009BDE]";
  const tagColor = theme === "light" ? "text-white/70" : "text-gray-500";

  // Wordmark scales with the mark for a balanced lockup.
  const nameSize = Math.max(size * 0.46, 16);
  const tagSize = Math.max(size * 0.2, 9);

  const inner = (
    <span className="inline-flex items-center gap-3 select-none">
      {/* Tooth mark */}
      <span
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo-mark.png"
          alt={`${CLINIC.name} logo mark`}
          width={size}
          height={size}
          className="w-full h-full object-contain drop-shadow-sm"
          draggable={false}
        />
      </span>

      {variant === "full" && (
        <span className="flex flex-col leading-none gap-[5px] min-w-0">
          {/* Wordmark — "HollyHill" navy/white with a wide gap before
              the sky-blue "Dental" accent. */}
          <span
            className={`font-serif font-bold tracking-tight ${nameColor} whitespace-nowrap`}
            style={{ fontSize: nameSize }}
          >
            HollyHill
            <span className="inline-block" style={{ width: nameSize * 0.18 }} />
            <span className={accentColor}>Dental</span>
          </span>

          {showTagline && (
            <span
              className={`font-sans font-extrabold uppercase ${tagColor} whitespace-nowrap`}
              style={{ fontSize: tagSize, letterSpacing: "0.24em" }}
            >
              Smile with Confidence
            </span>
          )}
        </span>
      )}
    </span>
  );

  const wrapperClass = `inline-flex items-center ${className}`;

  if (!asLink) {
    return <span className={wrapperClass}>{inner}</span>;
  }

  // Role-aware destination: explicit href wins; signed-in users go to
  // their dashboard; guests land on the marketing home page.
  const destination =
    href ||
    (user
      ? user.role === "admin"
        ? "/admin/dashboard"
        : "/portal/dashboard"
      : "/");

  return (
    <Link href={destination} className={wrapperClass} aria-label={CLINIC.name}>
      {inner}
    </Link>
  );
}
