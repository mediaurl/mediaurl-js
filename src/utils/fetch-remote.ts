export type FetchRemoteFn = () => Promise<any>;

export const fetchRemote: FetchRemoteFn = async () => {
    throw new Error("fetchRemote not implemented");
};
