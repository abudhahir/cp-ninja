---
name: technical-analyzer
description: Analyzes a given topic or use case within the existing codebase to produce a detailed technical implementation plan. It may leverage other skills for brainstorming, planning, and review to ensure a comprehensive analysis.
---

# Technical Analyzer Skill

## Role
A specialist that analyzes a use case or requirement to produce a comprehensive technical plan for implementation, grounded in the existing codebase.

## Core Process
This skill guides the agent through a structured analysis process. The agent may use other skills to complete these steps.

1.  **Scope & Requirement Definition**: 
    - **Action**: Initiate a dialogue to clarify the use case, functional requirements, non-functional requirements (performance, security), and constraints.
    - **Suggested Skill**: `brainstorming`

2.  **Codebase Exploration & Analysis**:
    - **Action**: Thoroughly examine the current codebase to identify relevant modules, existing patterns, potential integration points, and areas of impact.
    - **Tools**: Use static analysis tools, search, and read relevant files.

3.  **Solution Design & Prototyping**:
    - **Action**: Propose one or more high-level implementation strategies. Outline the architecture, data models, and key components for each. Discuss pros, cons, and potential risks.
    - **Suggested Skill**: `software-architect`

4.  **Implementation Planning**:
    - **Action**: Develop a detailed, step-by-step plan for the chosen solution.
    - **Suggested Skill**: `writing-plans`

5.  **Task Breakdown & Effort Estimation**:
    - **Action**: Decompose the implementation plan into granular tasks. Provide a rough order of magnitude effort estimate for each task (e.g., using T-shirt sizes: S, M, L).

6.  **Review and Refinement**:
    - **Action**: Present the draft analysis document for feedback.
    - **Suggested Skill**: `requesting-code-review` (applying the concept to the plan)

7.  **Final Document Compilation**:
    - **Action**: Assemble all the information into the final Technical Analysis Document.

## Deliverable: Technical Analysis Document

The primary output is a markdown document with the following structure:

### 1. Executive Summary
   - A brief overview of the problem and the proposed solution.

### 2. Background & Requirements
   - Detailed description of the use case, goals, and constraints.

### 3. Codebase Impact Analysis
   - Summary of findings from the codebase exploration.
   - List of files/modules to be modified, created, or deprecated.
   - Potential risks and dependencies.

### 4. Proposed Solution
   - Detailed description of the recommended architecture and design.
   - Diagrams (e.g., using Mermaid.js) illustrating the new components and flows.
   - Justification for technology and pattern choices.

### 5. Detailed Implementation Plan
   - A step-by-step guide for implementation, generated from the `writing-plans` skill.

### 6. Task Breakdown & Effort Estimates
   | Task Description | Effort (S/M/L) | Depends On |
   | ---------------- |:--------------:|:----------:|
   | E.g., Create new API endpoint... | M              | Task X     |
   | E.g., Update database schema... | S              | -          |
   | E.g., Build frontend component... | L              | Task Y     |

### 7. Open Questions & Next Steps
   - Any remaining questions or areas needing further investigation.
   - Immediate next steps to begin the work.
