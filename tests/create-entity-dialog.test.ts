// Uses react-dom/client and plain DOM queries rather than Testing Library: bun shares the module
// cache across test files, and Testing Library binds `screen` to the first happy-dom window it sees,
// which would break tests/tier-list-detail-hook.test.ts after this file unregisters. For the same
// reason Radix's useLayoutEffect may already be the no-op it picks when loaded without a document,
// which would keep the dialog portal from ever mounting, so it is pointed back at React's.
import { afterAll, afterEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { act, createElement, useLayoutEffect, useState } from "react";
import { Layers } from "lucide-react";

mock.module("@radix-ui/react-use-layout-effect", () => ({ useLayoutEffect }));
GlobalRegistrator.register();
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { CreateEntityDialog } = await import("../src/components/ui/create-entity-dialog");

type Root = ReturnType<typeof createRoot>;
let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
});
afterAll(() => GlobalRegistrator.unregister());

function Harness({ initialName = "", onSubmit }: { initialName?: string; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  return createElement(CreateEntityDialog, {
    open: true,
    onOpenChange: () => {},
    icon: Layers,
    title: "Create New Deck",
    description: "Give it a name now.",
    name: { id: "create-deck-name", label: "Deck name", placeholder: "My deck", value: name, onChange: setName },
    submitLabel: "Create Deck",
    submitting: false,
    onSubmit: () => onSubmit(name),
  });
}

function mount(props: { initialName?: string; onSubmit: (name: string) => void }) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(createElement(Harness, props)));
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  if (!dialog) throw new Error("dialog did not render");
  return dialog;
}

function button(dialog: HTMLElement, name: string) {
  const match = [...dialog.querySelectorAll("button")].find(
    (el) => (el.getAttribute("aria-label") ?? el.textContent ?? "").trim() === name
  );
  if (!match) throw new Error(`no button named ${name}`);
  return match;
}

function typeName(dialog: HTMLElement, value: string) {
  const input = dialog.querySelector<HTMLInputElement>("#create-deck-name")!;
  const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

describe("CreateEntityDialog", () => {
  test("has the title, the X close, a Cancel button and the submit button", () => {
    const dialog = mount({ onSubmit: () => {} });
    expect(dialog.querySelector("h2")?.textContent).toBe("Create New Deck");
    expect(button(dialog, "Close").getAttribute("aria-label")).toBe("Close");
    expect(button(dialog, "Cancel").textContent).toBe("Cancel");
    expect(button(dialog, "Create Deck").getAttribute("type")).toBe("submit");
    expect(dialog.querySelector('label[for="create-deck-name"]')?.textContent).toBe("Deck name");
  });

  test("draws the shared dialog surface", () => {
    const classes = mount({ onSubmit: () => {} }).className.split(/\s+/);
    expect(classes).toContain("bg-card-overlay");
    expect(classes).toContain("border-primary-soft");
    expect(classes).toContain("md:rounded-surface");
  });

  test("submit is disabled while the name is blank or whitespace", () => {
    const dialog = mount({ onSubmit: () => {} });
    const submit = button(dialog, "Create Deck");
    expect(submit.disabled).toBe(true);
    typeName(dialog, "   ");
    expect(submit.disabled).toBe(true);
    typeName(dialog, "Aggro");
    expect(submit.disabled).toBe(false);
  });

  test("clicking submit passes the typed name once", () => {
    const submitted: string[] = [];
    const dialog = mount({ initialName: "Spellbook", onSubmit: (name) => submitted.push(name) });
    act(() => button(dialog, "Create Deck").click());
    expect(submitted).toEqual(["Spellbook"]);
  });

  test("a blank form does not submit", () => {
    const submitted: string[] = [];
    const dialog = mount({ onSubmit: (name) => submitted.push(name) });
    const form = dialog.querySelector("form")!;
    act(() => {
      form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(submitted).toEqual([]);
  });
});
