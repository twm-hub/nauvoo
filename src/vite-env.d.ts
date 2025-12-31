/// <reference types="vite/client" />

// Declare raw file imports
declare module '*.ics?raw' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const value: any;
  export default value;
}
