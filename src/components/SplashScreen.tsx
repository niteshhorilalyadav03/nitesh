/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: SplashScreen.tsx (Smooth Responsive Logo Shrink & Settle Transition)
 * Optimized for: Smartphone, Tablet, and PC Screens
 * ==============================================================================
 */

import React, { useEffect, useState } from 'react';
import { LifelineLogo } from './LifelineLogo';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 1850
}) => {
  const [phase, setPhase] = useState<'centered' | 'shrinking'>('centered');
  const [targetCoords, setTargetCoords] = useState<{ x: number; y: number } | null>(null);

  // Initial responsive scale before shrinking starts
  const getInitialScale = () => {
    if (typeof window === 'undefined') return 1.5;
    if (window.innerWidth >= 1024) return 1.6; // PC Screen
    if (window.innerWidth >= 640) return 1.35; // Tablet Screen
    return 1.15;                               // Smartphone Screen
  };

  const [initialScale, setInitialScale] = useState<number>(getInitialScale);

  // Measure target logo in login page for exact FLIP coordinates
  const measureTargetPosition = () => {
    setInitialScale(getInitialScale());

    const targetElement = document.getElementById('login-target-logo');
    if (targetElement) {
      const targetRect = targetElement.getBoundingClientRect();

      // Target center position relative to viewport
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;

      // Current center of viewport (where splash un-transformed logo is anchored)
      const currentCenterX = window.innerWidth / 2;
      const currentCenterY = window.innerHeight / 2;

      const deltaX = targetCenterX - currentCenterX;
      const deltaY = targetCenterY - currentCenterY;

      setTargetCoords({ x: deltaX, y: deltaY });
    } else {
      // Responsive fallback per screen class if target element is still mounting
      const isDesktop = window.innerWidth >= 1024;
      const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

      if (isDesktop) {
        setTargetCoords({
          x: -(window.innerWidth * 0.22),
          y: -(window.innerHeight * 0.23)
        });
      } else if (isTablet) {
        setTargetCoords({
          x: 0,
          y: -(window.innerHeight * 0.28)
        });
      } else {
        // Smartphone
        setTargetCoords({
          x: 0,
          y: -(window.innerHeight * 0.32)
        });
      }
    }
  };

  useEffect(() => {
    // Initial measurement after paint
    const rafId = requestAnimationFrame(() => {
      measureTargetPosition();
    });

    // Listen to resize/orientation changes across phone, tablet, and PC
    const handleResize = () => {
      measureTargetPosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Stage 1: Hold centered opening pop-up for 850ms, then smoothly shrink & settle
    const shrinkTimer = setTimeout(() => {
      measureTargetPosition();
      setPhase('shrinking');
    }, 850);

    // Stage 2: Shrinking finishes and seamlessly completes hand-off to login page
    const completeTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(shrinkTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  const isShrinking = phase === 'shrinking';

  // Dynamic CSS Transform calculation
  const transformStyle = !isShrinking
    ? `translate(-50%, -50%) scale(${initialScale})`
    : targetCoords
    ? `translate(calc(-50% + ${targetCoords.x}px), calc(-50% + ${targetCoords.y}px)) scale(1.0)`
    : `translate(-50%, -50%) scale(1.0)`;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden cursor-pointer ${
        isShrinking ? 'pointer-events-none' : ''
      }`}
    >
      {/* Background Dimmer Backdrop (smoothly fades out to reveal login card underneath as logo glides) */}
      <div
        className={`absolute inset-0 bg-[#071322] transition-opacity duration-700 ease-out ${
          isShrinking ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Background Radial Dots Ambient Layer */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out ${
          isShrinking ? 'opacity-0' : 'opacity-20'
        }`}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Background Animated Concentric Sonar Radar Waves (fades smoothly during shrink) */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ease-out ${
          isShrinking ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="w-56 sm:w-72 h-56 sm:h-72 rounded-full border border-sky-500/20 animate-radar-wave" />
        <div
          className="absolute w-[18rem] sm:w-[24rem] h-[18rem] sm:h-[24rem] rounded-full border border-sky-500/10 animate-radar-wave"
          style={{ animationDelay: '0.6s' }}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FLYING LOGO: Pops up centered, then glides seamlessly into target  */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="fixed z-50 pointer-events-none select-none will-change-transform inline-flex items-center"
        style={{
          left: '50%',
          top: '50%',
          transform: transformStyle,
          transition: isShrinking
            ? 'transform 850ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'none'
        }}
      >
        <div className={!isShrinking ? 'animate-login-popup' : ''}>
          <LifelineLogo size="md" variant="dark" showText={true} subtitle="LOGIN" />
        </div>
      </div>
    </div>
  );
};
