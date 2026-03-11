# API Design Helper Skill — Design Document

**Date:** 2026-03-11
**Status:** Approved

---

## Overview

A new cp-ninja skill (`skills/api-design-helper/SKILL.md`) that guides an AI coding agent through a structured interview to design a single REST API endpoint, then generates a combined Markdown document containing a design spec, copy-paste-ready Java code headers (JavaDoc + SpringDoc annotations), and an embedded OpenAPI 3.0 YAML spec.

**Primary use case:** GitHub Copilot in VS Code Chat via `@cp-ninja /api-design-helper`, or copied as a standalone custom agent instruction for any coding agent.

**Scope:** One API endpoint per session.

---

## Conversation Flow

The skill uses a **Linear Interview → Adaptive Follow-ups → Generate** structure:

```
Phase 1 — Basics
  Questions: HTTP method, endpoint path, purpose/description, API version

Phase 2 — Request Structure
  Questions: Path params, query params, request body fields (name, type, required/optional)

Phase 3 — Response Structure
  Questions: Success response body fields, HTTP status codes (success + all error cases)

Phase 4 — Validation Rules
  Questions: Field-level constraints (not-null, size, pattern, min/max), custom error messages

Phase 5 — Versioning & Caching
  Questions: URL-based vs header-based versioning, cache-control hints, idempotency

Phase 6 — Adaptive Follow-ups (optional)
  Trigger: AI asks "Is there anything else I should know before generating the document?"
  AI identifies remaining gaps/ambiguities and asks targeted questions

Phase 7 — Generate Output
  Produces one combined Markdown document using the output template
```

---

## Output Document Template

The generated Markdown file follows this fixed structure:

```
# API Design: [HTTP Method] [path]

## Overview
- Purpose, API version, base path, content type

## Endpoint Summary
| Field        | Value             |
|--------------|-------------------|
| Method       | GET/POST/PUT/...  |
| Path         | /api/v1/...       |
| Version      | v1                |
| Content-Type | application/json  |

## Request
### Path Parameters
(table: name, type, required, description)

### Query Parameters
(table: name, type, required, default, description)

### Request Body
(table: field, type, required, constraints, description)

## Response
### Success Response
(status code + table: field, type, description)

### Error Responses
(table: status code, reason, message)

## Validation Rules
(table: field, constraint, message)

## Caching & Versioning Notes
(free text based on Phase 5 answers)

## Java Code Headers

### JavaDoc Comment Block
```java
/**
 * [description]
 *
 * @param [param] [description]
 * @return [description]
 * @throws [exception] [when]
 */
```

### SpringDoc Annotations
```java
@Operation(summary = "...", description = "...")
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "..."),
    @ApiResponse(responseCode = "400", description = "..."),
    ...
})
@Parameter(name = "...", description = "...", required = true)
```

## OpenAPI 3.0 Spec
```yaml
openapi: "3.0.3"
info:
  title: ...
  version: v1
paths:
  /api/v1/...:
    [method]:
      summary: ...
      description: ...
      parameters: [...]
      requestBody: ...
      responses:
        "200": ...
        "400": ...
```
```

---

## Skill Behavior Rules

### Interview Rules
- Ask **one question at a time** — wait for the user's answer before proceeding
- Prefer **multiple-choice questions**; use open-ended only when necessary
- Never skip a phase — if user says "not applicable", record N/A and move on
- At the end of Phase 5, explicitly ask: *"Is there anything else I should know before I generate the document?"* to open the adaptive follow-up window

### Generation Rules
- Only generate the output document **after all phases are complete** — no partial output mid-interview
- Follow the output template structure exactly
- JavaDoc block and SpringDoc annotations must be **consistent with each other** and with the OpenAPI YAML
- OpenAPI YAML must be **self-contained** (no `$ref` to external files) for easy copy-paste use

### Scope Rules
- **One endpoint per session** — if the user mentions a second endpoint, remind them to start a new session with `/api-design-helper`
- Announce at start: what the skill does, the phases to expect, and the one-endpoint-per-session rule

---

## Out of Scope

- Security / authentication / authorization (handled separately in the target project)
- OpenAPI 3.1.x (target is 3.0.x for broad tooling compatibility)
- Multiple endpoints in one session
- External `$ref` in OpenAPI YAML

---

## Files to Create

| File | Purpose |
|------|---------|
| `skills/api-design-helper/SKILL.md` | The skill itself — full instructions for the AI agent |

---

## Success Criteria

1. The skill asks questions one at a time through all 5 phases
2. Adaptive follow-up phase triggers naturally after Phase 5
3. Generated Markdown contains all template sections, fully populated
4. JavaDoc block and SpringDoc annotations are internally consistent
5. OpenAPI 3.0 YAML is valid and self-contained
6. Works as a cp-ninja slash command and as a standalone copy-paste agent instruction
