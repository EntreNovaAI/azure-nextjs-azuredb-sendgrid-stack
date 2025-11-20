'use client'

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';

/**
 * PillNav Item Type
 * Defines the structure for navigation items
 */
export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

/**
 * PillNav Props Interface
 * Theme-aware navigation component using Tailwind CSS
 */
export interface PillNavThemedProps {
  logo: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
  // Optional children to render additional buttons (auth, theme toggle, etc.)
  rightSlot?: React.ReactNode;
}

/**
 * PillNav Component (Tailwind + Theme-Aware)
 * 
 * Modern, animated navigation bar using simplified theme system
 * Automatically responds to theme changes via next-themes
 * 
 * Features:
 * - Automatic light/dark mode via next-themes
 * - Smooth GSAP animations on hover
 * - Fully responsive with mobile menu
 * - Active page indicator
 * - Accessible ARIA attributes
 * 
 * Theme Integration:
 * - Uses simplified theme colors: primary, secondary, accent, background, text
 * - Tailwind classes automatically respond to .dark class
 * - All styling uses Tailwind utilities with theme variables
 */
const PillNav: React.FC<PillNavThemedProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  onMobileMenuClick,
  initialLoadAnimation = true,
  rightSlot
}) => {
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Refs for GSAP animation targets
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | HTMLElement | null>(null);

  /**
   * Layout and Animation Setup Effect
   * Calculates geometry for pill hover animations and sets up GSAP timelines
   * Recalculates on window resize for responsive behavior
   */
  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach(circle => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        
        // Calculate circular expand effect geometry
        // Uses circle segment mathematics for smooth bottom-up expansion
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        // Apply calculated dimensions to hover circle
        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        // Set initial GSAP state for circle (scaled down, hidden)
        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        // Get label elements for text animation
        const label = pill.querySelector<HTMLElement>('.pill-label');
        const hoverLabel = pill.querySelector<HTMLElement>('.pill-label-hover');

        // Initialize label positions
        if (label) gsap.set(label, { y: 0 });
        if (hoverLabel) gsap.set(hoverLabel, { y: h + 12, opacity: 0 });

        // Create hover animation timeline for this pill
        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        // Kill any existing timeline for this pill
        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        // Animate circle expansion on hover
        tl.to(circle, { 
          scale: 1.2, 
          xPercent: -50, 
          duration: 2, 
          ease, 
          overwrite: 'auto' 
        }, 0);

        // Animate default label sliding up
        if (label) {
          tl.to(label, { 
            y: -(h + 8), 
            duration: 2, 
            ease, 
            overwrite: 'auto' 
          }, 0);
        }

        // Animate hover label sliding in from below
        if (hoverLabel) {
          gsap.set(hoverLabel, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(hoverLabel, { 
            y: 0, 
            opacity: 1, 
            duration: 2, 
            ease, 
            overwrite: 'auto' 
          }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    // Run initial layout calculation
    layout();

    // Recalculate on window resize
    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    // Wait for fonts to load before final calculation
    if (document.fonts) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    // Initialize mobile menu as hidden
    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1, y: 0 });
    }

    // Initial page load animation (optional)
    if (initialLoadAnimation) {
      const logo = logoRef.current;
      const navItems = navItemsRef.current;

      // Animate logo scale from 0 to 1
      if (logo) {
        gsap.set(logo, { scale: 0 });
        gsap.to(logo, {
          scale: 1,
          duration: 0.6,
          ease
        });
      }

      // Animate nav items width from 0 to auto
      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: 'hidden' });
        gsap.to(navItems, {
          width: 'auto',
          duration: 0.6,
          ease
        });
      }
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease, initialLoadAnimation]);

  /**
   * Handle pill hover enter
   * Plays the hover animation forward (shows hover state)
   */
  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  /**
   * Handle pill hover leave
   * Plays the hover animation backward (returns to default state)
   */
  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  /**
   * Handle logo hover
   * Rotates the logo 360 degrees for playful interaction
   */
  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  /**
   * Toggle mobile menu visibility
   * Animates hamburger icon to X and shows/hides menu
   */
  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    // Animate hamburger lines to form X when open
    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    // Animate menu dropdown visibility
    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: 'top center'
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }

    onMobileMenuClick?.();
  };

  /**
   * Helper: Check if link is external
   * External links use standard <a> tag, internal links use Next.js <Link>
   */
  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href?: string) => href && !isExternalLink(href);

  return (
    <div className="absolute top-4 z-1000 left-1/2 -translate-x-1/2 w-full md:w-auto px-4 md:px-0">
      <nav
        className={`w-full md:w-max flex items-center justify-between md:justify-start box-border ${className}`}
        aria-label="Primary"
      >
        {/* Logo Button - Uses Tailwind classes for all styling */}
        {isRouterLink(items?.[0]?.href) ? (
          <Link
            href={items[0].href}
            aria-label="Home"
            onMouseEnter={handleLogoEnter}
            role="menuitem"
            ref={el => {
              logoRef.current = el;
            }}
            className="w-[42px] h-[42px] rounded-full p-2 inline-flex items-center justify-center overflow-hidden bg-primary transition-colors duration-200"
          >
            <img 
              src={logo} 
              alt={logoAlt} 
              ref={logoImgRef} 
              className="w-full h-full object-cover block" 
            />
          </Link>
        ) : (
          <a
            href={items?.[0]?.href || '#'}
            aria-label="Home"
            onMouseEnter={handleLogoEnter}
            ref={el => {
              logoRef.current = el;
            }}
            className="w-[42px] h-[42px] rounded-full p-2 inline-flex items-center justify-center overflow-hidden bg-primary transition-colors duration-200"
          >
            <img 
              src={logo} 
              alt={logoAlt} 
              ref={logoImgRef} 
              className="w-full h-full object-cover block" 
            />
          </a>
        )}

        {/* Desktop Navigation Items - Hidden on mobile, shown on md+ screens */}
        <div
          ref={navItemsRef}
          className="relative items-center rounded-full hidden md:flex ml-2 h-[42px] bg-background shadow-md transition-colors duration-200"
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-[3px] h-full gap-[3px]"
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href;

              // Pill content structure for animation
              const PillContent = (
                <>
                  {/* Hover circle background - expands from bottom on hover */}
                  <span
                    className="absolute left-1/2 bottom-0 rounded-full z-1 block pointer-events-none bg-primary"
                    style={{ willChange: 'transform' }}
                    aria-hidden="true"
                    ref={el => {
                      circleRefs.current[i] = el;
                    }}
                  />
                  
                  {/* Label stack - contains default and hover text */}
                  <span className="relative inline-block leading-none z-2">
                    {/* Default label - slides up on hover */}
                    <span
                      className="pill-label relative z-2 inline-block leading-none"
                      style={{ willChange: 'transform' }}
                    >
                      {item.label}
                    </span>
                    {/* Hover label - slides in from bottom */}
                    <span
                      className="pill-label-hover absolute left-0 top-0 z-3 inline-block text-background"
                      style={{ willChange: 'transform, opacity' }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                  
                  {/* Active indicator dot - shows current page */}
                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 rounded-full z-4 bg-accent"
                      aria-hidden="true"
                    />
                  )}
                </>
              );

              // Pill button classes - all Tailwind utilities
              const pillClasses =
                'relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full font-semibold text-base leading-none uppercase tracking-wide whitespace-nowrap cursor-pointer px-[18px] bg-secondary text-background transition-colors duration-200';

              return (
                <li key={item.href} role="none" className="flex h-full">
                  {isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      href={item.href}
                      className={pillClasses}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={pillClasses}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile Hamburger Menu Button - Only visible on mobile */}
        <button
          ref={hamburgerRef}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          {...{ 'aria-expanded': isMobileMenuOpen }}
          className="w-[42px] h-[42px] md:hidden rounded-full border-0 flex flex-col items-center justify-center gap-1 cursor-pointer p-0 relative bg-background shadow-md transition-colors duration-200"
        >
          <span className="hamburger-line w-4 h-0.5 rounded origin-center bg-secondary" />
          <span className="hamburger-line w-4 h-0.5 rounded origin-center bg-secondary" />
        </button>

        {/* Right slot for auth buttons, theme toggle, etc. */}
        {rightSlot && (
          <div className="hidden md:flex items-center gap-2 ml-2">
            {rightSlot}
          </div>
        )}
      </nav>

      {/* Mobile Menu Dropdown - Animated slide-down menu */}
      <div
        ref={mobileMenuRef}
        className="md:hidden absolute top-12 left-4 right-4 rounded-[27px] shadow-xl z-[998] origin-top bg-background"
      >
        <ul className="list-none m-0 p-[3px] flex flex-col gap-[3px]">
          {items.map(item => {
            // Mobile link classes - hover effect with bg transition
            const linkClasses =
              'block py-3 px-4 text-base font-medium rounded-[50px] transition-all duration-200 bg-secondary text-background hover:bg-primary hover:text-background';

            return (
              <li key={item.href}>
                {isRouterLink(item.href) ? (
                  <Link
                    href={item.href}
                    className={linkClasses}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className={linkClasses}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
          
          {/* Right slot content in mobile menu */}
          {rightSlot && (
            <li className="p-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {rightSlot}
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

// Named exports for flexibility
export { PillNav };

// Default export
export default PillNav;
