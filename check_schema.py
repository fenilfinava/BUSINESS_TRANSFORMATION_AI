import os
import asyncio
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("backend/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
client = create_client(url, key)

print("Columns in workspaces:")
res = client.table("workspaces").select("*").limit(1).execute()
if res.data:
    print(res.data[0].keys())
else:
    print("No data, cannot infer columns. Trying to insert a test.")
    try:
        client.table("workspaces").insert({"name": "test schema"}).execute()
        res2 = client.table("workspaces").select("*").limit(1).execute()
        print(res2.data[0].keys())
    except Exception as e:
        print("Error:", e)
