import { jest } from "@jest/globals";

describe("metadata module", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("@decaf-ts/decoration");
  });

  test("guards against duplicate registrations", async () => {
    const register = jest.fn(() => {
      throw new Error("already registered");
    });

    jest.doMock("@decaf-ts/decoration", () => ({
      Metadata: {
        registerLibrary: register,
      },
    }));

    const metadata = await import("../../src/metadata");
    expect(metadata.VERSION).toBeDefined();
    expect(register).toHaveBeenCalled();
  });

  test("rethrows unexpected registration errors", async () => {
    jest.doMock("@decaf-ts/decoration", () => ({
      Metadata: {
        registerLibrary: () => {
          throw new Error("fatal");
        },
      },
    }));

    await expect(import("../../src/metadata")).rejects.toThrow("fatal");
  });
});
