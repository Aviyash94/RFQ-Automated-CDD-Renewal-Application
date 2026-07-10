import { ValidationVerdict } from '../../../common/enums';

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface ValidationProviderResult {
  verdict: ValidationVerdict;
  confidenceScore: number;
  checks: ValidationCheck[];
  extractedFields: Record<string, string>;
}

export interface ValidationProvider {
  validate(
    filePath: string,
    documentType: string,
  ): Promise<ValidationProviderResult>;
}

export const VALIDATION_PROVIDER = 'VALIDATION_PROVIDER';
