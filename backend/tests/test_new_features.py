import unittest
import sys
import io
from pathlib import Path
from PIL import Image

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from starlette.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import FileRecord, FolderNode, SummaryRecord
from app.services.folder_service import FolderService
from app.config import ORGANIZED_DIR, UPLOAD_DIR
import shutil

class TestNewFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Clean physical storage dirs
        for d in [ORGANIZED_DIR, UPLOAD_DIR]:
            if d.exists():
                for item in d.glob("*"):
                    if item.is_file():
                        try:
                            item.unlink()
                        except Exception:
                            pass
                    elif item.is_dir():
                        try:
                            shutil.rmtree(item)
                        except Exception:
                            pass

        with SessionLocal() as db:
            db.query(SummaryRecord).delete()
            db.query(FileRecord).delete()
            db.query(FolderNode).filter(FolderNode.is_custom == 1).delete()
            db.commit()
            FolderService.recalculate_real_counts(db)

    def test_structured_summary_endpoint(self):
        # 1. Upload a rich text document
        sample_doc = (
            "Database Management Systems Fundamentals\n\n"
            "A database management system is defined as software that coordinates access to relational tables. "
            "Relational algebra operations guarantee ACID transaction properties across distributed networks. "
            "Normalization is characterized by decomposing tables to eliminate update anomalies and data redundancy. "
            "In 2026, over 95% of enterprise data pipelines implement indexing algorithms to achieve query responses under 10ms. "
            "In conclusion, modern database systems ensure data integrity and scalable storage."
        )
        resp = self.client.post("/api/v1/files/upload", files=[
            ("files", ("dbms_lecture.txt", io.BytesIO(sample_doc.encode("utf-8")), "text/plain"))
        ])
        self.assertEqual(resp.status_code, 200)
        file_id = resp.json()[0]["id"]

        # 2. Call structured summary endpoint
        sum_resp = self.client.post(f"/api/v1/files/{file_id}/structured-summary")
        self.assertEqual(sum_resp.status_code, 200)
        data = sum_resp.json()

        # Verify all 8 parts are present
        self.assertIn("title", data)
        self.assertIn("overview", data)
        self.assertIn("mainTopic", data)
        self.assertIn("detailedSummary", data)
        self.assertIn("importantPoints", data)
        self.assertIn("keyTerms", data)
        self.assertIn("datesFiguresFacts", data)
        self.assertIn("conclusion", data)

        self.assertTrue(len(data["importantPoints"]) > 0)
        self.assertTrue(len(data["keyTerms"]) > 0)
        self.assertTrue(len(data["datesFiguresFacts"]) > 0)
        self.assertIn("2026", [f["item"] for f in data["datesFiguresFacts"] if f.get("category") == "date"] + [f["item"] for f in data["datesFiguresFacts"]])

    def test_combined_summary_endpoint(self):
        # 1. Upload two related files
        doc1 = "Python programming features list comprehensions, lambda functions, and extensive open source libraries."
        doc2 = "Advanced Python decorators and generators provide memory-efficient iteration across large datasets in 2026."

        resp = self.client.post("/api/v1/files/upload", files=[
            ("files", ("python_intro.txt", io.BytesIO(doc1.encode("utf-8")), "text/plain")),
            ("files", ("python_advanced.txt", io.BytesIO(doc2.encode("utf-8")), "text/plain"))
        ])
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        fids = [it["id"] for it in items]

        # 2. Call combined summary
        comb_resp = self.client.post("/api/v1/files/combined-summary", json={"fileIds": fids})
        self.assertEqual(comb_resp.status_code, 200)
        comb_data = comb_resp.json()

        self.assertEqual(comb_data["fileCount"], 2)
        self.assertEqual(len(comb_data["individualSummaries"]), 2)
        self.assertTrue(len(comb_data["combinedSummary"]) > 20)
        self.assertTrue(len(comb_data["keyFindings"]) > 0)

        # 3. Verify history endpoint
        hist_resp = self.client.get("/api/v1/files/summary-history")
        self.assertEqual(hist_resp.status_code, 200)
        self.assertTrue(len(hist_resp.json()) >= 1)

    def test_storage_info_and_file_actions(self):
        # 1. Check storage info
        info_resp = self.client.get("/api/v1/files/storage-info")
        self.assertEqual(info_resp.status_code, 200)
        data = info_resp.json()
        self.assertTrue(data["isLocal"])
        self.assertIn("storagePath", data)

        # 2. Upload file
        resp = self.client.post("/api/v1/files/upload", files=[
            ("files", ("test_file.txt", io.BytesIO(b"Hello storage"), "text/plain"))
        ])
        fid = resp.json()[0]["id"]

        # 3. Rename file
        ren_resp = self.client.put(f"/api/v1/files/{fid}/rename", json={"newName": "renamed_file.txt"})
        self.assertEqual(ren_resp.status_code, 200)
        self.assertEqual(ren_resp.json()["newFilename"], "renamed_file.txt")

        # 4. Move file
        move_resp = self.client.post(f"/api/v1/files/{fid}/move", json={"targetFolder": "My Custom Target/"})
        self.assertEqual(move_resp.status_code, 200)
        self.assertEqual(move_resp.json()["targetFolder"], "My Custom Target/")

if __name__ == "__main__":
    unittest.main()
