'use client';

import { useState, useCallback } from 'react';
import { MobileNav } from './MobileNav';
import { MobileDrawer } from './MobileDrawer';

export function MobileNavSystem() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <MobileDrawer isOpen={isOpen} onClose={close} />
      <MobileNav onMenuOpen={open} />
    </>
  );
}
