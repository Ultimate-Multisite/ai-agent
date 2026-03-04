# AI Agent Master Plan: The Ultimate WordPress AI Admin & Chat Interface

> **Goal**: Transform the AI Agent for wordpress from a basic chat widget into the most powerful admin AI interface available — surpassing standalone desktop tools (Claude Code, Codex, OpenCode) by leveraging deep WordPress integration, and surpassing cloud chat interfaces (OpenWebUI, ChatGPT, Claude.ai) by providing agentic capabilities that actually *do* things on the server.

---

## Current State Assessment

### What We Have Today

| Component                       | Status | Description                                                         |
|---------------------------------|--------|---------------------------------------------------------------------|
| Chat Widget                     | Basic | Floating bubble + fullpage mode, markdown rendering, session key    |
| WP abilities tool use Execution | Working | Server-side agentic loop (3 rounds), text-parsed command extraction |
| System Prompt                   | Working | Customizable via settings, ability toggles                          |
| Setup Wizard                    | Working | guided setup                                                        |
| Many AI providers               | Working | Uses core code for WP 7.0                                           |

### Critical Gaps vs Competition

**The current agent is a thin chat wrapper around OpenClaw.** Nearly all intelligence, tool calling, memory, and orchestration lives in OpenClaw. The WordPress side is passive — it sends messages and displays responses. This means:

2. **No knowledge/RAG system** — can't search docs, posts, or uploaded files
5. **No collaboration** — single-user, no shared conversations or team features
6. **No rich artifacts** — can't render previews, charts, forms, or interactive content
7. **No task/project management** — no way to track multi-step work
8. **No undo/safety system** — destructive commands have no rollback
9. **No file/media management** — can't upload, browse, or analyze files
10. **No voice interface** — text only

---

## Strategic Vision

### The Unfair Advantage

Every competitor (OpenWebUI, Claude Code, Codex, OpenCode) operates *outside* the application. They can edit files and run commands, but they don't have:

- **Live database access** to customers, memberships, payments, sites
- **WordPress hook system** to trigger actions and react to events
- **Admin context** — knowing which page the user is on, what they're looking at
- **Multisite awareness** — understanding the network topology, site relationships
- **Domain expertise** — billing cycles, checkout flows, DNS, limitations
- **Server-side execution** — running directly on the hosting environment
- **User's business context** — their products, pricing, customer base

**The play: Build the AI interface that knows your business, not just your code.**

---

## Phase 1: Foundation (Core Chat Platform)

**Priority: HIGH — These are table-stakes features every competitor has.**

### 1.1 Conversation Persistence & History

**Features:**
- [ ] Conversation list in sidebar (searchable, sortable by date/name)
- [ ] Folder organization with drag-and-drop
- [ ] Pin/archive conversations
- [ ] Rename conversations (auto-title from first message)
- [ ] Delete conversations (soft delete → trash → permanent)
- [ ] Export conversations (JSON, Markdown, PDF)
- [ ] Import conversations (JSON, OpenWebUI format)
- [ ] Conversation search (full-text across all messages)

**Gap closed:** OpenWebUI has full history; Claude Code has session resume; we have nothing.

### 1.2 LLM Provider Integration


**Features:**
- [x] Provider settings page with API key management (encrypted storage)
- [x] Model selector dropdown in chat (switch mid-conversation)
- [ ] Per-model configuration (temperature, max_tokens, system prompt)
- <strike>Streaming responses via Server-Sent Events (SSE)</strike> not possible with wp core code. We will wait for WP 7.1 or 7.2
- [ ] Token counting and cost tracking per message
- [ ] Usage dashboard (tokens, cost, by model, by user, by day)
- [ ] Automatic fallback chains (if primary model fails, try backup)
- [ ] Rate limit handling with exponential backoff


### 1.3 Modern Chat Interface

Replace the basic widget with a professional chat application.

