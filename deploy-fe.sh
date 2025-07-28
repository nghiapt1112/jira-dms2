#!/bin/bash

# Variables
BUCKET_NAME="jit-kpi-api-management"  # Replace with your S3 bucket name
DISTRIBUTION_ID="E3V5KPKXQWPNKX"   # Replace with your CloudFront distribution ID

echo "Building React app..."
#npm install
npm run build

echo "Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete --profile piktekk

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"  --profile piktekk

echo "Deployment complete! 🎉"

rm -rf dist

echo "Cleaned the build folder! 🎉"
