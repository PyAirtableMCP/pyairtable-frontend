# /incremental-dev

## Purpose
Automated incremental development workflow with JIRA integration, GitHub PRs, and multi-agent coordination for small, focused changes that improve without disrupting

## Core Philosophy
- **Small, incremental changes** - Each PR should be <500 lines
- **Build and test locally** - Verify everything works before PR
- **Address all feedback** - No PR merged with unresolved comments
- **Help, don't distort** - Improvements that maintain existing patterns

## Master Workflow Pipeline

### Phase 1: Planning & Architecture
```
/incremental-dev sprint "[sprint-name]"
```

**Agents Involved:**
1. **product-manager** agent:
   - Creates JIRA sprint
   - Breaks down epic into stories
   - Creates subtasks for each story
   - Prioritizes backlog
   - Sets story points

2. **architect-reviewer** agent:
   - Reviews technical requirements
   - Defines system boundaries
   - Identifies dependencies
   - Creates technical design docs
   - Approves story breakdown

**JIRA Integration:**
```bash
# Automated JIRA commands executed:
gh api /repos/{owner}/{repo}/issues -X POST
jira create sprint "[name]"
jira create story "[title]" --epic [epic-id]
jira create subtask "[title]" --story [story-id]
jira prioritize [story-id] --priority [1-5]
```

### Phase 2: Implementation
```
/incremental-dev implement "[story-id]"
```

**Workflow Steps:**

1. **Pick up story from JIRA**:
   ```
   jira assign [story-id] --to implementing-agent
   jira transition [story-id] --to "In Progress"
   ```

2. **Create feature branch**:
   ```
   git checkout -b feat/[story-id]-[brief-description]
   ```

3. **Implementation by specialized agent**:
   - If frontend: `frontend-developer` agent
   - If backend: `backend-architect` agent
   - If database: `database-optimizer` agent
   - If API: `api-developer` agent

4. **Incremental changes only**:
   - Max 500 lines per PR
   - Single responsibility per change
   - Maintain existing patterns
   - No mass refactoring

### Phase 3: Local Build & Test
```
/incremental-dev build-test
```

**Automatic Build Detection & Execution:**

```javascript
// Detect project type and run appropriate build
if (file.exists("pom.xml")) {
  run("mvn clean install")
} else if (file.exists("package.json")) {
  run("npm install && npm run build")
} else if (file.exists("build.gradle")) {
  run("gradle clean build")
} else if (file.exists("go.mod")) {
  run("go build ./... && go test ./...")
} else if (file.exists("Cargo.toml")) {
  run("cargo build && cargo test")
} else if (file.exists("requirements.txt")) {
  run("pip install -r requirements.txt && pytest")
}
```

**Error Handling Loop:**
```
WHILE (build_fails || tests_fail) {
  1. Capture error output
  2. Launch debugger agent
  3. Fix compilation errors
  4. Fix test failures
  5. Re-run build
  6. Continue until success
}
```

### Phase 4: Pull Request Creation
```
/incremental-dev create-pr "[story-id]"
```

**PR Template:**
```markdown
## 🎯 JIRA Story: [STORY-ID]
[Link to JIRA ticket]

## 📝 Changes
- [Specific change 1]
- [Specific change 2]
- [Max 5 bullet points]

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No regression issues

## 📊 Impact
- Lines changed: [< 500]
- Files affected: [< 10]
- Breaking changes: None

## ✅ Checklist
- [ ] Follows existing patterns
- [ ] No mass code generation
- [ ] Incremental improvement
- [ ] Builds successfully locally
- [ ] All tests pass
```

**GitHub Commands:**
```bash
gh pr create \
  --title "[$STORY-ID] Brief description" \
  --body "$PR_TEMPLATE" \
  --assignee implementing-agent \
  --reviewer architect-agent,code-reviewer
```

### Phase 5: Code Review
```
/incremental-dev review "[pr-number]"
```

**Review Agents:**
1. **architect-reviewer** agent:
   - Validates architecture decisions
   - Checks pattern consistency
   - Ensures no over-engineering
   - Verifies incremental approach

2. **code-reviewer** agent:
   - Code quality checks
   - Best practices validation
   - Security review
   - Performance implications

**Review Actions:**
```bash
# Add review comments
gh pr review [pr-number] --comment -b "[feedback]"

# Request changes if needed
gh pr review [pr-number] --request-changes -b "[required changes]"

# Track in JIRA
jira comment [story-id] "PR review feedback: [summary]"
```

### Phase 6: Address Feedback
```
/incremental-dev address-feedback "[pr-number]"
```

**Feedback Loop:**
```
FOR each review_comment {
  1. implementing-agent reads comment
  2. Makes required change
  3. Commits with message: "Address review: [comment-summary]"
  4. Responds to comment: "Fixed in [commit-hash]"
  5. Marks comment as resolved
}
```

**Validation:**
- Re-run build locally
- Ensure tests still pass
- Push changes
- Request re-review

