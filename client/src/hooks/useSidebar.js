// src/hooks/useSidebar.js
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'merci-active-section';

/**
 * Estado de la sección activa del Rail, persistido en localStorage.
 * Se sincroniza automáticamente con la ruta actual.
 */
export function useSidebar(sections = [], currentPath = '', defaultSection = 'principal') {
  const [activeSection, setActiveSectionState] = useState(() => {
    // La ruta actual manda sobre todo lo demás
    const sectionFromPath = sections.find((section) =>
      section.items.some((item) => item.path === currentPath)
    );
    if (sectionFromPath) return sectionFromPath.id;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // localStorage no disponible (modo privado, SSR, etc.)
    }

    return defaultSection;
  });

  const setActiveSection = useCallback((sectionId) => {
    setActiveSectionState(sectionId);
    try {
      localStorage.setItem(STORAGE_KEY, sectionId);
    } catch {
      // Falla silenciosa
    }
  }, []);

  // Sincronizar con navegaciones externas (botón atrás, breadcrumbs, etc.)
  useEffect(() => {
    const sectionFromPath = sections.find((section) =>
      section.items.some((item) => item.path === currentPath)
    );
    if (sectionFromPath && sectionFromPath.id !== activeSection) {
      setActiveSection(sectionFromPath.id);
    }
  }, [currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  return { activeSection, setActiveSection };
}