import psycopg2

DATABASE_CONFIG = {
    "host": "db.jfzmhqjqkypvrkjbaanr.supabase.co",
    "port": "5432",
    "database": "postgres",
    "user": "postgres",
    "password": "hKJj0tRo0UqmzIr8",
    "sslmode": "require"
}


def get_db():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    try:
        yield conn
    finally:
        conn.close()
