#!/usr/bin/env python3
"""
Temporary mock auth service to bypass the UUID/int type mismatch issue
in the platform-services while tests are run.
"""

import json
import os
import jwt
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Environment variable validation
def validate_required_env_vars():
    """Validate that all required environment variables are present"""
    required_vars = ["JWT_SECRET"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Validate environment variables on startup
validate_required_env_vars()

app = FastAPI(title="Mock Auth Service")

# JWT secret from environment variable (required)
JWT_SECRET = os.getenv("JWT_SECRET")

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

# Mock user database
MOCK_USERS = {
    "testuser@example.com": {
        "id": 1,  # Using integer ID as expected by NextAuth
        "email": "testuser@example.com",
        "password": "TestPassword123",
        "role": "user",
        "tenant_id": "test-tenant-1"
    }
}

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Mock login endpoint that returns proper JWT tokens"""
    user = MOCK_USERS.get(request.email)
    
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT payload
    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "tenant_id": user["tenant_id"],
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow()
    }
    
    # Generate tokens
    access_token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    refresh_token = jwt.encode({**payload, "type": "refresh"}, JWT_SECRET, algorithm="HS256")
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@app.post("/auth/register")
async def register(request: LoginRequest):
    """Mock register endpoint"""
    if request.email in MOCK_USERS:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    MOCK_USERS[request.email] = {
        "id": len(MOCK_USERS) + 1,
        "email": request.email,
        "password": request.password,
        "role": "user",
        "tenant_id": f"tenant-{len(MOCK_USERS) + 1}"
    }
    
    return {"message": "User registered successfully"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "mock-auth-service"}

if __name__ == "__main__":
    print("Starting mock auth service on port 8009...")
    print("This is a temporary solution to bypass UUID/int type mismatch in platform-services")
    uvicorn.run(app, host="0.0.0.0", port=8009)