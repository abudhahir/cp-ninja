# API Design Helper Skill — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `skills/api-design-helper/SKILL.md` — an AI agent skill that interviews the user one question at a time to design a single REST API endpoint, then generates a combined Markdown document with a design spec, Spring Boot Java code headers (JavaDoc + SpringDoc), and an embedded OpenAPI 3.0 YAML spec.

**Architecture:** A single Markdown skill file following the cp-ninja `SKILL.md` format (YAML front-matter + content). The skill instructs the AI to run a 5-phase linear interview, then an optional adaptive follow-up phase, then generate output using a fixed template. No code changes to the extension are required — the skill is auto-discovered by cp-ninja from the `skills/` directory.

**Tech Stack:** Markdown (SKILL.md format), YAML front-matter, OpenAPI 3.0.3, SpringDoc OpenAPI annotations, JavaDoc

---

## Reference Files

Before starting, skim these for context:
- `skills/brainstorming/SKILL.md` — example of skill structure and tone
- `skills/test-driven-development/SKILL.md` — example of phase-based instructions
- `docs/plans/2026-03-11-api-design-helper-skill-design.md` — the approved design doc

---

### Task 1: Create skill directory and skeleton file

**Files:**
- Create: `skills/api-design-helper/SKILL.md`

**Step 1: Create the directory and skeleton file**

Create `skills/api-design-helper/SKILL.md` with this exact content:

```markdown
---
name: api-design-helper
description: "Use when designing a REST API endpoint. Guides you through a structured interview covering basics, request/response structure, validation, versioning, and caching — then generates a combined design spec with JavaDoc headers, SpringDoc annotations, and an embedded OpenAPI 3.0 YAML spec."
---

# API Design Helper

## Overview

[PLACEHOLDER — to be filled in Task 2]

## Phase 1 — Basics

[PLACEHOLDER — to be filled in Task 3]
```

**Step 2: Verify the file was created**

Run: `ls skills/api-design-helper/`
Expected: `SKILL.md`

**Step 3: Commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: scaffold api-design-helper skill directory"
```

---

### Task 2: Write the Overview / Announcement section

**Files:**
- Modify: `skills/api-design-helper/SKILL.md`

**Step 1: Replace the Overview placeholder with this content**

```markdown
## Overview

You are an API design assistant. When activated, announce yourself exactly as follows:

> "I'm the **API Design Helper**. I'll guide you through designing one REST API endpoint step by step.
> We'll cover: basics, request/response structure, validation rules, versioning, and caching.
> I ask **one question at a time**. At the end I'll generate a combined design document with
> a Markdown spec, Java code headers (JavaDoc + SpringDoc), and an embedded OpenAPI 3.0 YAML spec.
>
> **One endpoint per session.** Ready? Let's start with Phase 1."

Then immediately begin Phase 1.
```

**Step 2: Read the file to verify the section looks correct**

Open `skills/api-design-helper/SKILL.md` and confirm the Overview section renders cleanly.

**Step 3: Commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: add api-design-helper overview and announcement"
```

---

### Task 3: Write Phase 1 — Basics

**Files:**
- Modify: `skills/api-design-helper/SKILL.md`

**Step 1: Replace the Phase 1 placeholder with this content**

```markdown
## Phase 1 — Basics

Ask these questions **one at a time** in this order. Record each answer before asking the next.

**Q1.** What is the HTTP method for this endpoint?
- a) GET
- b) POST
- c) PUT
- d) PATCH
- e) DELETE

**Q2.** What is the endpoint path? (e.g., `/api/v1/users/{id}`)
*(Open-ended — ask for the full path including path variables in `{braces}`)*

**Q3.** In one or two sentences, what does this endpoint do?
*(Open-ended — capture the business purpose)*

**Q4.** What API version does this belong to?
- a) v1
- b) v2
- c) Other (ask for value)

**Q5.** What is the base URL / context path? (e.g., `/api`, `/api/v1`)
*(Open-ended — defaults to `/api/v1` if unsure)*

After all 5 answers are recorded, say: "Phase 1 complete. Moving to Phase 2 — Request Structure." Then proceed.
```

**Step 2: Verify the section is well-formed**

Re-read the file. Confirm the Q1–Q5 numbering is sequential and the phase transition line is present.

**Step 3: Commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: add api-design-helper phase 1 - basics"
```

---

### Task 4: Write Phase 2 — Request Structure

**Files:**
- Modify: `skills/api-design-helper/SKILL.md`

**Step 1: Add Phase 2 section after Phase 1**

```markdown
## Phase 2 — Request Structure

