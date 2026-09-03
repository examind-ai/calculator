export { Calculator, default } from './Calculator';
export type { CalculatorProps } from './Calculator';

// Re-export the evaluation seam so a mode package can type its evaluator
// straight from the skin package (originally from @examind/calculator-core).
export type { Evaluator } from '@examind/calculator-react';
