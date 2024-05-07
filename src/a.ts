export function getFavNo(a: number): number {
  return a;
}

function identity(arg: number): number {
  return arg;
}

function identityAgain<Type>(arg: Type): Type {
  return arg;
}

let output = identityAgain(0)