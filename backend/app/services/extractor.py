import os
import re
import csv
from pathlib import Path
from PIL import Image

# Import document parsing libraries
try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import pptx
    HAS_PPTX = True
except ImportError:
    HAS_PPTX = False


class DocumentExtractor:
    """
    Multi-format document content & metadata extractor.
    Supports PDF, DOCX, PPTX, XLSX/CSV, Images, Text/Markdown, Code, and Fallbacks.
    """

    @classmethod
    def extract(cls, file_path: Path, filename: str) -> dict:
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        lower_name = filename.lower()

        # 1. PDF
        if ext == "pdf":
            return cls._extract_pdf(file_path, filename)

        # 2. Word (.docx, .doc)
        if ext in ["docx", "doc"]:
            return cls._extract_docx(file_path, filename)

        # 3. PowerPoint (.pptx, .ppt)
        if ext in ["pptx", "ppt"]:
            return cls._extract_pptx(file_path, filename)

        # 4. Excel & CSV
        if ext in ["xlsx", "xls", "csv", "tsv"]:
            return cls._extract_spreadsheet(file_path, filename, ext)

        # 5. Images
        if ext in ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "ico", "tiff"]:
            return cls._extract_image(file_path, filename)

        # 6. Text, Markdown, and Code
        if ext in ["txt", "md", "rtf", "log", "rst", "py", "js", "ts", "html", "css", "java", "c", "cpp", "json", "sql", "sh", "yaml", "yml"]:
            return cls._extract_text(file_path, filename)

        # 7. Unrecognized or binary files
        return cls._binary_fallback(file_path, filename)

    @classmethod
    def _extract_pdf(cls, file_path: Path, filename: str) -> dict:
        if not file_path.exists():
            return cls._binary_fallback(file_path, filename)

        if HAS_PYPDF:
            try:
                reader = PdfReader(str(file_path))
                num_pages = len(reader.pages)
                page_texts = []
                for i, page in enumerate(reader.pages):
                    t = page.extract_text()
                    if t and t.strip():
                        page_texts.append(t.strip())

                full_text = "\n\n".join(page_texts)
                is_scanned = len(full_text.strip()) < 20 and num_pages > 0

                if not is_scanned:
                    return {
                        "raw_text": full_text,
                        "method": "PDF Page Extraction (pypdf)",
                        "excerpt": full_text[:300] + ("..." if len(full_text) > 300 else ""),
                        "metadata": {
                            "page_count": num_pages,
                            "word_count": len(full_text.split()),
                            "is_scanned": False
                        }
                    }
                else:
                    # Check stream fallback before concluding it's a scanned image
                    try:
                        with open(file_path, "rb") as f:
                            data = f.read()
                        text_chunks = re.findall(rb"\((.*?)\)Tj", data)
                        if not text_chunks:
                            text_chunks = re.findall(rb"\[(.*?)\]TJ", data)
                        extracted = " ".join([c.decode("latin-1", errors="ignore") for c in text_chunks])
                        extracted = re.sub(r"\s+", " ", extracted).strip()
                        if len(extracted) > 20:
                            return {
                                "raw_text": extracted,
                                "method": "PDF Stream Fallback",
                                "excerpt": extracted[:300] + ("..." if len(extracted) > 300 else ""),
                                "metadata": {"word_count": len(extracted.split()), "page_count": num_pages, "is_scanned": False}
                            }
                    except Exception:
                        pass

                    return {
                        "raw_text": f"Scanned PDF: {filename} containing {num_pages} pages without embedded text layer.",
                        "method": "Scanned PDF Detection",
                        "excerpt": f"Scanned PDF with {num_pages} pages (no direct text layer; OCR required).",
                        "metadata": {
                            "page_count": num_pages,
                            "word_count": 0,
                            "is_scanned": True
                        }
                    }
            except Exception as e:
                print(f"pypdf extraction error for {filename}: {e}")

        # Fallback stream parser
        try:
            with open(file_path, "rb") as f:
                data = f.read()
            text_chunks = re.findall(rb"\((.*?)\)Tj", data)
            if not text_chunks:
                text_chunks = re.findall(rb"\[(.*?)\]TJ", data)
            extracted = " ".join([c.decode("latin-1", errors="ignore") for c in text_chunks])
            extracted = re.sub(r"\s+", " ", extracted).strip()
            if len(extracted) > 20:
                return {
                    "raw_text": extracted,
                    "method": "PDF Stream Fallback",
                    "excerpt": extracted[:300] + ("..." if len(extracted) > 300 else ""),
                    "metadata": {"word_count": len(extracted.split()), "page_count": 1}
                }
        except Exception:
            pass

        return cls._binary_fallback(file_path, filename, reason="PDF format requires OCR")

    @classmethod
    def _extract_docx(cls, file_path: Path, filename: str) -> dict:
        if HAS_DOCX and file_path.suffix.lower() == ".docx":
            try:
                doc = docx.Document(str(file_path))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                
                # Extract text inside tables
                for table in doc.tables:
                    for row in table.rows:
                        row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                        if row_text:
                            paragraphs.append(row_text)

                text = "\n".join(paragraphs)
                if len(text.strip()) > 5:
                    return {
                        "raw_text": text,
                        "method": "python-docx Extraction",
                        "excerpt": text[:300] + ("..." if len(text) > 300 else ""),
                        "metadata": {
                            "paragraph_count": len(doc.paragraphs),
                            "table_count": len(doc.tables),
                            "word_count": len(text.split())
                        }
                    }
            except Exception as e:
                print(f"python-docx error for {filename}: {e}")

        return cls._binary_fallback(file_path, filename, reason="Legacy Word or binary format")

    @classmethod
    def _extract_pptx(cls, file_path: Path, filename: str) -> dict:
        if HAS_PPTX and file_path.suffix.lower() == ".pptx":
            try:
                prs = pptx.Presentation(str(file_path))
                slide_texts = []
                for i, slide in enumerate(prs.slides):
                    slide_content = []
                    for shape in slide.shapes:
                        if hasattr(shape, "text") and shape.text.strip():
                            slide_content.append(shape.text.strip())
                    if slide_content:
                        slide_texts.append(f"Slide {i + 1}: " + " | ".join(slide_content))

                text = "\n".join(slide_texts)
                if len(text.strip()) > 5:
                    return {
                        "raw_text": text,
                        "method": "python-pptx Slide Extraction",
                        "excerpt": text[:300] + ("..." if len(text) > 300 else ""),
                        "metadata": {
                            "slide_count": len(prs.slides),
                            "word_count": len(text.split())
                        }
                    }
            except Exception as e:
                print(f"python-pptx error for {filename}: {e}")

        return cls._binary_fallback(file_path, filename, reason="Presentation slide extraction unavailable")

    @classmethod
    def _extract_spreadsheet(cls, file_path: Path, filename: str, ext: str) -> dict:
        try:
            if ext == "csv" or ext == "tsv":
                delimiter = "\t" if ext == "tsv" else ","
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.reader(f, delimiter=delimiter)
                    rows = list(reader)

                if rows:
                    headers = rows[0]
                    num_rows = len(rows) - 1
                    num_cols = len(headers)
                    sample_rows = rows[1:6]

                    preview_lines = [f"Columns ({num_cols}): {', '.join(headers)}", f"Total Data Rows: {num_rows}"]
                    for r in sample_rows[:3]:
                        preview_lines.append("Row: " + ", ".join(r[:6]))

                    raw_text = "\n".join(preview_lines)
                    return {
                        "raw_text": raw_text,
                        "method": "CSV Tabular Analysis",
                        "excerpt": raw_text[:300] + ("..." if len(raw_text) > 300 else ""),
                        "metadata": {
                            "headers": headers,
                            "row_count": num_rows,
                            "column_count": num_cols
                        }
                    }
            elif ext in ["xlsx", "xls"]:
                # Basic string token extraction from unzipped XML or shared strings
                import zipfile
                import xml.etree.ElementTree as ET
                if zipfile.is_zipfile(file_path):
                    with zipfile.ZipFile(file_path) as z:
                        if "xl/sharedStrings.xml" in z.namelist():
                            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
                            strings = [t.text for t in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text]
                            joined = " ".join(strings)
                            return {
                                "raw_text": joined,
                                "method": "Excel Workbook Extraction",
                                "excerpt": joined[:300] + ("..." if len(joined) > 300 else ""),
                                "metadata": {"cell_string_tokens": len(strings)}
                            }
        except Exception as e:
            print(f"Spreadsheet extraction error: {e}")

        return cls._binary_fallback(file_path, filename, reason="Spreadsheet preview parsed")

    @classmethod
    def _extract_image(cls, file_path: Path, filename: str) -> dict:
        try:
            with Image.open(file_path) as img:
                width, height = img.size
                img_format = img.format or "Image"
                mode = img.mode
                exif = img.getexif()
                exif_dict = {str(k): str(v) for k, v in exif.items()} if exif else {}

                desc = (
                    f"Image File: {filename} | Format: {img_format} | Resolution: {width}x{height} pixels | "
                    f"Color Mode: {mode} | Aspect Ratio: {round(width / max(1, height), 2)}:1"
                )

                return {
                    "raw_text": desc,
                    "method": "Image Analysis (Pillow)",
                    "excerpt": desc,
                    "metadata": {
                        "dimensions": f"{width}x{height}",
                        "format": img_format,
                        "color_mode": mode,
                        "exif": exif_dict
                    }
                }
        except Exception as e:
            print(f"Image analysis error: {e}")

        return cls._binary_fallback(file_path, filename, reason="Image header decoded")

    @classmethod
    def _extract_text(cls, file_path: Path, filename: str) -> dict:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            lines = content.splitlines()
            words = content.split()

            return {
                "raw_text": content,
                "method": "Full Text Reader",
                "excerpt": content[:300].strip() + ("..." if len(content) > 300 else ""),
                "metadata": {
                    "line_count": len(lines),
                    "word_count": len(words),
                    "char_count": len(content)
                }
            }
        except Exception as e:
            print(f"Text read error: {e}")

        return cls._binary_fallback(file_path, filename, reason="Text encoding fallback")

    @classmethod
    def _binary_fallback(cls, file_path: Path, filename: str, reason: str = "") -> dict:
        size = file_path.stat().st_size if file_path.exists() else 0
        clean_name = re.sub(r"[_\-.]+", " ", filename)
        return {
            "raw_text": f"File name: {clean_name}. Size: {size} bytes.",
            "method": "Metadata Only Fallback",
            "excerpt": f"Binary file '{filename}' ({size} bytes). {reason}",
            "metadata": {"size_bytes": size, "reason": reason}
        }
