import path from "path";
import type { DecorationResourceTemplate } from "../types";
import { getWorkspaceRoot, readWorkspaceFile } from "../workspace";

export const decorationResourceTemplates: DecorationResourceTemplate[] = [];

function makeLoader(type: "src" | "tests" | "workdocs") {
  return async ({ path: relative }: { path: string }) => {
    const root = getWorkspaceRoot();
    const target = path.join(type, relative);
    const text = await readWorkspaceFile(root, target);
    return { text };
  };
}

export function buildDecorationResourceTemplates(): DecorationResourceTemplate[] {
  const templates: DecorationResourceTemplate[] = [
    {
      name: "read-code-from-source",
      description:
        "Read a file from the <base_path>/src tree by relative path.",
      mimeType: "text/plain",
      uriTemplate: "from-source://src/{path}",
      arguments: [
        {
          name: "path",
          description:
            "Path under <base_path>/src to load, e.g. 'decoration/types.ts'",
          required: true,
        },
      ],
      load: makeLoader("src"),
    },
    {
      name: "read-test-from-source",
      description:
        "Read a file from the <base_path>/tests tree by relative path.",
      mimeType: "text/plain",
      uriTemplate: "from-source://tests/{path}",
      arguments: [
        {
          name: "path",
          description:
            "Path under <base_path>/tests to load, e.g. 'decoration/tests/types.test.ts'",
          required: true,
        },
      ],
      load: makeLoader("tests"),
    },
    {
      name: "read-doc-from-source",
      description:
        "Read a file from the <base_path>/workdocs tree by relative path.",
      mimeType: "text/plain",
      uriTemplate: "from-source://workdocs/{path}",
      arguments: [
        {
          name: "path",
          description:
            "Path under <base_path>/workdocs to load, e.g. 'decoration/workdocs/tutorials/for-developers.md'",
          required: true,
        },
      ],
      load: makeLoader("workdocs"),
    },
  ];

  decorationResourceTemplates.splice(
    0,
    decorationResourceTemplates.length,
    ...templates
  );
  return decorationResourceTemplates;
}
