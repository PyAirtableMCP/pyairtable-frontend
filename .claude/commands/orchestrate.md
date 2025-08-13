# /orchestrate

## Purpose
Intelligently coordinate multiple agents to accomplish complex tasks with automatic task distribution

## Core Syntax

### Basic Orchestration
```
/orchestrate [number] agents for "[task]"
```

### Smart Orchestration
```
/orchestrate "[goal]"
```
Claude automatically determines the right agents and coordinates them

## Orchestration Patterns

### 1. Parallel Swarm
```
/orchestrate swarm "[task]"
```
Launches multiple agents working in parallel on different aspects

Example:
```
/orchestrate swarm "redesign dashboard"
→ UI Designer: Visual mockups
→ Frontend Architect: Component structure  
→ UX Researcher: User feedback analysis
→ Accessibility Specialist: WCAG compliance
→ Performance Engineer: Optimization plan
```

### 2. Pipeline Pattern
```
/orchestrate pipeline "[task]"
```
Agents work sequentially, each building on the previous

Example:
```
/orchestrate pipeline "api development"
→ Backend Architect: Design API
→ Database Optimizer: Schema design
→ Security Auditor: Security review
→ API Documenter: Documentation
→ Test Automator: Test suite
```

### 3. Specialist Team
```
/orchestrate team "[domain]" for "[task]"
```

Examples:
```
/orchestrate team "frontend" for "new UI"
/orchestrate team "backend" for "microservice"
/orchestrate team "fullstack" for "feature"
/orchestrate team "security" for "audit"
```

### 4. Hierarchical Coordination
```
/orchestrate hierarchy "[project]"
```
Lead agent coordinates sub-agents

Example:
```
/orchestrate hierarchy "payment system"
→ Project Manager (Lead)
  → Frontend Developer
  → Backend Developer
  → Payment Integration Specialist
  → Security Auditor
  → QA Manager
```

## Smart Agent Selection

### By Task Keywords

**"UI", "interface", "design"**:
→ frontend-architect, ui-designer, ux-researcher

**"API", "backend", "service"**:
→ backend-architect, api-documenter, database-optimizer

**"test", "quality", "QA"**:
→ test-automator, qa-manager, performance-engineer

**"security", "audit", "vulnerability"**:
→ security-auditor, penetration-tester, compliance-officer

**"deploy", "release", "ship"**:
→ deployment-engineer, release-manager, sre-engineer

**"optimize", "performance", "speed"**:
→ performance-engineer, database-optimizer, cache-expert

## Agent Coordination Examples

### Example 1: E-commerce Feature
```
/orchestrate "add shopping cart feature"
```
Automatically launches:
1. **product-manager**: Define requirements
2. **ux-designer**: Design user flow
3. **frontend-architect**: Build UI components
4. **backend-architect**: Create cart API
5. **database-optimizer**: Design cart schema
6. **payment-integration**: Payment flow
7. **test-automator**: E2E tests
8. **security-auditor**: Security review

### Example 2: Performance Crisis
```
/orchestrate "emergency: site is slow"
```
Immediately launches:
1. **incident-responder**: Triage issue
2. **performance-engineer**: Profile bottlenecks
3. **database-optimizer**: Query optimization
4. **cache-expert**: Caching strategy
5. **sre-engineer**: Infrastructure scaling
6. **monitoring-specialist**: Set up alerts

### Example 3: New Microservice
```
/orchestrate 5 agents for "user notification service"
```
Selects and launches:
1. **backend-architect**: Service design
2. **message-queue-expert**: Queue implementation
3. **database-optimizer**: Storage strategy
4. **test-automator**: Test coverage
5. **deployment-engineer**: Deployment setup

## Task Distribution Strategies

### Round-Robin
```
/orchestrate round-robin "[list of tasks]"
```
Distributes tasks evenly among agents

### Load-Balanced
```
/orchestrate balanced "[project]"
```
Assigns tasks based on agent expertise and workload

### Priority-Based
```
/orchestrate priority "[critical task]"
```
Assigns best agents to most critical tasks first

### Skill-Matched
```
/orchestrate match-skills "[requirements]"
```
Matches agent skills to task requirements

## Complex Orchestration

### Multi-Phase Project
```
/orchestrate phases "mobile app"

PHASE 1: Planning
- product-manager
- ux-researcher
- technical-architect

PHASE 2: Development
- ios-developer
- android-developer
- backend-architect
- api-developer

PHASE 3: Testing
- qa-manager
- test-automator
- performance-engineer

PHASE 4: Launch
- deployment-engineer
- marketing-specialist
- support-engineer
```

### Cross-Functional Team
```
/orchestrate cross-team "platform migration"
```
Coordinates across:
- Development team
- DevOps team
- QA team
- Security team
- Documentation team

## Agent Communication

### Information Sharing
Agents automatically share:
- Task status updates
- Discovered issues
- Dependencies
- Recommendations
- Completed work

### Conflict Resolution
When agents disagree:
1. Present both perspectives
2. Seek user input if critical
3. Use best practices as tiebreaker
4. Document decision rationale

## Monitoring & Control

### Status Tracking
```
/orchestrate status
```
Shows all active agents and their tasks

### Pause/Resume
```
/orchestrate pause
/orchestrate resume
```

### Abort
```
/orchestrate abort
```
Stops all agents immediately

## Success Metrics

Orchestration succeeds when:
- All agents complete their tasks
- No blocking issues remain
- Deliverables are integrated
- Tests pass
- Documentation is complete

## Advanced Features

### Conditional Orchestration
```
/orchestrate if-then
IF frontend_complete:
  Launch backend agents
ELSE:
  Launch more frontend agents
```

### Recursive Orchestration
```
/orchestrate recursive "refactor codebase"
```
Agents can spawn sub-agents as needed

### Learning Orchestration
```
/orchestrate learn "pattern"
```
System learns from successful orchestrations

## Best Practices

1. **Start with goal, not agent count**: Let system determine optimal team
2. **Use domain teams**: "frontend team" vs listing individual agents
3. **Monitor progress**: Check status regularly
4. **Trust agent expertise**: Agents know their domains
5. **Review outputs**: Verify integrated solution

## Quick Commands

- `/orchestrate 3 for "bug fix"` - 3 agents for bug
- `/orchestrate team "frontend"` - Frontend team
- `/orchestrate swarm "redesign"` - Parallel redesign
- `/orchestrate emergency "outage"` - Crisis response
- `/orchestrate fullstack "feature"` - Complete feature team