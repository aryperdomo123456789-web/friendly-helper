import { useEffect } from "react";

/**
 * Hook de Navegação Espacial para Smart TVs e suporte a controle remoto.
 * Gerencia o foco entre elementos interativos usando as setas do teclado.
 */
export function useTVNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Teclas de Navegação (Smart TV / Teclado)
      const keys = {
        UP: [38, "ArrowUp"],
        DOWN: [40, "ArrowDown"],
        LEFT: [37, "ArrowLeft"],
        RIGHT: [39, "ArrowRight"],
        ENTER: [13, "Enter"],
        BACK: [8, 461, 10009, "Backspace", "Escape"]
      };

      const isKey = (type: keyof typeof keys) => 
        keys[type].includes(e.keyCode) || keys[type].includes(e.key);

      if (isKey("ENTER")) {
        const active = document.activeElement as HTMLElement;
        if (active && active.tagName !== "BODY") {
          active.click();
          return;
        }
      }

      if (isKey("BACK")) {
        // Lógica de voltar (se necessário)
        // window.history.back();
        return;
      }

      const moveFocus = (direction: "up" | "down" | "left" | "right") => {
        const active = document.activeElement as HTMLElement;
        const focusable = Array.from(
          document.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
        ) as HTMLElement[];

        if (focusable.length === 0) return;

        // Se nada estiver focado, foca o primeiro
        if (!active || active === document.body) {
          focusable[0].focus();
          return;
        }

        const activeRect = active.getBoundingClientRect();
        
        // Algoritmo simples de proximidade espacial
        let bestElement: HTMLElement | null = null;
        let minDistance = Infinity;

        focusable.forEach(el => {
          if (el === active) return;
          const rect = el.getBoundingClientRect();
          
          let isCandidate = false;
          if (direction === "up") isCandidate = rect.bottom <= activeRect.top + 5;
          if (direction === "down") isCandidate = rect.top >= activeRect.bottom - 5;
          if (direction === "left") isCandidate = rect.right <= activeRect.left + 5;
          if (direction === "right") isCandidate = rect.left >= activeRect.right - 5;

          if (isCandidate) {
            // Distância Euclidiana entre centros
            const dx = (rect.left + rect.width/2) - (activeRect.left + activeRect.width/2);
            const dy = (rect.top + rect.height/2) - (activeRect.top + activeRect.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance < minDistance) {
              minDistance = distance;
              bestElement = el;
            }
          }
        });

        if (bestElement) {
          e.preventDefault();
          (bestElement as HTMLElement).focus();
          // Scroll suave para garantir visibilidade na TV
          (bestElement as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      };

      if (isKey("UP")) moveFocus("up");
      if (isKey("DOWN")) moveFocus("down");
      if (isKey("LEFT")) moveFocus("left");
      if (isKey("RIGHT")) moveFocus("right");
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Auto-foco inicial se nada estiver focado
    const timer = setTimeout(() => {
      if (document.activeElement === document.body) {
        const first = document.querySelector('button, [href], input') as HTMLElement;
        first?.focus();
      }
    }, 500);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, []);
}
