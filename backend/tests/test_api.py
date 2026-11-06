import unittest
import sys
import os
from pathlib import Path

# Add backend to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from starlette.testclient import TestClient
from app.main import app
from app.services.classifier import classifier_engine
from app.services.summarizer import DocumentSummarizer

class TestSmartFolderAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        from app.database import SessionLocal
        from app.models import FileRecord, FolderNode
        from app.services.folder_service import FolderService
        with SessionLocal() as db:
            db.query(FileRecord).delete()
            db.query(FolderNode).filter(FolderNode.is_custom == 1).delete()
            db.commit()
            FolderService.recalculate_real_counts(db)

    @classmethod
    def tearDownClass(cls):
        from app.database import SessionLocal
        from app.models import FileRecord, FolderNode
        from app.services.folder_service import FolderService
        with SessionLocal() as db:
            db.query(FileRecord).delete()
            db.query(FolderNode).filter(FolderNode.is_custom == 1).delete()
            db.commit()
            FolderService.recalculate_real_counts(db)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("SmartFolder", data["service"])

    def test_file_type_detection(self):
        # 1. DBMS_Notes.pdf -> PDF Files/
        res = classifier_engine.classify_file("DBMS_Notes.pdf")
        self.assertEqual(res["predicted_category"], "PDF Files")
        self.assertEqual(res["recommended_folder"], "PDF Files/")
        self.assertIn("DBMS_Notes.pdf → PDF Files/", res["confidence_reason"])

        # 2. Assignment.docx -> Word Files/
        res = classifier_engine.classify_file("Assignment.docx")
        self.assertEqual(res["predicted_category"], "Word Files")
        self.assertEqual(res["recommended_folder"], "Word Files/")

        # 3. Marks.xlsx -> Excel Files/
        res = classifier_engine.classify_file("Marks.xlsx")
        self.assertEqual(res["predicted_category"], "Excel Files")
        self.assertEqual(res["recommended_folder"], "Excel Files/")

        # 4. Diagram.png -> Image Files/
        res = classifier_engine.classify_file("Diagram.png")
        self.assertEqual(res["predicted_category"], "Image Files")
        self.assertEqual(res["recommended_folder"], "Image Files/")

        # 5. Unknown.xyz -> Other Files/
        res = classifier_engine.classify_file("Unknown.xyz")
        self.assertEqual(res["predicted_category"], "Other Files")
        self.assertEqual(res["recommended_folder"], "Other Files/")

        # 6. Uppercase extension
        res = classifier_engine.classify_file("RESEARCH_PAPER.PDF")
        self.assertEqual(res["predicted_category"], "PDF Files")
        self.assertEqual(res["recommended_folder"], "PDF Files/")

        # 7. Filenames with multiple dots
        res = classifier_engine.classify_file("backup.archive.2026.tar.gz")
        self.assertEqual(res["predicted_category"], "Archive Files")
        self.assertEqual(res["recommended_folder"], "Archive Files/")

        res = classifier_engine.classify_file("student.grades.v1.final.csv")
        self.assertEqual(res["predicted_category"], "Excel Files")
        self.assertEqual(res["recommended_folder"], "Excel Files/")

        # 8. Files without extension
        res = classifier_engine.classify_file("Makefile")
        self.assertEqual(res["predicted_category"], "Code Files")
        self.assertEqual(res["recommended_folder"], "Code Files/")

    def test_initial_zero_metrics(self):
        response = self.client.get("/api/v1/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["totalFiles"], 0)
        self.assertEqual(data["filesAnalyzed"], 0)
        self.assertEqual(data["recommendations"], 0)
        self.assertEqual(data["categoriesFound"], 0)
        self.assertEqual(data["lastScanTime"], "No scans yet")
        self.assertIn("PDF Files", data["typeBreakdown"])
        self.assertEqual(data["typeBreakdown"]["PDF Files"], 0)

    def test_get_folder_tree(self):
        response = self.client.get("/api/v1/folders/tree")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data), 0)
        paths = [node["path"] for node in data]
        self.assertTrue("PDF Files/" in paths and "Word Files/" in paths)

    def test_custom_folder_lifecycle(self):
        # 1. Create a custom folder "My College Notes"
        resp = self.client.post("/api/v1/folders", json={"name": "My College Notes"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["name"], "My College Notes")
        self.assertEqual(data["path"], "My College Notes/")
        self.assertTrue(data["isCustom"])
        folder_id = data["id"]

        # 2. Verify it shows up in tree with isCustom = True
        tree_resp = self.client.get("/api/v1/folders/tree")
        self.assertEqual(tree_resp.status_code, 200)
        custom_folders = [f for f in tree_resp.json() if f.get("isCustom")]
        self.assertTrue(any(f["name"] == "My College Notes" for f in custom_folders))

        # 3. Rename custom folder to "My University Notes"
        rename_resp = self.client.put(f"/api/v1/folders/{folder_id}/rename", json={"newName": "My University Notes"})
        self.assertEqual(rename_resp.status_code, 200)
        renamed = rename_resp.json()
        self.assertEqual(renamed["name"], "My University Notes")
        self.assertEqual(renamed["path"], "My University Notes/")

        # 4. Check folder files (currently empty)
        files_resp = self.client.get(f"/api/v1/folders/{folder_id}/files")
        self.assertEqual(files_resp.status_code, 200)
        self.assertEqual(len(files_resp.json()), 0)

        # 5. Delete the folder safely
        del_resp = self.client.delete(f"/api/v1/folders/{folder_id}")
        self.assertEqual(del_resp.status_code, 200)
        self.assertTrue(del_resp.json()["success"])

    def test_summarize_unsupported(self):
        res = DocumentSummarizer.summarize_file(Path("video.mp4"), "video.mp4")
        self.assertFalse(res["supported"])
        self.assertIn("unavailable", res["message"].lower())

    def test_full_workflow_upload_and_organization(self):
        import io
        from PIL import Image
        import docx
        import zipfile
        from app.database import SessionLocal
        from app.models import FileRecord, FolderNode
        from app.services.folder_service import FolderService

        # 1. Prepare 4 test file streams: PDF, DOCX, PNG, and Python file
        pdf_bytes = (
            b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
            b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
            b"xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000111 00000 n\n"
            b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n"
        )
        
        docx_buf = io.BytesIO()
        doc = docx.Document()
        doc.add_heading("Operating Systems Architecture", level=1)
        doc.add_paragraph("Process synchronization ensures cooperative processes execute correctly using semaphores and mutexes.")
        doc.add_paragraph("Deadlock prevention eliminates mutual exclusion, hold and wait, and circular wait conditions.")
        doc.save(docx_buf)
        docx_bytes = docx_buf.getvalue()

        png_buf = io.BytesIO()
        img = Image.new("RGB", (640, 480), color=(73, 109, 137))
        img.save(png_buf, format="PNG")
        png_bytes = png_buf.getvalue()

        py_bytes = b"# Python Script\ndef process_data():\n    return [x**2 for x in range(10)]\n"

        files_payload = [
            ("files", ("lecture_notes.pdf", io.BytesIO(pdf_bytes), "application/pdf")),
            ("files", ("os_assignment.docx", io.BytesIO(docx_bytes), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
            ("files", ("architecture_diagram.png", io.BytesIO(png_bytes), "image/png")),
            ("files", ("data_pipeline.py", io.BytesIO(py_bytes), "text/x-python"))
        ]

        # 2. Upload all 4 files
        upload_resp = self.client.post("/api/v1/files/upload", files=files_payload)
        self.assertEqual(upload_resp.status_code, 200)
        uploaded = upload_resp.json()
        self.assertEqual(len(uploaded), 4)

        up_map = {item["name"]: item for item in uploaded}
        self.assertEqual(up_map["lecture_notes.pdf"]["predictedCategory"], "PDF Files")
        self.assertEqual(up_map["os_assignment.docx"]["predictedCategory"], "Word Files")
        self.assertEqual(up_map["architecture_diagram.png"]["predictedCategory"], "Image Files")
        self.assertEqual(up_map["data_pipeline.py"]["predictedCategory"], "Code Files")

        # 3. Verify category counts on folder tree and metrics
        metrics_resp = self.client.get("/api/v1/metrics")
        self.assertEqual(metrics_resp.status_code, 200)
        metrics_data = metrics_resp.json()
        self.assertEqual(metrics_data["typeBreakdown"]["PDF Files"], 1)
        self.assertEqual(metrics_data["typeBreakdown"]["Word Files"], 1)
        self.assertEqual(metrics_data["typeBreakdown"]["Image Files"], 1)
        self.assertEqual(metrics_data["typeBreakdown"]["Code Files"], 1)

        tree_resp = self.client.get("/api/v1/folders/tree")
        self.assertEqual(tree_resp.status_code, 200)
        tree_map = {f["name"]: f for f in tree_resp.json()}
        self.assertEqual(tree_map["PDF Files"]["fileCount"], 1)
        self.assertEqual(tree_map["Word Files"]["fileCount"], 1)
        self.assertEqual(tree_map["Image Files"]["fileCount"], 1)
        self.assertEqual(tree_map["Code Files"]["fileCount"], 1)

        # 4. Verify folder contents
        pdf_files_resp = self.client.get("/api/v1/folders/fld-pdf/files")
        self.assertEqual(pdf_files_resp.status_code, 200)
        self.assertTrue(any(f["name"] == "lecture_notes.pdf" for f in pdf_files_resp.json()))

        word_files_resp = self.client.get("/api/v1/folders/fld-word/files")
        self.assertEqual(word_files_resp.status_code, 200)
        self.assertTrue(any(f["name"] == "os_assignment.docx" for f in word_files_resp.json()))

        # 5. Test summarization
        docx_id = up_map["os_assignment.docx"]["id"]
        sum_resp = self.client.post(f"/api/v1/files/{docx_id}/summarize?mode=detailed")
        self.assertEqual(sum_resp.status_code, 200)
        sum_data = sum_resp.json()
        self.assertTrue(sum_data["supported"])
        self.assertTrue(len(sum_data["summary"]) > 10)

        png_id = up_map["architecture_diagram.png"]["id"]
        img_sum_resp = self.client.post(f"/api/v1/files/{png_id}/summarize?mode=short")
        self.assertEqual(img_sum_resp.status_code, 200)
        self.assertTrue(img_sum_resp.json()["supported"])
        self.assertIn("640x480", img_sum_resp.json()["summary"])

        # 6. Create custom folder and assign file
        fld_resp = self.client.post("/api/v1/folders", json={"name": "Semester 3 Projects"})
        self.assertEqual(fld_resp.status_code, 200)
        custom_node = fld_resp.json()
        custom_path = custom_node["path"]

        py_id = up_map["data_pipeline.py"]["id"]
        reassign_resp = self.client.post(f"/api/v1/files/{py_id}/reassign", json={"newFolder": custom_path})
        self.assertEqual(reassign_resp.status_code, 200)

        # 7. Approve Move
        approve_resp = self.client.post(f"/api/v1/files/{up_map['lecture_notes.pdf']['id']}/approve")
        self.assertEqual(approve_resp.status_code, 200)
        self.assertTrue(approve_resp.json()["success"])

        approve_py_resp = self.client.post(f"/api/v1/files/{py_id}/approve")
        self.assertEqual(approve_py_resp.status_code, 200)
        self.assertTrue(approve_py_resp.json()["success"])

        # Check DB status
        with SessionLocal() as db:
            pdf_rec = db.query(FileRecord).filter_by(id=up_map['lecture_notes.pdf']['id']).first()
            self.assertEqual(pdf_rec.status, "approved")
            py_rec = db.query(FileRecord).filter_by(id=py_id).first()
            self.assertEqual(py_rec.status, "approved")

        # 8. Test ZIP download
        zip_resp = self.client.get("/api/v1/files/download-zip")
        self.assertEqual(zip_resp.status_code, 200)
        zf = zipfile.ZipFile(io.BytesIO(zip_resp.content))
        names = zf.namelist()
        self.assertTrue(any("lecture_notes" in n and "PDF Files" in n for n in names))
        self.assertTrue(any("data_pipeline" in n and "Semester 3 Projects" in n for n in names))

        # 9. Clean up test records
        with SessionLocal() as db:
            db.query(FileRecord).delete()
            fld_node = db.query(FolderNode).filter_by(id=custom_node["id"]).first()
            if fld_node:
                db.delete(fld_node)
            db.commit()
            FolderService.recalculate_real_counts(db)

if __name__ == "__main__":
    unittest.main()
