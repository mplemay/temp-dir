# app-shell Specification

## Purpose

Provides the web application's document shell, file-based routes, home page, and not-found handling so every request is served as a React full-stack page rather than a static SPA.

## Requirements

### Requirement: HTML document shell

The application SHALL serve every page inside a complete HTML document with UTF-8 charset, a responsive viewport meta tag, and a document title.

#### Scenario: Home page document

- **WHEN** a client requests `/`
- **THEN** the response is an HTML document that includes charset and viewport metadata and a non-empty title

### Requirement: Home page

The application SHALL render a home page at `/` that identifies the app as ready to build on and does not present the previous vanilla Vite starter landing page or its client-only counter.

#### Scenario: Successful home visit

- **WHEN** a user opens `/`
- **THEN** they see a home page stating the project is ready, with no Vite “Get started” copy and no “Count is” counter

#### Scenario: Home content is in the initial HTML

- **WHEN** a client fetches `/` without executing client JavaScript
- **THEN** the response body includes the home page heading or equivalent visible copy

### Requirement: Unknown routes

The application SHALL render a not-found page for paths that do not match a defined route.

#### Scenario: Missing page

- **WHEN** a user opens a path with no matching route
- **THEN** they see a not-found message and the document remains a complete HTML page
