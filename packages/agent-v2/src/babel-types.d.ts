// Babel type declarations
declare module '@babel/traverse' {
  import { Node } from '@babel/types';
  
  export interface NodePath<T = Node> {
    node: T;
    parent: Node;
    [key: string]: any;
  }
  
  export interface Visitor {
    [key: string]: (path: NodePath) => void;
  }
  
  export default function traverse(ast: Node, visitor: Visitor): void;
}

declare module '@babel/generator' {
  import { Node } from '@babel/types';
  
  export interface GeneratorOptions {
    [key: string]: any;
  }
  
  export interface GeneratorResult {
    code: string;
    map?: any;
  }
  
  export default function generate(
    ast: Node,
    options?: GeneratorOptions,
    source?: string
  ): GeneratorResult;
}
