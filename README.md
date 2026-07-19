# SunoCampus

SunoCampus is a full-stack college social networking and event management platform. It combines a Vite + React frontend with an Express + MongoDB backend to support student profiles, event discovery and registration, contributor publishing tools, admin moderation, saved content, reports, and OTP-based authentication.

## Overview

The repository is organized as a small monorepo:

- The frontend lives at the repository root and runs with Vite.
- The backend lives in `Backend/` and runs as a separate Express server.
- The frontend talks to the backend through the `/api` HTTP namespace.

The app supports three core roles:

- `student` for browsing, registering for events, saving content, and managing a profile.
- `contributor` for creating events, publishing posts, exporting registrations, and viewing analytics.
- `admin` for managing users, colleges, contributors, content, and reports.

## Key Features

- Email OTP registration and password reset flow.
- College email-domain validation during signup.
- Role-based routing and dashboards.
- Browse feed with mixed posts and events, filtering, search, likes, comments, and infinite scroll.
- Event registration with custom form fields and CSV export.
- Content saving for posts and events.
- Reporting and moderation workflows.
- Cloudinary-backed image uploads and local document uploads for contributor verification.
- Scheduled event reminder emails.

## Tech Stack

### Frontend

- React 19
- React Router 7
- Axios
- Vite 7
- Tailwind CSS 3
- React Icons

### Backend

- Node.js ES modules
- Express 4
- MongoDB with Mongoose 7
- JWT authentication
- bcryptjs password hashing
- Nodemailer email delivery
- Cloudinary image storage
- Multer file uploads
- node-cron scheduled jobs
- json2csv export support

## Project Structure

```text
SunoCampus/
├── src/                    # Frontend app
│   ├── components/         # Shared UI and feature components
│   ├── context/            # Save/auth state helpers
│   ├── pages/              # Route-level screens
│   ├── services/           # API client configuration
│   ├── App.jsx             # Router and auth gating
│   └── main.jsx            # React entry point
├── Backend/                # Express API server
│   ├── config/             # Database and Cloudinary config
│   ├── controllers/        # Route handlers
│   ├── jobs/               # Cron jobs
│   ├── middleware/         # Auth and upload middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── seeds/              # Seed scripts
│   ├── uploads/            # Local uploads
│   └── server.js           # Express app bootstrap
├── .env.example            # Frontend environment template
├── Backend/.env.example    # Backend environment template
└── README.md               # Project guide
```

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB Atlas or another MongoDB instance
- Gmail app password for SMTP email sending
- Optional: Cloudinary account for hosted image uploads

## Environment Setup

Copy the example files and fill in the values for your environment.

### Frontend

Create a root `.env` file from `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend

Create `Backend/.env` from `Backend/.env.example`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/DatabaseName
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

If you use Cloudinary, also add:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Installation

Install the frontend and backend dependencies separately:

```bash
npm install
cd Backend
npm install
```

## Running the App

Start the backend in one terminal:

```bash
cd Backend
npm run dev
```

Start the frontend in another terminal from the repository root:

```bash
npm run dev
```

Expected local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Useful Scripts

### Frontend scripts

Defined in the root `package.json`:

```bash
npm run dev      # Start Vite development server
npm run build    # Build the frontend for production
npm run lint     # Run ESLint
npm run preview  # Preview the production build locally
```

### Backend scripts

Defined in `Backend/package.json`:

```bash
npm run dev      # Start Express server with nodemon
npm start        # Start Express server with Node.js
```

## Initial Data

The backend includes a seed script for college records. Run it after configuring MongoDB if you want the signup flow to work with the default college list.

```bash
cd Backend
node seeds/colleges.js
```

## API Surface

The backend exposes REST endpoints under `/api`.

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google-login`
- `POST /api/auth/forgot-password/*`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/colleges`
- `GET /api/browse/feed`
- `GET /api/browse/events/:id`
- `POST /api/contributor/events`
- `POST /api/contributor/posts`
- `GET /api/admin/stats`
- `POST /api/reports`
- `POST /api/saves`

For the full route list and request/response examples, see `Backend/README.md`.

## Development Notes

- The frontend API client automatically attaches the JWT stored in `localStorage`.
- `src/App.jsx` handles route protection and role-based navigation.
- `Backend/server.js` enables CORS for localhost development and mounts all API route groups.
- Uploaded event and post images are stored in Cloudinary, while contributor verification documents use local disk storage.
- The backend schedules event reminder emails daily at 09:00 UTC.

## Verification

After starting both servers, a quick health check should return a JSON response from:

```bash
curl http://localhost:5000/api/health
```

You can also open the URL in a browser. A successful response confirms the Express server is running and the API is reachable.

## Troubleshooting

- If the frontend cannot reach the API, confirm `VITE_API_URL` points to the backend server.
- If authentication fails, verify `Backend/.env` contains a valid `JWT_SECRET` and MongoDB connection string.
- If emails are not sending, confirm the Gmail app password is correct and 2FA is enabled on the account.
- If uploads fail, check the Cloudinary credentials and the file-size limits in the backend middleware.

## Documentation

- `Backend/README.md` contains backend-only setup and endpoint examples.
- `SETUP_AND_TESTING_GUIDE.md` contains a more detailed step-by-step setup and manual testing guide.
- `CUSTOM_FIELDS_IMPLEMENTATION.md` and `CUSTOM_FIELDS_TESTING_GUIDE.md` document the event form field system.

## Contributing

1. Create a branch for your change.
2. Update the relevant frontend or backend code.
3. Run the appropriate validation command(s).
4. Keep documentation in sync when you change setup, scripts, or routes.

## License

ISC, as declared in the root `package.json`.

