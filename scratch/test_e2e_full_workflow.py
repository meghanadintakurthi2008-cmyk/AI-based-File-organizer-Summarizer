import os
import sys
import json
import zipfile
import urllib.request
import urllib.parse
from pathlib import Path
from PIL import Image

BASE_URL = "http://127.0.0.1:8000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def test_request(method, endpoint, data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = headers or {}
    req_data = None
    if data and isinstance(data, (dict, list)):
        req_data = json.dumps(data).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    elif data:
        req_data = data
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
        content_type = resp.headers.get("Content-Type", "")
        if "application/json" in content_type:
            return resp.status, json.loads(content.decode("utf-8"))
        return resp.status, content

def run_tests():
    scratch_dir = Path("scratch_test_files")
    scratch_dir.mkdir(exist_ok=True)

    # 1. Health check
    status, health = test_request("GET", "/health")
    assert status == 200 and health["status"] == "healthy", "Health check failed"
    log(f"Health check PASSED: {health}", "SUCCESS")

    # 2. Check initial metrics
    status, metrics = test_request("GET", "/api/v1/metrics")
    assert status == 200, "Metrics failed"
    log(f"Initial metrics: Total={metrics['totalFiles']}, Analyzed={metrics['filesAnalyzed']}", "SUCCESS")

    # 3. Create test files: PDF, DOCX, PNG, and Python file
    pdf_path = scratch_dir / "test_notes.pdf"
    # Create simple minimal valid PDF
    pdf_content = (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
        b"xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000111 00000 n\n"
        b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n"
    )
    with open(pdf_path, "wb") as f:
        f.write(pdf_content)

    # Create DOCX
    docx_path = scratch_dir / "test_assignment.docx"
    import docx
    doc = docx.Document()
    doc.add_heading("Operating Systems Assignment", level=1)
    doc.add_paragraph("Process synchronization ensures cooperative processes execute correctly using semaphores.")
    doc.add_paragraph("Deadlock prevention eliminates mutual exclusion, hold and wait, no preemption, and circular wait.")
    doc.save(str(docx_path))

    # Create PNG Image
    png_path = scratch_dir / "test_diagram.png"
    img = Image.new("RGB", (640, 480), color=(73, 109, 137))
    img.save(png_path)

    # Create Python File
    py_path = scratch_dir / "test_script.py"
    with open(py_path, "w", encoding="utf-8") as f:
        f.write("# Python Data Processing\ndef calculate_fib(n):\n    return n if n <= 1 else calculate_fib(n-1) + calculate_fib(n-2)\n")

    log("Generated 4 sample test files (PDF, DOCX, PNG, Python)", "SUCCESS")

    # 4. Upload all 4 files via multipart/form-data
    import mimetypes
    boundary = "----WebKitFormBoundarySmartFolderTest12345"
    body_parts = []
    
    test_files = [
        ("test_notes.pdf", pdf_path, "application/pdf"),
        ("test_assignment.docx", docx_path, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("test_diagram.png", png_path, "image/png"),
        ("test_script.py", py_path, "text/x-python"),
    ]

    for fname, fpath, mime in test_files:
        with open(fpath, "rb") as fp:
            data = fp.read()
        body_parts.append(f"--{boundary}\r\n".encode("utf-8"))
        body_parts.append(f'Content-Disposition: form-data; name="files"; filename="{fname}"\r\n'.encode("utf-8"))
        body_parts.append(f"Content-Type: {mime}\r\n\r\n".encode("utf-8"))
        body_parts.append(data)
        body_parts.append(b"\r\n")
    body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    payload = b"".join(body_parts)

    status, upload_res = test_request(
        "POST", 
        "/api/v1/files/upload", 
        data=payload, 
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    assert status == 200, f"Upload failed: {upload_res}"
    assert len(upload_res) == 4, f"Expected 4 uploaded records, got {len(upload_res)}"
    log("Successfully uploaded 4 files simultaneously via /upload", "SUCCESS")

    # Verify classification categories
    uploaded_map = {item["name"]: item for item in upload_res}
    assert uploaded_map["test_notes.pdf"]["predictedCategory"] == "PDF Files", "PDF detection failed"
    assert uploaded_map["test_assignment.docx"]["predictedCategory"] == "Word Files", "DOCX detection failed"
    assert uploaded_map["test_diagram.png"]["predictedCategory"] == "Image Files", "PNG detection failed"
    assert uploaded_map["test_script.py"]["predictedCategory"] == "Code Files", "Python detection failed"
    log("All 4 file types correctly classified: PDF -> PDF Files, DOCX -> Word Files, PNG -> Image Files, PY -> Code Files", "SUCCESS")

    # 5. Check updated metrics & category counts
    status, updated_metrics = test_request("GET", "/api/v1/metrics")
    assert updated_metrics["totalFiles"] >= 4, f"Metrics total files mismatch: {updated_metrics}"
    assert updated_metrics["typeBreakdown"]["PDF Files"] >= 1, "PDF count missing in breakdown"
    assert updated_metrics["typeBreakdown"]["Word Files"] >= 1, "Word count missing in breakdown"
    assert updated_metrics["typeBreakdown"]["Image Files"] >= 1, "Image count missing in breakdown"
    assert updated_metrics["typeBreakdown"]["Code Files"] >= 1, "Code count missing in breakdown"
    log(f"Updated metrics confirmed: {updated_metrics['typeBreakdown']}", "SUCCESS")

    # 6. Check folder tree counts
    status, tree = test_request("GET", "/api/v1/folders/tree")
    assert status == 200, "Failed to get tree"
    tree_map = {node["name"]: node for node in tree}
    assert tree_map["PDF Files"]["fileCount"] >= 1, "Tree PDF count mismatch"
    assert tree_map["Word Files"]["fileCount"] >= 1, "Tree Word count mismatch"
    assert tree_map["Image Files"]["fileCount"] >= 1, "Tree Image count mismatch"
    assert tree_map["Code Files"]["fileCount"] >= 1, "Tree Code count mismatch"
    log("Folder tree sidebar counts accurately match uploaded files", "SUCCESS")

    # 7. Check folder contents (testing /api/v1/folders/{id}/files)
    pdf_node_id = tree_map["PDF Files"]["id"]
    status, pdf_files = test_request("GET", f"/api/v1/folders/{pdf_node_id}/files")
    assert status == 200, "Failed to get PDF folder files"
    assert any(f["name"] == "test_notes.pdf" for f in pdf_files), "test_notes.pdf missing from PDF folder"
    log(f"Opening folder 'PDF Files' returns: {[f['name'] for f in pdf_files]}", "SUCCESS")

    word_node_id = tree_map["Word Files"]["id"]
    status, word_files = test_request("GET", f"/api/v1/folders/{word_node_id}/files")
    assert status == 200, "Failed to get Word folder files"
    assert any(f["name"] == "test_assignment.docx" for f in word_files), "test_assignment.docx missing from Word folder"
    log(f"Opening folder 'Word Files' returns: {[f['name'] for f in word_files]}", "SUCCESS")

    # 8. Test Summarization for DOCX and Image
    docx_id = uploaded_map["test_assignment.docx"]["id"]
    status, docx_summary = test_request("POST", f"/api/v1/files/{docx_id}/summarize?mode=detailed")
    assert status == 200, f"Summarize DOCX failed: {docx_summary}"
    assert docx_summary["supported"] is True, "DOCX should be supported"
    assert "synchronization" in docx_summary["summary"].lower() or "deadlock" in docx_summary["summary"].lower(), "Summary missing key terms"
    log(f"DOCX Detailed Summarization: {docx_summary['summary'][:120]}...", "SUCCESS")

    img_id = uploaded_map["test_diagram.png"]["id"]
    status, img_summary = test_request("POST", f"/api/v1/files/{img_id}/summarize?mode=short")
    assert status == 200, f"Summarize Image failed: {img_summary}"
    assert img_summary["supported"] is True, "Image should be supported"
    assert "640x480" in img_summary["summary"], "Image dimensions missing from summary"
    log(f"Image Summarization: {img_summary['summary']}", "SUCCESS")

    # 9. Create Custom Folder & Assign File
    status, custom_fld = test_request("POST", "/api/v1/folders", data={"name": "Semester 3 Notes"})
    assert status == 200, f"Create custom folder failed: {custom_fld}"
    assert custom_fld["name"] == "Semester 3 Notes", "Custom folder name mismatch"
    log(f"Custom folder created: {custom_fld['name']} (path: {custom_fld['path']})", "SUCCESS")

    # Reassign the Python script to the custom folder
    py_id = uploaded_map["test_script.py"]["id"]
    status, reassign_res = test_request("POST", f"/api/v1/files/{py_id}/reassign", data={"newFolder": custom_fld["path"]})
    assert status == 200, f"Reassign failed: {reassign_res}"
    assert reassign_res["recommendedFolder"] == custom_fld["path"], "Target folder not updated"
    log(f"Reassigned '{uploaded_map['test_script.py']['name']}' to '{custom_fld['path']}'", "SUCCESS")

    # 10. Approve Move for PDF, Word, and Python file
    status, approve_pdf = test_request("POST", f"/api/v1/files/{uploaded_map['test_notes.pdf']['id']}/approve")
    assert status == 200, f"Approve PDF failed: {approve_pdf}"
    assert approve_pdf["status"] == "approved"
    log("Approved PDF move to organized storage", "SUCCESS")

    status, approve_py = test_request("POST", f"/api/v1/files/{py_id}/approve")
    assert status == 200, f"Approve Python failed: {approve_py}"
    assert approve_py["status"] == "approved"
    log("Approved Python move into custom folder", "SUCCESS")

    # Check physical existence in organized directory
    organized_pdf = Path("backend/storage/organized/PDF Files/test_notes.pdf")
    assert organized_pdf.exists(), f"Physical organized PDF not found at {organized_pdf}"
    organized_py = Path(f"backend/storage/organized/Semester 3 Notes/test_script.py")
    assert organized_py.exists(), f"Physical organized Python file not found at {organized_py}"
    log(f"Verified physical files in disk: {organized_pdf} and {organized_py}", "SUCCESS")

    # 11. Download Organized ZIP
    status, zip_bytes = test_request("GET", "/api/v1/files/download-zip")
    assert status == 200, "Download ZIP failed"
    out_zip = scratch_dir / "downloaded_test.zip"
    with open(out_zip, "wb") as f:
        f.write(zip_bytes)
    
    with zipfile.ZipFile(out_zip, "r") as zf:
        namelist = zf.namelist()
        log(f"Downloaded ZIP contains {len(namelist)} entries: {namelist}", "SUCCESS")
        assert any("PDF Files/test_notes.pdf" in n for n in namelist), "PDF missing in ZIP"
        assert any("Semester 3 Notes/test_script.py" in n for n in namelist), "Custom folder Python file missing in ZIP"
    log("ZIP download package fully verified with proper directory hierarchy!", "SUCCESS")

    # Clean up local scratch test files
    for p in scratch_dir.glob("*"):
        try:
            p.unlink()
        except Exception:
            pass
    try:
        scratch_dir.rmdir()
    except Exception:
        pass

    log("ALL 11 END-TO-END TEST SUITE STEPS PASSED WITH 100% SUCCESS!", "SUCCESS")

if __name__ == "__main__":
    run_tests()
