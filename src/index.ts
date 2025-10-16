/**
 * @module MCP
 * @description This module serves as the main entry point for the ts-workspace library.
 * @summary Aggregates and exports functionality from various submodules and utilities within the project.
 */

export * from "./mcp";
export * from "./constants";
export * from "./McpWrapper";
export * from "./types";
export * from "./utils";

export function complexFunction(): string {
  return "Hello Worlddefault";
}

export class Class {
  constructor(private readonly value: number, private readonly text: string) {}

  async method(): Promise<string> {
    throw new Error("Method not implemented");
  }

  static method(): never {
    throw new Error("Static method not implemented");
  }
}

export class ChildClass extends Class {
  constructor(text: string, other: string) {
    super(text.length, other);
  }

  override async method(): Promise<string> {
    return "ok";
  }

  method2(_value: string): never {
    throw new Error("Method2 not supported");
  }
}

export function something(this: Class): Class {
  return this;
}
