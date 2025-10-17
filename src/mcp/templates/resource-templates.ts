
async function loadFile(root: string, type: "src" | "tests" | "workdocs") {
  return async function loadFile(obj: { path: string }) {
    const abs = path.join(root, type, obj.path);
    const text = readFileSafe(abs) ?? "";
    return { text };
  };
}

export function buildResourceTemplates(
  repoPath: string
): DecorationResourceTemplate[] {
  const root = path.resolve(process.cwd(), repoPath);
  return [
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
      load: loadFile(root, "src") as any,
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
      load: loadFile(root, "tests") as any,
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
      load: loadFile(root, "workdocs") as any,
    },
  ];
}
