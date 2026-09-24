import { Injectable } from '@nestjs/common';
import { calculateTrustScore, TrustInputs } from '@wildprice/trust-algorithm';
import { TrustScoreBreakdown } from '@wildprice/shared-types';

@Injectable()
export class TrustService {
  calculate(inputs: TrustInputs): TrustScoreBreakdown {
    return calculateTrustScore(inputs);
  }
}
