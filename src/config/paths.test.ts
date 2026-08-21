import { describe, expect, it } from "vitest";
import { withBasePath } from "./paths";

describe("public asset paths", () => {
  it("prefixes root assets for a project Pages site without duplicating slashes", () => {
    expect(withBasePath("/brand/mark.svg", "/masterskaya-ukrasheniy/")).toBe("/masterskaya-ukrasheniy/brand/mark.svg");
    expect(withBasePath("/brand/mark.svg", "")).toBe("/brand/mark.svg");
  });
});
