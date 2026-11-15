# Client Source Implementation Details

## 1. Application Layout & Route Architecture

```mermaid
flowchart TD
    Index[main.jsx: QueryClient & BrowserRouter] --> App[App.jsx]
    App --> AuthCheck{JWT in localStorage?}
    AuthCheck -- No --> Login[pages/LoginPage.jsx]
    AuthCheck -- Yes --> Layout[components/Layout.jsx]
    Layout --> Books[pages/BooksPage.jsx]
    Layout --> Members[pages/MembersPage.jsx]
    Layout --> Circ[pages/IssueReturnPage.jsx]
    Layout --> Fines[pages/FinesPage.jsx]
    Layout --> Staff[pages/StaffPage.jsx]
    Layout --> Software[pages/SoftwarePage.jsx]
    Layout --> Reports[pages/ReportsPage.jsx]
    Layout --> Profile[pages/ProfilePage.jsx]
```

## 2. Authentication Lifecycle
- **Token Persistence:** Stored securely in `localStorage` under key `'token'`.
- **Automatic Attachment:** Injected as HTTP Bearer token on all outgoing requests by `src/api/http.js`.
- **401 Interception:** If an expired or invalid token response is returned from Express, the Axios interceptor immediately clears `localStorage` and redirects the user to `/login`.
- **Staff access:** Public registration creates Librarian accounts only. The profile screen loads and updates the signed-in staff member's own information; changing a password requires the existing password.
