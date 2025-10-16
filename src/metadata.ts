import { Metadata } from "@decaf-ts/decoration";

/**
 * @const VERSION
 * @name VERSION
 * @description Represents the current version of the ts-workspace module.
 * @summary The actual version number is replaced during the build process.
 * @type {string}
 */
export const VERSION = "##VERSION##";
export const PACKAGE_NAME = "##PACKAGE_NAME##";

try {
  Metadata.registerLibrary(PACKAGE_NAME, VERSION);
} catch (error) {
  if (error instanceof Error && error.message.includes("already")) {
    // Ignore duplicate registration during tests/bundling checks.
  } else {
    throw error;
  }
}
