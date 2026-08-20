/** @format */
export default function asError(err: unknown): Error {
 return err instanceof Error ? err : new Error(String(err));
}