### Phase 7: Merge & Complete
```
/incremental-dev merge "[pr-number]"
```

**Final Steps:**
1. **All checks pass**:
   - CI/CD green
   - All reviews approved
   - No unresolved comments
   - Build successful

2. **Merge PR**:
   ```bash
   gh pr merge [pr-number] --squash --delete-branch
   ```

3. **Update JIRA**:
   ```bash
   jira transition [story-id] --to "Done"
   jira comment [story-id] "Merged in PR #[pr-number]"
   ```

4. **Clean up**:
   ```bash
   git checkout main
   git pull origin main
   git branch -d feat/[story-id]
   ```

## Incremental Development Rules

### ✅ DO:
- Make one logical change per PR
- Keep PRs under 500 lines
- Follow existing code patterns
- Write tests for new code
- Fix broken tests immediately
- Address all review comments
- Use meaningful commit messages
- Update documentation inline

### ❌ DON'T:
- Generate massive boilerplate
- Refactor unrelated code
- Change formatting wholesale
- Skip local testing
- Ignore build failures
- Merge with failing tests
- Leave comments unresolved
- Make breaking changes without discussion

## Agent Coordination Matrix

| Phase | Lead Agent | Supporting Agents | JIRA Status |
|-------|------------|-------------------|-------------|
| Planning | product-manager | architect-reviewer | To Do |
| Design | architect-reviewer | domain experts | In Design |
| Implementation | [specialized]-developer | test-automator | In Progress |
| Testing | qa-manager | test-automator | In Testing |
| Review | code-reviewer | architect-reviewer | In Review |
| Merge | release-manager | devops-engineer | Done |

## Automation Triggers

### Sprint Start
```
TRIGGER: New sprint created in JIRA
ACTIONS:
  1. product-manager: Plan sprint
  2. architect-reviewer: Technical review
  3. Create implementation tasks
  4. Assign to agents
```

### Story Ready
```
TRIGGER: Story moved to "Ready for Dev"
ACTIONS:
  1. Assign to appropriate agent
  2. Create feature branch
  3. Start implementation
```

### PR Created
```
TRIGGER: New PR opened
ACTIONS:
  1. Run build checks
  2. Assign reviewers
  3. Update JIRA
  4. Start review cycle
```

### Review Complete
```
TRIGGER: All reviews approved
ACTIONS:
  1. Final build check
  2. Merge PR
  3. Update JIRA
  4. Deploy (if applicable)
```

## Build Commands by Language

### Java/Maven
```bash
mvn clean install
mvn test
mvn verify
```

### JavaScript/Node
```bash
npm ci
npm run build
npm test
npm run lint
```

### Python
```bash
pip install -r requirements.txt
python -m pytest
python -m black . --check
python -m flake8
```

### Go
```bash
go mod download
go build ./...
go test ./...
go vet ./...
```

### Rust
```bash
cargo build --release
cargo test
cargo clippy
```

## Error Recovery Patterns

### Build Failure
```
IF build_fails:
  1. Capture error log
  2. Launch debugger agent
  3. Fix syntax/compilation errors
  4. Retry build
  5. If still fails: Create help ticket
```

### Test Failure
```
IF tests_fail:
  1. Identify failing tests
  2. Launch test-automator agent
  3. Fix test issues
  4. Re-run test suite
  5. Verify all pass
```

### Merge Conflict
```
IF merge_conflict:
  1. Pull latest main
  2. Resolve conflicts locally
  3. Re-test everything
  4. Push resolution
  5. Request re-review
```

## Success Metrics

- **PR Size**: < 500 lines
- **Build Success**: 100% before PR
- **Test Coverage**: Maintained or improved
- **Review Turnaround**: < 4 hours
- **Comments Resolved**: 100%
- **JIRA Accuracy**: All tickets updated
- **Deployment Success**: No rollbacks

## Example Usage

### Complete Sprint Workflow
```
/incremental-dev sprint "Sprint 23"
```
Automatically:
1. Creates sprint in JIRA
2. Plans stories with product-manager
3. Reviews with architect
4. Assigns implementation tasks
5. Monitors progress
6. Handles PRs and reviews
7. Closes sprint when complete

### Single Story Implementation
```
/incremental-dev story "PROJ-123"
```
Automatically:
1. Picks up story from JIRA
2. Creates branch
3. Implements changes (<500 lines)
4. Builds and tests locally
5. Fixes any issues
6. Creates PR
7. Manages review cycle
8. Merges when approved

### Fix Build Errors
```
/incremental-dev fix-build
```
Automatically:
1. Identifies build errors
2. Launches appropriate fixing agent
3. Iterates until build passes
4. Commits fixes
5. Updates PR

## Notes

- This workflow enforces incremental development
- No PR merged without passing builds
- All agents coordinate through JIRA
- GitHub and JIRA stay synchronized
- Focus on helping, not disrupting
- Small changes compound to big improvements