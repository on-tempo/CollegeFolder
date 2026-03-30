from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

#Load environment variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

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