# JIRA Manual Authentication Steps

## Step 1: Browser Login
1. Open this URL in your browser: https://3vantage.atlassian.net
2. Login with your credentials (gerasimovkris@3vantage.com)
3. Make sure you can access the JIRA dashboard

## Step 2: Create API Token (If Not Working)
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Delete the old "jira_api_key" token if it exists
3. Create a new token called "PyAirtable-CLI"
4. Copy the new token immediately

## Step 3: Test Direct API Access
Open this URL while logged in:
https://3vantage.atlassian.net/rest/api/2/myself

You should see your user info in JSON format. If you get an error, the account permissions might be restricted.

## Step 4: Check Project Access
Visit your project board:
https://3vantage.atlassian.net/jira/software/projects

Note the actual project key (it might not be "SCRUM" - could be something else like "PROJ", "DEV", etc.)

## Step 5: Manual Task Creation (Fallback)
If the API continues to fail, you can:
1. Copy the task list from `.jira/sprint-25-emergency.json`
2. Use JIRA's bulk create feature:
   - Go to Issues → Create multiple issues
   - Use CSV import or copy-paste the tasks

## Alternative: Use OAuth Instead
If API tokens aren't working, you might need OAuth:
1. Go to: https://3vantage.atlassian.net/secure/admin/oauth-consumers
2. Create an OAuth consumer
3. Use OAuth authentication instead of API token

## Current Issue
The API token authentication is failing with 401 Unauthorized. This typically means:
- The token was created for a different email
- The account doesn't have API access permissions
- 2FA or SSO is required and blocking API access

## Quick Fix Attempt
Try creating the token while in an incognito/private browser window:
1. Open incognito browser
2. Login fresh to https://3vantage.atlassian.net
3. Create new API token
4. Test immediately with:
```bash
curl -u gerasimovkris@3vantage.com:YOUR_NEW_TOKEN \
  https://3vantage.atlassian.net/rest/api/2/myself
```

If this returns your user data, update the token in `.jira-config` and run the scripts again.