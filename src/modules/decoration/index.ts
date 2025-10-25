import { prompts } from './prompts';
import { resources } from './resources';
import { templates } from './templates';
import { tools } from './tools';
export { prompts } from './prompts';
export { resources } from './resources';
export { templates } from './templates';
export { tools } from './tools';
export const modulePackage = { name: 'decoration', prompts, resources, templates, tools } as const;
