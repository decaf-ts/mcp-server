import type { Resource } from "fastmcp";
import type { ResourceAsset } from "../../types";
import { moduleRegistry } from "../moduleRegistry";
import { getWorkspaceRoot } from "../workspace";
import {
  buildObjectPrompts,
  discoverDocPrompts,
} from "../prompts/prompts";

function toResource(asset: ResourceAsset): Resource<undefined> {
  return {
    name: asset.id,
    uri: asset.uri,
    description: asset.description ?? asset.title,
    mimeType: asset.mimeType,
    load: () => asset.load(),
  };
}

function buildModuleResources(): Resource<undefined>[] {
  return moduleRegistry.listResources().map(toResource);
}

export const resources: Resource<undefined>[] = [
  {
    name: "codex-prompt-index",
    uri: "codex://prompts/index",
    description:
      "Enumerate available .codex prompt files with titles and descriptions.",
    mimeType: "application/json",
    load: async () => {
      const root = getWorkspaceRoot();
      const prompts = discoverDocPrompts(root).map((prompt) => ({
        name: prompt.name,
        title: prompt.title,
        description: prompt.description,
        path: prompt.absolutePath,
      }));
      return {
        text: JSON.stringify({ prompts }, null, 2),
        mimeType: "application/json",
      };
    },
  },
  {
    name: "codex-object-prompts",
    uri: "codex://prompts/objects",
    description:
      "Provides the resolved prompt content for each documented object workflow.",
    mimeType: "application/json",
    load: async () => {
      const entries = await Promise.all(
        buildObjectPrompts().map(async (prompt) => ({
          name: prompt.name,
          description: prompt.description,
          content: await prompt.load({} as never),
        }))
      );
      return {
        text: JSON.stringify({ prompts: entries }, null, 2),
        mimeType: "application/json",
      };
    },
  },
  ...buildModuleResources(),
];
