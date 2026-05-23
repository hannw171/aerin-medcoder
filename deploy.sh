#!/bin/bash
echo "🔨 Building docker image..."
docker build --platform linux/amd64 -t asia-southeast2-docker.pkg.dev/jvc-icd-coder/aerin-repo/medcoder:latest .

echo "🚀 Pushing image to Google Artifact Registry..."
docker push asia-southeast2-docker.pkg.dev/jvc-icd-coder/aerin-repo/medcoder:latest

echo "☁️ Deploying to Cloud Run..."
gcloud run deploy aerin-medcoder \
  --image=asia-southeast2-docker.pkg.dev/jvc-icd-coder/aerin-repo/medcoder:latest \
  --region=asia-southeast2

echo "✅ Deployment updated successfully!"
