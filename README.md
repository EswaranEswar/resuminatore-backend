# Resuminatore Backend

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Resuminatore is a powerful, professional resume builder platform. This repository contains the backend services built with **NestJS**, designed for scalability and high performance.

## 🚀 Key Features

- **Auth System**: Secure authentication using JWT, OTP email verification, and Google OAuth2 integration.
- **Multi-Format Export**:
  - **PDF**: Lightning-fast, native PDF generation using `pdfmake` (no browser needed).
  - **Word**: Structured `.docx` generation using `docx`.
- **AI Integration**: AI-powered resume content generation and improvement using Google Gemini / OpenRouter.
- **Asynchronous Tasks**: High-performance email and background task processing with **BullMQ** and **Redis**.
- **Monorepo Architecture**: Organized into clean, reusable libraries (`core`, `shared`, `export`, `user`).
- **Database**: Robust data management with **MongoDB** and Mongoose.

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Runtime**: Node.js 22 (LTS)
- **Database**: MongoDB
- **Caching/Queues**: Redis + BullMQ
- **Exporting**: pdfmake, docx, jsdom
- **Dev-Ops**: Docker, Tilt, docker-compose
- **Package Manager**: pnpm

## 📁 Project Structure

```text
resuminatore-backend
├── apps
│   └── api             # Main API Gateway and Controller logic
├── libs
│   ├── core            # Databases, Queues, Email, and Global Filters
│   ├── export          # PDF and Word generation logic
│   ├── shared          # Shared DTOs, Schemas, and Constants
│   └── user            # User management and Profile services
├── Dockerfile          # Continuous Deployment configuration
├── Tiltfile            # Local development orchestration
└── docker-compose.yml  # Local infrastructure setup (Redis, Mongo)
```

## 🚥 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) & [Tilt](https://tilt.dev/) (for local dev)

### Installation

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd resuminatore-backend
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure Environment:
   Create a `.env` file in the root based on your local requirements (refer to existing `.env` keys).

### Running Locally

**Using Tilt (Recommended)**:
Tilt will automatically handle your Docker containers (Redis, etc.) and hot-reload your code.

```bash
tilt up
```

**Using Nest CLI**:

```bash
# Start the application in watch mode
pnpm run start:dev
```

## 📜 Export Options

- **PDF**: Uses `pdfmake` to generate PDFs from HTML content without a browser overhead.
- **Word**: Uses `docx` to create high-quality, editable Microsoft Word files.

