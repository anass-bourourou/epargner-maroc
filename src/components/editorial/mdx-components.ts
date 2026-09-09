// -----------------------------------------------------------------------------
// Global MDX component mapping. Passed to <Content components={...} /> so that
// article authors can use <Callout>, <KeyTakeaway>, etc. without importing.
// -----------------------------------------------------------------------------

import Callout from '../ui/Callout.astro';
import FinancialNumber from '../ui/FinancialNumber.astro';
import KeyTakeaway from './KeyTakeaway.astro';
import Quote from './Quote.astro';
import ComparisonTable from './ComparisonTable.astro';
import CalculatorEmbed from './CalculatorEmbed.astro';

export const mdxComponents = {
  Callout,
  KeyTakeaway,
  Quote,
  ComparisonTable,
  CalculatorEmbed,
  FinancialNumber,
};
