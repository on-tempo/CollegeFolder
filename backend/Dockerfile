# Base image: lightweight Linux with Python 3.11 preinstalled
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install dependencies first (separately from code) so Docker can cache
# this layer and skip reinstalling when only the source code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source code into the container
COPY . .

# Document that the app listens on port 8000
EXPOSE 8000

# Start the server. --host 0.0.0.0 is required so the app is reachable
# from outside the container (localhost inside the container is not enough).
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]