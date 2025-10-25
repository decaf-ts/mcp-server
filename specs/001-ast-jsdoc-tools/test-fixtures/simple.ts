export function add(a: number, b: number): number {
  return a + b;
}

export const VERSION = '1.0.0';

export class Greeter {
  constructor(private name: string) {}
  greet() {
    return `Hello ${this.name}`;
  }
}