**Full-page chat app** (React, using @wordpress/element):
- [ ] Split layout: conversation sidebar + chat area + optional context panel
- [ ] Message rendering: full Markdown, syntax-highlighted code blocks, LaTeX, Mermaid diagrams
- [ ] Message actions: copy, edit, regenerate, branch, bookmark
- [ ] Edit a previous message → creates a branch (preserves original thread)
- [ ] Regenerate with different model
- [ ] Streaming responses with typing indicator and token counter
- [ ] Stop generation button
- [ ] Multi-line input with Shift+Enter, auto-resize
- [ ] File/image attachment via drag-and-drop or button
- [ ] `@` mentions for files, pages, users, sites
- [ ] `/` slash commands (similar to Slack)
- [ ] Command palette (Cmd+K) for quick actions
- [ ] Keyboard shortcuts throughout
- [ ] Dark mode / light mode (respect WP admin preference)
- [ ] Responsive design (works on tablets)
- [ ] Floating widget mode (current) as an option alongside fullpage

**Slash commands:**
- `/new` — new conversation
- `/model <name>` — switch model
- `/clear` — clear context
- `/export` — export conversation
- `/site <domain>` — set site context
- `/customer <email>` — load customer context
- `/wp <command>` — execute WP-CLI
- `/search <query>` — search knowledge base
- `/help` — show available commands

**Gap closed:** OpenWebUI has branching, regeneration, multi-model; Claude.ai has artifacts; we have basic markdown only.

### 1.4 Native Tool Calling (Function Calling)

Replace text-parsing with proper structured tool calling.

**Architecture:**
- Mosty done vi WP abilities
- Configurable max iterations (default 10, max 25)
- Per-tool permission levels: auto-execute, confirm-first, admin-only, disabled


**Built-in tool categories:**

More research needed to find gaps in tools. Many plugins exist that offer many generic abilities.
we should decide if we can use these for our goals or if we need to create our own separate plugin to
provide more abilities:

The needs are:

WordPress Management:

Server & System:
- [ ] `server_info` — PHP version, MySQL version, disk space, memory
- [ ] `error_log` — Read and search PHP error logs
- [ ] `database_query` — Execute read-only SQL queries (with safety checks)
- [ ] `file_read` — Read files from the WordPress installation
- [ ] `file_write` — Write/edit files (with diff preview and confirmation)
- [ ] `file_search` — Search files by name or content (grep)
- [ ] `cron_system` — View system cron jobs
- [ ] `dns_lookup` — DNS record lookups for domains
- [ ] `ssl_check` — SSL certificate status and expiry
- [ ] `http_request` — Make HTTP requests (for API testing)

Intelligence:
- [ ] `web_search` — Search the web (via SearXNG, Brave, or Google)
- [ ] `web_fetch` — Fetch and parse a URL
- [ ] `knowledge_search` — Search the knowledge base (Phase 2)
- [ ] `calculate` — Math calculations
- [ ] `code_execute` — Execute PHP/JS in a sandbox

**Safety system:**
- Tools categorized: read-only, write, destructive
- Read-only tools auto-execute
- Write tools show a confirmation dialog with preview
- Destructive tools require explicit "I understand" confirmation
- All tool executions logged to activity log
- Undo system for reversible actions (Phase 3)

**Gap closed:** Claude Code has 15+ built-in tools with native function calling; OpenCode has 13+; we parse text for WP-CLI commands.

---

## Phase 2: Intelligence Layer (Knowledge & Context)

**Priority: HIGH — This is what makes it smarter than generic chat interfaces.**

### 2.1 Knowledge Base & RAG

Give the AI deep knowledge of the user's WordPress installation.

**Automatic knowledge sources** (indexed continuously):
- [ ] All posts/pages content (title, content, meta, taxonomies)
- [ ] Plugin/theme documentation (readme files)
- [ ] WordPress Codex / Developer docs (shipped or fetched)
- [ ] WP Ultimo documentation
- [ ] Site error logs (recent entries)
- [ ] WP options (configuration)
- [ ] User-uploaded documents (PDF, TXT, MD, DOCX)
- [ ] Previous AI conversations (searchable)

