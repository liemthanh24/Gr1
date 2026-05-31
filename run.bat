@echo off
title Ticket System Runner

echo =========================================
echo Starting Ticket System (Gr1)
echo =========================================

echo.
echo [1/2] Starting backend services (Postgres, Redis, API, Worker) in Docker...
docker-compose up -d

echo.
echo [2/2] Starting Next.js frontend...
cd ticket-frontend
npm run dev
