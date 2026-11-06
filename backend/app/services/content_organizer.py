import re
import math
from collections import Counter
from typing import List, Dict, Any, Tuple

# Comprehensive stopword list for document text analysis
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
    "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
    "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
    "you've", "your", "yours", "yourself", "yourselves", "also", "using", "used", "document", "file",
    "page", "section", "chapter", "table", "figure", "total", "null", "none", "true", "false",
    "will", "shall", "may", "might", "must", "can", "could", "would", "should", "like", "just",
    "make", "made", "take", "taken", "give", "given", "find", "found", "show", "shown", "see", "seen"
}

# Domain taxonomies for topic identification
TOPIC_DOMAINS = {
    "Java Programming": {
        "folder": "Java Programming/",
        "keywords": [
            "java", "jvm", "inheritance", "polymorphism", "class", "classes", "object", "objects",
            "method", "methods", "interface", "spring", "boot", "constructor", "bytecode", "override",
            "encapsulation", "abstract", "extends", "implements", "package", "public", "static", "void"
        ],
        "weight_multipliers": {"java": 3.0, "jvm": 2.5, "polymorphism": 2.5, "inheritance": 2.5, "bytecode": 2.5}
    },
    "Database Management": {
        "folder": "Database Management/",
        "keywords": [
            "database", "dbms", "sql", "query", "queries", "table", "tables", "normalization",
            "relational", "schema", "mysql", "postgresql", "mongodb", "sqlite", "acid", "transaction",
            "transactions", "foreign", "primary", "indexing", "join", "joins", "nosql", "crud"
        ],
        "weight_multipliers": {"sql": 3.0, "database": 2.5, "dbms": 3.0, "normalization": 3.0, "acid": 2.5}
    },
    "Certificates": {
        "folder": "Certificates/",
        "keywords": [
            "certificate", "certify", "certified", "award", "achievement", "completion", "honor",
            "honour", "participation", "merit", "diploma", "credential", "presented", "awarded",
            "recognize", "recognition", "distinction", "excellence"
        ],
        "weight_multipliers": {"certificate": 3.0, "certified": 2.5, "award": 2.5, "achievement": 2.5}
    },
    "Operating Systems": {
        "folder": "Operating Systems/",
        "keywords": [
            "operating", "process", "processes", "scheduling", "deadlock", "semaphore", "virtual",
            "memory", "kernel", "paging", "threads", "thread", "mutex", "ipc", "multithreading",
            "cpu", "posix", "interrupt", "filesystem", "concurrency"
        ],
        "weight_multipliers": {"deadlock": 3.0, "semaphore": 2.5, "kernel": 2.5, "paging": 2.5}
    },
    "Machine Learning & AI": {
        "folder": "Machine Learning & AI/",
        "keywords": [
            "machine", "learning", "neural", "network", "deep", "model", "models", "dataset",
            "transformer", "pytorch", "tensorflow", "gradient", "descent", "training", "classification",
            "clustering", "regression", "llm", "embeddings", "nlp", "epoch", "hyperparameters"
        ],
        "weight_multipliers": {"neural": 3.0, "pytorch": 2.5, "tensorflow": 2.5, "transformer": 2.5}
    },
    "Web Development": {
        "folder": "Web Development/",
        "keywords": [
            "frontend", "backend", "react", "javascript", "typescript", "html", "css", "api",
            "component", "components", "endpoint", "endpoints", "tailwind", "node", "express",
            "fastapi", "router", "webhook", "dom", "graphql", "rest"
        ],
        "weight_multipliers": {"react": 2.5, "typescript": 2.5, "javascript": 2.0, "fastapi": 2.5}
    },
    "Finance & Accounting": {
        "folder": "Finance & Accounting/",
        "keywords": [
            "financial", "accounting", "balance", "sheet", "revenue", "profit", "loss", "invoice",
            "tax", "budget", "ledger", "audit", "payroll", "dividend", "cash", "depreciation",
            "fiscal", "equity", "investment", "banking"
        ],
        "weight_multipliers": {"revenue": 2.5, "accounting": 2.5, "invoice": 2.5, "ledger": 2.5}
    },
    "Healthcare & Medicine": {
        "folder": "Healthcare & Medicine/",
        "keywords": [
            "patient", "clinical", "hospital", "diagnosis", "medical", "disease", "treatment",
            "doctor", "health", "prescription", "symptoms", "therapy", "cardiology", "pathology",
            "surgery", "pharmacy", "radiology", "vital", "blood"
        ],
        "weight_multipliers": {"clinical": 2.5, "patient": 2.0, "diagnosis": 2.5, "cardiology": 3.0}
    },
    "Data Science & Analytics": {
        "folder": "Data Science & Analytics/",
        "keywords": [
            "dataframe", "pandas", "numpy", "visualization", "statistics", "analytics", "dataset",
            "matplotlib", "seaborn", "histogram", "correlation", "variance", "jupyter", "distribution"
        ],
        "weight_multipliers": {"pandas": 3.0, "numpy": 2.5, "dataframe": 3.0}
    },
    "Networking & Security": {
        "folder": "Networking & Security/",
        "keywords": [
            "cybersecurity", "encryption", "firewall", "protocol", "packet", "packets", "cryptography",
            "vulnerability", "authentication", "ssl", "tls", "socket", "dns", "malware", "phishing",
            "router", "tcp", "udp"
        ],
        "weight_multipliers": {"cybersecurity": 3.0, "encryption": 2.5, "firewall": 2.5, "cryptography": 3.0}
    },
    "Academic Coursework": {
        "folder": "Academic Coursework/",
        "keywords": [
            "syllabus", "semester", "coursework", "assignment", "lecture", "notes", "curriculum",
            "textbook", "exam", "midterm", "homework", "student", "university", "professor"
        ],
        "weight_multipliers": {"syllabus": 3.0, "semester": 2.5, "coursework": 2.5}
    }
}


