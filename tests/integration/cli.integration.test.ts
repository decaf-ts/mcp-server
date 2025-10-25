import fs from "fs";
import os from "os";
import path from "path";
import { McpWrapper } from "../../src/McpWrapper";

// We'll stub/mocking pieces of FastMCP by spying on console and using a tmp workspace

describe("CLI integration (McpWrapper)", () => {
  const origCwd = process.cwd();
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decaf-cli-int-"));

  beforeAll(() => {
    process.chdir(tmpRoot);
  });

  afterAll(() => {
    try {
      process.chdir(origCwd);
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  test("runs help without throwing and prints loaded modules", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Provide argv similar to: node, script, help
    const argv = ["node", "decaf", "help"];

    const wrapper = new McpWrapper("./", 2);

    // run should resolve; if it throws test will fail
    await expect(wrapper.run(argv)).resolves.toBeUndefined();

    // ensure "loaded modules" message was printed at boot
    const printed = logSpy.mock.calls.flat().join("\n");
    expect(printed).toMatch(/loaded modules:/);

    logSpy.mockRestore();
    errSpy.mockRestore();
  }, 20000);

  test("runs list command and doesn't crash", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const argv = ["node", "decaf", "list"];
    const wrapper = new McpWrapper("./", 2);
    await expect(wrapper.run(argv)).resolves.toBeUndefined();

    const printed = logSpy.mock.calls.flat().join("\n");
    expect(printed).toMatch(/loaded modules:/);

    logSpy.mockRestore();
    errSpy.mockRestore();
  }, 20000);
});
