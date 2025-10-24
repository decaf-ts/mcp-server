import { z } from "zod";
import {
  analyzeRepoSchema,
  enumerateCapabilitiesSchema,
  planFeatureSchema,
  documentCodeSchema,
  codeChangeSchema,
  documentObjectSchema,
  coverageTaskSchema,
  readmeImprovementSchema,
} from "./schemas";

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

export type DocumentObjectArgs = z.infer<typeof documentObjectSchema>;

export type CoverageTaskArgs = z.infer<typeof coverageTaskSchema>;

export type ReadmeImprovementArgs = z.infer<typeof readmeImprovementSchema>;

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

export type PromptResourceTemplate = {
  name: string;
  description: string;
  uriTemplate: string;
  mimeType: string;
  arguments: ReadonlyArray<{
    name: string;
    description: string;
    required: boolean;
  }>;
  load: (args: { name: string }) => Promise<{ text: string; uri?: string }>;
};
