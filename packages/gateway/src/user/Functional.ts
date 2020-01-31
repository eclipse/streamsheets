type ParamTypeAt<
  T extends {
    [key: string]: (...args: any) => any;
  },
  X extends number
> = {
  [P in keyof T]: Parameters<T[P]>[X];
};

type MergeParams<T extends object> = T extends { [key: string]: infer U }
  ? U
  : never;

type PartialApply1<F extends (arg1: any, ...args: any[]) => any> = (
  ...args: Tail<Parameters<F>>
) => ReturnType<F>;

function partialApply1<F extends (arg1: any, ...args: any) => any>(
  f: F,
  arg1: Parameters<F>[0]
): PartialApply1<F> {
  return (...args) => f(arg1, ...args);
}

type PartialApply1All<
  T extends {
    [key: string]: (...args: any) => any;
  }
> = {
  [P in keyof T]: PartialApply1<T[P]>;
};

function partialApply1All<
  T extends {
    [key: string]: (...args: any) => any;
  }
>(object: T, arg1: MergeParams<ParamTypeAt<T, 0>>): PartialApply1All<T> {
  return <PartialApply1All<T>>(
    Object.entries(object).reduce(
      (acc, [key, func]) => ({ ...acc, [key]: partialApply1(func, arg1) }),
      {}
    )
  );
}

type PartialApply2<F extends (arg1: any, arg2: any, ...args: any[]) => any> = (
  ...args: Tail<Tail<Parameters<F>>>
) => ReturnType<F>;

type PartialApply2All<
  T extends {
    [key: string]: (...args: any) => any;
  }
> = {
  [P in keyof T]: PartialApply2<T[P]>;
};

type PartialApply3All<
  T extends {
    [key: string]: (...args: any) => any;
  }
> = {
  [P in keyof T]: PartialApply3<T[P]>;
};

type PartialApply3<
  F extends (arg1: any, arg2: any, arg3: any, ...args: any[]) => any
> = (...args: Tail<Tail<Tail<Parameters<F>>>>) => ReturnType<F>;

const test1 = (nana: string, x: number, qq: boolean, s: string, ps: number) =>
  "test";

function partialApply2<F extends (arg1: any, arg2: any, ...args: any) => any>(
  f: F,
  arg1: Parameters<F>[0],
  arg2: Parameters<F>[1]
): PartialApply2<F> {
  return (...args) => f(arg1, arg2, ...args);
}

function partialApply3<
  F extends (arg1: any, arg2: any, arg3: any, ...args: any) => any
>(
  f: F,
  arg1: Parameters<F>[0],
  arg2: Parameters<F>[1],
  arg3: Parameters<F>[2]
): PartialApply3<F> {
  return (...args) => f(arg1, arg2, arg3, ...args);
}

type Head<T extends any[]> = T extends [any, ...any[]] ? T[0] : never;
type Tail<T extends any[]> = ((...t: T) => any) extends (
  _: any,
  ...tail: infer TT
) => any
  ? TT
  : [];
