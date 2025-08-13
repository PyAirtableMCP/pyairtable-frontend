# /workflow

## Purpose
Execute complex multi-step workflows with automated command chaining and agent orchestration

## Workflow Definitions

### 🚀 Feature Development Workflow
**Trigger**: "develop feature [name]" or "build new feature"
**Chain**:
1. `/create-prd` - Define requirements
2. `/create-jtbd` - User story documentation  
3. `/todo add` - Break down into tasks
4. Launch `frontend-architect` agent - Design UI components
5. Launch `backend-architect` agent - Design API endpoints
6. Launch `test-automator` agent - Create test suite
7. `/commit` - Commit changes
8. `/create-pr` - Create pull request

### 🐛 Bug Fix Workflow
**Trigger**: "fix bug [issue]" or "debug issue [number]"
**Chain**:
1. `/fix-github-issue [number]` - Start fix workflow
2. Launch `debugger` agent - Analyze the issue
3. Launch `code-reviewer` agent - Review fix
4. Launch `test-automator` agent - Add regression tests
5. `/clean` - Clean up code
6. `/commit` - Commit fix
7. `/add-to-changelog` - Update changelog
8. `/create-pr` - Create PR

### 📊 Full Stack Feature Workflow
**Trigger**: "full stack feature" or "implement end-to-end"
**Chain**:
1. `/context-prime` - Load context
2. `/create-prd` - Requirements
3. Launch `backend-architect` agent - API design
4. Launch `database-optimizer` agent - Schema design
5. Launch `frontend-architect` agent - UI implementation
6. Launch `test-automator` agent - E2E tests
7. Launch `api-documenter` agent - API docs
8. `/update-docs` - Update documentation
9. `/commit` - Commit all changes
10. `/create-pr` - Create PR

### 🔒 Security Audit Workflow
**Trigger**: "security audit" or "check security"
**Chain**:
1. Launch `security-auditor` agent - Security review
2. Launch `code-reviewer` agent - Code quality check
3. Launch `dependency-checker` agent - Check vulnerabilities
4. `/todo add` - Add security fixes as tasks
5. Fix identified issues
6. `/commit` - Commit security updates
7. `/add-to-changelog` - Document security fixes

### 🚀 Release Workflow
**Trigger**: "prepare release" or "ship version"
**Chain**:
1. `/pr-review` - Review pending PRs
2. Launch `qa-manager` agent - Final testing
3. Launch `performance-engineer` agent - Performance check
4. `/update-docs` - Update documentation
5. `/add-to-changelog` - Finalize changelog
6. `/release [version]` - Create release
7. Launch `deployment-engineer` agent - Deploy

### 🧹 Code Quality Workflow
**Trigger**: "improve code quality" or "refactor"
**Chain**:
1. `/context-prime` - Load context
2. Launch `code-reviewer` agent - Identify issues
3. Launch `legacy-modernizer` agent - Refactor old code
4. Launch `performance-engineer` agent - Optimize
5. `/clean` - Fix formatting
6. Launch `test-automator` agent - Add missing tests
7. `/commit` - Commit improvements
8. `/update-docs` - Update documentation

### 📝 Documentation Workflow
**Trigger**: "document project" or "update all docs"
**Chain**:
1. Launch `technical-writer` agent - Create docs
2. Launch `api-documenter` agent - API documentation
3. `/update-docs` - Update existing docs
4. `/create-prd` - Product documentation
5. Generate README updates
6. `/commit` - Commit documentation
7. `/create-pr` - Create documentation PR

### 🔄 Sync & Review Workflow
**Trigger**: "sync and review" or "update from main"
**Chain**:
1. Git pull latest changes
2. `/context-prime` - Reload context
3. `/todo list` - Check pending tasks
4. Launch `code-reviewer` agent - Review changes
5. Run tests
6. Fix any conflicts
7. `/commit` - Commit merge

## Agent Orchestration Patterns

### Parallel Execution
```
PARALLEL {
  agent: frontend-architect
  agent: backend-architect  
  agent: database-optimizer
}
WAIT_ALL
THEN /commit
```

### Sequential Pipeline
```
SEQUENCE {
  agent: architect-reviewer → 
  agent: code-reviewer →
  agent: security-auditor →
  agent: qa-manager
}
THEN /create-pr
```

### Conditional Branching
```
IF bug_critical {
  agent: incident-responder
  agent: debugger
  /fix-github-issue
} ELSE {
  /todo add "Fix non-critical bug"
}
```

## Custom Workflow Syntax

### Define Custom Workflow
```
WORKFLOW "my-custom-flow" {
  STEPS [
    /context-prime
    agent: frontend-architect with "Design dashboard"
    agent: backend-architect with "Create API"
    PARALLEL {
      agent: test-automator
      agent: api-documenter
    }
    /commit
    /create-pr
  ]
}
```

### Invoke Multiple Agents
```
AGENTS 3 for "implement payment system" {
  agent: payment-integration - "Stripe integration"
  agent: security-auditor - "PCI compliance"
  agent: test-automator - "Payment tests"
}
```

## Trigger Phrases

### Agent Invocation
- "involve X agents to Y" → Launches X relevant agents for task Y
- "coordinate agents for Z" → Orchestrates agents for goal Z
- "full team on W" → Launches all relevant agents for W

### Workflow Triggers
- "start feature workflow" → Feature development chain
- "emergency fix" → Bug fix workflow with priority
- "ship it" → Release workflow
- "make it perfect" → Code quality workflow

## Examples

### Example 1: Complex Feature
**User**: "involve 5 agents to implement real-time chat"
**Execution**:
```
1. frontend-architect - Design chat UI
2. backend-architect - WebSocket architecture
3. database-optimizer - Message storage
4. security-auditor - Encryption & auth
5. test-automator - Real-time tests
6. /commit
7. /create-pr
```

### Example 2: Quick Fix
**User**: "quick fix for issue 123"
**Execution**:
```
1. /fix-github-issue 123
2. debugger agent
3. /clean
4. /commit
5. /create-pr
```

### Example 3: Full Deployment
**User**: "prepare and deploy v2.0"
**Execution**:
```
1. All pre-release checks
2. qa-manager agent
3. /release v2.0
4. deployment-engineer agent
5. Monitor deployment
```

## Success Metrics
- All commands execute successfully
- Agents complete their tasks
- Tests pass
- Documentation updated
- PR created with all changes