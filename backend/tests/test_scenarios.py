import unittest
import sys
import io
import os
import zipfile
from pathlib import Path
from PIL import Image

# Add backend to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from starlette.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import FileRecord, FolderNode
from app.services.folder_service import FolderService
from app.config import ORGANIZED_DIR

class TestSmartFolderScenarios(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Clean state for isolated scenario testing
        import shutil
        with SessionLocal() as db:
            db.query(FileRecord).delete()
            db.query(FolderNode).filter(FolderNode.is_custom == 1).delete()
            db.commit()
            FolderService.recalculate_real_counts(db)

        # Clear physical organized directory to isolate file collision tests
        if ORGANIZED_DIR.exists():
            for item in ORGANIZED_DIR.iterdir():
                if item.is_dir():
                    shutil.rmtree(item, ignore_errors=True)
                else:
                    item.unlink(missing_ok=True)

        with SessionLocal() as db:
            FolderService.seed_initial_data(db)

    def create_minimal_pdf(self, content_text: str = "") -> bytes:
        """Helper to create valid PDF bytes with embedded text and font resources"""
        escaped = content_text.replace("(", "\\(").replace(")", "\\)")
        stream_content = f"BT\n/F1 12 Tf\n72 712 Td\n({escaped}) Tj\nET\n".encode("latin-1")
        stream_len = len(stream_content)
        
        pdf = (
            b"%PDF-1.4\n"
            b"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
            b"2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
            b"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 4 0 R>>>> /Contents 5 0 R>> endobj\n"
            b"4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n"
            b"5 0 obj <</Length " + str(stream_len).encode("ascii") + b">> stream\n" +
            stream_content +
            b"endstream\nendobj\n"
            b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000222 00000 n \n0000000293 00000 n \n"
            b"trailer <</Size 6 /Root 1 0 R>>\nstartxref\n492\n%%EOF\n"
        )
        return pdf

    # =========================================================================
    # SCENARIO 1: Upload 10+ Different File Types Together
    # =========================================================================
    def test_scenario_01_upload_ten_different_file_types(self):
        # 1. Image
        png_io = io.BytesIO()
        Image.new("RGB", (100, 100), color="blue").save(png_io, format="PNG")
        
        # 2. Archive
        zip_io = io.BytesIO()
        with zipfile.ZipFile(zip_io, "w") as z:
            z.writestr("test.txt", "archived data")

        files_payload = [
            ("files", ("sample.pdf", io.BytesIO(self.create_minimal_pdf("Sample PDF Document")), "application/pdf")),
            ("files", ("contract.docx", io.BytesIO(b"PK\x03\x04docx dummy"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
            ("files", ("sales_data.csv", io.BytesIO(b"Item,Price,Qty\nA,10,2\nB,20,5\n"), "text/csv")),
            ("files", ("slides.pptx", io.BytesIO(b"PK\x03\x04pptx dummy"), "application/vnd.openxmlformats-officedocument.presentationml.presentation")),
            ("files", ("photo.png", io.BytesIO(png_io.getvalue()), "image/png")),
            ("files", ("podcast.mp3", io.BytesIO(b"ID3\x03dummy audio frame data"), "audio/mpeg")),
            ("files", ("presentation.mp4", io.BytesIO(b"\x00\x00\x00\x18ftypmp42dummy video"), "video/mp4")),
            ("files", ("script.py", io.BytesIO(b"def compute():\n    return 42\n"), "text/x-python")),
            ("files", ("notes.txt", io.BytesIO(b"Meeting notes and reminders.\nFollow up tomorrow."), "text/plain")),
            ("files", ("backup.zip", io.BytesIO(zip_io.getvalue()), "application/zip")),
            ("files", ("binary.dat", io.BytesIO(b"\x00\x01\x02\x03\x04"), "application/octet-stream"))
        ]

        resp = self.client.post("/api/v1/files/upload", files=files_payload)
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        self.assertEqual(len(items), 11)

        cat_map = {item["name"]: item["predictedCategory"] for item in items}
        self.assertEqual(cat_map["sample.pdf"], "PDF Files")
        self.assertEqual(cat_map["contract.docx"], "Word Files")
        self.assertEqual(cat_map["sales_data.csv"], "Excel Files")
        self.assertEqual(cat_map["slides.pptx"], "PowerPoint Files")
        self.assertEqual(cat_map["photo.png"], "Image Files")
        self.assertEqual(cat_map["podcast.mp3"], "Audio Files")
        self.assertEqual(cat_map["presentation.mp4"], "Video Files")
        self.assertEqual(cat_map["script.py"], "Code Files")
        self.assertEqual(cat_map["notes.txt"], "Text Files")
        self.assertEqual(cat_map["backup.zip"], "Archive Files")
        self.assertEqual(cat_map["binary.dat"], "Other Files")

        # Verify real counts updated in metrics
        metrics = self.client.get("/api/v1/metrics").json()
        self.assertEqual(metrics["totalFiles"], 11)
        for cat in cat_map.values():
            self.assertGreaterEqual(metrics["typeBreakdown"][cat], 1)

    # =========================================================================
    # SCENARIO 2: Upload Multiple PDFs on Different Topics
    # =========================================================================
    def test_scenario_02_multiple_pdfs_different_topics(self):
        ai_content = "Machine Learning deep neural network transformers gradient descent backpropagation PyTorch dataset training"
        db_content = "Relational Database SQL query transaction normalization ACID properties primary key foreign key indexing table schema"
        health_content = "Clinical patient hospital diagnosis cardiology symptoms treatment vital signs medical prescription doctor therapy"

        files_payload = [
            ("files", ("research_ai.pdf", io.BytesIO(self.create_minimal_pdf(ai_content)), "application/pdf")),
            ("files", ("system_dbms.pdf", io.BytesIO(self.create_minimal_pdf(db_content)), "application/pdf")),
            ("files", ("clinical_study.pdf", io.BytesIO(self.create_minimal_pdf(health_content)), "application/pdf"))
        ]

        resp = self.client.post("/api/v1/files/upload", files=files_payload)
        self.assertEqual(resp.status_code, 200)
        items = resp.json()

        item_map = {it["name"]: it for it in items}
        
        # Verify AI & Machine Learning subfolder
        self.assertIn("AI & Machine Learning", item_map["research_ai.pdf"]["recommendedFolder"])
        self.assertEqual(item_map["research_ai.pdf"]["predictedCategory"], "PDF Files")
        self.assertGreaterEqual(item_map["research_ai.pdf"]["confidence"], 90.0)

        # Verify Database Systems subfolder
        self.assertIn("Database Systems", item_map["system_dbms.pdf"]["recommendedFolder"])
        self.assertEqual(item_map["system_dbms.pdf"]["predictedCategory"], "PDF Files")
        self.assertGreaterEqual(item_map["system_dbms.pdf"]["confidence"], 90.0)

        # Verify Healthcare & Medicine subfolder
        self.assertIn("Healthcare & Medicine", item_map["clinical_study.pdf"]["recommendedFolder"])
        self.assertEqual(item_map["clinical_study.pdf"]["predictedCategory"], "PDF Files")
        self.assertGreaterEqual(item_map["clinical_study.pdf"]["confidence"], 90.0)

    # =========================================================================
    # SCENARIO 3: Misleading Filenames (Content Analysis Takes Precedence)
    # =========================================================================
    def test_scenario_03_misleading_filenames(self):
        # invoice.pdf contains Operating System lecture notes
        os_lecture = (
            "Operating Systems CS301 Lecture: Process scheduling, threads, CPU scheduling, "
            "deadlock avoidance with Banker's algorithm, mutex locks, semaphores, and virtual memory paging."
        )
        # balance_sheet.txt contains Web Development / FastAPI code notes
        web_content = (
            "Building modern frontend and backend applications using FastAPI router, React components, "
            "REST API endpoints, TypeScript interfaces, and Tailwind CSS styling."
        )

        files_payload = [
            ("files", ("invoice.pdf", io.BytesIO(self.create_minimal_pdf(os_lecture)), "application/pdf")),
            ("files", ("balance_sheet.txt", io.BytesIO(web_content.encode("utf-8")), "text/plain"))
        ]

        resp = self.client.post("/api/v1/files/upload", files=files_payload)
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        item_map = {it["name"]: it for it in items}

        # invoice.pdf MUST be classified under Operating Systems based on content
        self.assertIn("Operating Systems", item_map["invoice.pdf"]["recommendedFolder"])
        top_terms = [t["term"] for t in item_map["invoice.pdf"]["topTokens"]]
        self.assertTrue(any(t in top_terms for t in ["deadlock", "scheduling", "process", "operating", "threads"]))

        # balance_sheet.txt MUST be classified under Web Development based on content
        self.assertIn("Web Development", item_map["balance_sheet.txt"]["recommendedFolder"])
        self.assertNotIn("Finance", item_map["balance_sheet.txt"]["recommendedFolder"])

    # =========================================================================
    # SCENARIO 4: Unsupported Formats (Fallback to Other Files & Polite Message)
    # =========================================================================
    def test_scenario_04_unsupported_formats(self):
        files_payload = [
            ("files", ("device_driver.bin", io.BytesIO(b"\x7fELF\x02\x01\x01"), "application/octet-stream"))
        ]
        resp = self.client.post("/api/v1/files/upload", files=files_payload)
        self.assertEqual(resp.status_code, 200)
        item = resp.json()[0]

        self.assertEqual(item["predictedCategory"], "Other Files")
        self.assertEqual(item["recommendedFolder"], "Other Files/")

        # Request summarization on unsupported file
        sum_resp = self.client.post(f"/api/v1/files/{item['id']}/summarize")
        self.assertEqual(sum_resp.status_code, 200)
        sum_data = sum_resp.json()
        self.assertFalse(sum_data["supported"])
        self.assertIn("Summarization is unavailable for Other Files", sum_data["message"])
        self.assertIn("Supported formats: PDF", sum_data["message"])

    # =========================================================================
    # SCENARIO 5: Duplicate File Name Handling (Zero Data Loss)
    # =========================================================================
    def test_scenario_05_duplicate_file_handling(self):
        # 1. Upload first copy of document
        resp1 = self.client.post("/api/v1/files/upload", files=[
            ("files", ("project_plan.txt", io.BytesIO(b"Version 1 of project plan."), "text/plain"))
        ])
        item1 = resp1.json()[0]

        # 2. Approve move to Text Files/
        app1 = self.client.post(f"/api/v1/files/{item1['id']}/approve")
        self.assertEqual(app1.status_code, 200)
        self.assertEqual(app1.json()["filename"], "project_plan.txt")

        # 3. Upload second copy with identical filename
        resp2 = self.client.post("/api/v1/files/upload", files=[
            ("files", ("project_plan.txt", io.BytesIO(b"Version 2 updated plan."), "text/plain"))
        ])
        item2 = resp2.json()[0]

        # 4. Approve second copy -> Must automatically append (1)
        app2 = self.client.post(f"/api/v1/files/{item2['id']}/approve")
        self.assertEqual(app2.status_code, 200)
        self.assertEqual(app2.json()["filename"], "project_plan (1).txt")

        # Verify both physical files exist safely on disk
        dest_dir = ORGANIZED_DIR / "Text Files"
        self.assertTrue((dest_dir / "project_plan.txt").exists())
        self.assertTrue((dest_dir / "project_plan (1).txt").exists())

    # =========================================================================
    # SCENARIO 6: Empty or Corrupted Files (Graceful Handling, Zero Crashes)
    # =========================================================================
    def test_scenario_06_empty_or_corrupted_files(self):
        files_payload = [
            ("files", ("empty.pdf", io.BytesIO(b""), "application/pdf")),
            ("files", ("corrupt.docx", io.BytesIO(b"This is not a real zip-based docx file"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
            ("files", ("empty_notes.txt", io.BytesIO(b""), "text/plain"))
        ]

        resp = self.client.post("/api/v1/files/upload", files=files_payload)
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        self.assertEqual(len(items), 3)

        # Ensure summarization handles empty document gracefully
        empty_txt = next(it for it in items if it["name"] == "empty_notes.txt")
        sum_resp = self.client.post(f"/api/v1/files/{empty_txt['id']}/summarize")
        self.assertEqual(sum_resp.status_code, 200)
        self.assertIn("empty or whitespace-only", sum_resp.json()["summary"])

    # =========================================================================
    # SCENARIO 7: Custom Folder Creation, Reassignment & File Movement
    # =========================================================================
    def test_scenario_07_custom_folders_and_reassignment(self):
        # 1. Create custom folder "Semester 3"
        cf_resp = self.client.post("/api/v1/folders", json={"name": "Semester 3"})
        self.assertEqual(cf_resp.status_code, 200)
        custom_folder = cf_resp.json()
        self.assertEqual(custom_folder["path"], "Semester 3/")

        # 2. Upload file
        resp = self.client.post("/api/v1/files/upload", files=[
            ("files", ("lab_report.txt", io.BytesIO(b"Chemistry Lab Report experiments"), "text/plain"))
        ])
        file_item = resp.json()[0]

        # 3. Reassign to Semester 3/
        reassign_resp = self.client.post(f"/api/v1/files/{file_item['id']}/reassign", json={"newFolder": "Semester 3/"})
        self.assertEqual(reassign_resp.status_code, 200)

        # 4. Approve move
        app_resp = self.client.post(f"/api/v1/files/{file_item['id']}/approve")
        self.assertEqual(app_resp.status_code, 200)

        # 5. Check physical file exists in organized/Semester 3/
        target_path = ORGANIZED_DIR / "Semester 3" / "lab_report.txt"
        self.assertTrue(target_path.exists())

        # 6. Check folder files API returns the file
        files_resp = self.client.get(f"/api/v1/folders/{custom_folder['id']}/files")
        self.assertEqual(files_resp.status_code, 200)
        self.assertEqual(len(files_resp.json()), 1)
        self.assertEqual(files_resp.json()[0]["name"], "lab_report.txt")

    # =========================================================================
    # SCENARIO 8: Rejection / Dismissal of AI Folder Suggestions
    # =========================================================================
    def test_scenario_08_rejection_dismissal(self):
        resp = self.client.post("/api/v1/files/upload", files=[
            ("files", ("unwanted.txt", io.BytesIO(b"Temporary scratch note"), "text/plain"))
        ])
        file_item = resp.json()[0]

        # Dismiss recommendation
        del_resp = self.client.delete(f"/api/v1/files/{file_item['id']}/dismiss")
        self.assertEqual(del_resp.status_code, 200)
        self.assertTrue(del_resp.json()["success"])

        # Verify not returned in pending recommendations
        rec_resp = self.client.get("/api/v1/files/recommendations?status=pending")
        self.assertEqual(rec_resp.status_code, 200)
        self.assertFalse(any(it["id"] == file_item["id"] for it in rec_resp.json()))

    # =========================================================================
    # SCENARIO 9: Session Persistence Across Queries / Reloads
    # =========================================================================
    def test_scenario_09_session_persistence(self):
        resp = self.client.post("/api/v1/files/upload", files=[
            ("files", ("persistent_doc.txt", io.BytesIO(b"Data that must persist across reloads"), "text/plain"))
        ])
        file_id = resp.json()[0]["id"]

        # Simulate reload by querying the endpoints anew
        metrics_resp = self.client.get("/api/v1/metrics")
        self.assertEqual(metrics_resp.status_code, 200)
        self.assertGreaterEqual(metrics_resp.json()["totalFiles"], 1)

        tree_resp = self.client.get("/api/v1/folders/tree")
        self.assertEqual(tree_resp.status_code, 200)
        text_node = next(n for n in tree_resp.json() if n["name"] == "Text Files")
        self.assertGreaterEqual(text_node["fileCount"], 1)

        rec_resp = self.client.get(f"/api/v1/files/recommendations?status=all")
        self.assertTrue(any(f["id"] == file_id for f in rec_resp.json()))

    # =========================================================================
    # SCENARIO 10: Complete Operation via APIs and ZIP Export
    # =========================================================================
    def test_scenario_10_zip_export_and_final_organization(self):
        # Upload, approve, and verify ZIP archive
        resp = self.client.post("/api/v1/files/upload", files=[
            ("files", ("final_report.pdf", io.BytesIO(self.create_minimal_pdf("Final Report content")), "application/pdf"))
        ])
        item = resp.json()[0]
        self.client.post(f"/api/v1/files/{item['id']}/approve")

        zip_resp = self.client.get("/api/v1/files/download-zip")
        self.assertEqual(zip_resp.status_code, 200)
        self.assertEqual(zip_resp.headers["content-type"], "application/zip")

        zf = zipfile.ZipFile(io.BytesIO(zip_resp.content))
        names = zf.namelist()
        self.assertTrue(any("final_report" in n for n in names))
        self.assertTrue(any("SmartFolder_Organized" in n for n in names))

if __name__ == "__main__":
    unittest.main()
