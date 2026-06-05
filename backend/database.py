import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_HOST = os.getenv("DB_HOST") or os.getenv("MYSQLHOST") or "localhost"
DB_PORT = os.getenv("DB_PORT") or os.getenv("MYSQLPORT") or "3306"
DB_USER = os.getenv("DB_USER") or os.getenv("MYSQLUSER") or "root"
DB_PASSWORD = os.getenv("DB_PASSWORD") or os.getenv("MYSQLPASSWORD") or ""
DB_NAME = os.getenv("DB_NAME") or os.getenv("MYSQLDATABASE") or "deskmindai_db"

DB_PASSWORD = quote_plus(DB_PASSWORD)

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()