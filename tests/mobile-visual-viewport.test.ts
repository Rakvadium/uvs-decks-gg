import { describe, expect, test } from "bun:test";
import { applyMobileVisualViewportFrame } from "../src/components/shell/use-mobile-visual-viewport";

describe("applyMobileVisualViewportFrame", () => {
  test("pins the frame to the visual viewport box", () => {
    const node = {
      style: {} as CSSStyleDeclaration,
    };
    applyMobileVisualViewportFrame(node as HTMLElement, {
      top: 47,
      left: 12,
      width: 390,
      height: 620,
    });
    expect(node.style.position).toBe("fixed");
    expect(node.style.top).toBe("0");
    expect(node.style.left).toBe("0");
    expect(node.style.width).toBe("390px");
    expect(node.style.height).toBe("620px");
    expect(node.style.transform).toBe("translate(12px, 47px)");
  });
});
