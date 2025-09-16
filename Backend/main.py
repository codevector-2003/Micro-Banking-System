from fastapi import FastAPI
from auth import router as auth_router

app = FastAPI(title="Micro Banking System", version="1.0.0")

# Include auth routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])


@app.get("/")
async def root():
    return {"message": "Welcome to the Micro Banking System API"}
