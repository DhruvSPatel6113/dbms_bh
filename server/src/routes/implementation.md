# API Routes Implementation Details

## 1. Routing Table & Middleware Stack

| Method | Endpoint | Middleware Chain | Handler | Role Restriction |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | `validate(loginSchema)` | `authController.login` | Public |
| **POST** | `/api/auth/signup` | `validate(signupSchema)` | `authController.signup` | Public; creates Librarian |
| **GET** | `/api/auth/profile` | `auth` | `authController.profile` | Authenticated self |
| **PATCH** | `/api/auth/profile` | `auth, validate(updateProfileSchema)` | `authController.updateProfile` | Authenticated self |
| **GET** | `/api/books` | `auth, validate(queryBookSchema)` | `bookController.list` | Authenticated |
| **GET** | `/api/books/lookup/:isbn` | `auth` | `bookController.lookupISBN` | Authenticated |
| **POST** | `/api/books` | `auth, roleGuard(['Admin', 'Librarian']), validate(createBookSchema)` | `bookController.create` | Admin, Librarian |
| **PUT** | `/api/books/:id` | `auth, roleGuard(['Admin', 'Librarian']), validate(updateBookSchema)` | `bookController.update` | Admin, Librarian |
| **DELETE**| `/api/books/:id` | `auth, roleGuard(['Admin'])` | `bookController.delete` | Admin Only |
| **POST** | `/api/members` | `auth, roleGuard(['Admin', 'Librarian']), validate(createMemberSchema)` | `memberController.create` | Admin, Librarian |
| **POST** | `/api/members/:id/renew` | `auth, roleGuard(['Admin', 'Librarian']), validate(renewMemberSchema)`| `memberController.renew` | Admin, Librarian |
| **POST** | `/api/txns/issue` | `auth, roleGuard(['Admin', 'Librarian']), validate(issueBookSchema)` | `txnController.issue` | Admin, Librarian |
| **POST** | `/api/txns/:id/return` | `auth, roleGuard(['Admin', 'Librarian']), validate(returnBookSchema)` | `txnController.returnBook` | Admin, Librarian |
| **POST** | `/api/fines/calculate` | `auth, roleGuard(['Admin', 'Librarian']), validate(calculateFineSchema)`| `fineController.calculate` | Admin, Librarian |
| **POST** | `/api/fines/:id/pay` | `auth, roleGuard(['Admin', 'Librarian']), validate(payFineSchema)` | `fineController.pay` | Admin, Librarian |
| **POST** | `/api/fines/:id/waive` | `auth, roleGuard(['Admin']), validate(waiveFineSchema)` | `fineController.waive` | Admin Only |
| **GET** | `/api/reports/defaulters` | `auth` | `reportController.getDefaulters` | Authenticated |

## 2. Middleware Execution Order
Each route strictly applies middlewares in this canonical order:
$$\text{Request} \longrightarrow \text{auth} \longrightarrow \text{roleGuard} \longrightarrow \text{validate} \longrightarrow \text{Controller}$$
1. `auth`: Verifies JWT authenticity; attaches `req.user`.
2. `roleGuard`: Rejects unauthorized roles with HTTP `403 Forbidden`.
3. `validate`: Validates request body/query with Zod; strips unknown fields; rejects invalid inputs with HTTP `400 Bad Request`.
