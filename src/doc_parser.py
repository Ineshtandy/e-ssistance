from pathlib import Path
import asyncio
from raganything import RAGAnything

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".gif", ".webp"}
DOC_EXTS   = {".pdf"}
SUPPORTED  = IMAGE_EXTS | DOC_EXTS

async def _parse_doc(file_path: str, output_dir: str) -> str:
    """
    Asynchronous OCR using RAG-Anything. Returns Markdown text.
    Use this if you're already inside an async context (e.g., FastAPI route).
    """
    p = Path(file_path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {p}")
    if p.suffix.lower() not in SUPPORTED:
        raise ValueError(f"Unsupported format {p.suffix}. Supported: {', '.join(sorted(SUPPORTED))}")

    rag = RAGAnything()
    content_list, md_content = await rag.parse_document(
        file_path=str(p),
        output_dir=output_dir,
        parse_method="ocr",
        display_stats=False,
    )
    # not of use
    # print("content_list:", content_list)
    # print("\n\nmd_content", md_content)
    return

def call_parser(file_path: str = "/app/doc_uploads/cur_resume.pdf", output_dir: str = "/app/parsed_output") -> str:
    """
    Synchronous wrapper for OCR. Call this from regular Python code.
    Internally spins up an event loop once to run the async parser.
    """
    # populates /app/parsed_output/cur_resume/ocr/cur_resume.md
    asyncio.run(_parse_doc(file_path, output_dir))

    with open("/app/parsed_output/cur_resume/ocr/cur_resume.md",'r',encoding='utf-8') as f:
        content = f.read()
        return content
    return

if __name__ == "__main__":
  call_parser('/Users/ineshtandon/Documents/GitHub/e-ssistance/notebooks/IT_DS_Resume.pdf', '/Users/ineshtandon/Documents/GitHub/e-ssistance/parsed_output')
  with open('/Users/ineshtandon/Documents/GitHub/e-ssistance/parsed_output/cur_resume/ocr/cur_resume.md','r',encoding='utf-8') as f:
    print(f.read())