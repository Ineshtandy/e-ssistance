FROM python:3.11-slim AS base

# 1) System packages you commonly need (add gcc, build-essential if compiling)
# more system packages required by mineru (for parsing) opencv/tesseract/pdf rasterization
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     curl build-essential \
#     tesseract-ocr poppler-utils ghostscript \
#     libglib2.0-0 libsm6 libxext6 libxrender1 \
#     && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
    tesseract-ocr poppler-utils ghostscript \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 \
    python3-opencv python3-numpy \
 && rm -rf /var/lib/apt/lists/*

# 2) Create a non-root user (good practice)
RUN useradd -m -u 10001 appuser

# 3) Set workdir and copy only requirements first (better layer caching)
WORKDIR /app 
# workdir marks the current working directory as the reference point from here onwards
COPY ext_explr/requirements.txt /app/ext-req.txt
COPY src/requirements.txt      /app/src-req.txt

# 4) Install Python deps
# RUN pip install --no-cache-dir -r /app/ext-req.txt && \
#     pip install --no-cache-dir -r /app/src-req.txt
RUN python -m pip install --no-cache-dir --upgrade pip \
 && python -m pip install --no-cache-dir -r /app/ext-req.txt -r /app/src-req.txt

# 5) Copy code
COPY src       /app/src
COPY ext_explr /app/ext_explr

# 6) Environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# 7) Expose API port & drop privileges
EXPOSE 5000
USER appuser

# 8) Default command
# For dev (Flask’s reloader), swap to: ["python","-m","ext_explr.app"]
CMD ["python","-m","ext_explr.app"]