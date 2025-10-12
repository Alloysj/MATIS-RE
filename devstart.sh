#!/bin/bash

# Navigate to project folder
cd "C:/Users/Alois/Downloads/MATIS_Sacco" || exit

echo " Starting MATIS Sacco frontend..."
# Run frontend in background
npm run dev &

# Wait a moment for frontend to start
sleep 6

echo "🚀 Starting backend server..."
cd backend || exit
npm run dev

# Keep terminal open for backend logs
wait
