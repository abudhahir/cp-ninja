# Skills vs Agents

Understanding the difference between **skills** and **agents** is fundamental to using CP-Ninja effectively.

## Skills

Skills are **structured methodologies** or **workflows** stored as markdown files that guide behavior and best practices:

- **What they are**: Step-by-step processes, templates, and guidelines (stored in `SKILL.md` files)
- **Purpose**: Define **HOW** to approach tasks systematically  
- **Examples**: 
  - `systematic-debugging`: A methodology for debugging
  - `test-driven-development`: TDD workflow
  - `writing-plans`: How to structure project plans
- **Usage**: Activated via `@cp-ninja:skill-name` in VS Code chat
- **Nature**: Static knowledge/procedures that guide the AI's behavior

## Agents

Agents are **autonomous AI instances** that execute specific tasks independently:

- **What they are**: Fresh AI instances dispatched to work on focused, independent tasks
- **Purpose**: **DO** the actual work - implement, debug, review code
- **Examples**:
  - Implementation agents that write code for specific features
  - Review agents that check code quality or spec compliance  
  - Debugging agents that investigate specific test failures
- **Usage**: Dispatched programmatically using tools like `runSubagent`
- **Nature**: Active executors that take actions and produce results

## Key Relationships

1. **Skills define workflows that use agents**: 
   - `subagent-driven-development` skill defines HOW to coordinate multiple agents
   - `dispatching-parallel-agents` skill defines WHEN and HOW to use multiple agents in parallel

2. **Skills are the "brain", agents are the "hands"**:
   - Skills provide the methodology and decision-making framework
   - Agents do the actual implementation work following those methodologies

3. **Skills persist, agents are ephemeral**:
   - Skills are saved as files and reused across projects
   - Agents are created for specific tasks and complete their work

## Practical Example

When you want to implement a feature:

1. **Use a skill** like "subagent-driven-development" to define the overall approach
2. **The skill guides you to dispatch agents** - one per independent task
3. **Each agent** implements their specific piece following guidelines from other skills (like "test-driven-development")
4. **Review agents** check the work quality
5. **The coordinating skill** ensures all pieces integrate properly

This creates a powerful system where proven methodologies (skills) coordinate autonomous workers (agents) for efficient, high-quality development.

## Summary

- **Skills** = Methodologies and workflows that define HOW to work
- **Agents** = AI workers that DO the actual implementation
- **Together** = Skills coordinate agents to execute complex development tasks systematically