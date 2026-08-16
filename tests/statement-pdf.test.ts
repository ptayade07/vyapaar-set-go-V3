import { describe, expect, it } from "vitest";
import { buildShopStatementFields } from "../backend/lib/statement-pdf";

describe("buildShopStatementFields", () => {
  it("maps a fully-completed shop's own identity onto the statement fields", () => {
    const fields = buildShopStatementFields({
      name: "Ramesh Kirana",
      address: "12 MG Road, Pune",
      phone: "9876543210",
      logoUrl: "https://example.com/logo.png",
    });

    expect(fields).toEqual({
      shopName: "Ramesh Kirana",
      shopAddress: "12 MG Road, Pune",
      shopPhone: "9876543210",
      shopLogoUrl: "https://example.com/logo.png",
    });
  });

  it("carries nulls through untouched for a shop that hasn't filled in optional fields", () => {
    const fields = buildShopStatementFields({
      name: "New Shop",
      address: null,
      phone: null,
      logoUrl: null,
    });

    expect(fields).toEqual({
      shopName: "New Shop",
      shopAddress: null,
      shopPhone: null,
      shopLogoUrl: null,
    });
  });
});