**Architecture:**
- Vector embeddings stored in a custom `wu_ai_embeddings` table
- Embedding providers: OpenAI text-embedding-3-small, local (via Ollama), Voyage AI
- Chunking strategy: recursive text splitting (512 tokens, 50 token overlap)
- Hybrid search: BM25 keyword + cosine similarity vector search
- Re-ranking with cross-encoder or LLM-based scoring
- Citation system: responses include source references with links

**Knowledge management UI:**
- [ ] Knowledge page: list all indexed sources with status
- [ ] Upload documents (drag-and-drop)
- [ ] Add URLs for web content ingestion
- [ ] Organize into collections (e.g., "Hosting Docs", "Client Policies")
- [ ] Per-collection access control
- [ ] Re-index button and schedule
- [ ] Embedding cost estimation before indexing

**In-chat usage:**
- [ ] `#collection-name` to scope RAG to specific knowledge
- [ ] Automatic context injection when questions match indexed content
- [ ] Source citations with clickable links
- [ ] "Based on your documentation..." attribution

**Gap closed:** OpenWebUI has full RAG with 9 vector DBs; we have zero knowledge/document support.

### 2.2 WordPress Context Awareness

The AI should know what the user is looking at and working on.

**Page context injection:**
- [ ] Detect current admin page and inject relevant context
- [ ] On a customer edit page → auto-load customer data, memberships, payments
- [ ] On a site edit page → auto-load site info, domain, template, limitations
- [ ] On the dashboard → inject network stats, recent activity
- [ ] On plugin pages → inject plugin info, known issues
- [ ] Context passed as structured data in the system prompt

**Implementation:**
- Widget JS sends `window.location` and page-specific data with each message
- PHP middleware enriches the request with relevant model data
- System prompt dynamically assembled based on context
- `wu_ai_context_providers` filter for addons to inject their own context

**Contextual suggestions:**
- [ ] When viewing a customer with failed payments → suggest recovery actions
- [ ] When viewing a site with errors → suggest diagnostic steps
- [ ] When on checkout settings → suggest optimization tips
- [ ] Proactive alerts: "3 memberships expired today, want me to send recovery emails?"

**Gap closed:** No competitor has this — Claude Code knows your codebase, but not your live application state. This is our unique advantage.

### 2.3 Persistent Memory

Remember user preferences, past decisions, and learned patterns.

**Memory types:**
- [ ] **User preferences** — "Always use table format for reports", "I prefer Starter plan for new clients"
- [ ] **Learned facts** — "The site uses Starter, Pro, and Enterprise plans", "Staging sites are on subdomain staging.*"
- [ ] **Procedures** — "When creating a new client: 1) Create customer 2) Create membership 3) Create site from Template A"
- [ ] **Corrections** — "Last time I said X but user corrected to Y"

**Storage:** `wu_ai_memories` table with vector embeddings for semantic search

**Features:**
- [ ] Automatic memory extraction from conversations (LLM-based)
- [ ] Manual memory management page (view, edit, delete)
- [ ] Memory search before each response (inject relevant memories)
- [ ] Per-user memory isolation
- [ ] Memory decay (reduce relevance of old, unused memories)
- [ ] `/remember <fact>` slash command for explicit storage
- [ ] `/forget <topic>` to remove memories

**Gap closed:** OpenWebUI has experimental adaptive memory; Claude Code has auto-memory files; we have nothing.

---

## Phase 3: Power Features (Surpassing Desktop Tools)

**Priority: MEDIUM — These differentiate us from both chat interfaces AND coding tools.**

### 3.1 Task & Project Management

Multi-step operations with progress tracking.

**Features:**
- [ ] AI can break complex requests into task lists
- [ ] Tasks displayed in a sidebar panel with status (pending/in-progress/done/failed)
- [ ] Each task can involve multiple tool calls
- [ ] Progress persistence across sessions
- [ ] Resume interrupted tasks
- [ ] Task templates for common workflows (e.g., "Onboard new customer", "Migrate site")
- [ ] Scheduled tasks (run at specific time via WP-Cron)
- [ ] Recurring tasks (daily report, weekly cleanup)