class ContentOrganizer:
    """
    Topic-based document organizer that analyzes ACTUAL extracted text from documents
    (excerpt and raw content) using keyword extraction (word frequency and manual TF-IDF).
    Groups documents into topical folders based on shared keywords and domain taxonomy.
    """

    @classmethod
    def extract_document_words(cls, text: str) -> List[str]:
        """Extracts cleaned meaningful words from raw text or excerpt."""
        if not text or not text.strip():
            return []
        tokens = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        return [w for w in tokens if w not in STOPWORDS]

    @classmethod
    def compute_tfidf_keywords(cls, doc_words_map: Dict[str, List[str]], top_k: int = 5) -> Dict[str, List[str]]:
        """
        Builds a word-document matrix manually and computes TF-IDF scores
        to extract the top distinguishing keywords for each document.
        """
        num_docs = len(doc_words_map)
        if num_docs == 0:
            return {}

        # 1. Document Frequency (DF) across the batch
        doc_freq = Counter()
        doc_tf = {}
        for doc_id, words in doc_words_map.items():
            counts = Counter(words)
            doc_tf[doc_id] = counts
            for term in counts.keys():
                doc_freq[term] += 1

        # 2. Compute TF-IDF score for each term in each document
        result_keywords = {}
        for doc_id, counts in doc_tf.items():
            total_words = sum(counts.values())
            if total_words == 0:
                result_keywords[doc_id] = []
                continue

            term_scores = []
            for term, count in counts.items():
                tf = count / total_words
                # Smoothed IDF: log(1 + N / DF) + 1.0
                idf = math.log(1.0 + (num_docs / doc_freq[term])) + 1.0
                tfidf = tf * idf
                term_scores.append((term, tfidf, count))

            # Sort by TF-IDF score descending, then by raw frequency
            term_scores.sort(key=lambda x: (x[1], x[2]), reverse=True)
            result_keywords[doc_id] = [t[0] for t in term_scores[:top_k]]

        return result_keywords

    @classmethod
    def match_predefined_topic(cls, keywords: List[str], text: str) -> Tuple[str, str, float, List[str]]:
        """
        Checks if document keywords and text match one of the defined domain taxonomies.
        Returns: (topic_name, target_folder, confidence, matched_keywords) or (None, None, 0.0, [])
        """
        text_lower = text.lower() if text else ""
        best_topic = None
        best_folder = None
        best_score = 0.0
        best_matched = []

        for topic_name, topic_data in TOPIC_DOMAINS.items():
            score = 0.0
            matched = []
            multipliers = topic_data.get("weight_multipliers", {})

            for kw in topic_data["keywords"]:
                # Check presence in extracted top keywords (highest weight)
                if kw in keywords:
                    mult = multipliers.get(kw, 1.0)
                    kw_val = 3.0 * mult
                    score += kw_val
                    matched.append(kw)
                # Check presence in excerpt text
                elif kw in text_lower:
                    mult = multipliers.get(kw, 1.0)
                    kw_val = 1.0 * mult
                    score += kw_val
                    matched.append(kw)

            if score > best_score:
                best_score = score
                best_topic = topic_name
                best_folder = topic_data["folder"]
                best_matched = matched

        # Require a minimum threshold to claim a predefined topic
        if best_score >= 3.0:
            confidence = round(min(98.0, 85.0 + min(best_score * 1.5, 12.0)), 1)
            return best_topic, best_folder, confidence, best_matched[:5]

        return None, None, 0.0, []

    @classmethod
    def organize_files(cls, records: List[Any]) -> Dict[str, Any]:
        """
        Takes a list of FileRecord objects with their extracted text from the database:
        1. Extracts words from the excerpt field of each document.
        2. Computes TF-IDF keywords per document without external ML libraries.
        3. Identifies domain topics or clusters files sharing keywords.
        4. Handles empty text gracefully by falling back to file type category.
        5. Returns structured suggestions and groupedTopics dictionary.
        """
        if not records:
            return {"suggestions": [], "groupedTopics": {}}

        # Extract words from each record's stored excerpt
        doc_words_map = {}
        doc_text_map = {}
        for r in records:
            text = (r.excerpt or "").strip()
            # If excerpt is short or missing, fallback to filename or empty
            doc_text_map[r.id] = text
            words = cls.extract_document_words(text)
            doc_words_map[r.id] = words

        # Extract top keywords per document via TF-IDF
        keywords_map = cls.compute_tfidf_keywords(doc_words_map, top_k=6)

        suggestions = []
        grouped_topics: Dict[str, List[str]] = {}

        # First pass: classify files by domain taxonomy or detect empty text
        pending_cluster_records = []
        record_map = {r.id: r for r in records}

        for r in records:
            text = doc_text_map[r.id]
            kws = keywords_map.get(r.id, [])

            # Handle empty text gracefully
            if not text or len(kws) == 0:
                fallback_folder = r.recommended_folder or f"{r.predicted_category}/"
                cat_topic = r.predicted_category or "Uncategorized"
                suggestions.append({
                    "fileId": r.id,
                    "fileName": r.filename,
                    "suggestedFolder": fallback_folder,
                    "confidence": 72.0,
                    "reason": f"No extractable text content found; organized by file format category: {r.predicted_category}",
                    "topKeywords": []
                })
                grouped_topics.setdefault(cat_topic, []).append(r.filename)
                continue

            # Check domain taxonomy match
            topic, folder, conf, matched_kws = cls.match_predefined_topic(kws, text)
            if topic and folder:
                display_kws = list(dict.fromkeys(matched_kws + kws))[:5]
                reason = f"Document content strongly matches {topic} (keywords: {', '.join(display_kws[:4])})"
                suggestions.append({
                    "fileId": r.id,
                    "fileName": r.filename,
                    "suggestedFolder": folder,
                    "confidence": conf,
                    "reason": reason,
                    "topKeywords": display_kws
                })
                grouped_topics.setdefault(topic, []).append(r.filename)
            else:
                # Needs cluster grouping or keyword-derived folder
                pending_cluster_records.append(r)

        # Second pass: group remaining documents by shared keywords
        if pending_cluster_records:
            # Build pairwise shared keywords
            grouped_file_ids = set()
            clusters: List[Tuple[str, str, List[str], List[Any]]] = []

            for i in range(len(pending_cluster_records)):
                r1 = pending_cluster_records[i]
                if r1.id in grouped_file_ids:
                    continue

                kws1 = set(keywords_map.get(r1.id, []))
                cluster_members = [r1]
                shared_terms = set(kws1)

                for j in range(i + 1, len(pending_cluster_records)):
                    r2 = pending_cluster_records[j]
                    if r2.id in grouped_file_ids:
                        continue

                    kws2 = set(keywords_map.get(r2.id, []))
                    common = kws1.intersection(kws2)
                    # If documents share 2 or more keywords, group them together
                    if len(common) >= 2 or (len(kws1) <= 2 and len(common) >= 1):
                        cluster_members.append(r2)
                        shared_terms = shared_terms.intersection(kws2) or common

                if len(cluster_members) > 1:
                    # Form a shared cluster
                    for m in cluster_members:
                        grouped_file_ids.add(m.id)

                    cluster_kws = sorted(list(shared_terms or kws1))[:3]
                    cluster_name = " ".join([w.title() for w in cluster_kws])
                    if not cluster_name.strip():
                        cluster_name = "Related Documents"
                    cluster_folder = f"{cluster_name}/"
                    clusters.append((cluster_name, cluster_folder, cluster_kws, cluster_members))

            # Record suggestions for clustered files
            for cluster_name, cluster_folder, cluster_kws, members in clusters:
                kw_str = ", ".join(cluster_kws) if cluster_kws else "shared content terms"
                for m in members:
                    m_kws = keywords_map.get(m.id, cluster_kws)
                    suggestions.append({
                        "fileId": m.id,
                        "fileName": m.filename,
                        "suggestedFolder": cluster_folder,
                        "confidence": 88.0,
                        "reason": f"Grouped with related files sharing top keywords: {kw_str}",
                        "topKeywords": m_kws[:5]
                    })
                    grouped_topics.setdefault(cluster_name, []).append(m.filename)

            # Handle unique remaining files that did not share keywords
            for r in pending_cluster_records:
                if r.id in grouped_file_ids:
                    continue

                kws = keywords_map.get(r.id, [])
                if kws:
                    # Suggest a folder based on its top 1 or 2 keywords
                    topic_title = " ".join([w.title() for w in kws[:2]])
                    suggested_folder = f"{topic_title}/"
                    confidence = 82.0
                    reason = f"Folder suggested from primary content keywords: {', '.join(kws[:3])}"
                else:
                    topic_title = r.predicted_category
                    suggested_folder = r.recommended_folder or f"{r.predicted_category}/"
                    confidence = 70.0
                    reason = f"Categorized by document file type: {r.predicted_category}"

                suggestions.append({
                    "fileId": r.id,
                    "fileName": r.filename,
                    "suggestedFolder": suggested_folder,
                    "confidence": confidence,
                    "reason": reason,
                    "topKeywords": kws[:5]
                })
                grouped_topics.setdefault(topic_title, []).append(r.filename)

        return {
            "suggestions": suggestions,
            "groupedTopics": grouped_topics
        }
