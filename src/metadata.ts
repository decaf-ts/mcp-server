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

Metadata.registerLibrary(PACKAGE_NAME, VERSION);
