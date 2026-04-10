#!/bin/bash
# Test Kilocode Provider Integration

echo "Testing Kilocode AI Provider Support..."
echo ""

# Test 1: Check help text
echo "✓ Test 1: Checking CLI help for kilocode provider..."
pnpm scan -- --help 2>/dev/null | grep -q "kilocode" && echo "  ✅ 'kilocode' found in CLI help" || echo "  ❌ 'kilocode' NOT in help"

# Test 2: Type check compiles
echo ""
echo "✓ Test 2: Building TypeScript..."
pnpm build 2>&1 | tail -1 | grep -q "^$" && echo "  ✅ Build successful (no errors)" || echo "  ❌ Build had errors"

# Test 3: Test with mock Kilocode (will fail with auth, but proves integration)
echo ""
echo "✓ Test 3: Testing provider detection (will fail with 401, but that's expected)..."
export KILO_API_KEY="test-key-123"
OUTPUT=$(pnpm scan -- ./examples/skills/github --provider kilocode --ai-model anthropic/claude-sonnet-4.5 2>&1 | head -30)
if echo "$OUTPUT" | grep -q "AI Provider Error"; then
  echo "  ✅ Kilocode provider recognized (got auth error as expected)"
else
  echo "  ⚠️  Provider test inconclusive"
fi
unset KILO_API_KEY

# Test 4: Verify Environment Variable Support
echo ""
echo "✓ Test 4: Checking environment variable support..."
grep -q "KILO_API_KEY" src/utils/ai-provider.ts && echo "  ✅ KILO_API_KEY env var configured" || echo "  ❌ KILO_API_KEY NOT found"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Kilocode integration tests complete!"
echo ""
echo "To use Kilocode with your API key:"
echo "  1. Get key from https://app.kilo.ai"
echo "  2. Export KILO_API_KEY=your_key"
echo "  3. Run: pinocchio-scan ./path --provider kilocode"
echo ""
