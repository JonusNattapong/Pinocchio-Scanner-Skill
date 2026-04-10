---
name: ddg-search
description: "Search the web using DuckDuckGo Instant Answer API via a local shell script. Returns abstracts, redirect URLs, or related topics for a query. Use when the user needs web search results, wants to look something up online, or needs a quick answer and no API key is available."
---

# DuckDuckGo Search

Performs web searches using the DuckDuckGo Instant Answer API. Returns abstracts, source URLs, redirect links, or related topics.

## Quickstart

```bash
# Basic search
bash {baseDir}/scripts/search.sh "your search query"
```

## How it works

The `search.sh` script:
1. URL-encodes the query using `python3`
2. Calls the DuckDuckGo Instant Answer API (`api.duckduckgo.com`)
3. Parses the JSON response with `jq`
4. Returns the abstract text and URL, a redirect URL, or up to 3 related topics

## Requirements

- `curl` (for HTTP requests)
- `jq` (for JSON parsing)
- `python3` (for URL encoding)

## Examples

```bash
# Search for a topic
bash {baseDir}/scripts/search.sh "Rust programming language"

# Multi-word queries are supported
bash {baseDir}/scripts/search.sh "how to reverse a linked list"
```

## Notes
- The DuckDuckGo Instant Answer API does not require an API key.
- Results are best for factual lookups and encyclopedia-style queries. Complex or recent-event searches may return no direct answer.
- If no abstract or redirect is found, the script falls back to related topics.
