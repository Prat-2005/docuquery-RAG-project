# DocuQuery — Frontend Development Master Prompt for Claude Code

## Project Context

I'm developing **DocuQuery**, an AI-powered document question-answering application based on Retrieval-Augmented Generation (RAG).

GitHub repository:

https://github.com/Prat-2005/docuquery-RAG-project

Important: The existing README.md is outdated. Do not use it as the source of truth. Inspect the actual source code, database models, API routers, Pydantic schemas, and frontend implementation.

The backend has already been developed. My current objective is to complete the frontend and integrate it with the existing backend.

Your role is to act as a senior frontend engineer who will implement this application incrementally.

## 1. Technical Requirements

Preferred frontend technologies:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios or native Fetch API
- Lucide React for icons

You may suggest simpler alternatives if the existing project already uses a suitable technology.

Rules:

1. Do not unnecessarily replace the existing frontend stack.
2. Do not rewrite the backend.
3. Do not introduce unnecessary dependencies.
4. Reuse existing backend API endpoints.
5. Do not create fake API responses or mock persistent data.
6. Do not hardcode authentication tokens, API keys, or credentials.
7. Keep components reusable and maintainable.
8. Follow a clean, modular architecture.
9. Ensure responsive layouts for desktop, tablet, and mobile.
10. Use TypeScript types for API requests and responses.

## 2. Application Pages and Features

### Page A — Landing Page

Route: `/`

Build a comprehensive landing page that introduces DocuQuery as a real software product.

It should contain the following sections:

**A. Navigation Bar**
- DocuQuery logo and name.
- Home.
- Features.
- How It Works.
- Technology.
- GitHub.
- Login.
- Get Started.

**B. Hero Section**

Introduce the application with a clear message explaining that users can upload documents and interact with their content through AI-powered question answering.

Include:
- A prominent headline.
- Short product description.
- Get Started CTA.
- Explore Features CTA.
- A visually appealing application preview.

**C. Product Features**

Explain the actual capabilities of DocuQuery, such as:

- Multi-format document uploads.
- Automatic text extraction.
- Intelligent document chunking.
- Vector embeddings.
- Semantic retrieval.
- Context-aware LLM responses.
- Automatic document summarization.
- Persistent conversation history.
- Multiple document support.

Only advertise features that are implemented or explicitly identified as planned.

**D. How It Works**

Show the actual RAG workflow:

Document Upload
→ Text Extraction
→ Chunking
→ Embedding Generation
→ Vector Retrieval
→ Context Construction
→ LLM Generation
→ Answer

Use a clean visual workflow rather than a wall of text.

**E. Development Journey**

Include a section explaining the application's development stages:

1. Document ingestion.
2. Database and authentication.
3. Persistent conversations.
4. Multi-document management.
5. PostgreSQL + pgvector retrieval.
6. Integrated RAG question answering.
7. Frontend and user experience.

Clearly distinguish completed capabilities from planned improvements. Do not falsely present planned features as completed.

**F. Technology Stack**

Show the actual technologies used by the project, based on the repository.

For example:
- FastAPI.
- Python.
- PostgreSQL.
- SQLAlchemy.
- Alembic.
- pgvector.
- FAISS, if still used in the current implementation.
- Sentence Transformers or the actual embedding provider.
- OpenAI-compatible LLM integration.
- React frontend.

Do not list technologies that are not actually used.

**G. Source Code Section**

Include a GitHub button linking to:

https://github.com/Prat-2005/docuquery-RAG-project

Mention that the project source code is publicly available.

**H. Upload CTA**

Provide an option to upload documents or start working with DocuQuery.

However, document uploads must require authentication. If the user is not logged in, redirect them to registration/login before allowing uploads.

**I. Footer**

Include:
- Project information.
- GitHub repository.
- Technology stack.
- Navigation links.
- Copyright information.

### Page B — Authentication

Routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

**Login Page**

Features:
- Email.
- Password.
- Show/hide password.
- Remember-me option only if supported by the authentication design.
- Login button.
- Forgot password link.
- Registration link.
- Loading and error states.

**Registration Page**

Features:
- Email.
- Password.
- Confirm password.
- Password visibility.
- Client-side validation.
- Registration success/error feedback.
- Link to login.

**Forgot Password Page**

Allow users to enter their registered email address and request a password reset link.

Show a generic confirmation message to avoid revealing whether an email address exists.

**Reset Password Page**

This page must only permit password resetting when the user arrives with a valid password-reset token from the email.

Requirements:
- Validate the reset token through the backend.
- Reject missing, expired, invalid, or already-used tokens.
- Provide new password and confirm password fields.
- Submit the new password to the backend.
- Display success or failure.
- Redirect to login after successful reset.

Do not assume that hiding the route in React Router provides security. The backend must validate the token and enforce single-use and expiration rules.

