declare module 'osrm-text-instructions' {
  export function compile(
    language: string,
    step: any,
    options?: {
      legIndex?: number;
      legCount?: number;
    }
  ): string;
  
  export default {
    compile
  };
}