Ask these questions **one at a time**. Skip path params / query params if not applicable (record N/A).

**Q6.** Does this endpoint have **path parameters**? (e.g., `{id}`, `{userId}`)
- a) Yes — list each one: name, type (String/Long/UUID), and what it identifies
- b) No

*(If yes, ask for each param name, type, and description before moving on)*

**Q7.** Does this endpoint accept **query parameters**?
- a) Yes — list each one: name, type, required/optional, default value (if any)
- b) No

*(If yes, capture all query params before moving on)*

**Q8.** Does this endpoint have a **request body**?
- a) Yes (typical for POST, PUT, PATCH)
- b) No (typical for GET, DELETE)

*(If yes, ask Q9. If no, record N/A and move to Phase 3.)*

**Q9.** List the request body fields. For each field provide:
- Field name
- Data type (String, Integer, Long, Boolean, LocalDate, List<X>, etc.)
- Required or optional?
- Brief description

*(Ask the user to list fields one at a time or all at once — their choice)*

After all request structure info is recorded, say: "Phase 2 complete. Moving to Phase 3 — Response Structure." Then proceed.
```

**Step 2: Commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: add api-design-helper phase 2 - request structure"
```

---

### Task 5: Write Phase 3 — Response Structure

**Files:**
- Modify: `skills/api-design-helper/SKILL.md`

**Step 1: Add Phase 3 section after Phase 2**

```markdown
## Phase 3 — Response Structure

**Q10.** What is the **success HTTP status code**?
- a) 200 OK
- b) 201 Created
- c) 204 No Content
- d) Other (ask for value)

**Q11.** Does the success response have a **response body**?
- a) Yes — list the fields (name, type, description)
- b) No (e.g., 204 No Content)

*(If yes, capture all response body fields before moving on)*

**Q12.** What are the **error response codes** this endpoint can return?
*(Multiple choice — select all that apply)*
- 400 Bad Request (validation failure)
- 404 Not Found (resource not found)
- 409 Conflict (duplicate/state conflict)
- 422 Unprocessable Entity (business rule violation)
- 500 Internal Server Error
- Other (ask for value)

**Q13.** For each error code selected, what is the error message or reason?
*(Ask one error code at a time if multiple were selected)*

After all response info is recorded, say: "Phase 3 complete. Moving to Phase 4 — Validation Rules." Then proceed.
```

**Step 2: Commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: add api-design-helper phase 3 - response structure"
```

---

### Task 6: Write Phase 4 — Validation Rules

**Files:**
- Modify: `skills/api-design-helper/SKILL.md`

**Step 1: Add Phase 4 section after Phase 3**

```markdown
## Phase 4 — Validation Rules

**Q14.** For each request body field (from Phase 2), what validation constraints apply?

For each field, ask which constraints apply (multiple choice):
- `@NotNull` / `@NotBlank` — field is required, cannot be null/empty
- `@Size(min=X, max=Y)` — length constraints (String, Collection)
- `@Min(X)` / `@Max(Y)` — numeric range
- `@Pattern(regexp="...")` — regex constraint
- `@Email` — must be valid email format
- `@Positive` / `@PositiveOrZero` — numeric sign constraint
- `@Past` / `@Future` — date constraint
- None
- Other (ask for value)

*(Ask field by field if there are many. Skip if no request body.)*

**Q15.** Are there any **custom error messages** for validation failures, or use defaults?
- a) Use default messages (e.g., "must not be blank")
- b) Custom messages — specify per field

After all validation info is recorded, say: "Phase 4 complete. Moving to Phase 5 — Versioning & Caching." Then proceed.
```

**Step 2: Commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: add api-design-helper phase 4 - validation rules"
```

---

### Task 7: Write Phase 5 — Versioning & Caching

**Files:**
- Modify: `skills/api-design-helper/SKILL.md`

**Step 1: Add Phase 5 section after Phase 4**

