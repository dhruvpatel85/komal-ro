from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Prefer env only if it is a real non-empty value; otherwise hard default
_env_url = os.getenv("DATABASE_URL")
SQLALCHEMY_DATABASE_URL = (
    _env_url
    if _env_url and _env_url.strip()
    else "mysql+pymysql://root:root@127.0.0.1:3306/komal_ro"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"connect_timeout": 5},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()