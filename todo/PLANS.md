# Gratis AI Agent - Plans & Strategy

## Positioning

**"The AI that doesn't just build your site -- it runs it."**

Every competitor generates a site and then you're on your own. We build AND manage. The agent
lives inside WordPress with access to the database, hooks, cron, plugins, and business context
that no external AI tool can match.

### What we have that nobody else does

- **True agentic architecture** -- autonomous multi-step tool calling via WordPress 6.9 Abilities API
- **Provider independence (BYOK)** -- users bring their own API key, pay direct, no markup
- **Extensible via Abilities API** -- any plugin can register abilities the agent discovers automatically
- **Event-driven + scheduled automations** -- 20+ WordPress/WooCommerce triggers, cron-based tasks
- **Knowledge base / RAG** -- document indexing, PDF upload, auto-index on publish
- **Persistent memory** -- cross-session memory with categories, auto-memory mode
- **Admin context awareness** -- agent knows which page you're on and adapts
- **No vendor lock-in** -- standard WordPress plugin, works on any host, any theme, any builder

### Where competitors beat us (gaps to close)

| Gap | Who does it | Priority | TODO refs |
|-----|-------------|----------|-----------|
| AI site generation from prompt | 10Web, GoDaddy, ZipWP, Divi | P0 | t060-t062 |
| Streaming responses | Everyone | P0 | t054 |
| Smart onboarding for existing sites | 10Web (site scan) | P0 | t063-t065 |
| Frontend widget for logged-in admins | N/A (our own gap) | P0 | t066 |
| AI image generation | 10Web, Divi (unlimited) | P1 | t068-t069 |
| WooCommerce deep integration | 10Web, GoDaddy | P1 | t070-t071 |
| Rich artifacts in chat | Claude.ai, OpenWebUI | P1 | t072-t074 |
| White-label / resale API | 10Web, ZipWP | P2 | t075-t076 |
| Multi-user collaboration | 10Web (agency workspaces) | P2 | t077-t079 |

## Current Focus

P0 tasks: onboarding flows (t060-t065), frontend widget (t066), streaming (t054). These are the
features that determine whether a user stays past the first 5 minutes.

## Competitive Landscape (March 2026)

### AI Site Generation Platforms (hosted)

**10Web** -- Hosted WordPress + AI builder. Full site from 1 prompt in <60s. Elementor-based
editor. $10-23/mo with hosting. 2M+ sites generated. 4.5/5 Trustpilot (2,300 reviews). Strengths:
speed, support, all-in-one. Weaknesses: AI struggles with complex prompts, billing complaints,
medium lock-in. White-label API for B2B.

**GoDaddy Airo** -- Proprietary builder (NOT WordPress). Site in <30s. $11-24/mo. 20M+ customers,
$4.6B revenue. Strengths: fastest setup, cheapest, marketing suite (email, social, SEO). Weaknesses:
generic designs, no plugins/apps, full vendor lock-in, no export. Not a direct competitor since
it's not WordPress, but sets user expectations for AI site building speed.

**ZipWP** -- WordPress-native AI builder by Brainstorm Force (Astra). Full site from prompt in
<60s. $0-33/mo. Real WordPress install, fully portable. Strengths: no lock-in, agency features,
Chrome extension for profile-to-site. Weaknesses: Astra/Spectra only, free plan sites expire in
24h. Closest competitor to our approach.

### AI-Enhanced Page Builders (plugins)

**Divi AI** -- AI built into Divi visual builder. Unlimited text/image/code generation at flat
$16-23/mo. Full site generation via Quick Sites. Fine-tuned on Divi codebase. Strengths: unlimited
usage, deep builder integration. Weaknesses: Divi-only, proprietary shortcode format.

**Elementor AI + Angie** -- AI in Elementor editor (credit-based) plus Angie (free agentic plugin).
Angie creates widgets, CPTs, admin snippets -- closest to our agentic approach. 21M+ sites.
Strengths: massive market share, Angie is truly agentic. Weaknesses: credit-based pricing, complex
tiers, Angie is new.

### AI Code Assistants

**CodeWP/Telex** -- AI code generation for WordPress, acquired by Automattic. In transition/rebrand.
WordPress-specific training data. Wildcard -- Automattic has deep WP knowledge and resources.

## Model Strategy

Default: GPT-4.1-nano ($0.10/1M input). Premium: GPT-4.1-mini ($0.40/1M input). Both native
OpenAI format, 1M context. Session cost ~$0.007 on nano. See ROADMAP.md for full analysis.

## Success Metrics

| Metric | 3-Month | 6-Month | 12-Month |
|--------|---------|---------|----------|
| WordPress.org active installs | 500 | 2,000 | 10,000 |
| Sites generated via AI builder | 200 | 2,000 | 15,000 |
| Daily active users | 100 | 500 | 3,000 |
| Avg sessions/user/day | 2 | 3 | 5 |
| Time to first value (install to useful output) | < 5 min | < 3 min | < 2 min |
| AI site generation success rate | > 75% | > 85% | > 90% |
| User retention (30-day) | 35% | 50% | 65% |
| NPS score | 30 | 45 | 60 |
| White-label partners | 0 | 3 | 10 |

## Key Workflows We Must Support

Ranked by user frequency and competitive necessity:

1. **"Build me a website for X"** -- full site generation from prompt (P0, t060-t062)
2. **"Write content about X"** -- blog post / page content generation (have ContentAbilities, need orchestration)
3. **Chat with streaming responses** -- real-time token streaming (P0, t054)
4. **"What's wrong with my site?"** -- site health analysis + auto-fix (P2, t080-t081)
5. **"Create a product for X"** -- WooCommerce product creation (P1, t070)
6. **"Fix my SEO"** -- SEO audit + auto-fix (have SeoAbilities)
7. **"Update all my plugins"** -- already works via WordPressAbilities
8. **"Show me my stats"** -- rich charts/dashboards (P1, t072-t073)
9. **"Set up email marketing"** -- integration hub (P3, t085-t088)
10. **"Answer customer questions"** -- frontend chatbot with RAG (P2, needs frontend widget t066 first)
