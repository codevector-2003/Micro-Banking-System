import psycopg2
# DATABASE_CONFIG = {
#     "host": "db.jfzmhqjqkypvrkjbaanr.supabase.co",
#     "port": "5432",
#     "database": "postgres",
#     "user": "postgres",
#     "password": "hKJj0tRo0UqmzIr8",
#     "sslmode": "require"
# }
DATABASE_CONFIG = {
    "host": "localhost",
    "port": "5432",
    "database": "B_trust ",
    "user": "postgres",
    "password": "1234",
}


def get_db():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    try:
        yield conn
    finally:
        conn.close()
