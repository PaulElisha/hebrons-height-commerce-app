/** @format */

declare module "fasy" {
 export interface Concurrent {
  map<A, B>(
   fn: (value: A) => B | Promise<B>,
   items: Iterable<A>,
  ): Promise<B[]>;
 }

 export interface FA {
  concurrent: Concurrent;
  map<A, B>(
   fn: (value: A) => B | Promise<B>,
   items: Iterable<A>,
  ): Promise<B[]>;
 }

 const FA: FA;
 export default FA;
}
