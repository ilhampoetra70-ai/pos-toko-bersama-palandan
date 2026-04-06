# Gemini Workspace Context: Toko Bersama POS

This document provides a high-level overview of the "Toko Bersama" Point of Sale (POS) application, optimized for AI-assisted development.

## 1. Project Overview

- **Project Name:** Toko Bersama (Code: `pos-cashier`)
- **Description:** A comprehensive, feature-rich desktop POS application built with Electron. It's designed for retail environments and includes advanced functionalities like a detailed stock audit trail, extensive reporting, highly customizable receipt printing, and integrated AI-driven business insights. The application also serves two companion Progressive Web Apps (PWAs): a Price Checker and a Mobile Admin dashboard.

## 2. Core Architecture & Tech Stack

| Component             | Technology / Library                                       | Purpose                                                                |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Desktop Framework** | Electron                                                   | Cross-platform desktop application container.                          |
| **Frontend**          | React 18 (TypeScript), Vite                                | UI rendering and component-based architecture.                         |
| **Styling**           | Tailwind CSS, shadcn/ui                                    | Utility-first CSS framework and pre-built UI components.               |
| **Backend/Core Logic**| Node.js (in Electron Main Process)                         | Handles business logic, file system access, and core operations.       |
| **Database**          | `better-sqlite3` (SQLite)                                  | High-performance, file-based SQL database with WAL mode enabled.       |
| **API Server**        | Express.js                                                 | Serves REST APIs for the PWAs from within the Electron app.            |
| **State Management**  | TanStack Query, React Context                              | Manages server state, caching, and global UI state.                    |
| **Routing**           | React Router                                               | Handles navigation within the React single-page application.           |
| **Packaging**         | `electron-builder`                                         | Builds and packages the application for distribution (Windows).        |

## 3. Key Modules & Features

The application's functionality is extensive, as documented in `ANALISIS_FITUR_POS_TOKO_BERSAMA.md`. Key modules include:

- **Authentication:** JWT-based login with Role-Based Access Control (Admin, Supervisor, Cashier).
- **Product Management:** Full CRUD, barcode generation, bulk import/export via Excel.
- **Stock Management:** A robust `stock_trail` system provides a complete audit of every stock movement (sales, restocks, adjustments, voids).
- **Cashier & Transactions:** Advanced sales interface supporting multiple payment methods (Cash, QRIS, Debt) and installment tracking.
- **Reporting:** In-depth analytics on sales, profit, product performance, and more, with exports to PDF and Excel.
- **Receipt Printing:** Highly customizable templates for various printer types (58mm thermal, continuous form).
- **AI Insights:** A unique feature that analyzes sales data to provide business trends, product analysis, and operational recommendations using local Llama models or external APIs.
- **Database Tools:** Integrated backup, restore, and maintenance utilities.
- **Companion PWAs:** A `price-checker` and `mobile-admin` app served over the local network.

## 4. How to Run & Build

The project's lifecycle is managed through scripts defined in `package.json`.

- **To run in Development Mode:**
  ```bash
  npm run dev
  ```
  This command concurrently starts the Vite dev server for the frontend and launches the Electron application, which loads the UI from Vite.

- **To Build for Production:**
  ```bash
  npm run build
  ```
  This command first builds the React frontend into the `dist-renderer` directory and then uses `electron-builder` to package the entire application into a distributable format (e.g., an executable or a portable app) in the `TOKO BERSAMA BARU` directory.

## 5. Important File Locations

- **`electron/main.js`**: The entry point for the Electron application.
- **`electron/database.js`**: Contains the majority of the application's business logic and all SQL queries. **Crucial for debugging data-related issues.**
- **`src/`**: Contains all the React/TypeScript source code for the frontend UI.
- **`ANALISIS_FITUR_POS_TOKO_BERSAMA.md`**: A detailed, human-readable breakdown of every feature in the application. An excellent source for understanding intended behavior.
- **`docs/`**: Contains supplementary documentation, including the database schema and API maps.
- **`package.json`**: Defines dependencies, scripts, and build configurations.

## 6. Constructive Critique & Suggestions

Based on the initial analysis, here are some constructive critiques and suggestions to enhance the project's long-term maintainability, stability, and security.

### a. Excessive Logic Centralization in `database.js`
- **Observation:** The `database.js` file is identified as a "HEAVY LOGIC" hub, containing not just data access (SQL queries) but also complex business logic for reporting and data manipulation. This creates a "God Object" anti-pattern, making the file difficult to read, test, and maintain. A small change can have unforeseen consequences.
- **Suggestion:**
    - **Refactor into Layers:** Break down `database.js` into smaller, more focused modules. Consider a layered architecture:
        1.  **Repository Layer:** Modules responsible solely for SQL queries and data access (e.g., `userRepository.js`, `productRepository.js`).
        2.  **Service Layer:** Modules that import repositories and contain business logic (e.g., `reportService.js` calculates sales data, `stockService.js` handles stock adjustments).
    - **Benefits:** This separation of concerns will improve code readability, simplify unit testing, and allow multiple developers to work on different logical areas with fewer conflicts.

### b. Absence of Automated Testing
- **Observation:** There are no testing frameworks (`Vitest`, `Jest`, etc.) listed in the `devDependencies` of `package.json`, and no `test` script is present. For an application handling financial data, the lack of automated tests is a significant risk. Manual testing is error-prone and not scalable.
- **Suggestion:**
    - **Introduce a Test Framework:** Integrate `Vitest` as it pairs well with a `Vite`-based project.
    - **Create a Test Plan:**
        1.  Start by writing **unit tests** for the critical business logic that will be refactored out of `database.js` (e.g., profit calculation, stock level updates).
        2.  Write **integration tests** for API endpoints to ensure they behave as expected.
        3.  Add a `test` script to `package.json` and integrate it into a pre-commit hook to ensure tests are always passing before code is committed.
    - **Benefits:** Drastically reduces regressions, provides living documentation of how code should behave, and increases developer confidence when making changes.

### c. Dependency and Security Management
- **Observation:** The project has many dependencies. The `ANALISIS_FITUR_POS_TOKO_BERSAMA.md` mentions storing API keys for AI services. Improperly managed dependencies or secrets can introduce security vulnerabilities.
- **Suggestion:**
    - **Regular Audits:** Periodically run `npm audit` to check for known vulnerabilities in dependencies and update them accordingly.
    - **Secret Management:** Instead of storing sensitive information like JWT secrets or API keys in plaintext files, use a standard like `.env` files.
        1.  Create a `.env` file for local development to store secrets.
        2.  **Crucially, add `.env` to your `.gitignore` file.**
        3.  Create a `.env.example` file that lists the required variables, so other developers know what to set up.
    - **Benefits:** Improves security posture and makes environment configuration clearer and more secure.

### d. Potential Complexity in State Management
- **Observation:** The state management is described as "React Context + TanStack Query". While excellent for server state, relying heavily on Context for all other global client-side state can lead to performance issues (excessive re-renders) and a complex "provider hell" in larger applications.
- **Suggestion:**
    - **Evaluate Global State:** Assess the non-server-state that is shared globally.
    - **Consider a Dedicated Library:** If the global client state is complex, consider a lightweight state management library like `Zustand` or `Jotai`. They offer a simpler API for managing shared state without the nested providers and can be more performant.
    - **Benefits:** Simplifies the component tree and can lead to better performance and a more scalable frontend architecture.
