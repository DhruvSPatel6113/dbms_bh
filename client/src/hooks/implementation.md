# Custom React Hooks Implementation Details

## 1. Reactive Design & State Synchronization

### 1.1 Authentication State Machine (`useAuth.js`)
- Initializes state synchronously from `localStorage` to avoid flash-of-unauthenticated-content (FOUC) upon page refresh.
- Computes memoized permission flags:
  ```javascript
  const isAdmin = user?.designation === 'Admin';
  const isLibrarian = user?.designation === 'Librarian';
  ```
- Exposes atomic `login()` and `logout()` callbacks that maintain dual synchronization between memory and browser storage.

### 1.2 Data Query Orchestration (`useBooks.js`)
- Encapsulates TanStack React Query's `useQuery` and `useMutation` primitives.
- Provides standard query keys `['books', searchParams]` that automatically trigger debounced network queries whenever search parameters change.
- Automatically dispatches cache invalidation (`queryClient.invalidateQueries({ queryKey: ['books'] })`) upon mutation success, guaranteeing consistent client-side views.
