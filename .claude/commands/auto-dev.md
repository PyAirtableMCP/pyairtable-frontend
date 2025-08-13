# /auto-dev

## Purpose
Fully automated development lifecycle from JIRA story to merged PR with zero manual intervention

## Master Command

### Complete Automation
```
/auto-dev complete "[STORY-ID]"
```
Picks up story → Implements → Builds → Tests → PRs → Reviews → Fixes → Merges

### Sprint Automation
```
/auto-dev sprint "[SPRINT-ID]"
```
Automates entire sprint from planning to completion

## Full Automation Pipeline

### Stage 1: Story Pickup
```
/auto-dev start "[STORY-ID]"
```

**Automatic Actions:**
1. Check JIRA for story details
2. Assign to appropriate agent based on labels
3. Move to "In Progress"
4. Create feature branch
5. Set up local environment

### Stage 2: Implementation
```
/auto-dev implement
```

**Agent Selection Matrix:**
| Story Label | Primary Agent | Support Agents |
|------------|---------------|----------------|
| frontend | frontend-developer | ui-designer, ux-researcher |
| backend | backend-architect | api-developer, database-optimizer |
| fullstack | fullstack-engineer | frontend-developer, backend-architect |
| mobile | mobile-developer | ui-designer, api-developer |
| devops | deployment-engineer | sre-engineer, cloud-architect |
| security | security-auditor | penetration-tester |

**Implementation Rules:**
- Max 500 lines per story
- Follow existing patterns
- Write tests alongside code
- Update docs inline
- No generated boilerplate

### Stage 3: Build & Test Loop
```
/auto-dev build-test-fix
```

**Automatic Build Detection:**
```python
BUILD_COMMANDS = {
    "pom.xml": "mvn clean install",
    "package.json": "npm ci && npm run build && npm test",
    "build.gradle": "gradle clean build test",
    "go.mod": "go build ./... && go test ./...",
    "Cargo.toml": "cargo build && cargo test",
    "requirements.txt": "pip install -r requirements.txt && pytest",
    "Gemfile": "bundle install && rake test",
    "mix.exs": "mix deps.get && mix test"
}
```

**Error Resolution Loop:**
```
WHILE not build_success:
    errors = capture_build_output()
    
    IF compilation_error:
        debugger_agent.fix_syntax()
    ELIF dependency_error:
        dependency_manager.resolve()
    ELIF test_failure:
        test_automator.fix_tests()
    ELSE:
        escalate_to_human()
    
    retry_build()
END
```

### Stage 4: Pull Request
```
/auto-dev create-pr
```

**PR Automation:**
1. Generate PR title from JIRA story
2. Create comprehensive description
3. Link to JIRA automatically
4. Assign reviewers based on code ownership
5. Add appropriate labels
6. Run PR checks

**PR Template Auto-Fill:**
```markdown
## JIRA: [AUTO-LINKED]
## Changes: [AUTO-GENERATED FROM DIFF]
## Tests: [AUTO-DETECTED FROM TEST FILES]
## Impact: [AUTO-CALCULATED]
## Breaking Changes: [AUTO-ANALYZED]
```

### Stage 5: Review Management
```
/auto-dev handle-review
```

**Review Response Automation:**
```
FOR each review_comment:
    category = analyze_comment()
    
    SWITCH category:
        CASE "style":
            auto_fix_formatting()
        CASE "logic":
            implementing_agent.address()
        CASE "test":
            test_automator.add_test()
        CASE "docs":
            technical_writer.update()
        CASE "question":
            generate_response()
    
    commit_fix()
    respond_to_comment()
END
```

### Stage 6: Merge Automation
```
/auto-dev merge
```

**Pre-Merge Checklist:**
- [ ] All CI checks green
- [ ] All reviews approved
- [ ] All comments resolved
- [ ] No merge conflicts
- [ ] JIRA story accepted

**Merge Actions:**
1. Squash commits with meaningful message
2. Delete feature branch
3. Update JIRA to "Done"
4. Trigger deployment (if configured)
5. Notify team

## Continuous Automation

### Sprint Autopilot
```
/auto-dev autopilot
```

**Runs continuously:**
```python
while sprint_active:
    # Check for ready stories
    ready_stories = jira.get_stories(status="Ready")
    
    for story in ready_stories:
        # Assign to available agent
        agent = find_available_agent(story.type)
        
        # Execute full pipeline
        auto_dev_complete(story.id)
        
        # Update sprint progress
        update_burndown_chart()
    
    # Daily standup report
    if time.is_daily_standup():
        generate_progress_report()
    
    sleep(check_interval)
```

