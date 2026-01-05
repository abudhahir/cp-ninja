# Sample Tutorials

This directory contains sample tutorials generated using the cp-ninja **technical-trainer** skill.

## About These Tutorials

These tutorials demonstrate the capabilities of cp-ninja's technical-trainer skill to transform complex technical concepts into clear, step-by-step educational content.

## How These Were Generated

### Tutorial: Git Repository Webview Browser
**File**: [git-repo-webview-tutorial.md](git-repo-webview-tutorial.md)

**Generated Using**: 
- **Skill**: `technical-trainer` from cp-ninja
- **Model**: Claude Sonnet 4.5 via GitHub Copilot
- **Date**: January 5, 2026

**User Request**:
> "adding a webview to retrieve prompts and instructions, agents, skills from a given git repo, if need we may have to provide configuration details like repo remote, access token, it should be light weight and user friendly and load lazily"

**What Was Used**:
1. **CP-Ninja Technical-Trainer Skill**: Applied the structured 7-step tutorial format:
   - Table of Contents
   - Introduction (context, learning outcomes, prerequisites)
   - Analogy (Smart TV Remote Control Panel)
   - Core Concepts (Webview fundamentals, lazy loading, Git access strategies)
   - Architecture Overview (with Mermaid diagrams)
   - Implementation Deep-Dive (5 detailed steps with full code)
   - Hands-On Examples (3 practical scenarios)
   - Summary and Next Steps

2. **Context Analysis**: Examined the cp-ninja codebase structure:
   - Existing managers (ResourceManager, SkillLoader, DynamicSkillRegistry)
   - Extension architecture patterns
   - Current skill loading mechanisms

3. **Tools Referenced** (from skill definition):
   - Context7 MCP Server: For fetching VS Code API documentation
   - Web Search: For supplementary information and best practices

4. **Project-Specific Integration**: 
   - Tailored examples to cp-ninja's existing codebase
   - Referenced actual files and classes
   - Maintained consistency with extension patterns

**Key Features of the Generated Tutorial**:
- ✅ Progressive complexity (simple → advanced)
- ✅ Real-world analogies for abstract concepts
- ✅ Complete, production-ready code examples
- ✅ Mermaid diagrams for visual learners
- ✅ Security best practices included
- ✅ Performance considerations highlighted
- ✅ Integration with existing systems explained

### Tutorial: VS Code Extension Development Setup
**File**: [vscode-plugin-development-setup.md](vscode-plugin-development-setup.md)

**Generated Using**: 
- **Skill**: `technical-trainer` from cp-ninja
- **Model**: Claude Sonnet 4.5 via GitHub Copilot
- **Date**: January 5, 2026

**User Request**:
> "similarly create a tutorial on how to setup vs code for plugin development. simple plugins, api calling plugins, webviews, etc"

**What Was Used**:
1. **CP-Ninja Technical-Trainer Skill**: Applied the structured tutorial format with progressive complexity
2. **Coverage Areas**:
   - Development environment setup (Yeoman, tooling)
   - Simple command-based extensions
   - API-calling extensions (weather example)
   - Interactive webviews (dashboard example)
   - Testing and debugging strategies
   - Publishing to VS Code marketplace

3. **Teaching Approach**:
   - Real-world analogies (workshop toolbox)
   - Progressive learning path (simple → complex)
   - Complete, runnable code examples
   - Mermaid diagrams for architecture
   - Common pitfalls and best practices
   - Practical debugging tips

4. **Key Features**:
   - ✅ Three complete extension examples
   - ✅ Step-by-step setup instructions
   - ✅ Production-ready code patterns
   - ✅ Testing and debugging guidance
   - ✅ Publishing workflow

---

## Using the Technical-Trainer Skill

To generate similar tutorials in your cp-ninja extension:

1. Activate the skill:
   ```
   @cp-ninja use technical-trainer skill
   ```

2. Provide a technical topic or request:
   ```
   Explain how to implement [feature] in [project context]
   ```

3. The skill will structure a comprehensive tutorial following best practices for technical education.

## Template Structure

Each tutorial follows this proven format:

```
1. Table of Contents - Learning journey overview
2. Introduction - Why it matters, what you'll learn, prerequisites
3. Analogy - Real-world mental model
4. Core Concepts - Fundamental building blocks
5. Architecture Overview - System design with diagrams
6. Implementation Deep-Dive - Step-by-step code walkthrough
7. Hands-On Examples - Practical applications
8. Summary and Next Steps - Recap, related topics, pitfalls
```

## Feedback

These tutorials are examples of AI-assisted technical documentation. They serve as:
- Reference implementations for new features
- Onboarding materials for contributors
- Templates for creating your own tutorials

For questions or improvements, refer to the cp-ninja documentation or submit feedback through the extension's GitHub repository.
