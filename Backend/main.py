from sys import prefix
import psycopg2
from fastapi import FastAPI
from auth import router as auth_router
from customer import router as customer_router
from employee import router as employee_router
from branch import router as branch_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Micro Banking System", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include auth routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(customer_router, prefix="/customers", tags=["Customers"])
app.include_router(employee_router, prefix="/employees", tags=["Employees"])
app.include_router(branch_router, prefix='/branches', tags=["Branches"])


@app.get("/")
async def root():
    return {"message": "Welcome to the Micro Banking System API"}
