# /workflow

## Purpose
Execute automated command chains and orchestrate multiple agents for complex tasks

## Quick Workflows

### 🚀 Feature Development
```
/workflow feature [name]
```
Executes: PRD → JTBD → Tasks → Frontend/Backend Agents → Tests → PR

### 🐛 Bug Fix
```
/workflow fix [issue-number]
```
Executes: Issue Analysis → Debug → Fix → Test → Commit → PR

### 📦 Release
```
/workflow release [version]
```
Executes: Review → Test → Docs → Changelog → Release → Deploy

### 🔒 Security Audit
```
/workflow security
```
Executes: Security Scan → Vulnerability Check → Fixes → Documentation

### 🧹 Code Quality
```
/workflow quality
```
Executes: Review → Refactor → Optimize → Test → Document

## Agent Orchestration

### Invoke Multiple Agents
```
/workflow agents [number] for "[task]"
```

Example:
```
/workflow agents 3 for "payment integration"
→ payment-integration agent
→ security-auditor agent  
→ test-automator agent
```

### Team Coordination
```
/workflow team "[feature]"
```
Launches all relevant agents for the feature

## Custom Chains

### Define Custom Workflow
```
/workflow custom
CHAIN: command1 → command2 → agent1 → command3
```

### Parallel Execution
```
/workflow parallel
AGENTS: [frontend-architect, backend-architect, database-optimizer]
THEN: /commit
```

## Workflow Templates

### 1. Full Stack Feature
```
/workflow fullstack "[feature name]"
```
- Context loading
- Requirements (PRD/JTBD)
- Backend API design
- Database schema
- Frontend UI
- E2E tests
- Documentation
- Pull request

### 2. Emergency Hotfix
```
/workflow hotfix [issue]
```
- Incident response
- Root cause analysis
- Quick fix
- Emergency tests
- Fast-track PR
- Deploy

### 3. Performance Optimization
```
/workflow optimize
```
- Performance profiling
- Bottleneck identification
- Optimization implementation
- Benchmark tests
- Documentation

### 4. Documentation Sprint
```
/workflow docs
```
- Technical documentation
- API documentation
- User guides
- README updates
- Changelog

## Conditional Workflows

### Based on Severity
```
/workflow smart-fix [issue]
```
- If critical → incident-responder + immediate fix
- If major → standard fix workflow
- If minor → add to backlog

### Based on Scope
```
/workflow smart-feature "[description]"
```
- If UI only → frontend agents
- If API only → backend agents
- If full stack → complete team

## Instructions for Claude

When executing workflows:

1. **Parse the workflow request** to identify the type and parameters
2. **Load the appropriate chain** from the workflow definitions
3. **Execute each step sequentially** unless marked as PARALLEL
4. **Launch agents with specific tasks** as defined
5. **Handle errors gracefully** and report status
6. **Summarize results** at the end

## Common Patterns

### Morning Routine
```
/workflow morning
```
1. /context-prime
2. Git pull latest
3. /todo list
4. Run tests
5. Check CI status

### End of Day
```
/workflow eod
```
1. /todo update
2. /commit (any uncommitted changes)
3. Push to remote
4. /add-to-changelog
5. Update documentation

### PR Preparation
```
/workflow pr-prep
```
1. /clean
2. Run all tests
3. /update-docs
4. /commit
5. /create-pr

## Advanced Usage

### Chain with Conditions
```
/workflow conditional
IF tests_pass:
  /commit → /create-pr
ELSE:
  Launch debugger agent → Fix issues → Retry
```

### Multi-Stage Pipeline
```
/workflow pipeline
STAGE 1: Development
  - Write code
  - Unit tests
STAGE 2: Integration  
  - Integration tests
  - API tests
STAGE 3: Release
  - Documentation
  - Deployment
```

## Available Agents for Orchestration

**Development**: frontend-architect, backend-architect, fullstack-engineer
**Testing**: test-automator, qa-manager, performance-engineer
**Security**: security-auditor, penetration-tester
**Documentation**: technical-writer, api-documenter
**DevOps**: deployment-engineer, sre-engineer, cloud-architect
**Code Quality**: code-reviewer, legacy-modernizer, refactoring-expert
**Database**: database-optimizer, sql-expert, migration-specialist
**Mobile**: ios-developer, android-developer, react-native-expert

## Usage Examples

1. **Simple**: `/workflow feature "user authentication"`
2. **With agents**: `/workflow agents 4 for "implement shopping cart"`
3. **Custom chain**: `/workflow custom [prd → todo → code → test → deploy]`
4. **Parallel**: `/workflow parallel [frontend, backend, database]`
5. **Emergency**: `/workflow hotfix 456`

## Notes
- Workflows are atomic - if one step fails, the workflow stops
- Results are logged for each step
- You can interrupt workflows with "stop workflow"
- Custom workflows are saved for reuse