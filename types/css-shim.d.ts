// types/css-shim.d.ts

// This declaration tells TypeScript that any module ending with '.css'
// exists and has a default export (even if we don't use it).
// This resolves the "Cannot find module '...css'" error for CSS imports.
declare module '*.css' {
  const css: string;
  export default css;
}