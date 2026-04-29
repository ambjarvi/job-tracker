# Job Application Tracker

🔗 **Live Site:** [Job-Tracker](https://job-tracker-ecru-two.vercel.app)

A full-stack job application tracker with an AI-powered resume tailoring feature. Built entirely using **Claude Code** for agentic, goal-driven development.

---

## What It Does

- Track job applications with status, company, role, URL, and description
- Upload resumes (PDF or DOCX) stored in the cloud
- Link a specific resume to each application
- Use AI to tailor your resume to a job posting — without fabricating skills
- Get a rewritten resume draft, a summary of changes, and a skill gap analysis

---

## Tech Stack

### Backend
- **Node.js** with ES modules
- **Apollo Server 4** — GraphQL API
- **MongoDB + Mongoose** — persistent data storage
- **Cloudinary** — cloud file storage for resume uploads
- **Anthropic API (Claude)** — AI resume tailoring via a GraphQL mutation

### Frontend
- **React** (Vite)
- **Apollo Client** — GraphQL queries and mutations
- **Tailwind CSS** — styling

### Deployment
- **Render** — backend hosting
- **Vercel** — frontend hosting
- **MongoDB Atlas** — cloud database

---

## GraphQL API

### Types

```graphql
type Application {
  id: ID!
  company: String!
  role: String!
  url: String!
  description: String
  status: ApplicationStatus!
  appliedAt: String
  resume: Resume
}

type Resume {
  id: ID!
  name: String!
  filePath: String!
  fileType: FileType!
  uploadedAt: String!
  applications: [Application!]!
}

type TailoringResult {
  resumeId: ID!
  applicationId: ID!
  tailoredResume: String!
  changes: String!
  suggestions: String!
}

enum ApplicationStatus {
  WISHLIST
  APPLIED
  INTERVIEWING
  OFFERED
  REJECTED
}
```

### Key Queries
```graphql
applications(status: ApplicationStatus): [Application!]!
application(id: ID!): Application
resumes: [Resume!]!
resume(id: ID!): Resume
```

### Key Mutations
```graphql
addApplication(company, role, url, description, status, resumeId): Application!
updateStatus(id, status): Application
uploadResumeFile(name, fileType): Resume!
tailorResume(resumeId, applicationId): TailoringResult!
deleteApplication(id): Boolean!
deleteResume(id): Boolean!
```

---

## AI Resume Tailoring

The `tailorResume` mutation:
1. Fetches the resume file from Cloudinary and extracts text (PDF or DOCX)
2. Pulls the job details from the linked application record
3. Calls the Anthropic API with both, instructing it to tailor the resume without inventing skills or experience
4. Returns three outputs:
   - **Tailored Resume** — full rewritten resume
   - **What Changed** — bullet list of edits made
   - **Skill Gaps** — things the job mentions that aren't on the resume, framed as suggestions

---

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── index.js          — Apollo Server setup, MongoDB connection
│   │   ├── schema.js         — GraphQL type definitions
│   │   ├── resolvers.js      — query/mutation logic
│   │   └── models/
│   │       ├── Application.js — Mongoose schema
│   │       └── Resume.js      — Mongoose schema
│   ├── .env.example
│   └── package.json
│
└── job-tracker-ui/
    ├── src/
    │   ├── main.jsx          — Apollo Client setup
    │   ├── App.jsx           — main layout and navigation
    │   ├── graphql/
    │   │   └── operations.js — all GraphQL queries and mutations
    │   └── components/
    │       ├── ApplicationList.jsx
    │       ├── AddApplication.jsx
    │       ├── ResumeUpload.jsx
    │       └── TailorResume.jsx
    ├── .env.example
    └── package.json
```

---

## Local Development

### Prerequisites
- Node.js 20+
- MongoDB running locally or an Atlas connection string
- Cloudinary account
- Anthropic API key

### Backend
```bash
cd backend
cp .env.example .env
# Fill in your environment variables
npm install
npm run dev
```

### Frontend
```bash
cd job-tracker-ui
cp .env.example .env
# Fill in VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

### Environment Variables

**Backend `.env`:**
```
MONGODB_URI=
ANTHROPIC_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_URL=
PORT=4000
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:4000
```

---

## How This Was Built

This project was built entirely using **Claude Code** — Anthropic's agentic CLI tool for coding. Rather than writing code manually, the entire development process used natural language prompts to scaffold features, debug errors, and evolve the schema across both frontend and backend.

The workflow looked like:
1. Describe a feature or goal in plain English
2. Claude Code reads the existing codebase, plans the changes, and implements them across multiple files
3. Test in the browser or Apollo Sandbox
4. Iterate with follow-up prompts if anything needs fixing

This approach was used for everything — initial scaffolding, adding the AI mutation, setting up relationships between types, migrating from in-memory storage to MongoDB, switching file storage from local disk to Cloudinary, and preparing for production deployment.

It's a practical example of agentic development: the developer drives intent and reviews output, while the AI handles implementation across the full stack.

