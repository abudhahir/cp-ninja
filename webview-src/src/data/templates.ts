import { SkillCategory, SkillTemplate } from '../types/skill';

export const SKILL_CATEGORIES: SkillCategory[] = [
    {
        id: 'all',
        name: 'All Templates',
        description: 'Browse all available skill templates',
        icon: '🌟'
    },
    {
        id: 'development',
        name: 'Development Workflows',
        description: 'Skills for code development, debugging, and quality assurance',
        icon: '🔧'
    },
    {
        id: 'project-management',
        name: 'Project Management',
        description: 'Skills for planning, organizing, and managing development projects',
        icon: '📋'
    },
    {
        id: 'documentation',
        name: 'Documentation',
        description: 'Skills for creating and maintaining project documentation',
        icon: '📝'
    },
    {
        id: 'workflow',
        name: 'Workflow & Process',
        description: 'Skills for improving development workflows and processes',
        icon: '⚡'
    }
];

export const SKILL_TEMPLATES: SkillTemplate[] = [
    // Existing CP-Ninja Skills
    {
        id: 'brainstorming',
        name: 'Brainstorming Ideas Into Designs',
        description: 'You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.',
        category: 'workflow',
        difficulty: 'Beginner',
        tags: ['brainstorming', 'design', 'requirements', 'creative'],
        content: `---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Documentation:**
- Write the validated design to \`docs/plans/YYYY-MM-DD-<topic>-design.md\`
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git

**Implementation (if continuing):**
- Ask: "Ready to set up for implementation?"
- Use cp-ninja:using-git-worktrees to create isolated workspace
- Use cp-ninja:writing-plans to create detailed implementation plan

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense`,
        customizationPoints: [
            'Add project-specific design patterns',
            'Include team decision-making process',
            'Adapt questioning style for team dynamics'
        ],
        dependencies: ['using-git-worktrees', 'writing-plans']
    },
    {
        id: 'test-driven-development',
        name: 'Test-Driven Development (TDD)',
        description: 'Use when implementing any feature or bugfix, before writing implementation code. Write the test first, watch it fail, write minimal code to pass.',
        category: 'development',
        difficulty: 'Intermediate',
        tags: ['tdd', 'testing', 'red-green-refactor', 'quality'],
        content: `--- 
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Violating the letter of the rules is violating the spirit of the rules.**

## When to Use

**Always:**
- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions (ask your human partner):**
- Throwaway prototypes
- Generated code
- Configuration files

Thinking "skip TDD just this once"? Stop. That's rationalization.

## The Iron Law

\`\`\`
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
\`\`\`

Write code before the test? Delete it. Start over.

## Red-Green-Refactor

### RED - Write Failing Test

Write one minimal test showing what should happen.

### Verify RED - Watch It Fail

**MANDATORY. Never skip.**

Confirm:
- Test fails (not errors)
- Failure message is expected
- Fails because feature missing (not typos)

### GREEN - Minimal Code

Write simplest code to pass the test.

### Verify GREEN - Watch It Pass

**MANDATORY.**

### REFACTOR - Clean Up

After green only:
- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.

## Good Tests

| Quality | Good | Bad |
|---------|------|-----|
| **Minimal** | One thing. "and" in name? Split it. | \`test('validates email and domain and whitespace')\` |
| **Clear** | Name describes behavior | \`test('test1')\` |
| **Shows intent** | Demonstrates desired API | Obscures what code should do |

## Final Rule

\`\`\`
Production code → test exists and failed first
Otherwise → not TDD
\`\`\`

No exceptions without your human partner's permission.`,
        customizationPoints: [
            'Add language-specific testing frameworks',
            'Include project-specific test patterns',
            'Add team TDD practices and conventions'
        ],
        dependencies: []
    },
    {
        id: 'systematic-debugging',
        name: 'Systematic Debugging',
        description: 'A systematic approach to debugging that helps identify and resolve issues efficiently through methodical investigation.',
        category: 'development',
        difficulty: 'Intermediate',
        tags: ['debugging', 'troubleshooting', 'systematic', 'root-cause'],
        content: `---
name: systematic-debugging
description: "A systematic debugging process that helps identify and resolve issues efficiently."
---

# Systematic Debugging

## Overview
A systematic debugging process that helps identify and resolve issues efficiently.

## Steps
1. **Reproduce the Issue**
   - Create minimal reproduction case
   - Document expected vs actual behavior
   
2. **Analyze the Problem**
   - Use logging and breakpoints
   - Check error messages and stack traces
   
3. **Form Hypothesis**
   - What might be causing the issue?
   - Prioritize most likely causes
   
4. **Test and Validate**
   - Test your hypothesis
   - Apply fixes systematically
   
5. **Verify Resolution**
   - Test the fix thoroughly
   - Check for regression issues

## Debugging Techniques

### Defense in Depth
- Add logging at multiple levels
- Use assertions to catch assumptions
- Implement health checks and monitoring

### Root Cause Tracing
- Follow the data flow
- Check inputs and outputs at each step
- Use binary search to isolate the problem

### Condition-Based Waiting
- Use proper synchronization primitives
- Avoid busy waiting
- Handle timeouts gracefully

## Best Practices
- Keep detailed logs of what you've tried
- Don't change multiple things at once
- Test each hypothesis systematically
- Document the solution for future reference`,
        customizationPoints: [
            'Add project-specific debugging tools',
            'Include team-specific logging practices',
            'Adapt for your development environment'
        ],
        dependencies: []
    },
    {
        id: 'using-git-worktrees',
        name: 'Using Git Worktrees',
        description: 'Git worktrees allow you to have multiple working directories from the same repository, enabling parallel work on different features or branches.',
        category: 'workflow',
        difficulty: 'Intermediate',
        tags: ['git', 'worktree', 'parallel-development', 'isolation'],
        content: `---
name: using-git-worktrees
description: "Git worktrees for parallel development and feature isolation"
---

# Using Git Worktrees

## Overview

Git worktrees allow you to have multiple working directories from the same repository, enabling parallel work on different features or branches.

## Basic Commands

### Create a new worktree
\`\`\`bash
# Create worktree for existing branch
git worktree add ../feature-branch feature-branch

# Create worktree with new branch
git worktree add ../new-feature -b new-feature

# Create worktree from specific commit
git worktree add ../hotfix-123 -b hotfix-123 main
\`\`\`

### List worktrees
\`\`\`bash
git worktree list
\`\`\`

### Remove worktree
\`\`\`bash
git worktree remove ../feature-branch
# or manually delete directory and prune
rm -rf ../feature-branch
git worktree prune
\`\`\`

## Benefits

1. **Parallel Development**: Work on multiple features simultaneously
2. **Clean Isolation**: Each worktree has its own working directory
3. **Shared Repository**: All worktrees share the same .git repository
4. **Fast Switching**: No need to stash/unstash when switching contexts
5. **Testing**: Keep one worktree for testing while developing in another

## Workflow Examples

### Feature Development
\`\`\`bash
# Create isolated workspace for new feature
git worktree add ../cp-ninja-skill-composer -b feature/skill-composer

# Work in the new directory
cd ../cp-ninja-skill-composer
# ... develop feature ...

# When done, merge and cleanup
git checkout main
git merge feature/skill-composer
git worktree remove ../cp-ninja-skill-composer
\`\`\`

### Hotfix While Developing
\`\`\`bash
# Continue working in current feature branch
# Create worktree for urgent hotfix
git worktree add ../hotfix-urgent -b hotfix/urgent-fix main

cd ../hotfix-urgent
# ... fix critical issue ...
git commit -m "Fix critical issue"

# Switch back to feature development
cd ../original-workspace
# ... continue feature work ...
\`\`\`

## Best Practices

- Use relative paths (../name) for worktrees
- Name worktrees clearly (feature name, branch name)
- Clean up worktrees when done
- Don't nest worktrees inside each other
- Use worktrees for medium to long-term parallel work`,
        customizationPoints: [
            'Add team worktree naming conventions',
            'Include project-specific setup scripts',
            'Add IDE configuration for worktrees'
        ],
        dependencies: []
    },
    {
        id: 'writing-plans',
        name: 'Writing Implementation Plans',
        description: 'Create detailed, actionable implementation plans that break down complex features into manageable tasks.',
        category: 'project-management',
        difficulty: 'Beginner',
        tags: ['planning', 'implementation', 'project-breakdown', 'tasks'],
        content: `---
name: writing-plans
description: "Create detailed, actionable implementation plans"
---

# Writing Implementation Plans

## Overview

Create detailed, actionable implementation plans that break down complex features into manageable tasks.

## Plan Structure

### 1. Feature Overview
- **Goal**: Clear statement of what we're building
- **Success Criteria**: How we'll know it's done
- **Assumptions**: Key assumptions and constraints

### 2. Technical Approach
- **Architecture**: High-level design decisions
- **Dependencies**: What needs to exist first
- **Risk Assessment**: Potential challenges and mitigation

### 3. Implementation Tasks
Break down into small, manageable tasks:

\`\`\`markdown
## Phase 1: Foundation
- [ ] Task 1: Setup basic structure (2h)
  - Create main component file
  - Add to navigation
  - Basic styling
- [ ] Task 2: Core functionality (4h)
  - Implement main feature
  - Add error handling
  - Write unit tests

## Phase 2: Integration
- [ ] Task 3: Connect to existing system (3h)
- [ ] Task 4: Add validation (2h)
\`\`\`

### 4. Testing Strategy
- Unit tests for core logic
- Integration tests for system interaction
- End-to-end tests for user workflows

### 5. Documentation
- API documentation updates
- User guide updates
- Code comments and README changes

## Task Guidelines

**Good Tasks:**
- ✅ Specific and actionable
- ✅ 1-4 hours of work
- ✅ Clear completion criteria
- ✅ Dependencies identified

**Bad Tasks:**
- ❌ "Implement the feature"
- ❌ Vague or too large
- ❌ No clear definition of done
- ❌ Missing dependencies

## Estimation

- **Small (1-2h)**: Simple, well-understood tasks
- **Medium (3-4h)**: Moderate complexity, some unknowns
- **Large (5-8h)**: Complex, many moving parts
- **Epic (>8h)**: Break down further

## Plan Template

\`\`\`markdown
# [Feature Name] Implementation Plan

## Overview
**Goal:** [What we're building]
**Success Criteria:** [How we'll know it's done]

## Technical Approach
**Architecture:** [Key design decisions]
**Dependencies:** [What needs to exist first]

## Tasks
### Phase 1: [Phase Name]
- [ ] Task 1: [Description] (estimate)
- [ ] Task 2: [Description] (estimate)

### Phase 2: [Phase Name]
- [ ] Task 3: [Description] (estimate)

## Testing
- [ ] Unit tests: [What to test]
- [ ] Integration tests: [What to test]

## Documentation
- [ ] API docs: [What to update]
- [ ] User guide: [What to add]

## Risks & Mitigation
- **Risk 1:** [Description] → [Mitigation]
- **Risk 2:** [Description] → [Mitigation]
\`\`\``,
        customizationPoints: [
            'Add team-specific task templates',
            'Include estimation guidelines',
            'Add project-specific phases'
        ],
        dependencies: []
    },

    // Original Development Templates
    {
        id: 'code-review-checklist',
        name: 'Code Review Checklist',
        description: 'A comprehensive checklist for conducting effective code reviews',
        category: 'development',
        difficulty: 'Beginner',
        tags: ['code-review', 'quality', 'checklist'],
        content: `# Code Review Checklist

## Overview
A comprehensive checklist to ensure thorough and effective code reviews.

## Pre-Review Setup
- [ ] Review is properly assigned
- [ ] PR description is clear and complete
- [ ] All tests are passing
- [ ] Code builds successfully

## Code Quality
- [ ] Code follows established style guidelines
- [ ] Functions are appropriately sized and focused
- [ ] Variable and function names are descriptive
- [ ] Code is well-documented where needed

## Logic and Design
- [ ] Logic is correct and handles edge cases
- [ ] Error handling is appropriate
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed

## Testing
- [ ] New code is adequately tested
- [ ] Tests cover edge cases and error conditions
- [ ] Test names are descriptive

## Documentation
- [ ] Public APIs are documented
- [ ] Complex logic includes comments
- [ ] README or docs updated if needed

## Final Steps
- [ ] Provide constructive feedback
- [ ] Approve when requirements are met
- [ ] Follow up on requested changes`,
        customizationPoints: [
            'Add language-specific checks',
            'Include team coding standards',
            'Add security-specific requirements'
        ],
        dependencies: []
    },

    // Project Management Templates
    {
        id: 'sprint-planning',
        name: 'Sprint Planning Process',
        description: 'A structured approach to planning development sprints',
        category: 'project-management',
        difficulty: 'Intermediate',
        tags: ['sprint', 'planning', 'agile'],
        content: `# Sprint Planning Process

## Overview
A comprehensive guide for conducting effective sprint planning sessions.

## Pre-Planning Preparation
- Review previous sprint retrospective
- Ensure backlog is groomed and prioritized
- Gather team availability information
- Prepare sprint goal candidates

## Planning Session Structure

### Part 1: Sprint Goal Setting (30 min)
- Review team capacity
- Define sprint goal
- Select high-priority backlog items

### Part 2: Task Breakdown (60 min)
- Break down user stories into tasks
- Estimate effort for each task
- Identify dependencies and blockers

### Part 3: Commitment (30 min)
- Review selected items vs capacity
- Make final commitments
- Document sprint backlog

## Outputs
- Sprint goal statement
- Sprint backlog with estimates
- Team commitments and availability
- Risk and dependency register

## Success Metrics
- Sprint goal achievement
- Velocity consistency
- Team satisfaction scores`,
        customizationPoints: [
            'Add team-specific estimation methods',
            'Include project management tools',
            'Adapt for team size and experience'
        ],
        dependencies: []
    },

    // Documentation Templates
    {
        id: 'api-documentation',
        name: 'API Documentation Template',
        description: 'A comprehensive template for documenting REST APIs',
        category: 'documentation',
        difficulty: 'Intermediate',
        tags: ['api', 'documentation', 'rest'],
        content: `# API Documentation Template

## API Overview
**Base URL:** \`https://api.example.com/v1\`
**Authentication:** Bearer Token
**Content Type:** application/json

## Authentication
All API requests require authentication using a Bearer token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

## Endpoints

### GET /users
Retrieve a list of users.

**Parameters:**
- \`page\` (optional): Page number (default: 1)
- \`limit\` (optional): Items per page (default: 20)
- \`search\` (optional): Search term

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
\`\`\`

## Error Handling
All errors follow a consistent format:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid",
    "details": {
      "email": ["Email is already taken"]
    }
  }
}
\`\`\`

## Rate Limiting
- 1000 requests per hour per API key
- Rate limit headers included in responses`,
        customizationPoints: [
            'Add specific endpoint documentation',
            'Include authentication method details',
            'Add language-specific examples'
        ],
        dependencies: []
    },
    {
        id: 'readme-template',
        name: 'Project README Template',
        description: 'A comprehensive template for project README files',
        category: 'documentation',
        difficulty: 'Beginner',
        tags: ['readme', 'project', 'documentation'],
        content: `# Project Name

[![Build Status](https://github.com/username/project/workflows/CI/badge.svg)](https://github.com/username/project/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Brief description of what this project does and who it's for.

## Features

- 🚀 Feature 1
- ⚡ Feature 2
- 🔒 Feature 3
- 📊 Feature 4

## Quick Start

### Prerequisites

- Node.js 18+ or Python 3.9+
- Docker (optional)
- Your favorite IDE

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/username/project.git
cd project

# Install dependencies
npm install
# or
pip install -r requirements.txt
\`\`\`

## Documentation

- [User Guide](docs/user-guide.md)
- [API Documentation](docs/api.md)
- [Contributing Guide](CONTRIBUTING.md)

## Development

### Running Tests

\`\`\`bash
# Run all tests
npm test
\`\`\`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.`,
        customizationPoints: [
            'Add project-specific badges',
            'Include actual installation steps',
            'Add team-specific contributing guidelines'
        ],
        dependencies: []
    }
];

// Export function to get templates by category for dynamic loading
export const getTemplatesByCategory = (categoryId: string): SkillTemplate[] => {
    return SKILL_TEMPLATES.filter(template => template.category === categoryId);
};

// Export function to get template by ID
export const getTemplateById = (templateId: string): SkillTemplate | undefined => {
    return SKILL_TEMPLATES.find(template => template.id === templateId);
};