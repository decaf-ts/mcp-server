export function hasExistingJsDoc(sourceText: string, nodeStartLine: number): { has: boolean; block?: string } {
  // Simple heuristic: look for /** */ block immediately preceding the line
  const lines = sourceText.split(/\r?\n/);
  const idx = Math.max(0, nodeStartLine - 2); // 0-based
  for (let i = idx; i >= 0 && i > idx - 6; i--) {
    const line = lines[i].trim();
    if (line.startsWith('/**')) {
      // collect block
      const blockLines = [];
      for (let j = i; j < lines.length; j++) {
        blockLines.push(lines[j]);
        if (lines[j].includes('*/')) break;
      }
      return { has: true, block: blockLines.join('\n') };
    }
    if (line && !line.startsWith('*') && !line.startsWith('//')) break;
  }
  return { has: false };
}
