import path from 'path';
import fs from 'fs';
import { generateMcpModuleTool } from '../src/mcp/tools/generateMcpModule';
import { __resetWorkspaceRoot } from '../src/mcp/workspace';

jest.setTimeout(20000);

describe('generateMcpModuleTool', () => {
  const repoPath = path.resolve(process.cwd(), 'src', 'modules', 'decoration');
  const moduleName = 'decoration';
  const modulesRoot = path.resolve(process.cwd(), 'src', 'modules');
  const targetModulePath = path.join(modulesRoot, moduleName);

  beforeAll(() => {
    // ensure workspace root is project root
    __resetWorkspaceRoot(process.cwd());
    // cleanup if tool will create things
    // leave existing decoration as-is; tool should be idempotent
  });

  it('generates an MCP module scaffold for decoration', async () => {
    const input = { repoPath, moduleName, includeDocs: true } as any;
    const res = await generateMcpModuleTool.execute(input);
    // verify result structure
    expect(res).toBeDefined();
    // check that module index exists
    expect(fs.existsSync(path.join(targetModulePath, 'index.ts'))).toBe(true);
    // prompts directory and index should exist (may or may not contain README)
    expect(fs.existsSync(path.join(targetModulePath, 'prompts'))).toBe(true);
    expect(fs.existsSync(path.join(targetModulePath, 'prompts', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(targetModulePath, 'resources', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(targetModulePath, 'templates', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(targetModulePath, 'tools', 'index.ts'))).toBe(true);
  });
});