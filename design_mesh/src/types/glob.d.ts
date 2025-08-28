// Type declarations for glob to resolve TypeScript compilation issues
declare module 'glob' {
  interface GlobOptions {
    cwd?: string;
    root?: string;
    dot?: boolean;
    nomount?: boolean;
    mark?: boolean;
    nosort?: boolean;
    stat?: boolean;
    silent?: boolean;
    strict?: boolean;
    cache?: { [path: string]: any };
    statCache?: { [path: string]: any };
    symlinks?: { [path: string]: any };
    realpathCache?: { [path: string]: any };
    follow?: boolean;
    ignore?: string | string[];
    absolute?: boolean;
  }

  function glob(pattern: string, options?: GlobOptions): Promise<string[]>;
  function glob(pattern: string, options: GlobOptions, callback: (err: Error | null, matches: string[]) => void): void;

  export = glob;
}
