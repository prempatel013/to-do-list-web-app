from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from app.schemas import UserCreate, UserLogin, UserOut, Token
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.db import db
from bson import ObjectId
import os
from dotenv import load_dotenv
import logging
import secrets
from datetime import datetime, timedelta
import hashlib
import smtplib
from email.mime.text import MIMEText

load_dotenv()

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user: UserCreate, response: Response):
    try:
        # Check if user already exists
        existing_user = await db["users"].find_one({"email": user.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        hashed_password = get_password_hash(user.password)
        user_doc = {
            "name": user.name,
            "email": user.email,
            "hashed_password": hashed_password,
            "avatar": None,
        }
        
        result = await db["users"].insert_one(user_doc)
        if not result.inserted_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

        # Create access token
        access_token = create_access_token(data={"sub": str(result.inserted_id)})
        
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during registration"
        )

@router.post("/login", response_model=Token)
async def login(user: UserLogin, response: Response):
    try:
        # Find user
        db_user = await db["users"].find_one({"email": user.email})
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Verify password
        if not verify_password(user.password, db_user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Create access token
        access_token = create_access_token(data={"sub": str(db_user["_id"])})
        logging.info(f"Created access token: {access_token}")
        logging.info(f"Token segments: {access_token.split('.')}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during login"
        )

@router.post("/forgot-password")
async def forgot_password(request: Request):
    try:
        body = await request.json()
        email = body.get("email")
        name = body.get("name")

        if not email or not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and name are required"
            )

        user = await db["users"].find_one({"email": email, "name": name})

        if not user:
            # Return a generic message even if user is not found for security reasons
            return {"message": "If an account with that email and name exists, a password reset link has been sent.", "success": False}

        # Generate a password reset token
        token = secrets.token_hex(32)
        hashed_token = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(hours=1) # Token valid for 1 hour

        # Store the hashed token and expiration in the user document
        await db["users"].update_one(
            {"_id": user["_id"]},
            {"$set": {"reset_password_token": hashed_token, "reset_password_expires": expires_at}}
        )

        # TODO: Implement sending a password reset email with the token here
        # The email should contain a link like: YOUR_FRONTEND_URL/reset-password?token={token}
        
        # Email sending logic using Gmail (requires configuring App Passwords if 2FA is on)
        gmail_user = os.getenv("GMAIL_USER")
        gmail_app_password = os.getenv("GMAIL_APP_PASSWORD")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000") # Default to localhost
        
        if gmail_user and gmail_app_password:
            try:
                reset_link = f"{frontend_url}/reset-password?token={token}"
                subject = "Password Reset Request"
                body = f"Hello {user['name']}, \n\nClick the link below to reset your password: {reset_link}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.\n\nTaskSphere Team"
                
                msg = MIMEText(body)
                msg['Subject'] = subject
                msg['From'] = gmail_user
                msg['To'] = email
                
                server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
                server.login(gmail_user, gmail_app_password)
                server.sendmail(gmail_user, email, msg.as_string())
                server.quit()
                print(f"Password reset email sent to {email}")
            except Exception as e:
                print(f"Failed to send password reset email to {email}: {e}")
                # Decide how to handle email sending failure - log, alert, etc.
        else:
            print("Gmail credentials not configured. Password reset email not sent.")
            # Still return success if user is found, but log that email wasn't sent

        # For now, return the token in the response for testing purposes
        return {"message": "If an account with that email and name exists, a password reset link has been sent.", "success": True, "reset_token": token}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in forgot_password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error initiating password reset"
        )

@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    try:
        return {
            "id": str(current_user["_id"]),
            "name": current_user["name"],
            "email": current_user["email"],
            "avatar": current_user.get("avatar"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching user data"
        )

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(current_user=Depends(get_current_user)):
    try:
        # Delete user's tasks
        await db["tasks"].delete_many({"user_id": current_user["_id"]})
        
        # Delete user's projects
        await db["projects"].delete_many({"user_id": current_user["_id"]})
        
        # Delete user's notifications
        await db["notifications"].delete_many({"user_id": current_user["_id"]})
        
        # Delete user's chat history
        await db["chat_history"].delete_many({"user_id": current_user["_id"]})
        
        # Finally, delete the user
        result = await db["users"].delete_one({"_id": current_user["_id"]})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting account"
        ) 