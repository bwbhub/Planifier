import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Sans globales Vitest, Testing Library ne démonte pas seul les rendus entre deux tests.
afterEach(cleanup);

// Navigation par défaut : hors d'une application Next, ni routeur ni adresse. Un test qui en observe les appels
// remplace ce mock par le sien (`vi.mock("next/navigation", …)`), avec tout ce que le composant lit.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom n'implémente pas l'ouverture modale de <dialog> (feuilles `Sheet`) : on la simule ; le vrai comportement
// (focus piégé, page inerte) est couvert en E2E.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
