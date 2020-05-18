export type OuterPromise<T = any> = Promise<T> & {
  resolve: (value?: any) => void;
  reject: (error: Error | string) => void;
  done: boolean;
  timeout: number | undefined;
};

/**
 * Utility function to resolve or reject promises outside the normal program flow.
 * Example:
 * ```
 * const p = outerPromise();
 * setTimeout(function firstCallback() { p.resolve(); }, 1000);
 * someHandler(async function otherCallback() {
 *   return await p;
 * });
 * ```
 * @param timeout Optional timeout.
 */
export const outerPromise = (timeout?: number) => {
  const temp: Partial<OuterPromise> = { done: false, timeout };

  let t: NodeJS.Timeout;
  const promise = new Promise((a, b) => {
    temp.resolve = (value) => {
      if (t) clearTimeout(t);
      temp.done = true;
      a(value);
    };
    temp.reject = (error) => {
      if (t) clearTimeout(t);
      temp.done = true;
      b(error);
    };
  });

  temp.then = (...args: any[]) => promise.then(...args);
  temp.catch = (...args: any[]) => promise.catch(...args);
  temp.finally = (...args: any[]) => promise.finally(...args);

  const res = <OuterPromise>temp;
  if (timeout) t = setTimeout(() => res.reject(new Error("Timeout")), timeout);
  return res;
};