If the existing backend does not provide password-reset or email-verification functionality, report the missing API requirements. Do not simulate successful password resets.

### Page C — Main Chat Interface

Route: `/app` or an equivalent authenticated dashboard route.

This is the most important page of DocuQuery.

Use Google NotebookLM as a functional reference for document-centric interaction, but create an original visual identity. Do not copy its branding or interface.

The interface should contain three main areas.

**A. Left Sidebar — Conversation Management**

Include:

- DocuQuery branding.
- New Conversation button.
- Conversation history.
- Search conversations.
- Recent conversations.
- Conversation titles.
- User profile menu.
- Settings navigation.
- Logout.

Users must be able to:
- Create conversations.
- Open existing conversations.
- Continue previous conversations.
- Switch between conversations.
- See their saved messages.

Use the existing PostgreSQL-backed conversation APIs.

Do not use sessionStorage as the permanent source of chat history.

**B. Center Panel — Chat Interface**

Include:

- Selected conversation title.
- Message history.
- User message bubbles.
- Assistant responses.
- Markdown rendering.
- Code block rendering.
- Copy response button.
- Loading indicators.
- Error handling.
- Message input area.
- Send button.
- Enter-to-send and Shift+Enter for a new line.

Users must be able to continue existing conversations.

When a conversation is opened, retrieve its previous messages from the backend.

**C. Right Panel — Document Workspace**

Include:
- Uploaded document list.
- Document filenames.
- File types.
- File sizes.
- Processing status.
- Document selection.
- Upload multiple documents.
- Remove documents if the backend supports removal.
- Document summary.

When a document is successfully uploaded and processed, automatically display its generated summary.

For multiple documents, clearly distinguish each document's summary.

If the backend returns a summary as part of the upload response, use that response. Otherwise, inspect whether a separate summary endpoint exists.

Do not generate fake summaries in the frontend.

### Page D — Settings

Route: `/settings`

Create a settings interface with the following sections.

**A. Profile Settings**

- User email.
- User ID, if appropriate.
- Profile information.
- Account creation date.
- Password change option, if supported.

**B. LLM Environment Configuration**

Allow configuration of supported model providers.

Potential fields:

- Provider selection.
- Model name.
- API base URL.
- API key.
- Connection/test button.
- Save configuration.

Support provider options only where the backend actually supports them.

API keys must:
- Never be returned as plaintext from the backend.
- Never be stored in localStorage or sessionStorage.
- Never appear in browser logs or URLs.
- Be handled by secure backend storage.
- Be masked in the UI after saving.

If backend endpoints for per-user provider configuration are missing, document the required API contract instead of pretending the settings are saved.

**C. Document Processing Settings**

Provide configuration options for:

- Chunk size.
- Chunk overlap.
- Top-K retrieval.
- Other supported retrieval parameters.

Only expose settings that the backend actually accepts and persists.

**D. Appearance Settings**

- Light mode.
- Dark mode.
- Theme preference.

Persist preferences appropriately.

## 3. UI/UX Design Direction

I want DocuQuery to feel like a professionally developed SaaS application, not a generic AI-generated template.

Design requirements:

- Clean and sophisticated interface.
- Consistent typography.
- Balanced whitespace.
- Clear visual hierarchy.
- Subtle borders and shadows.
- Consistent spacing.
- Professional color palette.
- Carefully designed buttons and forms.
- Consistent iconography.
- Smooth but restrained transitions.
- Responsive navigation.
- Useful empty states.
- Skeleton loading states.
- Clear error and success feedback.

Avoid:
- Excessive gradients.
- Unnecessary glassmorphism.
- Random decorative elements.
- Excessive animations.
- Overloaded dashboards.
- Generic AI illustrations.
- Too many cards.
- Inconsistent button styles.
- Large amounts of unnecessary text.

Prioritize usability over visual effects.

The interface should feel like a real productivity application used regularly by professionals and students.

## 4. Suggested Frontend Architecture

First inspect the existing frontend. If a new structure is necessary, use something similar to:

frontend/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── documents/
│   │   └── settings/
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── ChatPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── conversationService.ts
│   │   ├── documentService.ts
│   │   └── settingsService.ts
│   │
│   ├── hooks/
│   ├── context/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── public/
├── package.json
└── vite.config.ts

This is a suggested structure, not a requirement to reorganize an existing working frontend unnecessarily.

## 5. Backend Integration Rules

The FastAPI backend is the source of truth.

Before implementing frontend API calls:

1. Inspect every relevant backend API router.
2. Inspect Pydantic request and response schemas.
3. Identify authentication requirements.
4. Identify actual request methods and paths.
5. Identify required request headers and body formats.
6. Identify actual response formats.
7. Document any missing endpoints.

Create a centralized API client.

It should handle:
- Backend base URL.
- Authentication.
- Request headers.
- JSON requests.
- Multipart file uploads.
- Error responses.
- Unauthorized responses.
- Token expiration.

