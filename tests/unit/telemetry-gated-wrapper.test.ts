import { describe, expect, it } from 'vitest';
import { isRemoteRunReportingEnabled } from '../../src/telemetry/run-report-provider.js';

describe('telemetry remote opt-in', () => {
  it('enables remote reports only for the explicit balance-test flag or override', () => {
    expect(isRemoteRunReportingEnabled({ search: '' })).toBe(false);
    expect(isRemoteRunReportingEnabled({ search: '?debug=1' })).toBe(false);
    expect(isRemoteRunReportingEnabled({ search: '?wmTelemetry=1' })).toBe(true);
    expect(isRemoteRunReportingEnabled({ search: '?wmTelemetry=0', override: true })).toBe(true);
  });
});
