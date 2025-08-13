# /incremental-dev

## Purpose
Execute fully automated incremental development workflow with JIRA integration, GitHub PRs, local builds, and multi-agent coordination

## Quick Commands

### Start Sprint Development
```
/incremental-dev sprint "[sprint-name]"
```
Creates JIRA sprint, plans stories, assigns to agents

### Implement Single Story
```
/incremental-dev story "[STORY-ID]"
```
Pick up story → Implement → Build → Test → PR → Review → Merge

### Fix and Continue
```
/incremental-dev fix-continue
```
Fix current build/test failures and continue workflow

## Full Workflow Execution

### 1. Sprint Planning
```
/incremental-dev plan
```
**Executes:**
1. product-manager agent creates JIRA sprint
2. Breaks down epics into stories (max 500 lines each)
3. architect-reviewer validates technical approach
4. Creates subtasks and assigns story points
5. Prioritizes backlog

### 2. Story Implementation
```
/incremental-dev implement "[STORY-ID]"
```
**Executes:**
1. Assigns story to appropriate agent based on type:
   - Frontend → frontend-developer
   - Backend → backend-architect
   - API → api-developer
   - Database → database-optimizer
2. Creates feature branch: `feat/[STORY-ID]-description`
3. Implements ONLY the specific story (<500 lines)
4. Follows existing patterns, no mass generation

### 3. Build & Test Loop
```
/incremental-dev build-test
```
**Automatic detection and execution:**
```
Project Type Detection:
- pom.xml → mvn clean install
- package.json → npm install && npm build && npm test
- build.gradle → gradle clean build
- go.mod → go build ./... && go test ./...
- Cargo.toml → cargo build && cargo test
- requirements.txt → pip install -r requirements.txt && pytest
```

**If build/tests fail:**
1. Capture error output
2. Launch debugger agent
3. Fix issues incrementally
4. Re-run until success
5. No PR until everything passes

### 4. Create Pull Request
```
/incremental-dev pr "[STORY-ID]"
```
**Automatically:**
1. Ensures all tests pass locally
2. Creates PR with template
3. Links to JIRA story
4. Assigns reviewers (architect + code-reviewer)
5. Updates JIRA status to "In Review"

### 5. Review Cycle
```
/incremental-dev review
```
**Review agents:**
- architect-reviewer: Pattern consistency, design
- code-reviewer: Quality, security, performance

**For each comment:**
1. implementing-agent addresses feedback
2. Commits fix: "Address review: [comment]"
3. Responds to comment
4. Requests re-review

### 6. Merge
```
/incremental-dev merge
```
**Only when:**
- All builds pass
- All tests pass
- All reviews approved
- All comments resolved

**Then:**
1. Squash merge PR
2. Delete feature branch
3. Update JIRA to "Done"
4. Move to next story

## Agent Orchestration

### Automatic Agent Selection
Based on story tags in JIRA:
- `frontend` → frontend-developer, ui-designer
- `backend` → backend-architect, api-developer
- `database` → database-optimizer, sql-expert
- `security` → security-auditor
- `performance` → performance-engineer
- `mobile` → mobile-developer
- `devops` → deployment-engineer

### Agent Coordination
```
STORY: "Add user authentication"
AGENTS:
  1. backend-architect: Design auth flow
  2. security-auditor: Review security
  3. frontend-developer: Login UI
  4. test-automator: Auth tests
  5. api-documenter: API docs
```

## Incremental Rules Enforcement

### Enforced Limits
- **PR Size**: Max 500 lines
- **Files Changed**: Max 10 files
- **Build Time**: Must pass in <5 minutes
- **Test Coverage**: Must maintain or improve
- **Review Comments**: All must be resolved

### Automatic Splitting
If changes exceed limits:
1. Split into multiple stories
2. Create separate PRs
3. Chain dependencies
4. Merge incrementally

## JIRA Integration Commands

### Update Story Status
```
/incremental-dev jira-status "[STORY-ID]" "[STATUS]"
```
Statuses: To Do, In Progress, In Review, Done

### Add Story Comment
```
/incremental-dev jira-comment "[STORY-ID]" "[comment]"
```

### Link PR to Story
```
/incremental-dev jira-link "[STORY-ID]" "[PR-NUMBER]"
```

## GitHub Integration Commands

### Create Draft PR
```
/incremental-dev draft-pr
```
Creates PR marked as draft for early feedback

### Request Specific Reviewer
```
/incremental-dev add-reviewer "[username]"
```

### Auto-fix PR Issues
```
/incremental-dev auto-fix
```
Fixes linting, formatting, simple test failures

## Error Recovery

### Build Failures
```
/incremental-dev fix-build
```
1. Analyzes build errors
2. Launches fixing agent
3. Iterates until passing
4. Commits fixes

### Test Failures
```
/incremental-dev fix-tests
```
1. Identifies failing tests
2. Debugs root cause
3. Fixes implementation or tests
4. Verifies all pass

### Merge Conflicts
```
/incremental-dev fix-conflicts
```
1. Pulls latest main
2. Resolves conflicts
3. Re-runs tests
4. Updates PR

## Workflow Monitoring

### Check Sprint Progress
```
/incremental-dev sprint-status
```
Shows all stories and their current state

### Check Story Progress
```
/incremental-dev story-status "[STORY-ID]"
```
Shows implementation, review, and build status

### Check PR Status
```
/incremental-dev pr-status "[PR-NUMBER]"
```
Shows review status, comments, checks

## Examples

### Full Sprint Cycle
```
/incremental-dev sprint "Sprint 24"
→ Plans 10 stories
→ Each story < 500 lines
→ Implements one by one
→ All locally tested
→ All reviewed properly
→ Sprint completed
```

### Single Feature
```
/incremental-dev story "PROJ-456"
→ Picks up from JIRA
→ Implements feature
→ Builds locally
→ Tests pass
→ Creates PR
→ Handles review
→ Merges to main
```

### Fix and Continue
```
/incremental-dev fix-continue
→ Build failing?
  → Fix compilation errors
  → Retry build
→ Tests failing?
  → Fix test issues
  → Retry tests
→ Continue workflow
```

## Configuration

### Set Default Reviewers
```
/incremental-dev config reviewers "[user1,user2]"
```

### Set Build Command
```
/incremental-dev config build "[command]"
```

### Set Test Command
```
/incremental-dev config test "[command]"
```

## Best Practices

1. **One story = One PR** - Never combine stories
2. **Test locally first** - No broken PRs
3. **Address all feedback** - No ignored comments
4. **Small increments** - <500 lines always
5. **Follow patterns** - Match existing code
6. **Document inline** - Update docs with code
7. **Clean commits** - Meaningful messages

## Notes

- Workflow stops if build/tests fail
- No PR created until local success
- All agents coordinate through JIRA
- GitHub and JIRA stay synchronized
- Focus on incremental improvements
- Avoids mass code generation