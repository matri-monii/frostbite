import React from 'react';

export type BackdropVariant = 'home' | 'night' | 'steel';

interface Props {
  variant?: BackdropVariant;
}

// Fractal-noise film grain, tiled. Rendered as one fixed layer over the whole site.
export const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.8'/%3E%3C/svg%3E\")";

const GRADIENTS: Record<BackdropVariant, string> = {
  // Home: near-black behind the flavour panels and the whole scroll-reveal hero (stops shifted +100vh for the panels), then up through steel blue into frost white.
  home:
    'linear-gradient(180deg, #08090d 0, #0b0d14 240vh, #141b2b 380vh, #22324b 480vh, #4a6783 540vh, #6f8da3 calc(100% - 240vh), #a3b7c3 calc(100% - 140vh), #dfe6e8 calc(100% - 60vh), #f2f3ef 100%)',
  night: 'linear-gradient(180deg, #08090d 0%, #101624 22%, #26384f 52%, #5f7f98 80%, #a9bcc6 100%)',
  steel: 'linear-gradient(180deg, #2c4259 0%, #4d6a84 34%, #7893a6 68%, #a9bcc6 100%)',
};

export const AtmosphericBackground: React.FC<Props> = ({ variant = 'home' }) => (
  <>
    <div
      aria-hidden="true"
      className="absolute inset-0 w-full min-h-full pointer-events-none -z-20"
      style={{ background: GRADIENTS[variant] }}
    />
    <div
      aria-hidden="true"
      className="grain-layer fixed inset-0 w-full h-full pointer-events-none -z-10"
      style={{ backgroundImage: NOISE, backgroundRepeat: 'repeat' }}
    />
  </>
);
