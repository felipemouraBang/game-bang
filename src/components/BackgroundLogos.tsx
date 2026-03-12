import React from 'react';

export default function BackgroundLogos() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.03]">
      {/* Top Left */}
      <img src="/logo-da-esquerda.png.PNG" className="absolute top-10 left-10 w-32 h-32 rotate-[-15deg] object-contain" alt="" />
      {/* Top Right */}
      <img src="/logo-da-direita.png.png" className="absolute top-20 right-10 w-40 h-40 rotate-[10deg] object-contain" alt="" />
      {/* Bottom Left */}
      <img src="/logo-do-meio.png.PNG" className="absolute bottom-20 left-20 w-48 h-48 rotate-[5deg] object-contain" alt="" />
      {/* Bottom Right */}
      <img src="/logo-da-esquerda.png.PNG" className="absolute bottom-10 right-20 w-36 h-36 rotate-[-10deg] object-contain" alt="" />
      {/* Center Left */}
      <img src="/logo-da-direita.png.png" className="absolute top-1/2 left-5 w-24 h-24 -translate-y-1/2 rotate-[20deg] object-contain" alt="" />
      {/* Center Right */}
      <img src="/logo-do-meio.png.PNG" className="absolute top-1/3 right-1/4 w-56 h-56 rotate-[-5deg] object-contain" alt="" />
      {/* Extra Center Bottom */}
      <img src="/logo-da-esquerda.png.PNG" className="absolute bottom-1/3 left-1/3 w-28 h-28 rotate-[15deg] object-contain" alt="" />
    </div>
  );
}
