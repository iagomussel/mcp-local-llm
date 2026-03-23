# MCP Local LLM - Product Plan & Roadmap

## Vision

MCP Local LLM is a Model Context Protocol server that acts as a context preprocessor, reducing token consumption by up to 80% by routing large file analysis, error log digestion, and codebase searches through local or cloud LLMs before results reach the client IDE.

---

## Current State (v1.0.0)

### Core Architecture
- **Adapter Pattern** - Pluggable LLM providers (Ollama, OpenAI, Anthropic, Gemini)
- **Factory Pattern** - Dynamic adapter creation via `AdapterFactory`
- **Template Method** - `BaseTool` abstract class for all 35+ tools
- **Singleton** - `MemoryStoreSingleton` for persistent memory
- **Service Layer** - `LLMService`, `ModelSelector`, `RequestQueue`

### Implemented Features
| Category | Features |
|---|---|
| **LLM Providers** | Ollama, OpenAI, Anthropic, Gemini with adapter pattern |
| **Model Selection** | Intelligent routing by task type (code, math, creative, chat) |
| **Request Queue** | Concurrency control, deduplication, retry with backoff, metrics |
| **Tools (35+)** | Code analysis, error logs, memory, desktop, Playwright, docs, security |
| **Prompts (5)** | Token economy, context compression, thinking layer, tool usage rules |
| **Resources (6)** | Config, models, tools, prompts, usage stats, queue metrics |
| **Memory** | Persistent JSON store with search, tags, metadata filtering |
| **Transport** | Stdio (MCP standard) |

---

## Roadmap

### Phase 2 - Reliability & Performance
**Status: In Progress**

- [x] **Request Queue** - Concurrency control, dedup, retry, metrics tracking
- [ ] **Result Caching** - LRU cache for LLM responses with configurable TTL
  - Per-tool opt-in caching
  - Content-hash based keys
  - Cache invalidation strategies
- [ ] **Health Monitoring** - Periodic provider health checks with auto-failover
  - Heartbeat pings to active provider
  - Automatic fallback to secondary provider on failure
  - Recovery detection and switch-back

### Phase 3 - Transport & Connectivity
- [ ] **HTTP/SSE Transport** - Streamable HTTP transport alongside stdio
  - Enable remote client connections
  - Support multiple concurrent clients
  - Authentication via API keys
- [ ] **Streaming Responses** - Progressive response delivery for long-running tools
  - `callChatStream()` method in adapter interface
  - Server-Sent Events for incremental tool output
- [ ] **Webhook Notifications** - Push events for long-running tasks
  - Configurable webhook endpoints
  - Task completion and error notifications

### Phase 4 - Intelligence & Context
- [ ] **Conversation Context Manager** - Session-scoped context across tool calls
  - Track tool call history within a session
  - Provide context to subsequent tool calls
  - Token-efficient context summarization
- [ ] **Semantic Memory** - Vector-based memory search using local embeddings
  - Replace keyword search with embedding similarity
  - Auto-categorization of stored memories
  - Cross-session context retrieval
- [ ] **Tool Pipelines** - Chain tools together declaratively
  - Define multi-step workflows (e.g., analyze file → summarize → store memory)
  - Conditional branching based on intermediate results
  - Reusable pipeline templates

### Phase 5 - Ecosystem & Integration
- [ ] **Plugin System** - Third-party tool registration
  - Dynamic tool loading from npm packages or local paths
  - Plugin manifest format and lifecycle hooks
  - Sandboxed execution environment
- [ ] **Multi-Provider Routing** - Route different tool types to different providers
  - Code tasks → local Ollama (privacy)
  - Creative tasks → cloud provider (quality)
  - Cost-aware routing based on token budgets
- [ ] **Dashboard** - Web UI for monitoring and configuration
  - Real-time queue metrics visualization
  - Tool usage analytics
  - Provider status and configuration

### Phase 6 - Enterprise & Scale
- [ ] **Multi-Tenant Support** - Isolated sessions with per-user configuration
- [ ] **Rate Limiting** - Per-client request quotas
- [ ] **Audit Logging** - Structured logs for compliance
- [ ] **Encryption** - At-rest encryption for memory store
- [ ] **RBAC** - Role-based access control for tools and resources

---

## Design Principles

1. **Token Economy First** - Every feature should reduce or optimize token usage
2. **Provider Agnostic** - Never couple application logic to a specific LLM provider
3. **Fail Silently** - Server must remain operational even when providers are down
4. **No stdout Pollution** - MCP uses stdio for JSON-RPC; all logging to stderr only
5. **DRY & SOLID** - Abstract shared behavior, single responsibility per class
6. **Backward Compatible** - New features must not break existing tool definitions

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `ollama` | Active provider: ollama, openai, anthropic, gemini |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `ANTHROPIC_API_KEY` | - | Anthropic API key |
| `GEMINI_API_KEY` | - | Google Gemini API key |
| `MAX_TOKENS` | `256` | Default max tokens per response |
| `TEMPERATURE` | `0.7` | Default temperature |
| `QUEUE_MAX_CONCURRENT` | `3` | Max concurrent LLM requests |
| `QUEUE_MAX_RETRIES` | `2` | Retry attempts on failure |
| `QUEUE_RETRY_DELAY_MS` | `1000` | Base retry delay (exponential backoff) |
| `QUEUE_DEDUP_TTL_MS` | `30000` | Deduplication window for identical requests |
| `DISABLE_CHAT_SUMMARY_RULE` | `false` | Disable chat summary prompt injection |

---

## Contributing

1. All tools must extend `BaseTool` and implement `getToolDefinition()` + `handle()`
2. All LLM calls must go through `LLMService` (never import adapters directly)
3. New services follow the pattern: class in `src/services/`, exported from `index.js`
4. Tests use Node.js native test runner (`node:test` + `node:assert`)
5. No stdout output - use stderr for logging, it breaks MCP protocol
