"""
SmartFolder AI - Sample Data Cleanup Script
Removes ALL sample/demo data from the database and storage directories.
Preserves database structure, folder schema, and genuine user files.
"""
import sqlite3
import os
import shutil
from pathlib import Path

DB_PATH = Path("storage/smartfolder.db")
UPLOADS_DIR = Path("storage/uploads")
ORGANIZED_DIR = Path("storage/organized")
ZIP_PATH = Path("storage/SmartFolder_Organized.zip")

def show_counts(cur, label):
    print(f"\n--- {label} ---")
    for table in ["file_records", "folder_nodes", "summary_records", "cluster_suggestions", "metric_snapshots"]:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"  {table}: {count} rows")
        except Exception as e:
            print(f"  {table}: (skipped - {e})")

def run_cleanup():
    print("=" * 60)
    print("SmartFolder AI - Sample Data Cleanup")
    print("=" * 60)

    # Connect to DB
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    show_counts(cur, "BEFORE CLEANUP")

    # --- Step 1: Clear all file records (uploaded files) ---
    print("\n[1] Deleting all file_records...")
    cur.execute("DELETE FROM file_records")
    deleted_files = cur.rowcount
    print(f"    Deleted {deleted_files} file records.")

    # --- Step 2: Clear all summary records ---
    print("\n[2] Deleting all summary_records...")
    cur.execute("DELETE FROM summary_records")
    deleted_summaries = cur.rowcount
    print(f"    Deleted {deleted_summaries} summary records.")

    # --- Step 3: Clear cluster suggestions ---
    print("\n[3] Deleting cluster_suggestions...")
    try:
        cur.execute("DELETE FROM cluster_suggestions")
        print(f"    Deleted {cur.rowcount} cluster suggestion rows.")
    except Exception as e:
        print(f"    cluster_suggestions skipped: {e}")

    # --- Step 4: Clear metric snapshots ---
    print("\n[4] Deleting metric_snapshots...")
    try:
        cur.execute("DELETE FROM metric_snapshots")
        print(f"    Deleted {cur.rowcount} metric snapshot rows.")
    except Exception as e:
        print(f"    metric_snapshots skipped: {e}")

    # --- Step 5: Reset folder file_count to 0 (keep folder structure) ---
    print("\n[5] Resetting all folder file_counts to 0...")
    cur.execute("UPDATE folder_nodes SET file_count = 0")
    print(f"    Reset {cur.rowcount} folder nodes.")

    # --- Step 6: Remove all custom folders (keep only 11 default system folders) ---
    print("\n[6] Removing custom user-created folders from DB...")
    cur.execute("DELETE FROM folder_nodes WHERE is_custom = 1")
    print(f"    Deleted {cur.rowcount} custom folder nodes.")

    conn.commit()
    conn.close()

    # --- Step 7: Delete all uploaded files from storage/uploads ---
    print("\n[7] Deleting uploaded files from storage/uploads/...")
    if UPLOADS_DIR.exists():
        deleted_upload_count = 0
        for f in UPLOADS_DIR.iterdir():
            if f.is_file():
                f.unlink()
                deleted_upload_count += 1
                print(f"    Deleted: {f.name}")
        print(f"    Total deleted: {deleted_upload_count} uploaded files.")
    else:
        print("    storage/uploads/ directory not found.")

    # --- Step 8: Remove all organized folder contents ---
    print("\n[8] Clearing storage/organized/ directory contents...")
    if ORGANIZED_DIR.exists():
        deleted_org_count = 0
        for item in ORGANIZED_DIR.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
                deleted_org_count += 1
                print(f"    Removed folder: {item.name}/")
            elif item.is_file():
                item.unlink()
                deleted_org_count += 1
                print(f"    Removed file: {item.name}")
        print(f"    Total removed: {deleted_org_count} items from organized/.")
    else:
        print("    storage/organized/ directory not found.")

    # --- Step 9: Delete the stale ZIP archive ---
    print("\n[9] Deleting stale ZIP archive...")
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
        print("    Deleted SmartFolder_Organized.zip")
    else:
        print("    No ZIP archive found.")

    # --- Step 10: Recreate the 11 default empty organized folders ---
    print("\n[10] Recreating 11 default empty organized folders...")
    default_folders = [
        "PDF Files", "Word Files", "Excel Files", "PowerPoint Files",
        "Image Files", "Video Files", "Audio Files", "Text Files",
        "Code Files", "Archive Files", "Other Files"
    ]
    for folder_name in default_folders:
        folder_path = ORGANIZED_DIR / folder_name
        folder_path.mkdir(parents=True, exist_ok=True)
        print(f"    Created: organized/{folder_name}/")

    # --- Final verification ---
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    show_counts(cur, "AFTER CLEANUP")
    conn.close()

    print("\n" + "=" * 60)
    print("CLEANUP COMPLETE")
    print("  - All sample file records removed from database")
    print("  - All summary records cleared")
    print("  - All uploaded sample files deleted from disk")
    print("  - All organized sample folders removed")
    print("  - 11 clean empty default folders recreated")
    print("  - Database structure preserved")
    print("  - Restart the backend server to apply changes")
    print("=" * 60)

if __name__ == "__main__":
    run_cleanup()
