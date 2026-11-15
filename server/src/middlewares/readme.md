# Middlewares Directory (`server/src/middlewares/`)

## 1. Directory Purpose & Scope
This directory contains reusable Express middleware interceptors. These modules authenticate incoming requests, enforce Role-Based Access Control (RBAC), validate and sanitize request payloads via Zod, and manage centralized, uniform error responses.

## 2. Directory Contents
- `auth.js`: JWT token extractor and signature verification middleware.
- `roleGuard.js`: RBAC guard ensuring strict designation permissions (`Admin`, `Librarian`).
- `validate.js`: Generic Zod request schema validator stripping extra unexpected attributes.
- `errorHandler.js`: Central exception handling pipeline with status preservation and stack protection.
- `readme.md`: Scope and inventory.
- `implementation.md`: Security flowcharts, error format specifications, and token validation algorithms.

