from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

from sqlalchemy.engine import Engine

# Enable foreign keys for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in type(dbapi_connection).__module__:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

from sqlalchemy import text

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    # Ensure newly added columns exist in SQLite if table was already created
    with engine.connect() as conn:
        try:
            cursor = conn.execute(text("PRAGMA table_info(tasks)"))
            cols = [row[1] for row in cursor.fetchall()]
            if cols:
                if "tags" not in cols:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN tags VARCHAR(500) DEFAULT ''"))
                if "is_pinned" not in cols:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN is_pinned BOOLEAN DEFAULT 0"))
                conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
