# MCP Local LLM — Product Plan & Roadmap

## Vision

A production-grade MCP server that empowers AI-assisted workflows by routing expensive operations to local or cloud LLMs, reducing token usage by 80-90% while providing 34+ specialized tools for code analysis, content processing, web automation, documentation, memory, and desktop control.

---

## Current State (v1.0.0)

### Core Architecture
- **MCP Protocol**: Full JSON-RPC compliance over stdio transport
- **Multi-Provider Adapters**: Ollama, OpenAI, Anthropic, Gemini — switchable via config
- **Adapter Pattern**: Provider-agnostic abstraction (Factory + Base Adapter + Concrete Adapters)
- **Silent Operation**: Zero stdout pollution to prevent protocol corruption
- **Client Workspace Detection**: MCP Roots with process.cwd() fallback

### Tool Categories (36 tools)
| Category | Tools | Count |
|---|---|---|
| LLM Query | ask_llm, check_llm_status, think_through | 3 |
| Code Analysis | analyze_huge_file, search_code_usage, codebase_discovery, security_scanner | 4 |
| Content Processing | humanize_content, humanize_compact, humanize_file, digest_error_logs | 4 |
| Version Control | diff_files, diff_branches, git_diff_file | 3 |
| System | run_command, debugger | 2 |
| Web Automation | playwright_navigate, playwright_screenshot, playwright_extract_content, playwright_interact | 4 |
| Documentation | documentor_api, documentor_code, documentor_readme | 3 |
| Memory | memory_store, memory_retrieve, memory_update, memory_delete, memory_search | 5 |
| Desktop | desktop_launch, desktop_system_info, desktop_screenshot, desktop_file_operations, desktop_notification, desktop_clipboard | 6 |
| **Cache (NEW)** | **cache_stats, cache_clear** | **2** |

### Prompt System (5 prompts)
- mcp_tool_usage_rules (mandatory)
- token_economy_guidelines
- thinking_layer_instructions
- context_compression_rules
- chat_end_summary_rule (optional, feature-flagged)

### Resources (6 endpoints)
- server_config, available_models, tools_list, prompts_list, usage_statistics, **cache_statistics (NEW)**

---

## Implemented Features

### Phase 1 — Foundation (Complete)
- [x] MCP server with stdio transport
- [x] Ollama integration for local LLM processing
- [x] Core tools: ask_llm, check_llm_status, run_command
- [x] Code analysis tools: analyze_huge_file, search_code_usage
- [x] Content humanization tools
- [x] Prompt injection system for token optimization
- [x] Resource endpoints for configuration and stats

### Phase 2 — Multi-Provider & Advanced Tools (Complete)
- [x] Adapter pattern for provider abstraction
- [x] OpenAI, Anthropic, Gemini adapters
- [x] Model selector with use-case optimization
- [x] Web automation tools (Playwright)
- [x] Documentation generation tools
- [x] Memory system (file-based persistent storage)
- [x] Desktop automation tools
- [x] Security & performance scanner
- [x] Thinking layer (multi-step reasoning)
- [x] Codebase semantic discovery

### Phase 3 — Result Caching (Complete)
- [x] CacheService with in-memory LRU eviction
- [x] Content-hash based cache keys (SHA-256)
- [x] Per-tool opt-in via `cacheable` + `cacheTTL` in tool definitions
- [x] Transparent cache integration in BaseTool.handleCached()
- [x] Cache management tools (cache_stats, cache_clear)
- [x] Cache statistics resource endpoint
- [x] Environment-based configuration (CACHE_ENABLED, CACHE_MAX_ENTRIES, CACHE_DEFAULT_TTL)
- [x] Cached tools: ask_llm, think_through, analyze_huge_file, codebase_discovery, search_code_usage, humanize_content, security_scanner, documentor_code

---

## Planned Roadmap

### Phase 4 — Streaming & Real-Time (Next)
- [ ] Streaming responses for long-running LLM calls
- [ ] Progress callbacks for tools (e.g., file analysis progress)
- [ ] Server-Sent Events support for real-time updates
- [ ] Cancellation support for in-flight requests

### Phase 5 — Plugin System
- [ ] Dynamic tool loading from external directories
- [ ] Plugin manifest format (JSON/YAML)
- [ ] Plugin lifecycle hooks (install, enable, disable, uninstall)
- [ ] Plugin dependency resolution
- [ ] Sandboxed plugin execution

### Phase 6 — Tool Composition & Pipelines
- [ ] Tool chaining: output of one tool feeds into another
- [ ] Declarative pipeline definitions
- [ ] Conditional branching in pipelines
- [ ] Parallel tool execution within pipelines
- [ ] Pipeline templates for common workflows

### Phase 7 — Advanced Caching & Persistence
- [ ] Disk-backed cache for persistence across restarts
- [ ] Cache warming strategies for frequently-used queries
- [ ] Cache invalidation hooks (file change watchers)
- [ ] Distributed cache support (Redis adapter)
- [ ] Cache analytics dashboard

### Phase 8 — Observability & Metrics
- [ ] Usage metrics per tool (invocation count, latency, error rate)
- [ ] Token usage tracking per provider
- [ ] Cost estimation per operation
- [ ] Structured logging with log levels
- [ ] Health check endpoint
- [ ] OpenTelemetry integration

### Phase 9 — Security & Multi-Tenancy
- [ ] API key authentication for remote access
- [ ] Per-tool access control lists
- [ ] Rate limiting per client/tool
- [ ] Audit logging
- [ ] Input sanitization framework
- [ ] Secrets management integration

### Phase 10 — Ecosystem
- [ ] VS Code extension for direct MCP integration
- [ ] Web dashboard for tool management and monitoring
- [ ] CLI companion tool for standalone usage
- [ ] Docker image with pre-configured providers
- [ ] Helm chart for Kubernetes deployment

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| LLM_PROVIDER | ollama | Provider: ollama, openai, anthropic, gemini |
| OLLAMA_URL | http://localhost:11434 | Ollama API URL |
| OPENAI_API_KEY | - | OpenAI API key |
| OPENAI_BASE_URL | https://api.openai.com/v1 | OpenAI base URL |
| ANTHROPIC_API_KEY | - | Anthropic API key |
| ANTHROPIC_BASE_URL | https://api.anthropic.com/v1 | Anthropic base URL |
| GEMINI_API_KEY | - | Gemini API key |
| GEMINI_BASE_URL | https://generativelanguage.googleapis.com/v1beta | Gemini base URL |
| MODEL_NAME | (provider default) | Override default model |
| MAX_TOKENS | 256 | Default max tokens |
| TEMPERATURE | 0.7 | Default temperature |
| CACHE_ENABLED | true | Enable result caching |
| CACHE_MAX_ENTRIES | 200 | Maximum cache entries |
| CACHE_DEFAULT_TTL | 300000 | Default cache TTL (ms) |
| DISABLE_CHAT_SUMMARY_RULE | false | Disable chat summary prompt |

---

## Architecture Principles

1. **Abstraction Layers**: Application code never imports adapters directly — always through LLMService
2. **Open/Closed**: New providers are added as adapters without modifying existing code
3. **Single Responsibility**: Each tool, service, and handler has one clear purpose
4. **Silent Protocol**: Zero stdout output — MCP JSON-RPC integrity is paramount
5. **Opt-In Complexity**: Features like caching are enabled by default but configurable per-tool
6. **Graceful Degradation**: Failures in optional systems (cache, model init) never crash the server