Do not invent endpoint names or assume response properties.

If the backend lacks a feature requested in this prompt, identify the missing backend functionality and explain the required API contract. Do not silently modify the backend or create a fake frontend workaround.

Use the existing authentication mechanism. Do not store passwords or sensitive API keys in browser storage.

## 6. Development Phases and Execution Rules

Implement the frontend in the following phases.

### Phase 0 — Repository Audit and API Mapping

Before writing code:

- Inspect the repository and actual frontend implementation.
- Inspect backend routes and schemas.
- Inspect authentication and authorization.
- Identify existing dependencies.
- Identify supported document types and upload behavior.
- Identify summary-generation behavior.
- Identify available settings functionality.
- Identify missing backend endpoints.

Ignore README.md because it is outdated.

Produce:
1. Current frontend architecture.
2. Backend API inventory.
3. Frontend-to-backend integration mapping.
4. Missing API functionality.
5. Recommended implementation structure.
6. Dependency recommendations.

Do not modify any code during this phase.

Stop and wait for my approval.

### Phase 1 — Frontend Foundation

Set up or improve:
- Frontend framework.
- Routing.
- Global styles.
- Design tokens.
- Reusable UI components.
- Layout components.
- API client.
- Environment configuration.

Verify the frontend starts successfully.

Stop and report the results.

### Phase 2 — Landing Page

Implement the complete landing page described above.

Use actual project capabilities and the public GitHub URL.

Verify:
- Navigation.
- Responsive layout.
- CTA behavior.
- Links.
- Upload access restrictions.

Stop and report the results.

### Phase 3 — Authentication

Implement:
- Registration.
- Login.
- Forgot password.
- Reset password.
- Authentication state.
- Protected routes.
- Logout.

Use existing backend endpoints.

Report missing backend functionality rather than simulating it.

Test successful and unsuccessful authentication scenarios.

Stop and report the results.

### Phase 4 — Chat Interface

Implement:
- Main dashboard layout.
- Conversation sidebar.
- New conversation.
- Conversation history.
- Message rendering.
- Existing conversation continuation.
- Chat input.
- Responsive layout.

Integrate the actual conversation and message APIs.

Do not implement fake chat responses.

Stop and report the results.

### Phase 5 — Document Workspace

Implement:
- Multi-file upload.
- Upload progress.
- Document listing.
- Processing status.
- Document association with the selected conversation.
- Automatic summary display.
- Document selection and management.

Integrate the actual document endpoints.

Verify that multiple files can be uploaded and associated with the correct conversation.

Stop and report the results.

### Phase 6 — Settings

Implement:
- Profile settings.
- Supported LLM provider configuration.
- API URL and model configuration.
- Secure API-key management.
- Chunking settings.
- Retrieval settings.
- Appearance settings.

Only integrate features supported by the backend.

Report missing backend APIs separately.

Stop and report the results.

### Phase 7 — Full Integration

Connect the completed pages and verify the full workflow:

Landing Page
→ Registration
→ Login
→ Create Conversation
→ Upload Documents
→ Automatic Summary
→ Ask Questions
→ Receive Answers
→ Continue Existing Conversation
→ View Conversation History
→ Configure Settings
→ Logout

Ensure the application uses actual PostgreSQL-backed data.

Stop and report the results.

### Phase 8 — Testing and Final Polish

Test:

- Desktop responsiveness.
- Tablet responsiveness.
- Mobile responsiveness.
- Navigation.
- Authentication.
- Protected routes.
- Invalid credentials.
- Token expiration.
- Password reset links.
- Multi-file uploads.
- Document summaries.
- Conversation persistence.
- Existing conversation continuation.
- Error handling.
- Loading states.
- Accessibility.
- Browser refresh behavior.

Fix issues discovered during testing.

Provide a final implementation report.

## 7. Critical Instructions for Claude Code

These instructions are mandatory:

**Work incrementally.**

Do not implement all eight phases in one execution.

Start with Phase 0 only.

After each phase:
1. Summarize the changes.
2. List modified and created files.
3. Explain the implementation.
4. Run relevant tests.
5. Report test results honestly.
6. Identify unresolved issues.
7. Wait for my explicit approval before proceeding.

**Do not make unnecessary assumptions.**

If the backend doesn't support a requested feature, explain what is missing.

**Do not overwrite existing working code without inspecting it.**

**Do not use mock data as a replacement for actual backend functionality.**

**Do not expose secrets or compromise authentication security.**

**Do not sacrifice code quality for speed.**

I want to understand the frontend implementation as I develop it, so keep the code modular, explain important architectural decisions, and avoid generating unnecessarily complicated abstractions.

## First Task

Start with:

**PHASE 0 — Repository Audit and API Mapping.**

Inspect my current local repository, ignoring README.md.

Do not write or modify code yet.

Return a comprehensive audit and wait for my approval before implementing Phase 1.