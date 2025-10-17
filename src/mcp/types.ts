import { z } from "zod/index";
import {
  analyzeRepoSchema,
  enumerateCapabilitiesSchema,
  planFeatureSchema,
} from "./schemas";
import { documentCodeSchema } from "./mcp-module";

export type AnalyzeRepoArgs = z.infer<typeof analyzeRepoSchema>;
export type EnumerateCapabilitiesArgs = z.infer<
  typeof enumerateCapabilitiesSchema
>;
export type PlanFeatureArgs = z.infer<typeof planFeatureSchema>;

export type DecorationResourceTemplate = {
  name: string;
  description: string;
  uriTemplate: string;
  mimeType: string;
  arguments: ReadonlyArray<{
    name: string;
    description: string;
    required: boolean;
  }>;
  load: (args: { path: string }) => Promise<{ text: string }>;
};

export type DocumentCodeArgs = z.infer<typeof documentCodeSchema>;

export type ApplyCodeChangeArgs = z.infer<typeof codeChangeSchema>;

export type DocPrompt = {
  name: string;
  title: string;
  description: string;
  content: string;
  absolutePath: string;
};

export type WorkspaceResourceTemplate = {
  name: string;
  description: string;
  uriTemplate: string;
  mimeType: string;
  arguments: ReadonlyArray<{
    name: string;
    description: string;
    required: boolean;
  }>;
  load: (args: { path: string }) => Promise<{ text: string }>;
};
