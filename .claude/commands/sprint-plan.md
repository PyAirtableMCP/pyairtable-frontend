# /sprint-plan

## Purpose
Automated sprint planning with product-manager and architect-reviewer agents creating JIRA stories with proper breakdown

## Command Syntax

### Create New Sprint
```
/sprint-plan create "[sprint-name]" [duration-days]
```

### Plan Existing Sprint
```
/sprint-plan "[sprint-id]"
```

## Sprint Planning Workflow

### Phase 1: Sprint Setup
**Agent: product-manager**

1. **Create Sprint in JIRA**:
   ```bash
   jira sprint create \
     --name "[Sprint Name]" \
     --duration [14] \
     --goal "[Sprint Goal]"
   ```

2. **Review Backlog**:
   - Identify ready stories
   - Check story points
   - Validate acceptance criteria
   - Prioritize by business value

3. **Capacity Planning**:
   - Team velocity: [X] story points
   - Available capacity: [Y] hours
   - Sprint commitment: [Z] stories

### Phase 2: Story Breakdown
**Agents: product-manager + architect-reviewer**

For each epic or large feature:

1. **Break into Stories** (Max 500 lines each):
   ```
   Epic: "User Authentication System"
   ↓
   Stories:
   - PROJ-101: Create login UI component (3 points)
   - PROJ-102: Implement JWT auth endpoint (5 points)
   - PROJ-103: Add password reset flow (3 points)
   - PROJ-104: Create user session management (2 points)
   - PROJ-105: Add remember me functionality (1 point)
   ```

2. **Create Subtasks** for each story:
   ```
   Story: PROJ-101 (Login UI)
   ↓
   Subtasks:
   - Design login form component
   - Add form validation
   - Implement error handling
   - Write unit tests
   - Update documentation
   ```

3. **Technical Validation** (architect-reviewer):
   - Verify technical feasibility
   - Check dependencies
   - Identify risks
   - Suggest implementation approach
   - Ensure <500 lines per story

### Phase 3: JIRA Configuration

**Automated JIRA Updates**:

```bash
# For each story
jira story create \
  --title "[Story Title]" \
  --description "[Requirements]" \
  --acceptance-criteria "[Criteria]" \
  --story-points [points] \
  --sprint [sprint-id] \
  --assignee "unassigned" \
  --labels "incremental,small-pr"

# Add subtasks
jira subtask create \
  --parent [story-id] \
  --title "[Subtask Title]" \
  --estimate [hours]

# Set dependencies
jira link \
  --from [story-1] \
  --to [story-2] \
  --type "blocks"
```

### Phase 4: Story Templates

**Each story must include**:

```markdown
## Story: [PROJ-XXX] [Title]

### Description
[What needs to be built - 2-3 sentences]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Notes
- Max 500 lines of code
- Follow existing patterns
- No breaking changes
- Include tests

### Definition of Done
- [ ] Code implemented (<500 lines)
- [ ] Unit tests written
- [ ] Integration tests pass
- [ ] Build succeeds locally
- [ ] PR created and reviewed
- [ ] Documentation updated
- [ ] Merged to main
```

## Story Sizing Guidelines

### 1 Story Point (100-200 lines)
- Simple UI component
- Minor bug fix
- Config change
- Documentation update

### 2 Story Points (200-300 lines)
- API endpoint
- Database migration
- Feature toggle
- Validation logic

### 3 Story Points (300-400 lines)
- Complete feature flow
- Service integration
- Complex component
- Performance optimization

### 5 Story Points (400-500 lines)
- Multiple components
- End-to-end feature
- System integration
- Major refactoring

### 8+ Story Points
**MUST BE SPLIT** into multiple stories

## Sprint Planning Rules

### ✅ MUST Have
- Clear acceptance criteria
- Story points assigned
- Technical approach defined
- Dependencies identified
- Test strategy included

### ❌ MUST NOT Have
- Stories over 500 lines
- Vague requirements
- Missing test criteria
- Undefined dependencies
- No technical review

## Agent Responsibilities

### product-manager Agent
```
RESPONSIBILITIES:
- Create and configure sprint
- Break down epics into stories
- Write acceptance criteria
- Assign story points
- Prioritize backlog
- Ensure business value

OUTPUTS:
- JIRA sprint created
- Stories properly sized
- Backlog prioritized
- Sprint goal defined
```

### architect-reviewer Agent
```
RESPONSIBILITIES:
- Review technical feasibility
- Validate story sizing
- Identify dependencies
- Suggest implementation
- Ensure incremental approach
- Prevent over-engineering

OUTPUTS:
- Technical approach documented
- Dependencies mapped
- Risks identified
- Implementation notes added
```

## Execution Examples

### Example 1: New Sprint
```
/sprint-plan create "Sprint 24" 14

EXECUTES:
1. product-manager creates Sprint 24 (14 days)
2. Reviews backlog for ready stories
3. architect-reviewer validates technical approach
4. Stories created in JIRA (<500 lines each)
5. Sprint ready for development
```

### Example 2: Story Breakdown
```
/sprint-plan breakdown "User Dashboard"

EXECUTES:
1. Epic analyzed: User Dashboard
2. Broken into 5 stories:
   - Dashboard layout (3 pts)
   - Widget system (5 pts)
   - Data fetching (3 pts)
   - Real-time updates (5 pts)
   - User preferences (2 pts)
3. Each story gets subtasks
4. All added to JIRA
```

### Example 3: Capacity Check
```
/sprint-plan capacity

OUTPUTS:
- Team velocity: 40 points/sprint
- Current commitment: 35 points
- Available capacity: 5 points
- Can add 1-2 more stories
```

## Sprint Monitoring

### Daily Sync
```
/sprint-plan daily
```
- Shows sprint burndown
- Identifies blockers
- Updates JIRA statuses
- Adjusts priorities

### Sprint Health
```
/sprint-plan health
```
- Stories on track: X
- Stories at risk: Y
- Stories blocked: Z
- Sprint completion: N%

## Integration Points

### With Development
After planning:
```
/incremental-dev story "[STORY-ID]"
```
Picks up planned story for implementation

### With Testing
During sprint:
```
/test-suite story "[STORY-ID]"
```
Creates test plan for story

### With Review
Before merge:
```
/review story "[STORY-ID]"
```
Initiates review process

## Success Metrics

- **Story Size**: All <500 lines
- **Sprint Velocity**: Met or exceeded
- **Story Completion**: >90%
- **No Carry-over**: Stories complete in sprint
- **Quality**: No major bugs from sprint

## Notes

- Sprint planning is collaborative between agents
- Stories must be independently deployable
- Each story should provide value
- Technical debt tracked separately
- Retrospectives inform next sprint