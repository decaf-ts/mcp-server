// ...existing code...
export type PromptExport = {
  id: string;
  title: string;
  load: (...args: any[]) => any;
};

export type ModuleExportPackage = {
  name: string;
  prompts?: PromptExport[];
  resources?: any[];
  templates?: any[];
  tools?: any[];
};
