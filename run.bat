@echo off
title Ticket System Runner

echo =========================================
echo Starting Ticket System (Gr1) in Docker
echo =========================================

echo.
echo Starting all services (Postgres, Redis, API, Worker, Frontend)...
docker-compose up -d --build

echo.
echo All services are starting!
echo - Frontend: http://localhost:3000
echo - API: http://localhost:3001
echo.
