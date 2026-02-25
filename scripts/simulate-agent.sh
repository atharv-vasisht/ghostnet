#!/bin/bash
# Simulates an AI agent probing the GHOSTNET deception environment

set -e

BASE_URL="${DECEPTION_URL:-http://localhost:4000}"
echo "🤖 GHOSTNET Agent Simulation"
echo "Target: $BASE_URL"
echo "Watch your dashboard at http://localhost:5173/app/dashboard"
echo ""
sleep 2

# Step 1: Discovery
echo "[1/6] Initial reconnaissance — hitting service discovery..."
curl -s "$BASE_URL/.well-known/ghostnet-services" | python3 -m json.tool || true
sleep 2

# Step 2: IAM enumeration
echo ""
echo "[2/6] Enumerating IAM users..."
curl -s -X POST "$BASE_URL/iam/" \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20241125/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=abc123def456" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Action=ListUsers&Version=2010-05-08" || true
sleep 3

# Step 3: Get caller identity
echo ""
echo "[3/6] Validating credentials — GetCallerIdentity..."
curl -s -X POST "$BASE_URL/iam/" \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20241125/us-east-1/sts/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=abc123" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Action=GetCallerIdentity&Version=2011-06-15" || true
sleep 2

# Step 4: Credential retrieval
echo ""
echo "[4/6] Accessing secrets vault — credential harvesting..."
curl -s -X POST "$BASE_URL/secrets/" \
  -H "X-Amz-Target: secretsmanager.ListSecrets" \
  -H "Content-Type: application/x-amz-json-1.1" \
  -d '{}' || true
sleep 1

curl -s -X POST "$BASE_URL/secrets/" \
  -H "X-Amz-Target: secretsmanager.GetSecretValue" \
  -H "Content-Type: application/x-amz-json-1.1" \
  -d '{"SecretId": "prod/database"}' || true
sleep 1

curl -s -X POST "$BASE_URL/secrets/" \
  -H "X-Amz-Target: secretsmanager.GetSecretValue" \
  -H "Content-Type: application/x-amz-json-1.1" \
  -d '{"SecretId": "prod/api-key"}' || true
sleep 2

# Step 5: Authenticate to internal API with retrieved token
echo ""
echo "[5/6] Using retrieved credentials to access internal API..."
curl -s "$BASE_URL/api/v1/employees?page=1" \
  -H "Authorization: Bearer ghostnet_internal_token_abc123" || true

for PAGE in 2 3 4; do
  sleep 1
  curl -s "$BASE_URL/api/v1/employees?page=$PAGE" \
    -H "Authorization: Bearer ghostnet_internal_token_abc123" > /dev/null || true
done
echo ""
echo "(paginated through employee records — exfiltration detected)"
sleep 2

# Step 6: S3 access
echo ""
echo "[6/6] Accessing object storage..."
curl -s "$BASE_URL/api/v1/admin/config" \
  -H "Authorization: Bearer ghostnet_internal_token_abc123" || true
sleep 1

echo ""
echo ""
echo "✅ Simulation complete!"
echo "   Check your GHOSTNET dashboard — you should see a new CRITICAL session"
echo "   with full belief state analysis and IOCs"
echo ""
echo "   Dashboard: http://localhost:5173/app/dashboard"
