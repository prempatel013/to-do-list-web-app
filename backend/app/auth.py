from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from app.db import db
from app.models import User
from bson import ObjectId
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Get SECRET_KEY from environment variable, fallback to a default for development
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-please-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day instead of 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying password"
        )

def get_password_hash(password):
    try:
        return pwd_context.hash(password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error hashing password"
        )

def create_access_token(data: dict, expires_delta: timedelta = None):
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating access token"
        )

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try to get token from Authorization header first
    auth_header = request.headers.get("Authorization")
    logging.info(f"Auth header: {auth_header}")
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        logging.info(f"Token from header: {token}")
        logging.info(f"Token segments: {token.split('.')}")  # Log token segments
    elif not token:
        # If no token in header, try cookie
        cookie_token = request.cookies.get("token")
        logging.info(f"Cookie token: {cookie_token}")
        
        if cookie_token and cookie_token.startswith("Bearer "):
            token = cookie_token.split(" ", 1)[1]
            logging.info(f"Token from cookie (with Bearer): {token}")
            logging.info(f"Token segments: {token.split('.')}")  # Log token segments
        else:
            logging.error("Invalid token format in cookie")
            raise credentials_exception
    
    if not token:
        logging.error("No token found in request")
        raise credentials_exception
        
    try:
        logging.info(f"Attempting to decode token: {token}")
        logging.info(f"Token length: {len(token)}")
        logging.info(f"Token segments count: {len(token.split('.'))}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            logging.error("No user_id in token payload")
            raise credentials_exception
        logging.info(f"Successfully decoded token for user_id: {user_id}")
    except JWTError as e:
        logging.error(f"JWTError: {e}")
        logging.error(f"Token format: {token}")  # Log the problematic token
        raise credentials_exception
    except Exception as e:
        logging.error(f"Token processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing token"
        )
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if user is None:
            logging.error("User not found in DB")
            raise credentials_exception
        return user
    except Exception as e:
        logging.error(f"User fetch error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching user data"
        ) 