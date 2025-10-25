import type { ResourceAsset } from "../../../../src/types";

export const resources: ResourceAsset[] = [
  {
    id: "sample-module.resource.readme",
    title: "Sample Module README",
    uri: "fixture://sample-module/README",
    mimeType: "text/markdown",
    load: () => ({
      text: "Sample module resource content",
      mimeType: "text/markdown",
    }),
  },
];