**Example workflow — "Onboard customer ACME Corp":**
1. Create customer record ✓
2. Create Pro membership ✓
3. Provision site from template ✓
4. Map custom domain → waiting for DNS
5. Send welcome email ✓
6. Schedule 30-day check-in → scheduled

**Gap closed:** Claude Code has TodoWrite/TaskCreate; OpenWebUI has nothing; no tool has WordPress-specific workflow automation.

### 3.2 Artifacts & Rich Output

Render interactive content directly in the chat.

**Artifact types:**
- [ ] **Data tables** — sortable, filterable tables from query results
- [ ] **Charts** — revenue charts, growth graphs, usage metrics (Chart.js)
- [ ] **Site previews** — iframe preview of managed sites
- [ ] **Diff views** — side-by-side file change previews
- [ ] **Forms** — AI-generated forms for data collection (rendered inline)
- [ ] **Code blocks** — syntax highlighted with copy/run buttons
- [ ] **Dashboards** — mini-dashboards with key metrics
- [ ] **Action cards** — confirmable action previews (like a PR review)
- [ ] **Image galleries** — for media management results
- [ ] **Terminal output** — styled command output display

**Implementation:**
- Artifact components rendered as React components in the chat
- AI returns structured artifact data alongside text
- Artifacts can be interactive (click to drill down, edit, confirm)
- Export artifacts as images, CSV, or embed in WordPress pages

**Gap closed:** Claude.ai has artifacts; OpenWebUI has interactive artifacts; we render plain text only.

### 3.3 Undo/Redo & Safety Net

Every action should be reversible.

**Architecture:**
- [ ] Before any write operation, snapshot the affected state
- [ ] `wu_ai_snapshots` table: id, conversation_id, message_id, entity_type, entity_id, before_state (JSON), after_state (JSON), reverted, created_at
- [ ] "Undo" button on each tool result that modified data
- [ ] Bulk undo: revert all changes from a conversation
- [ ] Time-travel: "Show me what the customer record looked like before I changed it"

**Safety features:**
- [ ] Dry-run mode: AI explains what it *would* do without executing
- [ ] Confirmation previews for all write operations
- [ ] Destructive action warnings with required acknowledgment
- [ ] Rate limiting: max N write operations per minute
- [ ] Audit trail: complete log of all AI-initiated changes
- [ ] Admin can restrict AI capabilities per user role

**Gap closed:** Claude Code has /rewind for code; OpenCode has git-based undo; we have no safety net.

### 3.4 Multi-Model Comparison

Compare responses from different models side-by-side.

**Features:**
- [ ] "Compare" mode: send the same prompt to 2-4 models simultaneously
- [ ] Side-by-side response display
- [ ] Vote for preferred response (feeds into model selection learning)
- [ ] A/B testing for prompt optimization
- [ ] Per-task model recommendations (e.g., use cheap model for summaries, expensive for analysis)
- [ ] Model performance tracking (speed, quality, cost per task type)

**Gap closed:** OpenWebUI has Arena mode with ELO ratings; we have single-model only.

### 3.5 Automation & Scheduled Intelligence

AI that works while you sleep.

**Scheduled reports:**
- [ ] Daily network health summary (email or dashboard)
- [ ] Weekly revenue report with trend analysis
- [ ] Monthly customer churn analysis with recommendations
- [ ] Custom report schedules

**Event-driven AI actions:**
- [ ] New customer signup → AI enrichment (company lookup, classification)
- [ ] Payment failed → AI drafts recovery email
- [ ] Site down → AI runs diagnostics, alerts admin
- [ ] Membership expiring → AI suggests retention offer
- [ ] Support ticket (if integrated) → AI drafts response

