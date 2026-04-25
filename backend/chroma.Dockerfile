FROM chromadb/chroma:0.6.3

# Copy the pre-populated data into the container's persistence directory
COPY ./chroma_store /chroma/chroma

# The base image already has an entrypoint that starts the server on port 8000
