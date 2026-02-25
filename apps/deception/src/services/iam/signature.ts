export interface AwsCredentialInfo {
  accessKeyId: string;
  date: string;
  region: string;
  service: string;
  signedHeaders: string[];
  signature: string;
}

/**
 * Parse an `Authorization: AWS4-HMAC-SHA256 Credential=…` header.
 *
 * Validates the structural format only — the actual HMAC signature is
 * not verified, which allows any agent using standard AWS SDKs to
 * connect while we capture the credential info it presents.
 */
export function parseAwsSignature(
  authHeader: string,
): AwsCredentialInfo | null {
  if (!authHeader.startsWith('AWS4-HMAC-SHA256 ')) return null;

  const payload = authHeader.slice('AWS4-HMAC-SHA256 '.length);

  const credentialMatch = /Credential=([^,]+)/.exec(payload);
  const signedHeadersMatch = /SignedHeaders=([^,]+)/.exec(payload);
  const signatureMatch = /Signature=([a-fA-F0-9]+)/.exec(payload);

  if (
    !credentialMatch?.[1] ||
    !signedHeadersMatch?.[1] ||
    !signatureMatch?.[1]
  ) {
    return null;
  }

  const credParts = credentialMatch[1].split('/');
  if (credParts.length < 5) return null;

  const [accessKeyId, date, region, service] = credParts;
  if (!accessKeyId || !date || !region || !service) return null;

  return {
    accessKeyId,
    date,
    region,
    service,
    signedHeaders: signedHeadersMatch[1].split(';'),
    signature: signatureMatch[1],
  };
}
