import psycopg2
# DATABASE_CONFIG = {
#     "host": "db.jfzmhqjqkypvrkjbaanr.supabase.co",
#     "port": "5432",
#     "database": "postgres",
#     "user": "postgres",
#     "password": "hKJj0tRo0UqmzIr8",
#     "sslmode": "require"
# }
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Hardcoded config that works
# DATABASE_CONFIG = {
#     "host": "localhost",
#     "port": "5432",
#     "database": "B_trust ",
#     "user": "postgres",
#     "password": "1234",
# }

# Environment-based config
DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "B_trust"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "1234"),
    "sslmode": os.getenv("DB_SSLMODE", "disable")
}


def get_db():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    try:
        yield conn
    finally:
        conn.close()
