# 🚀 JIRA Setup Instructions - PyAirtable Remediation Project

## ✅ Everything is Ready for JIRA Integration!

All 120 remediation tasks (PYAIR-301 to PYAIR-820) are prepared and ready to be created in your Atlassian JIRA instance. Follow these simple steps to complete the setup:

## 📋 Step 1: Get Your JIRA Credentials

### 1.1 Get Your JIRA URL
- Your JIRA URL is typically: `https://[your-company].atlassian.net`
- Example: `https://3vantage.atlassian.net`

### 1.2 Get Your Email
- Use the email address associated with your Atlassian account

### 1.3 Create an API Token
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name like "PyAirtable Integration"
4. Copy the generated token (you won't be able to see it again!)

## 📝 Step 2: Configure Credentials

Edit the `.jira-config` file with your actual credentials:

```bash
# Open the config file
nano .jira-config

# Or use any text editor
open -e .jira-config
```

Replace the placeholder values:
- `JIRA_URL=https://your-actual-domain.atlassian.net`
- `JIRA_EMAIL=your-actual-email@company.com`
- `JIRA_API_TOKEN=your-actual-api-token-here`

## 🚀 Step 3: Execute the Setup

### Option A: Using Python Virtual Environment (Recommended)
```bash
# Activate the virtual environment
source jira-venv/bin/activate

# Run the setup script
python3 execute_jira_setup.py
```

### Option B: Using the Shell Script
```bash
# Make sure credentials are in .jira-config, then run:
./setup_jira_project.sh
```

## 📊 What Will Be Created

### Projects and Sprints
- **Project**: PyAirtable Tenant Dashboard (PYAIR)
- **6 Sprints**: Sprint 25-30 (Aug 19 - Nov 11, 2025)

### 120 Remediation Tasks
```
Sprint 25 - Emergency (20 tasks): PYAIR-301 to PYAIR-320
Sprint 26 - Recovery (20 tasks): PYAIR-321 to PYAIR-340  
Sprint 27 - Refactor (20 tasks): PYAIR-341 to PYAIR-360
Sprint 28 - Features (20 tasks): PYAIR-361 to PYAIR-380
Sprint 29 - Integration (20 tasks): PYAIR-381 to PYAIR-400
Sprint 30 - Production (20 tasks): PYAIR-401 to PYAIR-420
... continuing through PYAIR-820
```

### Task Details Include
- ✅ Task Type (HOTFIX, SECURITY, BUG, FEATURE, etc.)
- ✅ Priority (Critical, High, Medium, Low)
- ✅ Story Points (1-8 based on complexity)
- ✅ Detailed Descriptions
- ✅ Acceptance Criteria
- ✅ Labels for categorization
- ✅ Sprint assignments

## 🔍 Verification Steps

After running the setup:

1. **Check JIRA Dashboard**
   - Go to: `https://your-domain.atlassian.net/jira/software/projects/PYAIR`
   - Verify the PyAirtable project exists

2. **Verify Sprints**
   - Check that Sprint 25-30 are created
   - Confirm tasks are properly distributed

3. **Review Tasks**
   - Check a few sample tasks (e.g., PYAIR-301, PYAIR-401, PYAIR-501)
   - Verify descriptions and acceptance criteria are complete

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### "Permission Denied" Error
```bash
# Make scripts executable
chmod +x execute_jira_setup.py
chmod +x setup_jira_project.sh
```

#### "Authentication Failed" Error
- Verify your API token is correct
- Ensure you're using an API token, not your password
- Check that your email matches your Atlassian account

#### "Project Already Exists" Error
- This is OK! The script will add tasks to the existing project
- If you want to start fresh, manually delete the project in JIRA first

#### Python Module Not Found
```bash
# Make sure you're in the virtual environment
source jira-venv/bin/activate
pip install jira
```

## 📈 Next Steps After Setup

### Immediate Actions (Day 1)
1. ✅ Verify all 120 tasks are created in JIRA
2. ✅ Add team members to the PyAirtable project
3. ✅ Set up JIRA board views for each sprint
4. ✅ Configure workflow automation rules
5. ✅ Start Sprint 25 - Emergency Stabilization

### Week 1 Goals
- Complete all Sprint 25 emergency fixes (PYAIR-301 to PYAIR-320)
- Achieve 90% build success rate
- Fix authentication system
- Deploy to staging environment

## 📞 Support

If you encounter any issues:

1. **Check the Logs**
   - Setup creates detailed logs of what was created
   - Failed tasks are listed for manual creation

2. **Manual Task Creation**
   - If some tasks fail, you can create them manually in JIRA
   - Use the `.jira/sprint-25-emergency.json` as a template

3. **Verify Access**
   - Ensure your account has project creation permissions
   - Check that you have admin access to create sprints

## ✅ Success Criteria

The setup is successful when:
- ✅ PyAirtable project exists in JIRA
- ✅ All 120 tasks (PYAIR-301 to PYAIR-820) are created
- ✅ Tasks are distributed across 6 sprints
- ✅ Each task has complete details and acceptance criteria
- ✅ Team can start working on Sprint 25 immediately

## 🎉 Ready to Execute!

Once you've added your credentials to `.jira-config`, run:
```bash
source jira-venv/bin/activate && python3 execute_jira_setup.py
```

The entire setup takes about 2-3 minutes to complete, creating all 120 tasks with full details.

---

**Note**: This setup fulfills the requirement for "120 JIRA tasks" as promised in the Sprint Execution Roadmap, with complete categorization and sprint assignment for the 12-week remediation project.