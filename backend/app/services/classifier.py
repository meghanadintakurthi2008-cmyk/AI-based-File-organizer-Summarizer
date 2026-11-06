import os
import re
from pathlib import Path

# The 11 required file categories with their extensions, target folders, and UI metadata
CATEGORY_DEFINITIONS = {
    "PDF Files": {
        "extensions": {"pdf"},
        "folder": "PDF Files/",
        "theme": "rose",
        "description": "Portable Document Format files",
        "summarizable": True
    },
    "Word Files": {
        "extensions": {"doc", "docx", "dot", "dotx", "docm"},
        "folder": "Word Files/",
        "theme": "blue",
        "description": "Microsoft Word documents",
        "summarizable": True
    },
    "Excel Files": {
        "extensions": {"xls", "xlsx", "csv", "xlsm", "xlsb", "tsv"},
        "folder": "Excel Files/",
        "theme": "emerald",
        "description": "Excel spreadsheets & CSV datasets",
        "summarizable": True
    },
    "PowerPoint Files": {
        "extensions": {"ppt", "pptx", "pot", "potx", "pps", "ppsx"},
        "folder": "PowerPoint Files/",
        "theme": "amber",
        "description": "Slide presentations",
        "summarizable": True
    },
    "Image Files": {
        "extensions": {"jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "tif"},
        "folder": "Image Files/",
        "theme": "purple",
        "description": "Image and graphic media",
        "summarizable": True
    },
    "Video Files": {
        "extensions": {"mp4", "mkv", "avi", "mov", "webm", "wmv", "flv", "m4v", "3gp"},
        "folder": "Video Files/",
        "theme": "red",
        "description": "Video clips and recordings",
        "summarizable": False
    },
    "Audio Files": {
        "extensions": {"mp3", "wav", "aac", "flac", "ogg", "m4a", "wma", "opus", "aiff"},
        "folder": "Audio Files/",
        "theme": "teal",
        "description": "Sound recordings and audio tracks",
        "summarizable": False
    },
    "Text Files": {
        "extensions": {"txt", "rtf", "md", "markdown", "log", "rst", "tex"},
        "folder": "Text Files/",
        "theme": "slate",
        "description": "Plain text and notes",
        "summarizable": True
    },
    "Code Files": {
        "extensions": {
            "py", "java", "c", "cpp", "cc", "cxx", "h", "hpp", "cs",
            "js", "ts", "jsx", "tsx", "html", "htm", "css", "scss",
            "php", "rb", "go", "rs", "swift", "kt", "sql", "sh",
            "bash", "json", "xml", "yaml", "yml", "toml"
        },
        "folder": "Code Files/",
        "theme": "indigo",
        "description": "Source code and development scripts",
        "summarizable": True
    },
    "Archive Files": {
        "extensions": {"zip", "rar", "7z", "tar", "gz", "tar.gz", "tgz", "bz2", "xz", "iso"},
        "folder": "Archive Files/",
        "theme": "orange",
        "description": "Compressed archives and backups",
        "summarizable": False
    },
    "Other Files": {
        "extensions": set(),
        "folder": "Other Files/",
        "theme": "zinc",
        "description": "Unrecognized or miscellaneous binary formats",
        "summarizable": False
    }
}

COMMON_STOPWORDS = {
    "the", "and", "a", "an", "of", "to", "in", "is", "for", "that", "on", "with",
    "as", "by", "this", "it", "at", "from", "or", "are", "be", "was", "we", "were",
    "which", "have", "has", "had", "not", "but", "all", "can", "will", "would",
    "there", "their", "what", "about", "when", "into", "more", "other",
    "some", "such", "than", "then", "them", "these", "only", "also", "its"
}

# Domain taxonomies for content-based topic & subfolder classification
TOPIC_TAXONOMY = {
    "DBMS": {
        "target_folder": "Academic/DBMS/",
        "keywords": [
            "dbms", "database", "database management", "sql query", "relational database",
            "mongodb", "postgresql", "mysql", "sqlite", "transaction", "acid properties",
            "indexing", "foreign key", "primary key", "normalization", "stored procedure",
            "sharding", "replication", "schema design", "join query", "crud operations"
        ],
        "weight_multipliers": {
            "dbms": 3.0, "database management": 3.0, "sql query": 2.0, "normalization": 2.5, "acid properties": 2.5
        }
    },
    "Java": {
        "target_folder": "Academic/Java/",
        "keywords": [
            "java", "jvm", "public class", "public static void", "inheritance",
            "polymorphism", "encapsulation", "interface", "bytecode", "spring boot",
            "constructor", "override", "extends", "implements", "java classes", "abstract class"
        ],
        "weight_multipliers": {
            "java": 3.0, "jvm": 2.5, "java classes": 3.0, "polymorphism": 2.5, "bytecode": 2.5
        }
    },
    "Python": {
        "target_folder": "Academic/Python/",
        "keywords": [
            "python", "def ", "import numpy", "import pandas", "lambda",
            "list comprehension", "pip install", "pypi", "matplotlib", "dictionary",
            "python assignment", "tuple", "flask", "fastapi"
        ],
        "weight_multipliers": {
            "python": 3.0, "python assignment": 3.0, "import numpy": 2.5, "import pandas": 2.5
        }
    },
    "Chemistry": {
        "target_folder": "Academic/Chemistry/",
        "keywords": [
            "chemistry", "chemical reaction", "molecule", "periodic table",
            "covalent bonding", "atomic mass", "acid base", "molarity", "organic chemistry",
            "catalyst", "stoichiometry", "enthalpy", "valence electrons", "laboratory experiment"
        ],
        "weight_multipliers": {
            "chemistry": 3.0, "chemical reaction": 2.5, "periodic table": 2.5, "organic chemistry": 2.5
        }
    },
    "Operating Systems": {
        "target_folder": "PDF Files/Operating Systems/",
        "keywords": [
            "operating system", "process scheduling", "virtual memory", "deadlock",
            "mutex", "semaphore", "system call", "kernel", "paging", "threads",
            "multithreading", "concurrency", "cpu scheduling", "race condition",
            "page fault", "context switch", "interprocess communication", "ipc",
            "posix", "file system architecture"
        ],
        "weight_multipliers": {
            "deadlock": 2.5, "kernel": 2.0, "operating system": 2.5,
            "process scheduling": 2.5, "paging": 2.0, "mutex": 2.0, "semaphore": 2.0, "virtual memory": 2.5
        }
    },
    "AI & Machine Learning": {
        "target_folder": "PDF Files/AI & Machine Learning/",
        "keywords": [
            "machine learning", "deep learning", "neural network", "transformer",
            "dataset", "supervised learning", "unsupervised", "reinforcement learning",
            "pytorch", "tensorflow", "gradient descent", "backpropagation", "hyperparameters",
            "classification", "clustering", "large language model", "llm", "embeddings",
            "computer vision", "natural language processing", "nlp", "model training", "scikit-learn"
        ],
        "weight_multipliers": {
            "machine learning": 2.5, "deep learning": 2.5, "neural network": 2.5,
            "transformer": 2.0, "pytorch": 2.0, "tensorflow": 2.0, "gradient descent": 2.0
        }
    },
    "Database Systems": {
        "target_folder": "PDF Files/Database Systems/",
        "keywords": [
            "database systems", "sql query", "nosql", "relational database", "mongodb",
            "postgresql", "mysql", "sqlite", "transaction", "acid properties",
            "indexing", "foreign key", "primary key", "normalization", "stored procedure",
            "sharding", "replication", "schema design", "join query", "crud operations"
        ],
        "weight_multipliers": {
            "database systems": 2.5, "sql query": 2.0, "mongodb": 2.0, "postgresql": 2.0,
            "acid properties": 2.5, "normalization": 2.5, "relational database": 2.5
        }
    },
    "Healthcare & Medicine": {
        "target_folder": "Word Files/Healthcare & Medicine/",
        "keywords": [
            "patient", "clinical", "hospital", "diagnosis", "medical",
            "prescription", "treatment", "doctor", "cardiology", "symptoms",
            "pathology", "disease", "vital signs", "blood pressure", "pharmacy",
            "radiology", "therapy", "surgery", "healthcare", "oncology"
        ],
        "weight_multipliers": {
            "patient": 2.0, "clinical": 2.5, "diagnosis": 2.5, "hospital": 1.8,
            "treatment": 2.0, "cardiology": 2.5, "pathology": 2.5, "prescription": 2.0
        }
    },
    "Finance & Accounting": {
        "target_folder": "Excel Files/Finance & Accounting/",
        "keywords": [
            "financial", "balance sheet", "accounting", "revenue", "fiscal year",
            "tax return", "profit and loss", "cash flow", "audit", "invoice total",
            "interest rate", "payroll", "dividend", "equity", "investment portfolio",
            "ledger", "depreciation", "banking"
        ],
        "weight_multipliers": {
            "balance sheet": 2.5, "accounting": 2.0, "revenue": 1.8, "cash flow": 2.0,
            "profit and loss": 2.5, "fiscal year": 2.0, "tax return": 2.0
        }
    },
    "Web Development": {
        "target_folder": "Code Files/Web Development/",
        "keywords": [
            "frontend", "backend", "rest api", "graphql", "javascript", "typescript",
            "react component", "html5", "css3", "fastapi router", "express js",
            "endpoint", "tailwind", "nextjs", "node.js", "http request", "webhook", "dom"
        ],
        "weight_multipliers": {
            "rest api": 2.0, "react component": 2.5, "typescript": 1.8, "fastapi router": 2.5,
            "frontend": 1.8, "backend": 1.8
        }
    },
    "Networking & Security": {
        "target_folder": "Code Files/Networking & Security/",
        "keywords": [
            "cybersecurity", "encryption", "firewall", "tcp/ip", "packet",
            "vulnerability", "authentication", "authorization", "cryptography",
            "ssl certificate", "tls", "penetration testing", "dns", "routing protocol",
            "malware", "phishing", "socket"
        ],
        "weight_multipliers": {
            "cybersecurity": 2.5, "encryption": 2.0, "firewall": 2.0,
            "cryptography": 2.5, "vulnerability": 2.5, "penetration testing": 2.5
        }
    },
    "College & Academics": {
        "target_folder": "Academic/General/",
        "keywords": [
            "syllabus", "semester", "lecture notes", "coursework", "assignment",
            "university", "professor", "curriculum", "textbook", "midterm exam",
            "final exam", "academic credit", "homework", "student id"
        ],
        "weight_multipliers": {
            "syllabus": 2.5, "lecture notes": 2.0, "semester": 2.0, "curriculum": 2.0
        }
    }
}

class FileTypeClassificationEngine:
    """
    Automatic file-type detection and content-driven folder recommendation engine.
    Handles uppercase extensions, filenames containing multiple dots,
    extensionless files, and deep content-based topic & subfolder recommendations.
    """

    @classmethod
    def detect_extension(cls, filename: str) -> str:
        """
        Extracts clean lowercase extension, handling multi-dot filenames
        such as 'archive.tar.gz' or 'project.backup.2026.docx'.
        """
        clean_name = filename.strip()
        lower_name = clean_name.lower()

        # Check multi-part archive extensions first
        if lower_name.endswith(".tar.gz"):
            return "tar.gz"
        if lower_name.endswith(".tar.bz2"):
            return "tar.bz2"

        # Check standard single extension
        if "." in clean_name:
            parts = clean_name.rsplit(".", 1)
            ext = parts[1].strip().lower()
            return ext

        # Extensionless file heuristics
        base = lower_name.lower()
        if base in ["makefile", "dockerfile", "jenkinsfile", "gemfile", "procfile"]:
            return "code_noext"
        if base in ["license", "readme", "changelog", "authors", "todo", "notes"]:
            return "text_noext"

        return ""

    @classmethod
    def extract_top_tokens(cls, text: str, fallback_term: str = "") -> list:
        if not text or not text.strip():
            term = fallback_term or "document"
            return [{"term": term, "weight": 0.99}]

        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        meaningful = [w for w in words if w not in COMMON_STOPWORDS]
        if not meaningful:
            term = fallback_term or "document"
            return [{"term": term, "weight": 0.99}]

        freq = {}
        for w in meaningful:
            freq[w] = freq.get(w, 0) + 1

        sorted_terms = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:6]
        max_f = sorted_terms[0][1] if sorted_terms else 1
        return [{"term": term, "weight": round(min(1.0, count / max_f), 2)} for term, count in sorted_terms]

    @classmethod
    def detect_topic(cls, content: str) -> tuple:
        """
        Analyzes document content across domain taxonomies.
        Returns (best_topic, best_score, matched_keywords) or (None, 0.0, []).
        """
        if not content or len(content.strip()) < 15:
            return (None, 0.0, [])

        text_lower = content.lower()
        topic_scores = {}
        topic_matches = {}

        for topic_name, topic_data in TOPIC_TAXONOMY.items():
            score = 0.0
            matched = []
            for kw in topic_data["keywords"]:
                if kw in text_lower:
                    cnt = min(4, text_lower.count(kw))
                    mult = topic_data.get("weight_multipliers", {}).get(kw, 1.0)
                    phrase_weight = 2.5 if " " in kw else 1.0
                    kw_score = cnt * phrase_weight * mult
                    score += kw_score
                    matched.append((kw, kw_score))

            if score > 0:
                topic_scores[topic_name] = score
                topic_matches[topic_name] = sorted(matched, key=lambda x: x[1], reverse=True)

        if not topic_scores:
            return (None, 0.0, [])

        best_topic = max(topic_scores, key=topic_scores.get)
        best_score = topic_scores[best_topic]

        # Require a clear topic match threshold
        if best_score >= 3.0:
            top_kws = [m[0] for m in topic_matches[best_topic][:4]]
            return (best_topic, best_score, top_kws)

        return (None, best_score, [])

    @classmethod
    def classify_file(cls, filename: str, content_preview: str = "") -> dict:
        """
        Identifies the file type and generates corresponding category and target folder.
        If content is available, performs NLP topic classification to recommend
        meaningful content-based subfolders (e.g. 'PDF Files/Operating Systems/').
        """
        ext = cls.detect_extension(filename)

        if ext == "code_noext":
            cat_name = "Code Files"
        elif ext == "text_noext":
            cat_name = "Text Files"
        else:
            cat_name = "Other Files"
            for cat, meta in CATEGORY_DEFINITIONS.items():
                if ext in meta["extensions"]:
                    cat_name = cat
                    break

        cat_data = CATEGORY_DEFINITIONS.get(cat_name, CATEGORY_DEFINITIONS["Other Files"])
        base_folder = cat_data["folder"]

        # Content-based topic analysis
        detected_topic, score, top_kws = cls.detect_topic(content_preview) if content_preview else (None, 0.0, [])

        # If a topical match is detected for document/code/data types, suggest a topic subfolder
        if detected_topic and cat_name in [
            "PDF Files", "Word Files", "PowerPoint Files", "Excel Files", "Text Files", "Code Files"
        ]:
            topic_meta = TOPIC_TAXONOMY.get(detected_topic, {})
            recommended_folder = topic_meta.get("target_folder") or f"{cat_name}/{detected_topic}/"
            confidence = round(min(99.0, 92.0 + min(score * 0.8, 6.5)), 1)
            kw_str = ", ".join(top_kws[:3]) if top_kws else detected_topic

            # Check for misleading filename
            lower_fname = filename.lower()
            misleading_indicator = ""
            if "invoice" in lower_fname and detected_topic != "Finance & Accounting":
                misleading_indicator = f" (content overrides misleading '{filename}' name)"
            elif "notes" in lower_fname and detected_topic not in ["College & Academics", "Text Files"]:
                misleading_indicator = f" (classified by content rather than filename)"

            confidence_reason = (
                f"Content-driven analysis: Document discusses {detected_topic} "
                f"(keywords: {kw_str}){misleading_indicator} → {recommended_folder}"
            )
            top_tokens = cls.extract_top_tokens(content_preview, fallback_term=ext)
            alternative_suggestions = [
                {"folder": base_folder, "confidence": 88.0, "reason": f"Parent category for {cat_name}"},
                {"folder": f"{detected_topic}/", "confidence": 80.0, "reason": f"Top-level topic category"},
                {"folder": "Other Files/", "confidence": 40.0, "reason": "General archive fallback"}
            ]
        else:
            recommended_folder = base_folder
            confidence = 98.0 if cat_name != "Other Files" else 65.0
            confidence_reason = f"{filename} → {base_folder}"
            top_tokens = cls.extract_top_tokens(content_preview, fallback_term=ext or "raw")
            alternative_suggestions = [
                {"folder": "Other Files/", "confidence": 50.0, "reason": "General archive fallback"}
            ] if cat_name != "Other Files" else []

        return {
            "predicted_category": cat_name,
            "category_theme": cat_data["theme"],
            "recommended_folder": recommended_folder,
            "confidence": confidence,
            "confidence_reason": confidence_reason,
            "summarizable": cat_data["summarizable"],
            "alternative_suggestions": alternative_suggestions,
            "top_tokens": top_tokens
        }

    # Backward compatibility wrapper for existing routers
    def predict_folder(self, text: str = "", filename: str = "", method: str = "") -> dict:
        return self.classify_file(filename=filename, content_preview=text)

# Singleton instance
classifier_engine = FileTypeClassificationEngine()

