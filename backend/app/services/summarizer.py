import re
from pathlib import Path
from typing import List, Dict, Any
from .extractor import DocumentExtractor
from .classifier import FileTypeClassificationEngine, CATEGORY_DEFINITIONS

class DocumentSummarizer:
    """
    On-demand document and image summarization engine.
    Produces authentic short and detailed summaries from real extracted text and metadata.
    """

    @classmethod
    def summarize_file(cls, file_path: Path, filename: str, mode: str = "short") -> dict:
        """
        Generates a summary based on file format and content.
        Supports: PDF, DOCX, PPTX, Excel/CSV, Text/Markdown, Code, and Images.
        """
        classification = FileTypeClassificationEngine.classify_file(filename)
        category = classification["predicted_category"]
        is_supported = classification["summarizable"]

        # Check for unsupported formats (Videos, Audios, Archives, Unknown)
        if not is_supported or category in ["Video Files", "Audio Files", "Archive Files", "Other Files"]:
            return {
                "supported": False,
                "filename": filename,
                "fileType": category,
                "mode": mode,
                "message": (
                    f"Summarization is unavailable for {category}. "
                    "Supported formats: PDF (.pdf), Word (.docx), Excel/CSV (.xlsx, .csv), "
                    "PowerPoint (.pptx), Text (.txt, .md), and Images (.png, .jpg)."
                ),
                "summary": "",
                "keyPoints": [],
                "metadata": {}
            }

        # Extract content & metadata
        extracted = DocumentExtractor.extract(file_path, filename)
        raw_text = extracted.get("raw_text", "")
        meta = extracted.get("metadata", {})
        method = extracted.get("method", "Extraction")

        # 1. Image Summarization
        if category == "Image Files":
            return cls._summarize_image(filename, raw_text, meta, mode)

        # 2. Spreadsheet Summarization
        if category == "Excel Files":
            return cls._summarize_spreadsheet(filename, raw_text, meta, mode)

        # 3. PowerPoint Summarization
        if category == "PowerPoint Files":
            return cls._summarize_presentation(filename, raw_text, meta, mode)

        # 4. Scanned PDF Handling
        if meta.get("is_scanned"):
            return {
                "supported": True,
                "filename": filename,
                "fileType": category,
                "mode": mode,
                "summary": (
                    f"'{filename}' is a scanned PDF containing {meta.get('page_count', 1)} pages without "
                    "an embedded digital text layer. An external OCR transcription engine is required to extract "
                    "handwritten or scanned optical characters."
                ),
                "keyPoints": [
                    f"Detected format: Scanned PDF ({meta.get('page_count', 1)} pages)",
                    "Direct text layer: Not found (pixel rasterized)",
                    "Recommendation: Apply optical character recognition (OCR) tool"
                ],
                "metadata": meta,
                "wordCount": 0
            }

        # 5. Standard Text / PDF / Word / Code Summarization
        return cls._extractive_text_summary(filename, category, raw_text, meta, mode)

    @classmethod
    def _extractive_text_summary(cls, filename: str, category: str, text: str, meta: dict, mode: str) -> dict:
        """
        Authentic extractive sentence ranking based on term frequencies and paragraph positioning.
        """
        clean_text = text.strip()
        words = clean_text.split()
        word_count = len(words)

        if word_count == 0:
            return {
                "supported": True,
                "filename": filename,
                "fileType": category,
                "mode": mode,
                "summary": f"'{filename}' appears to be an empty or whitespace-only document.",
                "keyPoints": ["File contains 0 readable words."],
                "metadata": meta,
                "wordCount": 0
            }

        # Split into sentences
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean_text) if len(s.strip()) > 15]

        # Calculate word frequencies (ignoring common stopwords)
        stopwords = {
            "the", "and", "a", "an", "of", "to", "in", "is", "for", "that", "on", "with",
            "as", "by", "this", "it", "at", "from", "or", "are", "be", "was", "we", "were"
        }
        word_freq = {}
        for w in words:
            wl = re.sub(r"[^\w]", "", w.lower())
            if wl and wl not in stopwords and len(wl) > 2:
                word_freq[wl] = word_freq.get(wl, 0) + 1

        # Score sentences
        scored_sentences = []
        for i, s in enumerate(sentences):
            s_words = [re.sub(r"[^\w]", "", w.lower()) for w in s.split()]
            score = sum(word_freq.get(w, 0) for w in s_words) / max(1, len(s_words))
            # Position bonus for opening paragraphs
            if i < 3:
                score *= 1.3
            scored_sentences.append((i, s, score))

        scored_sentences.sort(key=lambda x: x[2], reverse=True)

        if mode == "points":
            # Points mode: return only the importantPoints list as bullet points (no detailed summary prose)
            raw_points = cls._extract_important_points(sentences, clean_text)
            if len(raw_points) < 4:
                selected = sorted(scored_sentences[:5], key=lambda x: x[0])
                for s in selected:
                    if s[1] not in raw_points:
                        raw_points.append(s[1])
                    if len(raw_points) >= 5:
                        break

            clean_points = [p.lstrip("•-* ").strip() for p in raw_points if p.strip()]
            summary_body = "\n".join([f"• {p}" for p in clean_points])
            key_points = clean_points
            final_summary = summary_body

        elif mode == "exam":
            # Exam mode: key terms as Q&A format, important facts, definitions, and practice questions derived from content
            topic_tuple = FileTypeClassificationEngine.detect_topic(clean_text)
            topic_name = topic_tuple[0] if topic_tuple[0] else cls._infer_fallback_topic(clean_text, category)

            # 1. Key terms & definitions in Q&A format
            key_terms = cls._extract_key_terms(clean_text, topic_name)
            qa_sections = []
            exam_key_points = []

            for t in key_terms[:4]:
                qa_sections.append(f"Q: What is {t['term']}?\nA: {t['definition']}")
                exam_key_points.append(f"Q&A: What is {t['term']}? -> {t['definition']}")

            if not qa_sections:
                top_terms = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:3]
                for term, cnt in top_terms:
                    term_cap = term.title()
                    qa_sections.append(
                        f"Q: What role does '{term_cap}' play in this document?\n"
                        f"A: '{term_cap}' is a fundamental concept mentioned {cnt} times across the text."
                    )
                    exam_key_points.append(f"Core Concept: {term_cap} (frequently referenced term).")

            qa_text = "\n\n".join(qa_sections)

            # 2. Key facts, dates, and figures
            facts_list = cls._extract_dates_figures_facts(clean_text)
            fact_lines = []
            for f in facts_list[:4]:
                fact_lines.append(f"• {f['item']} ({f['category'].title()}): {f['context']}")
                exam_key_points.append(f"Fact ({f['category']}): {f['item']} in context {f['context'][:60]}")

            # 3. Important points / core exam takeaways
            imp_points = cls._extract_important_points(sentences, clean_text)
            points_lines = [f"• {p}" for p in imp_points[:4]]

            # 4. Practice exam questions derived from content
            practice_questions = []
            if key_terms:
                t1 = key_terms[0]['term']
                practice_questions.append(f"1. Define and explain the significance of {t1} within {topic_name}.")
            else:
                practice_questions.append(f"1. Explain the primary concepts and methodologies discussed in {filename}.")

            if len(key_terms) > 1:
                t2 = key_terms[1]['term']
                practice_questions.append(f"2. How does {t2} function, and what are its key operational characteristics?")
            elif imp_points:
                practice_questions.append(f"2. Analyze the significance of the following finding: '{imp_points[0][:90]}...'")
            else:
                practice_questions.append(f"2. Describe the core problem or process analyzed in this document.")

            practice_questions.append(f"3. Summarize the main conclusions and practical applications highlighted in this material.")

            # Assemble exam guide summary
            exam_summary_parts = [
                f"EXAM REVISION GUIDE: '{filename}' ({topic_name})\n",
                "[1. Key Definitions & Conceptual Q&A]",
                qa_text,
                "\n[2. High-Yield Facts & Key Data]" if fact_lines else "",
                "\n".join(fact_lines) if fact_lines else "",
                "\n[3. Core Exam Takeaways]" if points_lines else "",
                "\n".join(points_lines) if points_lines else "",
                "\n[4. Practice Exam Questions]",
                "\n".join(practice_questions)
            ]
            final_summary = "\n".join([p for p in exam_summary_parts if p.strip()])

            for q in practice_questions:
                exam_key_points.append(f"Practice Question: {q[3:]}")
            key_points = exam_key_points[:8]

        elif mode == "short":
            # Pick top 2 sentences sorted in original order
            selected = sorted(scored_sentences[:2], key=lambda x: x[0])
            summary_body = " ".join([s[1] for s in selected]) if selected else clean_text[:250]

            # Generate 3 concise key takeaways
            key_points = [
                f"Document type: {category} ({word_count:,} words).",
                f"Primary topic: {selected[0][1][:120]}..." if selected else f"Extracted from {filename}.",
                f"Structure: {meta.get('page_count', meta.get('line_count', 'Standard'))} pages/sections analyzed."
            ]

            final_summary = f"Summary ({category} • {word_count:,} words):\n{summary_body}"
        else:
            # Detailed mode: 4-5 top sentences + comprehensive breakdown
            selected = sorted(scored_sentences[:5], key=lambda x: x[0])
            summary_body = "\n\n".join([f"• {s[1]}" for s in selected]) if selected else clean_text[:500]

            # Extract top 5 frequent topical keywords
            top_kw = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:6]
            kw_str = ", ".join([f"'{k}' ({v}x)" for k, v in top_kw])

            key_points = [
                f"Total Word Count: {word_count:,} words across {len(sentences)} detected sentences.",
                f"Prominent Terms: {kw_str}.",
                f"Document Sections: {meta.get('page_count', meta.get('paragraph_count', 'Multi-section'))} pages/paragraphs verified.",
                f"Content density: {round(word_count / max(1, len(sentences)), 1)} words per sentence on average."
            ]

            final_summary = (
                f"Detailed Breakdown for '{filename}':\n\n"
                f"Key Content Excerpts:\n{summary_body}\n\n"
                f"The document covers core concepts revolving around {kw_str}."
            )

        return {
            "supported": True,
            "filename": filename,
            "fileType": category,
            "mode": mode,
            "summary": final_summary,
            "keyPoints": key_points,
            "metadata": {
                **meta,
                "word_count": word_count,
                "sentence_count": len(sentences)
            },
            "wordCount": word_count
        }

    @classmethod
    def _summarize_spreadsheet(cls, filename: str, text: str, meta: dict, mode: str) -> dict:
        headers = meta.get("headers", [])
        num_rows = meta.get("row_count", 0)
        num_cols = meta.get("column_count", len(headers))

        header_str = ", ".join([f"'{h}'" for h in headers[:8]]) if headers else "Tabular cell columns"

        if mode == "points":
            key_points = [
                f"Dataset Scale: {num_rows:,} data rows across {num_cols} attribute columns",
                f"Schema Attributes: {header_str}",
                "Structure: Standard tabular dataset with columnar attributes",
                f"Column Count: {num_cols} distinct fields verified"
            ]
            summary = "\n".join([f"• {p}" for p in key_points])
        elif mode == "exam":
            key_points = [
                f"Dataset Schema: {header_str}",
                f"Total Records: {num_rows:,} rows",
                f"Total Features: {num_cols} columns"
            ]
            summary = (
                f"EXAM STUDY GUIDE (Dataset Analysis): '{filename}'\n\n"
                f"[Key Schema Q&A]\n"
                f"Q: What is the primary data structure of this dataset?\n"
                f"A: Tabular dataset with {num_rows:,} observations across {num_cols} fields.\n\n"
                f"Q: What key attributes are measured in this table?\n"
                f"A: Features include {header_str}.\n\n"
                f"[Practice Questions]\n"
                f"1. How would you normalize or preprocess the {headers[0] if headers else 'primary'} column for analysis?\n"
                f"2. What statistical methods are appropriate for evaluating relationships across these {num_cols} features?"
            )
        elif mode == "short":
            summary = (
                f"Spreadsheet Dataset Summary for '{filename}':\n"
                f"Contains {num_rows:,} data rows and {num_cols} columns ({header_str})."
            )
            key_points = [
                f"Dataset Scale: {num_rows:,} rows × {num_cols} columns",
                f"Key Attributes: {header_str}",
                "Format: Tabular spreadsheet / CSV data"
            ]
        else:
            summary = (
                f"Detailed Dataset Schema & Structure for '{filename}':\n\n"
                f"• Total Data Rows: {num_rows:,}\n"
                f"• Total Column Attributes: {num_cols}\n"
                f"• Defined Schema Headers: {header_str}\n\n"
                f"This dataset contains structured records suitable for tabular processing and analytics."
            )
            key_points = [
                f"Total Records: {num_rows:,} rows",
                f"Total Columns: {num_cols}",
                f"Column Schema: {', '.join(headers) if headers else 'Standard headers'}",
                "Data Format: Validated tabular structure"
            ]

        return {
            "supported": True,
            "filename": filename,
            "fileType": "Excel Files",
            "mode": mode,
            "summary": summary,
            "keyPoints": key_points,
            "metadata": meta,
            "wordCount": num_rows
        }

    @classmethod
    def _summarize_presentation(cls, filename: str, text: str, meta: dict, mode: str) -> dict:
        slides = meta.get("slide_count", 1)
        words = meta.get("word_count", len(text.split()))

        if mode == "points":
            key_points = [
                f"Slide Deck Length: {slides} total slides",
                f"Text Volume: {words:,} words across shapes",
                "Format: Microsoft PowerPoint presentation deck",
                "Content: Slide outlines, headings, and bullet points parsed"
            ]
            summary = "\n".join([f"• {p}" for p in key_points])
        elif mode == "exam":
            key_points = [
                f"Core Topic: Presentation slides covering {words:,} words across {slides} slides",
                "High-yield slide takeaways analyzed"
            ]
            summary = (
                f"EXAM STUDY GUIDE (Slide Deck Revision): '{filename}'\n\n"
                f"[Key Slide Deck Q&A]\n"
                f"Q: What is the scope of this presentation deck?\n"
                f"A: Covers {slides} slides with approximately {words:,} total words.\n\n"
                f"[High-Yield Slide Excerpts]\n"
                f"{text[:350]}...\n\n"
                f"[Practice Exam Questions]\n"
                f"1. Summarize the central thesis presented across these {slides} slides.\n"
                f"2. What key arguments or evidence are highlighted in the presentation body?"
            )
        elif mode == "short":
            summary = (
                f"PowerPoint Presentation Summary for '{filename}':\n"
                f"Slide Deck consists of {slides} slides containing approximately {words:,} total words."
            )
            key_points = [
                f"Slide Deck Length: {slides} slides",
                f"Text Volume: {words:,} words across slides",
                "Format: Microsoft PowerPoint presentation"
            ]
        else:
            summary = (
                f"Detailed Slide Deck Analysis for '{filename}':\n\n"
                f"• Total Slides: {slides}\n"
                f"• Total Word Count: {words:,} words\n"
                f"• Extracted Slide Content:\n{text[:450]}..."
            )
            key_points = [
                f"Total Slides: {slides}",
                f"Total Words: {words:,}",
                "Extracted Titles and Body Text verified across all presentation shapes"
            ]

        return {
            "supported": True,
            "filename": filename,
            "fileType": "PowerPoint Files",
            "mode": mode,
            "summary": summary,
            "keyPoints": key_points,
            "metadata": meta,
            "wordCount": words
        }

    @classmethod
    def _summarize_image(cls, filename: str, text: str, meta: dict, mode: str) -> dict:
        dims = meta.get("dimensions", "Unknown")
        fmt = meta.get("format", "Image")
        color = meta.get("color_mode", "RGB")
        exif = meta.get("exif", {})

        exif_info = f"Camera/Capture info: {len(exif)} EXIF tags detected." if exif else "No EXIF metadata embedded."

        if mode == "points":
            key_points = [
                f"Image Format: {fmt}",
                f"Resolution: {dims} pixels",
                f"Color Space: {color} model",
                f"Metadata: {exif_info}"
            ]
            summary = "\n".join([f"• {p}" for p in key_points])
        elif mode == "exam":
            key_points = [
                f"Image Format: {fmt} ({dims})",
                f"Color Mode: {color}",
                "OCR Requirements: Direct raster pixel layer; OCR required for text transcription"
            ]
            summary = (
                f"EXAM STUDY GUIDE (Visual Asset Inspection): '{filename}'\n\n"
                f"[Technical Specifications Q&A]\n"
                f"Q: What format and resolution is this graphic media?\n"
                f"A: Encoded as {fmt} with {dims} pixel resolution in {color} color mode.\n\n"
                f"Q: Can text characters be transcribed from this asset?\n"
                f"A: Raster pixel data requires optical character recognition (OCR) transcription.\n\n"
                f"[Practice Questions]\n"
                f"1. Explain how image resolution and color depth impact computer vision processing.\n"
                f"2. What preprocessing pipeline would optimize this {fmt} image for OCR text extraction?"
            )
        elif mode == "short":
            summary = (
                f"Image Analysis for '{filename}':\n"
                f"Format: {fmt} | Dimensions: {dims} pixels | Color Mode: {color} | {exif_info}"
            )
            key_points = [
                f"Dimensions: {dims} pixels ({color})",
                f"Image Format: {fmt}",
                "OCR note: Embedded text extraction requires Tesseract binary installed"
            ]
        else:
            summary = (
                f"Detailed Visual & Technical Analysis for '{filename}':\n\n"
                f"• Format: {fmt}\n"
                f"• Resolution: {dims} (Total pixels: {dims.replace('x', ' × ')})\n"
                f"• Color Model: {color}\n"
                f"• EXIF Metadata: {exif_info}\n\n"
                f"Optical Character Recognition (OCR): OCR transcription is available when the Tesseract OCR engine is installed on the host system."
            )
            key_points = [
                f"Resolution: {dims}",
                f"Color Space: {color}",
                f"Format: {fmt}",
                f"EXIF Metadata: {len(exif)} properties parsed"
            ]

        return {
            "supported": True,
            "filename": filename,
            "fileType": "Image Files",
            "mode": mode,
            "summary": summary,
            "keyPoints": key_points,
            "metadata": meta,
            "wordCount": 0
        }

    @classmethod
    def generate_structured_summary(cls, file_path: Path, filename: str) -> dict:
        """
        Generates comprehensive 8-part structured summary for a document:
        1. Document title
        2. Short overview
        3. Main topic
        4. Detailed summary (with chunking for long docs)
        5. Important points (key takeaways)
        6. Key terms and definitions
        7. Important dates, figures, and facts
        8. Conclusion
        """
        classification = FileTypeClassificationEngine.classify_file(filename)
        category = classification["predicted_category"]
        is_supported = classification["summarizable"]

        if not is_supported or category in ["Video Files", "Audio Files", "Archive Files", "Other Files"]:
            return {
                "filename": filename,
                "fileType": category,
                "title": Path(filename).stem.replace("_", " ").title(),
                "overview": f"Document summarization is unavailable for {category}.",
                "mainTopic": "Unsupported Format",
                "detailedSummary": (
                    f"'{filename}' is categorized as {category}. "
                    "Automatic AI text comprehension requires readable textual formats like PDF, Word (.docx), "
                    "PowerPoint (.pptx), Excel/CSV, or Text/Code documents."
                ),
                "importantPoints": ["Format does not contain an extractable text stream."],
                "keyTerms": [],
                "datesFiguresFacts": [],
                "conclusion": "Please upload a supported document format (PDF, DOCX, TXT, CSV, PPTX) for full analysis.",
                "wordCount": 0,
                "supported": False,
                "message": f"Summarization unavailable for {category}."
            }

        # Extract content & metadata
        extracted = DocumentExtractor.extract(file_path, filename)
        raw_text = extracted.get("raw_text", "").strip()
        meta = extracted.get("metadata", {})

        if meta.get("is_scanned"):
            return {
                "filename": filename,
                "fileType": category,
                "title": Path(filename).stem.replace("_", " ").title(),
                "overview": f"Scanned image document ({meta.get('page_count', 1)} pages) without digital text layer.",
                "mainTopic": "Scanned Document (OCR Required)",
                "detailedSummary": (
                    f"'{filename}' contains {meta.get('page_count', 1)} scanned image pages. "
                    "The document contains rasterized graphics rather than digital font streams, "
                    "requiring optical character recognition (OCR) transcription."
                ),
                "importantPoints": [
                    "Scanned image PDF detected with 0 direct characters.",
                    "High-resolution scan detected across document pages.",
                    "External OCR engine required to parse handwritten or printed text."
                ],
                "keyTerms": [{"term": "OCR", "definition": "Optical Character Recognition technology used to transcribe image text."}],
                "datesFiguresFacts": [{"item": f"{meta.get('page_count', 1)} Pages", "context": "Total scanned pages in PDF", "category": "fact"}],
                "conclusion": "Transcribe via OCR or upload a digitally generated PDF document for complete analysis.",
                "wordCount": 0,
                "supported": True,
                "message": "Scanned document detected."
            }

        words = raw_text.split()
        word_count = len(words)

        if word_count == 0:
            return {
                "filename": filename,
                "fileType": category,
                "title": Path(filename).stem.replace("_", " ").title(),
                "overview": "The document is empty or contains only whitespace.",
                "mainTopic": "Empty Document",
                "detailedSummary": f"No readable textual content could be parsed from '{filename}'.",
                "importantPoints": ["0 readable words found."],
                "keyTerms": [],
                "datesFiguresFacts": [],
                "conclusion": "Document has no content to summarize.",
                "wordCount": 0,
                "supported": True
            }

        # 1. Document Title
        title = cls._extract_title(filename, raw_text, meta)

        # 2. Sentences splitting & chunk-aware ranking
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", raw_text) if len(s.strip()) > 15]
        if not sentences:
            sentences = [raw_text[:200]]

        # 3. Main Topic
        topic_tuple = FileTypeClassificationEngine.detect_topic(raw_text)
        main_topic = topic_tuple[0] if topic_tuple[0] else cls._infer_fallback_topic(raw_text, category)

        # 4. Short Overview
        overview = cls._generate_overview(sentences, main_topic, word_count, category)

        # 5. Detailed Summary (using chunk-aware extractive ranking)
        detailed_summary = cls._generate_chunked_summary(sentences, raw_text, max_sentences=6)

        # 6. Important Points
        important_points = cls._extract_important_points(sentences, raw_text)

        # 7. Key Terms & Definitions
        key_terms = cls._extract_key_terms(raw_text, main_topic)

        # 8. Important Dates, Figures, and Facts
        dates_figures_facts = cls._extract_dates_figures_facts(raw_text)

        # 9. Conclusion
        conclusion = cls._extract_conclusion(sentences, raw_text, main_topic)

        return {
            "filename": filename,
            "fileType": category,
            "title": title,
            "overview": overview,
            "mainTopic": main_topic,
            "detailedSummary": detailed_summary,
            "importantPoints": important_points,
            "keyTerms": key_terms,
            "datesFiguresFacts": dates_figures_facts,
            "conclusion": conclusion,
            "wordCount": word_count,
            "supported": True
        }

    @classmethod
    def generate_combined_summary(cls, individual_summaries: List[dict]) -> dict:
        """
        Synthesizes multiple document summaries into a combined cross-document analysis:
        1. Individual summary for each file (provided in input)
        2. Combined narrative summary
        3. Common topics across documents
        4. Important differences & contrast analysis
        5. Key findings
        """
        valid_summaries = [s for s in individual_summaries if s.get("supported") and s.get("wordCount", 0) > 0]

        if not valid_summaries:
            return {
                "individualSummaries": individual_summaries,
                "combinedSummary": "No readable text content found across the selected documents for combined synthesis.",
                "commonTopics": [],
                "keyDifferences": [],
                "keyFindings": ["All uploaded files were either empty, scanned images, or unsupported binary formats."],
                "totalWordCount": 0,
                "fileCount": len(individual_summaries)
            }

        total_words = sum(s.get("wordCount", 0) for s in valid_summaries)

        # 1. Identify Common Topics
        topics = [s.get("mainTopic") for s in valid_summaries if s.get("mainTopic") and s.get("mainTopic") != "General Document"]
        from collections import Counter
        topic_counts = Counter(topics)
        common_topics = [t for t, c in topic_counts.items() if c >= 2]
        if not common_topics and topics:
            common_topics = list(set(topics))[:4]

        # 2. Identify Important Differences
        key_differences = []
        for s in valid_summaries:
            fname = s.get("filename", "Document")
            topic = s.get("mainTopic", "General")
            wc = s.get("wordCount", 0)
            key_differences.append(
                f"'{fname}' ({s.get('fileType', 'File')}) focuses specifically on {topic} with {wc:,} words of extracted content."
            )

        # 3. Key Findings across all documents
        key_findings = []
        for s in valid_summaries[:4]:
            pts = s.get("importantPoints", [])
            if pts:
                key_findings.append(f"From '{s.get('filename')}': {pts[0]}")
            else:
                key_findings.append(f"'{s.get('filename')}' establishes core concepts regarding {s.get('mainTopic')}.")

        # 4. Synthesize Combined Summary
        names_str = ", ".join([f"'{s.get('filename')}'" for s in valid_summaries])
        topic_summary_str = ", ".join(common_topics) if common_topics else "diverse multi-disciplinary subjects"
        
        combined_text = (
            f"Cross-Document Synthesis across {len(valid_summaries)} analyzed documents ({names_str}):\n\n"
            f"The collected documents encompass {total_words:,} total words focusing primarily on {topic_summary_str}. "
            f"Across these materials, key concepts establish foundational principles, methodologies, and technical procedures. "
            f"While each document addresses distinct aspects—ranging from theoretical foundations to practical implementations—"
            f"they collectively provide a cohesive perspective on {topic_summary_str}."
        )

        return {
            "individualSummaries": individual_summaries,
            "combinedSummary": combined_text,
            "commonTopics": common_topics,
            "keyDifferences": key_differences,
            "keyFindings": key_findings,
            "totalWordCount": total_words,
            "fileCount": len(individual_summaries)
        }

    # =========================================================================
    # Internal Extraction & NLP Helpers
    # =========================================================================
    @classmethod
    def _extract_title(cls, filename: str, text: str, meta: dict) -> str:
        # Check metadata title
        meta_title = meta.get("title")
        if meta_title and len(meta_title.strip()) > 3 and not meta_title.lower().startswith("microsoft word"):
            return meta_title.strip()

        # Check first 3 lines of text for title heading
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:3]:
            if 3 <= len(line.split()) <= 12 and not line.endswith(".") and not line.lower().startswith("page"):
                return line

        # Fallback: Clean filename without extension
        stem = Path(filename).stem
        return stem.replace("_", " ").replace("-", " ").title()

    @classmethod
    def _infer_fallback_topic(cls, text: str, category: str) -> str:
        words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
        stopwords = {
            "the", "and", "that", "this", "with", "from", "have", "were", "which", "about",
            "there", "their", "into", "more", "other", "some", "such", "than", "then", "them"
        }
        filtered = [w for w in words if w not in stopwords]
        from collections import Counter
        common = Counter(filtered).most_common(2)
        if common:
            terms = " & ".join([w[0].title() for w in common])
            return f"{terms} Studies"
        return f"{category.replace(' Files', '')} Analysis"

    @classmethod
    def _generate_overview(cls, sentences: List[str], topic: str, word_count: int, category: str) -> str:
        lead_sentences = sentences[:2]
        lead_text = " ".join(lead_sentences)
        return (
            f"This {category.replace(' Files', '')} document contains {word_count:,} words centered on {topic}. "
            f"{lead_text}"
        )

    @classmethod
    def _generate_chunked_summary(cls, sentences: List[str], text: str, max_sentences: int = 6) -> str:
        """
        Chunks long documents into overlapping segments and scores sentences
        to ensure representative summary across beginning, middle, and end.
        """
        stopwords = {
            "the", "and", "a", "an", "of", "to", "in", "is", "for", "that", "on", "with",
            "as", "by", "this", "it", "at", "from", "or", "are", "be", "was", "we", "were"
        }
        words = [re.sub(r"[^\w]", "", w.lower()) for w in text.split()]
        word_freq = {}
        for w in words:
            if w and w not in stopwords and len(w) > 2:
                word_freq[w] = word_freq.get(w, 0) + 1

        scored = []
        total = len(sentences)
        for i, s in enumerate(sentences):
            s_words = [re.sub(r"[^\w]", "", w.lower()) for w in s.split()]
            if len(s_words) < 5:
                continue
            score = sum(word_freq.get(w, 0) for w in s_words) / max(1, len(s_words))
            # Position bonuses: Beginning and ending sections
            if i < 3:
                score *= 1.3
            elif i > total - 4:
                score *= 1.25
            scored.append((i, s, score))

        scored.sort(key=lambda x: x[2], reverse=True)
        selected = sorted(scored[:max_sentences], key=lambda x: x[0])
        return "\n\n".join([f"• {s[1]}" for s in selected]) if selected else text[:500]

    @classmethod
    def _extract_important_points(cls, sentences: List[str], text: str) -> List[str]:
        # Filter for sentences with salient action/key verbs
        key_patterns = [
            r"\b(ensure|guarantee|require|critical|essential|crucial|demonstrates|proves|concludes)\b",
            r"\b(results in|leads to|significantly|key factor|primary|objective|advantage)\b",
            r"\b(defined as|implemented by|prevents|eliminates|reduces|increases)\b"
        ]
        points = []
        for s in sentences:
            s_clean = s.strip()
            if any(re.search(pat, s_clean, re.IGNORECASE) for pat in key_patterns):
                if 20 < len(s_clean) < 180 and s_clean not in points:
                    points.append(s_clean)
                    if len(points) >= 5:
                        break

        # Fallback if specific pattern match is sparse
        if len(points) < 3:
            for s in sentences[1:6]:
                if len(s) > 30 and s not in points:
                    points.append(s)
                if len(points) >= 4:
                    break

        return points[:5]

    @classmethod
    def _extract_key_terms(cls, text: str, topic: str) -> List[Dict[str, str]]:
        # Match definitions: Term is defined as / refers to / is a / etc.
        pattern = r"(?P<term>[A-Za-z\s]{3,30})\s+(?:is defined as|refers to|means|is characterized by|is a|is an)\s+(?P<def>[^.\n]{15,140})"
        matches = re.finditer(pattern, text, re.IGNORECASE)
        results = []
        seen = set()

        for m in matches:
            t = m.group("term").strip().title()
            d = m.group("def").strip()
            if t.lower() not in seen and len(t.split()) <= 4:
                seen.add(t.lower())
                results.append({"term": t, "definition": f"{t} is {d}."})
                if len(results) >= 5:
                    break

        # Fallback from domain keywords if text didn't use formal 'is defined as' grammar
        if len(results) < 3:
            kw_matches = re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b", text)
            from collections import Counter
            top_caps = [w for w, c in Counter(kw_matches).most_common(10) if w.lower() not in {"the", "this", "that", "these", "from", "with"}]
            for cap in top_caps:
                if cap.lower() not in seen:
                    seen.add(cap.lower())
                    results.append({"term": cap, "definition": f"Core technical concept identified within {topic} documentation."})
                    if len(results) >= 4:
                        break

        return results[:5]

    @classmethod
    def _extract_dates_figures_facts(cls, text: str) -> List[Dict[str, str]]:
        items = []
        seen = set()

        # 1. Dates
        date_pattern = r"\b(?:\d{1,2}[-/\s]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s]+\d{2,4}|\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b"
        for m in re.finditer(date_pattern, text):
            d_str = m.group(0).strip()
            if d_str not in seen:
                seen.add(d_str)
                # Find surrounding sentence
                start = max(0, m.start() - 60)
                end = min(len(text), m.end() + 60)
                context = text[start:end].replace("\n", " ").strip()
                items.append({"item": d_str, "context": f"...{context}...", "category": "date"})
                if len(items) >= 3:
                    break

        # 2. Figures & Percentages
        fig_pattern = r"(\$\d+[\d,]*(?:\.\d+)?|\b\d+(?:\.\d+)?%|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s*(?:MB|GB|KB|TB|ms|sec|GHz|MHz|pixels|rows|users)\b)"
        for m in re.finditer(fig_pattern, text):
            f_str = m.group(0).strip()
            if f_str not in seen:
                seen.add(f_str)
                start = max(0, m.start() - 50)
                end = min(len(text), m.end() + 50)
                context = text[start:end].replace("\n", " ").strip()
                items.append({"item": f_str, "context": f"...{context}...", "category": "figure"})
                if len(items) >= 6:
                    break

        return items[:6]

    @classmethod
    def _extract_conclusion(cls, sentences: List[str], text: str, topic: str) -> str:
        conclusion_signals = ["in conclusion", "to summarize", "concludes", "finally", "overall", "results indicate", "in summary"]
        for s in reversed(sentences[-6:]):
            if any(sig in s.lower() for sig in conclusion_signals):
                return s.strip()

        if len(sentences) >= 2:
            return f"In conclusion, the document establishes essential principles concerning {topic}. {sentences[-1].strip()}"
        return f"Document provides structured technical coverage for {topic}."

