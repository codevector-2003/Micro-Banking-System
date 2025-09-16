import psycopg2

DATABASE_CONFIG = {
    "host": "localhost",
    "port": "5432",
    "database": "BankingSystem",
    "user": "postgres",
    "password": "1234"
}


def get_db():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    try:
        yield conn
    finally:
        conn.close()
