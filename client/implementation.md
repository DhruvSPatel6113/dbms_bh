# Client Frontend Implementation Architecture

## 1. Application Layering & Architecture

```
[ Browser User Interface ]
            |
            v
+-------------------------------------------------------------+
| 1. Presentation Pages (src/pages/)                          |
|    Books, Members, IssueReturn, Fines, Staff, Software, etc.|
+-----------------------------+-------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 2. Reusable Component Layer (src/components/)               |
|    Layout, Navbar, Modal, NotificationToast, Table, Card    |
+-----------------------------+-------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 3. Query & Mutation Hooks (src/hooks/)                      |
|    TanStack React Query wrappers: cache invalidation & sync |
+-----------------------------+-------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 4. HTTP Transport Layer (src/api/http.js)                   |
|    Axios client, JWT Bearer interceptor, error toast mapper |
+-------------------------------------------------------------+
```

## 2. API Proxying & CORS Architecture
In development, the Vite configuration (`vite.config.js`) proxies all requests matching `/api/*` to `http://localhost:4000`. This circumvents cross-origin resource sharing (CORS) preflight friction while mirroring identical production reverse-proxy routing behavior.

