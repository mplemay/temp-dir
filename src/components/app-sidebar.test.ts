import { describe, expect, it } from "vite-plus/test";
import { isSidebarItemActive } from "./app-sidebar";

describe("isSidebarItemActive", () => {
  it("marks Product Knowledge current on an assay path", () => {
    expect(isSidebarItemActive("/product-knowledge/xt", "/product-knowledge")).toBe(true);
    expect(isSidebarItemActive("/product-knowledge", "/product-knowledge")).toBe(true);
  });

  it("does not treat Home as active on /crm", () => {
    expect(isSidebarItemActive("/crm", "/")).toBe(false);
    expect(isSidebarItemActive("/", "/")).toBe(true);
  });
});
