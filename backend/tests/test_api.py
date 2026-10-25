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

class TestSmartFolderAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("SmartFolder", data["service"])

    def test_ai_classifier_ai_paper(self):
        text = "We propose a sparse self-attention transformer neural network trained with cross-entropy loss and backpropagation in PyTorch."
        result = classifier_engine.predict_folder(text, "transformer_paper.pdf", "Full Text NLP")
        self.assertEqual(result["recommended_folder"], "/Academics/Fall_2026/AI/")
        self.assertEqual(result["predicted_category"], "Research Papers")
        self.assertGreaterEqual(result["confidence"], 80.0)
        self.assertGreater(len(result["top_tokens"]), 0)

    def test_ai_classifier_invoice(self):
        text = "Invoice #INV-9812 Billed To: Acme Corp Amount Due: $450.00 VAT Remittance Due Date Oct 2026"
        result = classifier_engine.predict_folder(text, "acme_invoice.pdf", "Full Text NLP")
        self.assertEqual(result["recommended_folder"], "/Finance/Invoices_2026/")
        self.assertEqual(result["predicted_category"], "Finance")
        self.assertGreaterEqual(result["confidence"], 80.0)

    def test_get_metrics(self):
        response = self.client.get("/api/v1/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["totalAnalyzed"], 1200)
        self.assertGreater(data["confidence"], 90.0)

    def test_get_folder_tree(self):
        response = self.client.get("/api/v1/folders/tree")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data), 0)
        paths = [node["path"] for node in data]
        self.assertTrue("/Academics/" in paths or "/Finance/" in paths)

    def test_get_cluster_suggestions(self):
        response = self.client.get("/api/v1/clusters/suggestions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data), 0)
        self.assertIn("suggestedFolder", data[0])

if __name__ == "__main__":
    unittest.main()
