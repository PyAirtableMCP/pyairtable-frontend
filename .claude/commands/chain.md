# /chain

## Purpose
Execute multiple slash commands in sequence with intelligent flow control

## Basic Syntax

### Simple Chain
```
/chain [command1] → [command2] → [command3]
```

### Parallel Chain
```
/chain [command1] + [command2] + [command3]
```

### Conditional Chain
```
/chain if [condition] then [command1] else [command2]
```

## Chain Patterns

### 1. Sequential Execution
```
/chain sequential
  /context-prime →
  /todo list →
  /clean →
  /commit →
  /create-pr
```

### 2. Parallel Execution
```
/chain parallel
  /update-docs +
  /add-to-changelog +
  /clean
THEN /commit
```

### 3. Conditional Branching
```
/chain conditional
  IF tests_pass:
    /commit → /create-pr
  ELSE:
    /fix-github-issue → /chain sequential
```

### 4. Loop Execution
```
/chain loop 3 times
  /clean →
  /test →
  /commit
```

## Pre-Built Chains

### 🌅 Morning Startup
```
/chain morning
```
Executes:
1. /context-prime
2. git pull
3. /todo list
4. Check CI status
5. Run tests

### 🌙 End of Day
```
/chain eod
```
Executes:
1. /todo update
2. /clean
3. /commit
4. Push changes
5. /add-to-changelog

### 🚀 Feature Complete
```
/chain feature-done
```
Executes:
1. /clean
2. Run all tests
3. /update-docs
4. /add-to-changelog
5. /commit
6. /create-pr

### 🐛 Bug Fix Flow
```
/chain bugfix [issue]
```
Executes:
1. /fix-github-issue [issue]
2. Write fix
3. Add tests
4. /clean
5. /commit
6. /create-pr

### 📦 Release Preparation
```
/chain release-prep [version]
```
Executes:
1. /pr-review
2. Merge approved PRs
3. /update-docs
4. /add-to-changelog
5. Run full test suite
6. /release [version]

### 🔍 Code Review
```
/chain review
```
Executes:
1. /context-prime
2. /pr-review
3. Run tests
4. Check coverage
5. Security scan

## Advanced Chains

### Dynamic Chain Building
```
/chain dynamic
  START: /context-prime
  FOR each todo:
    IF todo.type = "bug":
      /fix-github-issue
    ELIF todo.type = "feature":
      /create-prd
    ELSE:
      /todo done
  END: /commit all
```

### Error Handling
```
/chain safe
  TRY:
    /test →
    /commit →
    /create-pr
  CATCH:
    /clean →
    Fix errors →
    RETRY
```

### Nested Chains
```
/chain nested
  /chain morning →
  /chain feature-done →
  /chain eod
```

### Time-Based Chains
```
/chain scheduled
  EVERY 2 hours:
    /todo list
    /commit
  AT end_of_day:
    /chain eod
```

## Chain Control Commands

### Variables in Chains
```
/chain with-vars
  SET version = "2.0.0"
  SET issue = "123"
  /fix-github-issue $issue →
  /commit "Fix issue #$issue" →
  /release $version
```

### Interactive Chains
```
/chain interactive
  /context-prime →
  ASK "Which feature?" →
  /create-prd $answer →
  ASK "Create PR now?" →
  IF yes: /create-pr
```

### Retry Logic
```
/chain retry
  RETRY 3 times:
    Run tests
    IF pass: BREAK
    ELSE: Fix issues
  /commit
```

## Chain Templates

### 1. Full Development Cycle
```
/chain dev-cycle "[feature]"
```
1. /create-prd
2. /create-jtbd  
3. /todo (break down tasks)
4. Development
5. /clean
6. Tests
7. /update-docs
8. /commit
9. /create-pr
10. /pr-review

### 2. Hotfix Emergency
```
/chain hotfix "[issue]"
```
1. Create hotfix branch
2. /fix-github-issue
3. Emergency fix
4. Minimal tests
5. /commit
6. /create-pr (expedited)
7. Deploy immediately

### 3. Documentation Update
```
/chain docs-update
```
1. /update-docs
2. Generate API docs
3. Update README
4. /add-to-changelog
5. /commit
6. /create-pr

### 4. Quality Improvement
```
/chain quality
```
1. /context-prime
2. Run linter
3. /clean
4. Run tests
5. Check coverage
6. Fix issues
7. /commit

## Conditional Logic Examples

### Based on Test Results
```
/chain test-driven
  Run tests
  IF all_pass:
    /commit → /create-pr
  ELIF some_fail:
    Fix failing tests → RETRY
  ELSE:
    /todo add "Fix broken tests"
```

### Based on Day of Week
```
/chain weekly
  IF monday:
    /chain morning → /todo plan-week
  ELIF friday:
    /chain review → /chain eod
  ELSE:
    /chain morning → Development
```

### Based on Branch
```
/chain branch-aware
  IF branch = "main":
    Protected - no direct commits
  ELIF branch = "develop":
    /chain feature-done
  ELSE:
    /commit → Push
```

## Parallel Execution Examples

### Multiple Documentation Updates
```
/chain parallel-docs
  PARALLEL:
    Update README +
    Update API docs +
    Update CHANGELOG +
    Update wiki
  THEN: /commit "Documentation updates"
```

### Multi-Agent Chain
```
/chain multi-agent
  PARALLEL:
    Agent: frontend-architect +
    Agent: backend-architect +
    Agent: database-optimizer
  WAIT_ALL
  THEN: /commit → /create-pr
```

## Usage Examples

### Simple
```
/chain /clean → /commit → /push
```

### With Conditions
```
/chain if tests_pass then /create-pr else /fix
```

### Complex
```
/chain morning → develop → test → review → eod
```

### Custom
```
/chain custom [
  /context-prime,
  work_on_feature,
  /clean,
  /test,
  if(success) /commit /create-pr,
  else fix_and_retry
]
```

## Best Practices

1. **Start simple**: Begin with 2-3 command chains
2. **Use pre-built chains**: Leverage existing templates
3. **Add error handling**: Use TRY/CATCH for critical chains
4. **Document custom chains**: Save successful patterns
5. **Monitor execution**: Watch for chain failures
6. **Break long chains**: Split into logical sub-chains

## Notes

- Chains stop on first failure unless error handling is specified
- Each command in chain has access to previous command's output
- Chains can be saved and reused
- Maximum chain depth: 50 commands
- Parallel execution limited to 10 simultaneous commands