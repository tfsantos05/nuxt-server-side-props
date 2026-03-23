export declare function getServerSide<T>(fn: () => T | Promise<T>, key?: string): Promise<T | undefined>;
