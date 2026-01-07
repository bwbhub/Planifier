/**
 * Hook personnalisé pour détecter la présence d'une scrollbar
 * Utile pour ajuster le layout du calendrier en fonction de la scrollbar
 */

import { useState, useEffect } from "react";

/**
 * @param {React.RefObject} scrollContainerRef - Référence au conteneur scrollable
 * @param {any} trigger - Valeur qui déclenche le recalcul de la scrollbar
 * @returns {boolean} hasScrollbar - Indique si une scrollbar est présente
 */
export function useScrollbar(scrollContainerRef, trigger) {
  const [hasScrollbar, setHasScrollbar] = useState(true);

  useEffect(() => {
    const checkScrollbar = () => {
      if (scrollContainerRef.current) {
        const hasScroll =
          scrollContainerRef.current.scrollHeight >
          scrollContainerRef.current.clientHeight;
        setHasScrollbar(hasScroll);
      }
    };

    checkScrollbar();
    window.addEventListener("resize", checkScrollbar);

    return () => window.removeEventListener("resize", checkScrollbar);
  }, [scrollContainerRef, trigger]);

  return hasScrollbar;
}
