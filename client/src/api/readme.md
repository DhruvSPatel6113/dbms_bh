# Client API Transport Directory (`client/src/api/`)

## 1. Directory Purpose & Scope
This directory houses the HTTP network transport layer for the React client. It encapsulates the configured Axios instance, Bearer token injection interceptor, response normalization, and typed REST API endpoint client methods.

## 2. Directory Contents
- `http.js`: Axios instance configured with base URL, authorization headers, and status code interceptors.
- `endpoints.js`: Modular API service objects (`booksApi`, `membersApi`, `txnsApi`, `finesApi`, `softwareApi`, etc.).
- `readme.md`: Scope and client API inventory.
- `implementation.md`: Interceptor lifecycles, error propagation, and endpoint parameter specifications.

