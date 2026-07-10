import { Injectable } from '@nestjs/common';
import {
  ValidationProvider,
  ValidationProviderResult,
} from './validation-provider.interface';
import { ValidationVerdict } from '../../../common/enums';

@Injectable()
export class MockValidationProvider implements ValidationProvider {
  async validate(
    _filePath: string,
    documentType: string,
  ): Promise<ValidationProviderResult> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const passed = Math.random() > 0.25;
    const confidenceScore = passed
      ? 0.75 + Math.random() * 0.24
      : 0.3 + Math.random() * 0.4;

    return {
      verdict: passed
        ? ValidationVerdict.PASS
        : confidenceScore > 0.5
          ? ValidationVerdict.REVIEW_REQUIRED
          : ValidationVerdict.FAIL,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      checks: [
        {
          name: 'document_readable',
          passed: true,
          message: 'Document is readable',
        },
        {
          name: 'type_match',
          passed,
          message: passed
            ? `Document matches expected type: ${documentType}`
            : `Document may not match expected type: ${documentType}`,
        },
        {
          name: 'expiry_check',
          passed: Math.random() > 0.3,
          message: passed ? 'Document is not expired' : 'Document may be expired',
        },
        {
          name: 'tamper_check',
          passed: Math.random() > 0.15,
          message: passed ? 'No tampering detected' : 'Possible tampering detected',
        },
      ],
      extractedFields: {
        documentType,
        issueDate: '2024-01-15',
        expiryDate: '2029-01-15',
        holderName: 'John Doe',
      },
    };
  }
}
