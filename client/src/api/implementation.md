# Client API Implementation Details

## 1. Request & Response Interceptors (`http.js`)

```mermaid
flowchart TD
    Req[Outgoing Request] --> AddAuth{Token in localStorage?}
    AddAuth -- Yes --> AttachHeader[Attach Authorization: Bearer token]
    AddAuth -- No --> SendRaw[Send without Auth Header]
    AttachHeader --> Transport[Axios HTTP Dispatch]
    SendRaw --> Transport
    Transport --> Resp{Response Status}
    Resp -- 2xx OK --> Unpack[Return response.data]
    Resp -- 401 Unauthorized --> ClearSession[Clear token & redirect to login]
    Resp -- 4xx / 5xx Error --> ExtractMsg[Unpack error.response.data.error.message]
    ExtractMsg --> Reject[Promise.reject with friendly message]
```

## 2. Invariants & Guarantees
- Unpacks `response.data` directly, simplifying TanStack React Query fetcher functions:
  ```javascript
  const { data } = useQuery({ queryKey: ['books'], queryFn: () => booksApi.list() });
  ```
- Ensures that when backend triggers raise business violations (e.g. `LOAN_LIMIT_REACHED` or `NO_COPIES_AVAILABLE`), the normalized error message string reaches React components cleanly for toast notifications.

