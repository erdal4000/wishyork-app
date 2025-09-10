#!/bin/bash

# This script will upload your project code to your new GitHub repository.

# Step 1: Initialize Git and make the first commit
git init -b main
git add .
git commit -m "Initial project setup for Vercel deployment"

# Step 2: Ask for the GitHub repository URL
echo ""
echo "------------------------------------------------------------------"
echo "IMPORTANT: Please go to your new, empty GitHub repository page."
echo "Click the green '<> Code' button, and copy the 'HTTPS' URL."
echo "It should look like this: https://github.com/your-username/your-repository-name.git"
echo "------------------------------------------------------------------"
echo ""
read -p "Paste your GitHub repository HTTPS URL here and press Enter: " GITHUB_URL

# Step 3: Add the remote and push the code
git remote add origin $GITHUB_URL
git push -u origin main

echo ""
echo "✅ Success! Your code has been uploaded to your GitHub repository."
echo "You can now proceed to the next step: connecting this repository to Vercel."
