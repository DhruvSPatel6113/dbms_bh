# UI Components Implementation Details

## 1. Component Invariants & Composition Patterns

### 1.1 Responsive Navigation Shell (`Layout.jsx`)
- Leverages React Router's `<NavLink>` with active route highlighting (`bg-indigo-600 text-white`).
- Employs Lucide React icons for immediate visual recognition.
- Houses session context and the global `onLogout` trigger.

### 1.2 Modal Overlay Architecture (`Modal.jsx`)
- Renders conditionally when `isOpen === true`.
- Traps click events outside the content container to dismiss dialogs.
- Transitions smoothly using Tailwind CSS animation utility classes (`animate-in fade-in zoom-in-95`).

