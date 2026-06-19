from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

#Load environment variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Refuse to start with a clear error if the database URL is missing,
# instead of failing later with a confusing create_engine(None) error.
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

#Create database engine
engine = create_engine(DATABASE_URL)

#Each request gets its own DB session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Base class for all models
Base = declarative_base()

#Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()