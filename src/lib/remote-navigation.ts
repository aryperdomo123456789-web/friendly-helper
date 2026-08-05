import { useEffect } from "react";

type Direction = "up" | "down" | "left" | "right";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
  '[data-tv-focus]',
].join(",");

const IGNORE_ARROW_NAV_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  'video',
  'audio',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="slider"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="tablist"]',
  '[role="tab"]',
  '[role="tree"]',
  '[role="treeitem"]',
  '[role="radiogroup"]',
  '[role="radio"]',
].join(",");

function isVisible(element: HTMLElement) {
  if (!element.isConnected) return false;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none";
}

function isTypingContext(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;
  return Boolean(element.closest(IGNORE_ARROW_NAV_SELECTOR));
}

function getFocusableElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => isVisible(element) && !element.hasAttribute("aria-hidden"),
  );
}

function focusFirstFocusable() {
  const first = getFocusableElements()[0];
  if (!first) return false;
  first.focus({ preventScroll: false });
  return true;
}

function isActivationKey(event: KeyboardEvent) {
  return (
    event.key === "Enter" ||
    event.key === " " ||
    event.key === "Spacebar" ||
    event.key === "OK" ||
    event.key === "Select" ||
    event.key === "Accept" ||
    event.key === "Go" ||
    event.code === "Enter" ||
    event.code === "Space" ||
    event.code === "NumpadEnter" ||
    event.keyCode === 13 ||
    event.keyCode === 32 ||
    event.keyCode === 23 ||
    event.keyCode === 167
  );
}

function activateFocusedElement() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.matches(IGNORE_ARROW_NAV_SELECTOR)) return false;
  if (active instanceof HTMLButtonElement || active instanceof HTMLAnchorElement) {
    active.click();
    return true;
  }
  if (active.getAttribute("role") === "button" || active.hasAttribute("data-tv-focus")) {
    active.click();
    return true;
  }
  active.click();
  return true;
}

function moveFocus(direction: Direction) {
  const focusables = getFocusableElements();
  if (focusables.length === 0) return;

  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const current = active && focusables.includes(active) ? active : null;
  if (!current) {
    if (!focusFirstFocusable()) return;
    return;
  }

  const currentRect = current.getBoundingClientRect();
  const currentCenterX = currentRect.left + currentRect.width / 2;
  const currentCenterY = currentRect.top + currentRect.height / 2;

  let best: { element: HTMLElement; score: number } | null = null;

  for (const candidate of focusables) {
    if (candidate === current) continue;
    const rect = candidate.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = centerX - currentCenterX;
    const deltaY = centerY - currentCenterY;

    if (direction === "right" && deltaX <= 4) continue;
    if (direction === "left" && deltaX >= -4) continue;
    if (direction === "down" && deltaY <= 4) continue;
    if (direction === "up" && deltaY >= -4) continue;

    const primary =
      direction === "right" || direction === "left" ? Math.abs(deltaX) : Math.abs(deltaY);
    const secondary =
      direction === "right" || direction === "left" ? Math.abs(deltaY) : Math.abs(deltaX);
    const score = primary * 1.5 + secondary;

    if (!best || score < best.score) {
      best = { element: candidate, score };
    }
  }

  if (best) {
    best.element.focus({ preventScroll: false });
    best.element.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

export function useGlobalRemoteNavigation() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

      if (isActivationKey(event)) {
        const target = event.target;
        if (target instanceof HTMLElement && isTypingContext(target)) return;
        const active = document.activeElement;
        if (active instanceof HTMLElement && active !== document.body) {
          event.preventDefault();
          if (activateFocusedElement()) return;
        }
        if (focusFirstFocusable()) {
          event.preventDefault();
          activateFocusedElement();
        }
        return;
      }

      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;

      const target = event.target;
      if (isTypingContext(target)) return;

      event.preventDefault();
      const direction =
        event.key === "ArrowUp"
          ? "up"
          : event.key === "ArrowDown"
            ? "down"
            : event.key === "ArrowLeft"
              ? "left"
              : "right";
      moveFocus(direction);
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("keypress", onKey, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("keyup", onKey, true);
    document.addEventListener("keypress", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("keypress", onKey, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("keyup", onKey, true);
      document.removeEventListener("keypress", onKey, true);
    };
  }, []);
}
