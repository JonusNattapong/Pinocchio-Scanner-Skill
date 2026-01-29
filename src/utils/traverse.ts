import type { File } from "@babel/types";
import type { TraverseOptions } from "@babel/traverse";
import _traverse from "@babel/traverse";

// Handle ESM/CJS interop for @babel/traverse
// The module exports differently in ESM vs CJS contexts
type TraverseFunction = (ast: File, opts: TraverseOptions) => void;

const traverse: TraverseFunction = (
  typeof (_traverse as any).default === "function"
    ? (_traverse as any).default
    : _traverse
) as TraverseFunction;

export default traverse;
export type { NodePath } from "@babel/traverse";