**Implementation:**
- WP-Cron scheduled tasks that invoke the AI
- WordPress hooks (actions/filters) that trigger AI analysis
- Results stored as AI conversations viewable later
- Configurable triggers and response templates

**Gap closed:** No competitor has this. OpenClaw has cron but it's generic. This is deeply WordPress-specific.

---

## Phase 4: Collaboration & Multi-User (Enterprise)

**Priority: MEDIUM — Important for teams managing large multisite networks.**

### 4.1 Team Conversations & Shared Context

**Features:**
- [ ] Shared conversation threads (multiple admins can participate)
- [ ] `@username` to tag team members in AI conversations
- [ ] Conversation hand-off: "I started this, can you finish it?"
- [ ] Team knowledge base (shared across all admins)
- [ ] Personal knowledge base (per-admin)
- [ ] Conversation templates: pre-built prompts for common tasks
- [ ] Role-based AI permissions: super admin gets full access, shop manager gets limited tools

### 4.2 Channels (Async Collaboration)

Inspired by OpenWebUI Channels and Slack.

**Features:**
- [ ] Persistent topic channels (#billing-issues, #site-migrations, #general)
- [ ] AI participates in channels when @mentioned
- [ ] Channel history searchable
- [ ] Pin important AI responses for team reference
- [ ] Integrate with external tools (Slack notifications, email digests)

### 4.3 Audit & Compliance

**Features:**
- [ ] Complete audit log of all AI interactions (who asked what, what was done)
- [ ] Export audit logs for compliance
- [ ] Data retention policies (auto-delete after N days)
- [ ] PII detection and redaction in logs
- [ ] Admin dashboard showing AI usage across the team
- [ ] Cost allocation per user/department

---

## Phase 5: Advanced Intelligence (Market Leadership)

**Priority: LOWER — These push us ahead of every competitor.**

### 5.1 Voice Interface

**Features:**
- [ ] Push-to-talk button in chat widget
- [ ] Speech-to-text via Whisper API or browser Web Speech API
- [ ] Text-to-speech for AI responses (optional)
- [ ] Voice commands for common actions ("Create a new site called Demo Store")
- [ ] Hands-free mode for accessibility

### 5.2 Visual Intelligence

**Features:**
- [ ] Screenshot analysis: paste a screenshot, AI identifies issues
- [ ] Site visual comparison: compare current vs previous version
- [ ] Design suggestions: analyze a site and suggest improvements
- [ ] QA testing: AI visually inspects sites for broken layouts
- [ ] Brand consistency checking across network sites

### 5.3 Custom Agent Builder

Let admins create specialized AI agents without code.

**Features:**
- [ ] Agent builder UI: name, avatar, system prompt, allowed tools, model
- [ ] Pre-built agent templates: "Support Agent", "Sales Agent", "DevOps Agent"
- [ ] Per-agent knowledge bases (support agent knows the docs, sales agent knows pricing)
- [ ] Agent routing: different agents for different tasks
- [ ] Agent marketplace: share agents with other WP Ultimo users

### 5.4 Integration Hub

Connect the AI to the broader WordPress ecosystem.

**Native integrations:**
- [ ] WooCommerce — order management, product creation, inventory
- [ ] Gravity Forms / WPForms — form data analysis, submission handling
- [ ] MainWP — multi-site management from central dashboard
- [ ] Mailster — email campaign creation and analysis
- [ ] Google Analytics — traffic analysis and recommendations
- [ ] Google Search Console — SEO insights
- [ ] Cloudflare — DNS and performance management
- [ ] cPanel/Plesk — server management
- [ ] Slack/Discord — notification forwarding and AI in channels

**MCP ecosystem:**
- [ ] Expose integration hub tools as MCP server
- [ ] Consume external MCP servers (GitHub, Sentry, etc.)
- [ ] MCP marketplace within WordPress admin

### 5.5 AI Site Builder v2 Integration

Connect the existing AI Site Builder addon to the chat interface.

- [ ] "Build me a site for a pizza restaurant" → triggers full AI Site Builder pipeline
- [ ] Real-time progress in chat as site generates
- [ ] Iteration selection via chat interface (show previews as artifacts)
- [ ] Post-build refinement: "Change the hero image" → AI modifies the site
- [ ] Template creation: "Save this site as a template"

---

## Phase 6: Developer Platform (Ecosystem)

**Priority: LOWER — Turns the AI Agent into a platform others build on.**

### 6.1 Tool SDK

Make it easy for developers to add custom tools.

```php
// Example: Custom tool registration
add_action('wu_ai_register_tools', function($registry) {
    $registry->register(new class extends \WP_Ultimo\AI\Tool {
        public string $name = 'check_site_speed';
        public string $description = 'Run a speed test on a site';

        public function schema(): array {
            return [
                'url' => ['type' => 'string', 'description' => 'Site URL to test'],
            ];
        }

        public function execute(array $params): array {
            // Run speed test...
            return ['lcp' => '1.2s', 'fcp' => '0.8s', 'score' => 92];
        }
    });
});
```

### 6.2 Prompt Library & Marketplace

- [ ] Curated prompt templates for WordPress tasks
- [ ] Community prompt sharing
- [ ] Prompt versioning and A/B testing
- [ ] Variable substitution in prompts ({site_name}, {customer_email}, etc.)

### 6.3 Webhook API

- [ ] Trigger AI conversations via webhook
- [ ] External systems can ask the AI questions and get structured responses
- [ ] Zapier/Make integration for workflow automation
- [ ] REST API for programmatic AI access

### 6.4 White-Label Support

- [ ] Custom branding (logo, name, colors)
- [ ] Remove WP Ultimo branding
- [ ] Custom welcome messages and onboarding
- [ ] Resellable as a feature of managed WordPress hosting

---

## Technical Architecture

### Key Differentiators (What ONLY We Can Do)

1. **Zero-install AI admin** — It's a WordPress plugin. Activate and go. No Docker, no npm, no CLI.
2. **Live business context** — AI knows your customers, revenue, sites, memberships, payments in real-time.
3. **WordPress-native tools** — Not generic file editing; actual WordPress operations (create sites, manage plugins, configure checkout).
4. **Admin page awareness** — AI adapts to what you're doing right now in wp-admin.
5. **Multisite orchestration** — Manage hundreds of sites through natural language.
6. **Built-in billing integration** — AI can create/modify memberships, process refunds, generate invoices.
7. **Event-driven intelligence** — AI reacts to WordPress hooks (payment failed, site created, membership expiring).
8. **No API key required** (via rlaude) — Use your existing Claude subscription.
9. **Existing MCP ecosystem** — 50 tools already built and working.

---

## Success Metrics

| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|---------------------|
| Daily active users | 500 | 5,000 |
| Avg conversations/user/day | 3 | 8 |
| Tool calls/day (network-wide) | 5,000 | 100,000 |
| Knowledge docs indexed | 10/network avg | 100/network avg |
| NPS score | 40 | 60 |
| Time saved per admin (self-reported) | 2 hrs/week | 5 hrs/week |
| Churn reduction (for WP Ultimo) | 5% | 15% |

---

## Open Questions

1. **Pricing model** — Include in WP Ultimo core, or separate addon with its own pricing? The AI Site Builder already has a credit system — should this share it?
2. **Embedding storage** — Custom table with BLOB, or integrate with a vector DB (pgvector, ChromaDB)? Most WP hosts won't have vector DBs, so custom table with cosine similarity in PHP is likely the pragmatic choice.
3. **OpenClaw relationship** — Continue supporting OpenClaw as the primary mode, or position Direct Mode as the default and OpenClaw as the power-user option?
4. **Minimum PHP requirements** — Vector operations and streaming SSE work better with PHP 8.1+. Current minimum is 7.4. Should the AI Agent addon require 8.1+?
5. **React framework** — Use @wordpress/element (React 18 subset) or ship a standalone React app? The former is lighter but limited; the latter is more capable but heavier.
