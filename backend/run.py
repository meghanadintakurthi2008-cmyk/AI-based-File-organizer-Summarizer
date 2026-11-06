import os
import sys
from pathlib import Path
import uvicorn

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

app_dir = backend_dir / "app"

if __name__ == "__main__":
    use_reload = os.environ.get("RELOAD", "false").lower() == "true"
    
    if use_reload:
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            reload_dirs=[str(app_dir)],
            reload_excludes=["*storage*", "*.db", "*uploads*", "*organized*"]
        )
    else:
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=False
        )
