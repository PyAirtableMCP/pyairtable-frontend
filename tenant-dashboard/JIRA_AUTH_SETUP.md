# 🔐 JIRA Authentication Setup Guide

## Step 1: Create Your Personal API Token

1. **Login to Atlassian** with your account:
   - Go to: https://3vantage.atlassian.net
   - Login with email: `gerasimovkris@3vantage.com`
   - Use your Atlassian password (not the API token)

2. **Navigate to API Tokens**:
   - Direct link: https://id.atlassian.com/manage-profile/security/api-tokens
   - Or: Click your profile icon → Account settings → Security → API tokens

3. **Create New Token**:
   - Click "Create API token"
   - Label it: "PyAirtable JIRA Integration"
   - Click "Create"
   - **IMPORTANT**: Copy the token immediately (you can't see it again!)

## Step 2: Test Your Authentication

### Option A: Test with cURL (Quick Test)
```bash
# Replace YOUR_TOKEN with your actual token
curl -u gerasimovkris@3vantage.com:YOUR_TOKEN \
  -X GET \
  -H "Accept: application/json" \
  https://3vantage.atlassian.net/rest/api/2/myself
```

If successful, you'll see your user information in JSON format.

### Option B: Test with Python Script
```bash
# Update .jira-config with your new token
nano .jira-config

# Test the connection
source jira-venv/bin/activate
python3 test_jira_auth.py
```

## Step 3: Common Issues and Solutions

### Issue 1: "Client must be authenticated"
**Solution**: The token is invalid or expired. Create a new token.

### Issue 2: Wrong Email Account
**Solution**: Make sure you're creating the token while logged in as `gerasimovkris@3vantage.com`

### Issue 3: Organization Permissions
**Solution**: Ensure your account has permissions to create issues in the SCRUM project:
1. Go to: https://3vantage.atlassian.net/jira/software/projects/SCRUM/settings
2. Check "Permissions" section
3. Verify you have "Create Issues" permission

## Step 4: Manual Token Creation Process

If the provided token doesn't work, here's how to create a new one:

1. **Logout completely** from Atlassian
2. **Login specifically** with `gerasimovkris@3vantage.com`
3. **Go to API tokens**: https://id.atlassian.com/manage-profile/security/api-tokens
4. **Delete old tokens** if any exist for PyAirtable
5. **Create fresh token** with label "PyAirtable-2025"
6. **Copy immediately** and update `.jira-config`

## Step 5: Verify Token Format

Your token should look like:
```
ATCTT3xFfGN0[long string of characters]=EB3D5A71
```

Make sure:
- No extra spaces before/after
- Complete token is copied (check for `=` near the end)
- No line breaks in the middle

## Step 6: Alternative Authentication Methods

### Using Basic Auth Header
If the Python library has issues, try direct API calls:

```python
import requests
import base64

email = "gerasimovkris@3vantage.com"
api_token = "YOUR_TOKEN_HERE"

# Create auth header
auth = base64.b64encode(f"{email}:{api_token}".encode()).decode()
headers = {
    "Authorization": f"Basic {auth}",
    "Accept": "application/json"
}

# Test connection
response = requests.get(
    "https://3vantage.atlassian.net/rest/api/2/myself",
    headers=headers
)

print(response.status_code)
print(response.json())
```

## Step 7: Once Authentication Works

Run the task creation script:
```bash
source jira-venv/bin/activate
python3 create_jira_tasks_scrum.py
```

This will create all 120 remediation tasks in your SCRUM project.

## Need Help?

If authentication still fails:
1. Verify your Atlassian account email
2. Check if 2FA is enabled (may need app-specific token)
3. Ensure your account is active in the 3vantage organization
4. Try logging into JIRA web interface first

## Authentication Test Endpoints

Test these URLs in your browser while logged in:
- User info: https://3vantage.atlassian.net/rest/api/2/myself
- Project info: https://3vantage.atlassian.net/rest/api/2/project/SCRUM
- Permissions: https://3vantage.atlassian.net/rest/api/2/mypermissions?projectKey=SCRUM

If you can access these in browser but not via API, the issue is with the token.