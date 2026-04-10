# Kilocode AI Provider Setup

Pinocchio-Scan now supports **Kilocode** as an OpenAI-compatible AI provider gateway for semantic analysis and malware remediation.

## What is Kilocode?

[Kilocode](https://kilo.ai) is an open-source AI provider gateway that routes to **500+ models** from:
- **Anthropic** — Claude 3.5 Opus, Sonnet, Haiku
- **OpenAI** — GPT-4, GPT-4 Turbo, GPT-3.5
- **Google** — Gemini 2.0, 3.1 Pro  
- **xAI** — Grok 4, Grok Code Fast
- **Mistral** — Mistral Large, Codestral, Small
- **DeepSeek** — DeepSeek v3
- **And 400+ more models...**

Write once, route to any model—perfect for scanning with different AI backends without code changes.

## Getting Started

### 1. Get a Kilocode API Key

**Free trial (recommended for testing):**
1. Sign up: https://app.kilo.ai
2. Get your free API key from dashboard
3. Free tier includes $5 initial credit + free model access

**Or bring your own keys (BYOK):**
- Use your existing Anthropic, OpenAI, Google API keys directly via Kilocode
- Zero cost on Kilocode's side; billed by providers

### 2. Set Environment Variable

```bash
export KILO_API_KEY=<your_kilo_api_key>
```

**Or set in `.env` file:**
```dotenv
KILO_API_KEY=kilo_xxx...
```

### 3. Run Pinocchio with Kilocode

**Using default model (Claude Sonnet 4.5):**
```bash
# CLI mode
pinocchio-scan ./my-skill --provider kilocode --fix --report

# TUI mode (interactive)
pinocchio-scan ./my-skill --tui
# Then select "kilocode" as the AI provider in the options screen
```

**Using a specific model:**
```bash
# Use Claude Opus (more capable, higher cost)
pinocchio-scan ./my-skill --provider kilocode --ai-model anthropic/claude-opus-4.6

# Use GPT-4 (OpenAI)
pinocchio-scan ./my-skill --provider kilocode --ai-model openai/gpt-4o

# Use free Llama model (no credits needed)
pinocchio-scan ./my-skill --provider kilocode --ai-model meta-llama/llama-2-70b-instruct:free

# Use kilo-auto for intelligent routing (picks best available model)
pinocchio-scan ./my-skill --provider kilocode --ai-model kilo-auto/frontier
```

## Available Kilocode Models

### High-End Models (Best for complex analysis)
| Model | Provider | Use Case | Cost (approx) |
|-------|----------|----------|---------------|
| `anthropic/claude-opus-4.6` | Anthropic | Complex reasoning, deep analysis | $$$ |
| `anthropic/claude-sonnet-4.5` | Anthropic | **Recommended** — Balanced cost/quality | $$  |
| `openai/gpt-4o` | OpenAI | Latest GPT, good at code | $$$ |
| `google/gemini-2.0-pro` | Google | Advanced reasoning | $$$ |

### Balanced Models (Good cost/performance)
| Model | Provider | Use Case |
|-------|----------|----------|
| `anthropic/claude-haiku-3` | Anthropic | Fast + cheap |
| `openai/gpt-4o-mini` | OpenAI | Fast GPT variant |
| `google/gemini-2.0-flash` | Google | Super fast |

### Free Models (No credits required)
| Model | Provider | Rate Limit |
|-------|----------|-----------|
| `meta-llama/llama-2-70b:free` | Meta | 200 req/hr per IP |
| `x-ai/grok-code-fast-1:free` | xAI | 200 req/hr per IP |
| `openchat/openchat-3.5-1210:free` | OpenChat | 200 req/hr per IP |

### Auto-Routing Models (Let Kilocode choose)
```bash
--ai-model kilo-auto/frontier   # Highest capability
--ai-model kilo-auto/balanced   # Price/performance sweet spot
--ai-model kilo-auto/small      # Fastest/cheapest
--ai-model kilo-auto/free       # No credits needed
```

### List All Available Models
```bash
curl -s https://api.kilo.ai/api/gateway/models | jq '.data[].id'
```

## Usage Examples

### Example 1: Scan with Auto-Remediation using Claude Sonnet
```bash
KILO_API_KEY=xxx pinocchio-scan ./my-skill \
  --provider kilocode \
  --fix \
  --report
```

Output: Fixed SKILL.md with suggested remediation from Claude via Kilocode.

### Example 2: High-Security Audit with GPT-4
```bash
KILO_API_KEY=xxx pinocchio-scan ./malicious-skill \
  --provider kilocode \
  --ai-model openai/gpt-4o \
  --severity critical \
  --sarif report.sarif
```

Output: SARIF report with GPT-4 analysis focused on critical issues only.

### Example 3: Interactive TUI Scan (Choose Provider in UI)
```bash
KILO_API_KEY=xxx pinocchio-scan ./skills --tui
```

Then:
1. Enter path: `./skills`
2. Select **kilocode** from "AI Provider" dropdown
3. Pick a model: `anthropic/claude-sonnet-4.5` (default)
4. Toggle **Auto-fix** if desired
5. Start scan → watch live progress
6. Inspect findings with keyboard navigation
7. Export report or restart

### Example 4: Batch Scan Multiple Skills with Web Search
```bash
for skill in my-skills/*; do
  KILO_API_KEY=xxx pinocchio-scan "$skill" \
    --provider kilocode \
    --web-search \
    --report
done
```

## Pricing & Credit Management

### Free Tier
- **$5 initial credit** — Enough for ~50 scans with Claude Sonnet
- **Free model access** — `*:free` models unlimited (200 req/hr rate limit)
- **Bring Your Own Keys** — Use your own API keys, billed by providers directly

### Pay-As-You-Go
- Charged per token (input + output)
- Tracked with microdollar precision (1 USD = 1,000,000 microdollars)
- Real-time balance dashboard: https://app.kilo.ai/billing

### Example Costs (approx)
| Operation | Model | Input | Output | Total |
|-----------|-------|-------|--------|-------|
| Scan 1 skill | Claude Sonnet | 50k tokens | 3k tokens | ~$0.04 |
| Scan 10 skills | Claude Sonnet | 500k tokens | 30k tokens | ~$0.40 |
| Scan same, GPT-4 | GPT-4o | 500k tokens | 30k tokens | ~$3.00 |
| Scan same, Free Llama | Llama 2 | 500k tokens | 30k tokens | **$0.00** |

**Tip:** Use free models for development, Claude/GPT for production audits.

## Authentication Headers

Kilocode sends these headers automatically:
```
Authorization: Bearer <KILO_API_KEY>
Content-Type: application/json
HTTP-Referer: https://github.com/JonusNattapong/Skill-Scanner
X-Title: pinocchio-scan Security Audit
```

For BYOK mode, provide your provider's API key to Kilocode dashboard settings.

## Troubleshooting

### Error: "Request failed with status code 401"
- **Cause:** Missing or invalid `KILO_API_KEY`
- **Fix:** 
  ```bash
  export KILO_API_KEY=<your_key_from_https://app.kilo.ai>
  ```

### Error: "Request failed with status code 402 (Payment Required)"
- **Cause:** Kilocode account out of credits
- **Fix:** 
  1. Go to https://app.kilo.ai/billing
  2. Top up account (even free models need minimum balance)
  3. Or use a `*:free` model variant

### Error: Model not found
- **Cause:** Typo in model name or discontinued model
- **Fix:** List available models:
  ```bash
  curl -s https://api.kilo.ai/api/gateway/models | jq '.data[] | select(.id | contains("claude"))' 
  ```

### Scanning too slow?
- Use a faster model: `google/gemini-2.0-flash` or `kilo-auto/small`
- Or use free model: `meta-llama/llama-2-70b:free`

### Want to use your own API keys?
- Set up **BYOK** in Kilocode dashboard: https://app.kilo.ai/settings/keys
- Continue using `KILO_API_KEY` from Kilocode — they'll route through your credentials

## Comparison: Kilocode vs Others

| Feature | Kilocode | OpenRouter | Direct ChatGPT | Direct Gemini API |
|---------|----------|-----------|----------------|-----------------|
| **Models supported** | 500+ | 200+ | 1 (just GPT) | 1 (just Gemini) |
| **Auto-routing** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **BYOK support** | ✅ Yes | ❌ No | ✅ (direct) | ✅ (direct) |
| **Free models** | ✅ Yes (200 req/hr) | ✅ Yes | ❌ No | ❌ No |
| **Tool calling** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Streaming** | ✅ Full SSE | ✅ Full SSE | ✅ Yes | ✅ Yes |
| **Organization controls** | ✅ Yes | ✅ Yes (paid) | ✅ Yes | ✅ Yes |
| **Cost** | Market rates | Market rates + margin | Direct | Direct |

**Best for Pinocchio:** Kilocode wins on flexibility (model choice) + cost (free tier) + ease (single config).

## API Reference

### Base URL
```
https://api.kilo.ai/api/gateway
```

### POST /chat/completions (OpenAI-compatible)
```bash
curl -X POST "https://api.kilo.ai/api/gateway/chat/completions" \
  -H "Authorization: Bearer $KILO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Analyze this code..."}],
    "max_tokens": 2000
  }'
```

### GET /models (List all supported models)
```bash
curl -s https://api.kilo.ai/api/gateway/models | jq '.data[].id' | head -20
```

### GET /providers (List available providers)
```bash
curl -s https://api.kilo.ai/api/gateway/providers | jq '.data[].name'
```

## Additional Resources

- **Kilocode Docs:** https://docs.kilo.ai
- **Sign up:** https://app.kilo.ai
- **GitHub:** https://github.com/Kilo-Org/kilocode
- **Billing:** https://app.kilo.ai/billing
- **API Key:** https://app.kilo.ai/settings/keys

---

**Questions?** Open an issue on [Skill-Scanner](https://github.com/JonusNattapong/Skill-Scanner/issues) or [Kilocode](https://github.com/Kilo-Org/kilocode/issues).
