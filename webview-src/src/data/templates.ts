import { SkillCategory, SkillTemplate } from '../types/skill';

export const SKILL_CATEGORIES: SkillCategory[] = [
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
    }
];

export const SKILL_TEMPLATES: SkillTemplate[] = [
    // Development Workflows
    {
        id: 'debugging-process',
        name: 'Debugging Process',
        description: 'A systematic approach to identifying and fixing bugs in code',
        category: 'development',
        difficulty: 'Intermediate',
        tags: ['debugging', 'troubleshooting', 'systematic'],
        content: `# Debugging Process

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

## Customization Points
- Add project-specific debugging tools
- Include team-specific logging practices
- Adapt for your development environment`,
        customizationPoints: [
            'Add project-specific debugging tools',
            'Include team-specific logging practices',
            'Adapt for your development environment'
        ],
        dependencies: []
    },
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
    {
        id: 'tdd-workflow',
        name: 'Test-Driven Development',
        description: 'A workflow for implementing features using test-driven development',
        category: 'development',
        difficulty: 'Intermediate',
        tags: ['tdd', 'testing', 'workflow'],
        content: `# Test-Driven Development Workflow

## Overview
A structured approach to implementing features using test-driven development.

## The Red-Green-Refactor Cycle

### 1. Red Phase (Write Failing Test)
- Write a test that fails
- Test should be minimal and focused
- Run test to verify it fails

### 2. Green Phase (Make Test Pass)
- Write minimal code to make test pass
- Don't worry about perfection
- Focus on making the test pass

### 3. Refactor Phase (Improve Code)
- Clean up the code
- Remove duplication
- Improve design
- Ensure tests still pass

## Best Practices
- Write tests first, always
- Keep tests small and focused
- Test behavior, not implementation
- Refactor regularly
- Run tests frequently

## Benefits
- Better code design
- Comprehensive test coverage
- Reduced debugging time
- Increased confidence in changes`,
        customizationPoints: [
            'Add project-specific test patterns',
            'Include testing framework specifics',
            'Add team TDD practices'
        ],
        dependencies: []
    },

    // Project Management
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
    {
        id: 'feature-requirements',
        name: 'Feature Requirements Template',
        description: 'A template for documenting feature requirements and acceptance criteria',
        category: 'project-management',
        difficulty: 'Beginner',
        tags: ['requirements', 'documentation', 'features'],
        content: `# Feature Requirements Template

## Feature Overview
**Feature Name:** [Feature Name]
**Priority:** [High/Medium/Low]
**Epic:** [Related Epic]
**Requestor:** [Stakeholder/Customer]

## Problem Statement
Describe the problem this feature solves and why it's important.

## User Stories
### Primary User Story
As a [user type], I want [functionality] so that [benefit/value].

### Additional Stories
- As a [user type], I want [functionality] so that [benefit].
- As a [user type], I want [functionality] so that [benefit].

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Requirements
### Functional Requirements
- Requirement 1
- Requirement 2

### Non-Functional Requirements
- Performance: [response times, throughput]
- Security: [authentication, authorization]
- Scalability: [concurrent users, data volume]

## Dependencies
- External systems
- Other features/components
- Infrastructure requirements

## Assumptions and Constraints
### Assumptions
- List key assumptions

### Constraints
- Technical limitations
- Business constraints
- Timeline constraints

## Success Metrics
- How will success be measured?
- What are the key performance indicators?

## Risks and Mitigation
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Risk 1 | High | Low | Mitigation strategy |`,
        customizationPoints: [
            'Add company-specific requirement fields',
            'Include compliance requirements',
            'Add stakeholder approval workflow'
        ],
        dependencies: []
    },

    // Documentation
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

### POST /users
Create a new user.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
\`\`\`

**Response:**
- **201 Created:** User successfully created
- **400 Bad Request:** Invalid input data
- **409 Conflict:** Email already exists

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
- Rate limit headers included in responses

## SDKs and Examples
- [JavaScript SDK](link-to-js-sdk)
- [Python SDK](link-to-python-sdk)
- [cURL Examples](link-to-examples)`,
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

# Set up environment variables
cp .env.example .env
\`\`\`

### Usage

\`\`\`bash
# Development
npm run dev
# or
python main.py

# Production
npm run build && npm start
\`\`\`

## Documentation

- [User Guide](docs/user-guide.md)
- [API Documentation](docs/api.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Development

### Project Structure

\`\`\`
project/
├── src/           # Source code
├── tests/         # Test files
├── docs/          # Documentation
├── scripts/       # Build and deployment scripts
└── config/        # Configuration files
\`\`\`

### Running Tests

\`\`\`bash
# Run all tests
npm test
# or
pytest

# Run with coverage
npm run test:coverage
# or
pytest --cov
\`\`\`

### Code Quality

\`\`\`bash
# Linting
npm run lint
# or
flake8 src/

# Formatting
npm run format
# or
black src/
\`\`\`

## Deployment

[Include deployment instructions or link to deployment guide]

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 🐛 Issues: [GitHub Issues](https://github.com/username/project/issues)

## Acknowledgments

- Thanks to [contributor names]
- Inspired by [similar projects]
- Built with [technologies used]`,
        customizationPoints: [
            'Add project-specific badges',
            'Include actual installation steps',
            'Add team-specific contributing guidelines'
        ],
        dependencies: []
    }
];