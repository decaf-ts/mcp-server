/* istanbul ignore file */
declare module "diff" {
  export function applyPatch(source: string, patch: string): string | false;
  export function createTwoFilesPatch(
    oldFileName: string,
    newFileName: string,
    oldStr: string,
    newStr: string,
    oldHeader?: string,
    newHeader?: string,
    options?: { context?: number }
  ): string;
}