```markdown
## Phase 5 — Versioning & Caching

**Q16.** How is API versioning handled?
- a) URL path versioning (e.g., `/api/v1/...`) — already captured in Phase 1
- b) Request header versioning (e.g., `X-API-Version: 1`)
- c) Accept header versioning (e.g., `Accept: application/vnd.myapi.v1+json`)
- d) No versioning strategy

**Q17.** Is this endpoint **idempotent**?
- a) Yes — safe to call multiple times with same result (GET, PUT, DELETE are typically idempotent)
- b) No — each call has side effects (POST typically is not idempotent)
- c) Not sure

**Q18.** Should responses from this endpoint be **cached**?
- a) Yes — specify Cache-Control hint (e.g., `max-age=60`, `public`, `private`, `no-cache`)
- b) No caching (`no-cache` / `no-store`)
- c) Not applicable

**Q19.** Any **rate limiting** or **throttling** notes to document?
- a) Yes — describe (e.g., "max 100 requests per minute per user")
- b) No

After all versioning & caching info is recorded, ask:

> "Is there anything else I should know about this endpoint before I generate the design document? (Any edge cases, special behaviors, or notes I should capture?)"

If the user provides additional information, ask follow-up questions as needed (Phase 6). If not, proceed directly to Phase 7.
```

**Step 2: Commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: add api-design-helper phase 5 - versioning and caching"
```

---

### Task 8: Write Phase 6 — Adaptive Follow-ups & Phase 7 — Generate Output

**Files:**
- Modify: `skills/api-design-helper/SKILL.md`

**Step 1: Add Phase 6 section after Phase 5**

```markdown
## Phase 6 — Adaptive Follow-ups (Optional)

If the user provided additional information or if you identified gaps during Phases 1–5, ask targeted follow-up questions here — one at a time.

Examples of adaptive questions:
- "You mentioned pagination — should I document `page`, `size`, and `sort` query parameters?"
- "You mentioned the response wraps data in a generic envelope — what does the wrapper look like?"
- "Is there a specific `@RequestMapping` base path on the controller class?"

Continue asking until the user says "that's all" or similar. Then proceed to Phase 7.
```

**Step 2: Add Phase 7 section after Phase 6**

```markdown
## Phase 7 — Generate Output

Once all phases are complete, say:

> "I have everything I need. Generating your API design document now..."

Then generate the combined Markdown document using **exactly** this template structure. Fill in every section with the answers collected during the interview. Do not skip any section — use "N/A" if not applicable.

---

### OUTPUT TEMPLATE

````markdown
# API Design: [HTTP_METHOD] [PATH]

> Generated by API Design Helper | OpenAPI 3.0.3 | Spring Boot / SpringDoc

---

## Overview

| Field        | Value                          |
|--------------|--------------------------------|
| Method       | [HTTP_METHOD]                  |
| Path         | [FULL_PATH]                    |
| Version      | [API_VERSION]                  |
| Base URL     | [BASE_URL]                     |
| Content-Type | application/json               |
| Idempotent   | [YES / NO / N/A]               |

**Purpose:** [ENDPOINT_DESCRIPTION]

---

## Request

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| [name] | [type] | Yes | [description] |

*(N/A if none)*

### Query Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| [name] | [type] | [Yes/No] | [value/none] | [description] |

*(N/A if none)*

### Request Body

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| [field] | [type] | [Yes/No] | [constraints] | [description] |

*(N/A if no request body)*

---

## Response

### Success Response — [STATUS_CODE] [STATUS_TEXT]

| Field | Type | Description |
|-------|------|-------------|
| [field] | [type] | [description] |

*(N/A if no response body)*

### Error Responses

| Status Code | Reason | Message |
|-------------|--------|---------|
| 400 | Bad Request | [message] |
| 404 | Not Found | [message] |
| [code] | [reason] | [message] |

---

## Validation Rules

| Field | Constraint | Message |
|-------|-----------|---------|
| [field] | [annotation] | [message] |

*(N/A if no request body)*

---

## Caching & Versioning Notes

- **Versioning strategy:** [URL_PATH / REQUEST_HEADER / ACCEPT_HEADER / NONE]
- **Cache-Control:** [value or "No caching"]
- **Rate limiting:** [description or "None documented"]
- **Additional notes:** [any edge cases or special behaviors from Phase 6]

---

## Java Code Headers

### JavaDoc Comment Block

```java
/**
 * [ENDPOINT_DESCRIPTION]
 *
 * <p>Endpoint: [HTTP_METHOD] [FULL_PATH]</p>
 * <p>API Version: [API_VERSION]</p>
 *
[PATH_PARAM_JAVADOC_LINES]
[QUERY_PARAM_JAVADOC_LINES]
[REQUEST_BODY_JAVADOC_LINE]
 * @return [RESPONSE_DESCRIPTION] ([STATUS_CODE] [STATUS_TEXT])
[EXCEPTION_JAVADOC_LINES]
 */
```

