FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better caching
COPY requirements.txt .
# Install CPU-only version of PyTorch to save ~3GB of GPU binaries
RUN pip install --no-cache-dir torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the necessary application directories and files
# This prevents the massive chroma_store from being copied into the backend image
COPY main.py .
COPY routes routes
COPY services services
COPY scripts scripts
COPY data data

# Expose the FastAPI port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
