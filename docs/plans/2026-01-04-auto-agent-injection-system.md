# Auto Agent Injection System Design

**Date:** January 4, 2026  
**Status:** In Development  
**Version:** 1.0  

## Overview
Automatic injection of relevant agents, prompts, and workflows based on project profile detection to enhance developer experience and ensure consistent development practices.

## Problem Statement
- Current cp-ninja extension requires manual activation of agents/workflows
- Users don't know what agents are available for their project type
- No automatic context-aware suggestions based on project characteristics
- Project profiles lack sensible defaults for different development scenarios

## Solution Architecture

### Phase 1: Basic Project Type Detection ⚡ In Progress
**Goal:** Detect common project types from workspace analysis
**Implementation:**
- Package.json framework detection (React, Angular, Express, etc.)
- File structure pattern recognition
- Dependency analysis for project classification
- Basic heuristic engine for project DNA fingerprinting

### Phase 2: Default Agent Configuration ⚡ In Progress  
**Goal:** Auto-configure optimal agent mix per project type
**Implementation:**
- Framework-based profile system
- Pre-configured agent templates for common scenarios
- Default workflow suggestions based on project type
- Seamless integration with existing manual workflows

### Phase 3: Smart Contextual Suggestions (Future)
- Event-driven workflow triggers (file creation, git commits, PRs)
- Context menu integration for quick agent access  
- Status bar workflow suggestions
- Proactive notifications based on code changes

### Phase 4: Learning and Personalization (Future)
- Track developer usage patterns
- Build personalized default profiles
- Team profile sharing and standardization
- Machine learning for optimal agent recommendations

### Phase 5: Team/Organization Integration (Future)
- Enterprise profile management
- CI/CD pipeline integration
- Git hooks for automated workflow triggers
- Organization-wide standardization tools

## Project Profile Configuration Schema

```json
{
  "profiles": {
    "react-frontend": {
      "name": "React Frontend",
      "triggers": {
        "dependencies": ["react", "@types/react", "webpack", "vite"],
        "filePatterns": ["src/components/**", "public/index.html"],
        "packageScripts": ["build", "start", "dev"]
      },
      "defaultAgents": [
        "software-architect",
        "technical-analyzer",
        "performance-analyzer"
      ],
      "workflows": [
        "component-design-review",
        "state-management-analysis",
        "bundle-optimization"
      ],
      "skills": [
        "brainstorming",
        "systematic-debugging",
        "test-driven-development"
      ],
      "contextualTriggers": {
        "onComponentCreate": ["component-design-review"],
        "onStateUpdate": ["state-management-analysis"],
        "onBuild": ["performance-analysis"]
      }
    },
    "node-backend": {
      "name": "Node.js Backend",
      "triggers": {
        "dependencies": ["express", "fastify", "koa", "nest"],
        "filePatterns": ["server.js", "app.js", "src/routes/**"],
        "packageScripts": ["start", "dev", "server"]
      },
      "defaultAgents": [
        "software-architect", 
        "security-analyst",
        "technical-analyzer"
      ],
      "workflows": [
        "api-security-review",
        "database-optimization",
        "error-handling-analysis"
      ],
      "skills": [
        "systematic-debugging",
        "verification-before-completion"
      ]
    },
    "full-stack": {
      "name": "Full Stack Application",
      "triggers": {
        "dependencies": ["react", "express", "next", "nuxt"],
        "filePatterns": ["pages/**", "api/**", "components/**"],
        "packageScripts": ["build", "dev", "start"]
      },
      "defaultAgents": [
        "business-analyst",
        "software-architect",
        "security-analyst", 
        "technical-analyzer"
      ],
      "workflows": [
        "end-to-end-security-review",
        "performance-optimization",
        "deployment-readiness-check"
      ]
    }
  }
}
```

## Implementation Plan

### Phase 1 & 2 Current Sprint
- [x] Create ProjectProfileDetector service
- [x] Implement basic package.json analysis
- [x] Add file pattern recognition
- [x] Create profile configuration system
- [x] Integrate with existing ProfileChatHandler
- [x] Add auto-activation of default agents
- [ ] Create profile management UI
- [ ] Add workspace-level profile persistence

### Technical Architecture

```
WorkspaceAnalyzer
├── PackageAnalyzer (package.json parsing)
├── FileStructureAnalyzer (directory patterns)
├── DependencyAnalyzer (tech stack detection)
└── ProjectProfileMatcher (heuristic matching)

ProfileManager
├── ProfileRegistry (available profiles)
├── ProfileActivator (auto-configuration)
├── ProfilePersistence (workspace settings)
└── ProfileCustomizer (user overrides)

AgentInjector
├── AutoActivation (background agent startup)
├── ContextualSuggestions (smart recommendations)
├── WorkflowTriggers (event-driven activation)
└── FallbackHandling (graceful degradation)
```

## Success Metrics
- Reduced time to first useful agent interaction
- Increased adoption of appropriate workflows per project type
- Decreased manual configuration overhead
- Higher user satisfaction with contextual relevance

## Risk Mitigation
- **Performance Impact:** Lazy loading, cached analysis results
- **User Overwhelm:** Opt-out mechanisms, progressive disclosure
- **False Positives:** Confidence scoring, manual override options
- **Privacy Concerns:** Local-only analysis, no external data sharing

## Future Enhancements
- Machine learning for pattern recognition improvement
- Community profile sharing marketplace
- Integration with popular project generators (create-react-app, etc.)
- Real-time collaboration for team profile synchronization