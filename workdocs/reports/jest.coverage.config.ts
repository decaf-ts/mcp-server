import { Config } from "@jest/types";
import conf from "../../jest.config";

const config: Config.InitialOptions = {
  ...conf,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/mcp/prompts/**/*.ts",
    "src/mcp/resources/**/*.ts",
    "src/mcp/templates/**/*.ts",
    "src/mcp/tools/**/*.ts",
  ],
  coverageDirectory: "./workdocs/reports/coverage",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./workdocs/reports/junit",
        outputName: "junit-report.xml",
      },
    ],
    [
      "jest-html-reporters",
      {
        publicPath: "./workdocs/reports/html",
        filename: "test-report.html",
        openReport: true,
        expand: true,
        pageTitle: "@decaf-ts/mcp-server tst report",
        stripSkippedTest: true,
        darkTheme: true,
        enableMergeData: true,
        dataMergeLevel: 2,
      },
    ],
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 85,
      lines: 95,
      statements: 95,
    },
  },
};

export default config;