### Parallel Story Processing
```
/auto-dev parallel [count]
```

Process multiple stories simultaneously:
```
PARALLEL_EXECUTION:
    Thread1: Story-101 → frontend-developer
    Thread2: Story-102 → backend-architect
    Thread3: Story-103 → database-optimizer
    
    SYNC_POINT: All PRs created
    
    REVIEW_PHASE: Sequential reviews
    
    MERGE_ORDER: Based on dependencies
```

## Smart Automation Features

### Dependency Resolution
```
/auto-dev resolve-deps
```
- Detects story dependencies
- Orders implementation
- Manages merge sequence
- Prevents conflicts

### Conflict Prevention
```
/auto-dev prevent-conflicts
```
- Monitors parallel development
- Alerts on file overlaps
- Suggests merge order
- Auto-rebases when safe

### Quality Gates
```
/auto-dev quality-check
```
Enforces:
- Code coverage >80%
- No security vulnerabilities
- Performance benchmarks met
- Documentation complete
- No technical debt increase

## Monitoring & Reporting

### Real-time Dashboard
```
/auto-dev dashboard
```
Shows:
- Stories in progress
- Build status
- PR reviews pending
- Merge queue
- Sprint velocity

### Daily Report
```
/auto-dev daily-report
```
Generates:
- Completed stories
- Blocked items
- Failed builds
- Review bottlenecks
- Tomorrow's plan

### Sprint Metrics
```
/auto-dev metrics
```
Tracks:
- Story completion rate
- Average PR size
- Build success rate
- Review turnaround time
- Defect rate

## Configuration

### Set Automation Level
```
/auto-dev config level [1-5]
```
1. Manual (just notifications)
2. Semi-auto (requires approval)
3. Auto with confirmation
4. Full auto with escalation
5. Autonomous (no intervention)

### Configure Agents
```
/auto-dev config agents
```
Set preferred agents for:
- Frontend work
- Backend work
- Testing
- Reviews
- Documentation

### Set Quality Thresholds
```
/auto-dev config quality
```
- Min test coverage: 80%
- Max PR size: 500 lines
- Max build time: 5 minutes
- Required reviewers: 2

## Error Handling

### Escalation Rules
```
IF error_count > 3:
    pause_automation()
    notify_human()
    await_intervention()
    
IF critical_error:
    rollback_changes()
    create_incident()
    alert_team()
```

### Recovery Procedures
```
/auto-dev recover
```
1. Assess current state
2. Rollback if needed
3. Fix root cause
4. Restart pipeline
5. Verify success

## Examples

### Single Story Automation
```
/auto-dev complete "PROJ-123"

OUTPUT:
✓ Story picked up by backend-architect
✓ Implementation complete (423 lines)
✓ Build successful (mvn clean install)
✓ Tests passing (48/48)
✓ PR #456 created
✓ Reviews completed (2 approvals)
✓ Feedback addressed (3 comments)
✓ Merged to main
✓ JIRA updated to Done
⏱ Total time: 2h 34m
```

### Sprint Automation
```
/auto-dev sprint "Sprint-24"

OUTPUT:
Sprint 24 Progress:
- Total Stories: 15
- Completed: 12 ✓
- In Progress: 2 ⚡
- Blocked: 1 ⚠️
- Velocity: 38/40 points
- ETA: On track for Friday
```

### Parallel Processing
```
/auto-dev parallel 3

EXECUTING:
→ Thread 1: PROJ-123 (frontend)
→ Thread 2: PROJ-124 (backend)
→ Thread 3: PROJ-125 (database)

STATUS:
✓ PROJ-123: PR created
⚡ PROJ-124: Building...
⚡ PROJ-125: Implementing...
```

## Best Practices

1. **Start with semi-auto** - Build confidence
2. **Monitor closely initially** - Catch patterns
3. **Set conservative limits** - <300 lines initially
4. **Review automation logs** - Learn from issues
5. **Gradually increase automation** - As confidence grows
6. **Keep humans in loop** - For critical decisions
7. **Document failures** - Improve automation

## Notes

- Automation pauses on critical errors
- Human override always available
- All actions logged for audit
- JIRA is source of truth
- GitHub PR is implementation record
- Focus on small, safe changes
- Continuous improvement mindset