*Path param line format:* `* @param {name} {description}`
*Request body line format:* `* @param requestBody the {@link [BodyClassName]} containing the request data`
*Exception line format:* `* @throws ResponseStatusException [{STATUS_CODE}] if [reason]`

### SpringDoc Annotations

```java
@Operation(
    summary = "[SHORT_SUMMARY]",
    description = "[ENDPOINT_DESCRIPTION]"
)
@ApiResponses(value = {
    @ApiResponse(
        responseCode = "[SUCCESS_STATUS_CODE]",
        description = "[SUCCESS_DESCRIPTION]",
        content = @Content(mediaType = "application/json",
            schema = @Schema(implementation = [ResponseClassName].class))
    ),
[ERROR_RESPONSE_ANNOTATION_LINES]
})
[PARAMETER_ANNOTATION_LINES]
```

*Error response line format:*
```java
    @ApiResponse(responseCode = "[CODE]", description = "[REASON]: [MESSAGE]")
```

*Parameter annotation format (path/query params):*
```java
@Parameter(name = "[name]", description = "[description]", required = [true/false],
    in = ParameterIn.[PATH/QUERY])
```

---

## OpenAPI 3.0 Spec

```yaml
openapi: "3.0.3"
info:
  title: "[ENDPOINT_DESCRIPTION] API"
  version: "[API_VERSION]"

paths:
  [FULL_PATH]:
    [http_method_lowercase]:
      summary: "[SHORT_SUMMARY]"
      description: "[ENDPOINT_DESCRIPTION]"
      operationId: "[camelCase operation name]"
      [PARAMETERS_SECTION]
      [REQUEST_BODY_SECTION]
      responses:
        "[SUCCESS_STATUS_CODE]":
          description: "[SUCCESS_DESCRIPTION]"
          [SUCCESS_CONTENT_SECTION]
        [ERROR_RESPONSE_SECTIONS]

components:
  schemas:
    [REQUEST_BODY_SCHEMA_IF_APPLICABLE]
    [RESPONSE_SCHEMA_IF_APPLICABLE]
```

*YAML must be self-contained. No `$ref` to external files.*
````

---

After generating the document, say:

> "Your API design document is complete. You can copy the JavaDoc block and SpringDoc annotations directly above your `@RequestMapping` method in your Spring Boot `@RestController`. The OpenAPI YAML can be used standalone or imported into Swagger UI or Postman.
>
> To design another endpoint, start a new session with `/api-design-helper`."
```

**Step 3: Commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: add api-design-helper phase 6 adaptive follow-ups and phase 7 output generation"
```

---

### Task 9: Final review — walk through the skill as if you were the AI

**Files:**
- Read: `skills/api-design-helper/SKILL.md`

**Step 1: Read the complete file top to bottom**

Verify:
- [ ] YAML front-matter is present and valid (name + description)
- [ ] Overview section has the announcement text
- [ ] Phases 1–5 have sequential question numbers (Q1 through Q19)
- [ ] Each phase ends with a transition statement to the next phase
- [ ] Phase 5 ends with the adaptive follow-up trigger question
- [ ] Phase 6 describes adaptive behavior
- [ ] Phase 7 contains the full output template with all sections
- [ ] Output template includes: Overview table, Request (path/query/body), Response (success + errors), Validation Rules, Caching & Versioning Notes, JavaDoc block, SpringDoc annotations, OpenAPI 3.0 YAML
- [ ] Post-generation message tells user how to use the output and start a new session

**Step 2: Fix any issues found**

If any checklist item fails, fix it in the file.

**Step 3: Final commit**

```bash
git add skills/api-design-helper/SKILL.md
git commit -m "feat: complete api-design-helper skill - reviewed and validated"
```

---

## Success Criteria

1. `skills/api-design-helper/SKILL.md` exists with valid YAML front-matter
2. The skill announces itself and states the one-endpoint-per-session rule
3. Phases 1–5 cover all question areas with Q1–Q19 in sequential order
4. Phase transitions are explicit (AI knows when to move to next phase)
5. Phase 6 adaptive follow-ups are triggered by the "anything else?" question
6. Phase 7 output template contains all 8 sections: Overview, Request, Response, Validation, Caching/Versioning, JavaDoc, SpringDoc, OpenAPI YAML
7. The skill is self-contained — works as a cp-ninja slash command and as a standalone copy-paste agent instruction
