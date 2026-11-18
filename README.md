# Committee Coordinator VJTI

A web app (installable on Android as well) for the student committees at VJTI, Mumbai. Committees log their expenses and sponsorships, faculty advisors approve them, and a dean/admin can see everything across all committees. Committees also post finished events so that attendees can leave feedback, and everyone who opted in gets a phone notification when something happens.

- **Website:** https://committee-coordinator-vjti.onrender.com
- **API:** https://committee-coordinator-api-kfo8.onrender.com

> The backend runs on a free Render plan. After about 15 minutes without traffic it goes to sleep, and the first request afterwards can take up to a minute.

## Contents

- [What it does](#what-it-does)
- [How the pieces fit together](#how-the-pieces-fit-together)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Running it on your own machine](#running-it-on-your-own-machine)
- [Environment variables](#environment-variables)
- [Seeded accounts](#seeded-accounts)
- [API overview](#api-overview)
- [Notifications and installing the app](#notifications-and-installing-the-app)
- [Deployment](#deployment)
- [Adding a committee](#adding-a-committee)
- [Contributing](#contributing)
- [License](#license)

## What it does

There are four kinds of visitor.

**Anyone, without logging in**
- Browse the home page, the list of committees, all announcements and the faculty advisors.
- Pick a committee and one of its events, then submit feedback (name, college email, 1 to 5 stars, comments, up to 5 photos). The email must end in `.vjti.ac.in`, and one person can answer an event only once.
- Turn on notifications and install the app.

**Student treasurer** (one account per committee)
- Log an expense with a title, amount, category, description and a receipt link (a Drive or Dropbox link, not an upload).
- Log a sponsorship with company details, a document link and the pledged amount.
- Watch the status of each submission (pending, approved, rejected, with the rejection reason).
- Post a finished event with poster, dates and times so people can give feedback on it, and read the feedback that comes in.
- Chat with the committee's faculty advisor and the admin.

**Faculty advisor** (one account per committee)
- Review the committee's expense and sponsorship queues. Approve or reject expenses (a rejection reason can be added, and the student sees it). Confirm sponsorships.
- When approving, leave an optional note for the admin.
- See the committee's funds and expenses totals, the full expense history and the committee's feedback.
- Post and delete announcements for the committee.
- Chat with the student treasurer and the admin.

**Admin (dean)**
- See every approved expense and confirmed sponsorship from all committees, with the faculty's note, newest first. New items are flagged as unread until the admin marks them seen.
- Create and remove faculty and student accounts, and see who belongs to which committee.
- See all events, open the feedback for each one, and delete an event (its feedback goes with it).
- Post announcements as "Admin", and remove any announcement.
- Join any committee's chat. Admin messages are shown in red so they stand out.

## How the pieces fit together

### Logging in

There are two ways in, and both end up in the same place.

- The **Login** link in the top bar opens one panel. You type a username and password, and the server decides who you are. Students go to the student dashboard, faculty to the faculty dashboard, and the admin to the admin dashboard.
- Each committee card on the home page opens a login page for that committee. It checks that the account belongs to that committee, so an SRA account cannot sign in on the COC page.

A successful login returns a signed token (valid for 3 days) that the browser keeps and sends with every request. Dashboards are only reachable with the right role, and an expired token sends the user back to the home page.

Accounts are not self-service. They come from the seed script, or the admin creates them in the admin dashboard.

### Life of an expense

1. The student submits it. The faculty advisors of that committee get a notification.
2. It shows up in the faculty "Expense Queue" as pending.
3. The faculty approves (with an optional note for the admin) or rejects it (with a reason).
   - Approving adds the amount to the committee's total expenses. The status check and the update happen together, so a double click cannot count it twice, and a decided expense cannot be changed afterwards.
   - The student is notified of the outcome.
4. On approval, the admin is notified, and the item appears in the admin's Approvals list as unread, together with the note.
5. The admin opens it, reads the note and marks it seen.

Sponsorships follow the same path. Confirming one adds its amount to the committee's total funds.

### Events and feedback

1. A student treasurer posts a finished event. Everyone with notifications turned on is notified, and tapping it opens the feedback form for that event.
2. Visitors choose the committee and event on the Feedback page and submit their response.
3. The student treasurer and the faculty see feedback for their own committee. The admin sees all of it.
4. A committee cannot delete an event that already has feedback. The admin can, and the feedback is deleted with it.

### Chat

Each committee has one chat room shared by its student, its faculty and the admin. Messages are stored and also pushed live over a socket connection. The socket needs a valid login token, and a user can only join their own committee's room. The admin may join any room.

### Who is notified, and when

| Event | Who gets a notification |
| --- | --- |
| A committee posts an event | Everyone with notifications on |
| A new announcement | Everyone with notifications on |
| A student submits an expense or sponsorship | That committee's faculty |
| An expense is approved or rejected, a sponsorship confirmed | The student who submitted it |
| An expense is approved or a sponsorship confirmed | The admin |
| A chat message | The rest of that committee |

## Tech stack

| Part | What is used |
| --- | --- |
| Website | React 19, React Router 7, Vite 7, Axios, AOS (scroll animations), Socket.IO client |
| Backend | Node.js 20+, Express 5, Mongoose 8, Socket.IO, JSON Web Tokens, bcryptjs, web-push |
| Database | MongoDB (Atlas in production) |
| Phone app | A Progressive Web App: web manifest, service worker, Web Push |
| Hosting | Render (one web service and one static site, defined in `render.yaml`) |
| Checks | GitHub Actions (`.github/workflows/deploy-check.yml`) |

## Project layout

```
.
├── backend/
│   ├── server.js            Express app, CORS, Socket.IO, route mounting
│   ├── committees.js        The list of committee ids (shared by seed and admin)
│   ├── seed.js              Recreates every account (deletes all users first)
│   ├── createAdmin.js       Adds only the admin account
│   ├── controllers/         Request handlers, one file per feature
│   ├── routes/              URL to controller wiring
│   ├── middleware/          Login and role checks
│   ├── models/              Mongoose schemas
│   └── utils/notify.js      Sends the push notifications
├── frontend/
│   ├── public/              Icons, manifest, service worker (sw.js), logos, faculty photos
│   └── src/
│       ├── pages/           One file per page (Welcome, Login, dashboards, Feedback, Faculty...)
│       ├── components/      Navbar, modals, event manager, feedback list, time picker...
│       ├── committees.js    Committee names, ids and logos shown on the site
│       ├── mockData.js      Faculty advisors shown on the Faculty page
│       ├── api.js           Backend address and the expired-login handling
│       └── push.js          Notification and install helpers
├── render.yaml              Render deployment blueprint
├── .github/workflows/       The deploy check
├── DEPLOY.md                Deployment notes
├── CONTRIBUTING.md
└── LICENSE
```

## Running it on your own machine

### What you need

- [Node.js](https://nodejs.org) 20 or newer (with npm)
- [Git](https://git-scm.com)
- A MongoDB database. The easiest is a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). A local MongoDB also works.

### 1. Get the code

To just look at it or try it, clone the repository:

```bash
git clone https://github.com/AvanishSalunke/HCI.git
cd HCI
```

If you plan to change things and send them back, fork the repository first and clone your fork instead. [CONTRIBUTING.md](CONTRIBUTING.md) explains this step by step.

### 2. Set up the backend

```bash
cd backend
npm install
```

Copy the example settings file and fill it in:

```bash
cp .env.example .env        # on Windows PowerShell: Copy-Item .env.example .env
```

Open `backend/.env` and set at least `MONGO_URI` and `JWT_SECRET`. To make a secret and the notification keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx web-push generate-vapid-keys
```

The [environment variables](#environment-variables) section lists everything. Then create the accounts and start the server:

```bash
npm run seed       # creates the committee accounts and the admin
npm run dev        # starts the API on http://localhost:5000 and restarts on changes
```

### 3. Set up the website

Open a second terminal:

```bash
cd frontend
npm install
npm run dev        # opens the site on http://localhost:5173
```

The website talks to `http://localhost:5000` by default. To point it somewhere else, create `frontend/.env` with `VITE_API_URL=https://your-backend-address`.

Notifications and the install prompt only work over HTTPS (or on `localhost`), and they need working VAPID keys in the backend.

### Useful commands

| Where | Command | What it does |
| --- | --- | --- |
| `backend` | `npm run dev` | Start the API with auto-restart |
| `backend` | `npm start` | Start the API normally (used in production) |
| `backend` | `npm run seed` | Delete all users and recreate the seeded accounts |
| `backend` | `npm run create-admin` | Add the admin account only, without touching other users |
| `frontend` | `npm run dev` | Start the website in development |
| `frontend` | `npm run build` | Build the website into `frontend/dist` |
| `frontend` | `npm run lint` | Check the code for errors |

## Environment variables

### Backend (`backend/.env`)

| Name | Required | What it is |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string. Put the database name after the host, for example `.../committee-coordinator?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | Long random text used to sign login tokens |
| `FRONTEND_URL` | In production | The website address(es) allowed to call the API, comma separated, no trailing slash. If empty, any origin is allowed (fine for local use only) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | For notifications | A key pair made with `npx web-push generate-vapid-keys`. Without them the app works but sends no notifications |
| `VAPID_SUBJECT` | For notifications | A contact address in the form `mailto:you@example.com` |
| `DNS_SERVERS` | No | Only if your network blocks MongoDB's DNS lookups, for example `8.8.8.8,1.1.1.1` |
| `PORT` | No | Defaults to 5000. Render sets it for you |

### Website (`frontend/.env`)

| Name | What it is |
| --- | --- |
| `VITE_API_URL` | The backend address. Defaults to `http://localhost:5000`. It is baked in when the site is built, so changing it means rebuilding |

Never commit a real `.env` file. They are listed in `.gitignore`.

## Seeded accounts

`npm run seed` creates two accounts for every committee, plus the admin. The password for all of them is **`123`**.

| Account | Username | Password |
| --- | --- | --- |
| Student treasurer | `<committee id>-student` | `123` |
| Faculty advisor | `<committee id>-teacher` | `123` |
| Admin | `admin` | `123` |

The committee ids are `technovanza`, `sra`, `pratibimb`, `enthusia`, `rangawardhan`, `coc`, `vjti-racing`, `digital-vjti`, `vishwa-vjti`, `synergists`, `ecell` and `alumni`. For example: `coc-student`, `coc-teacher`, `vjti-racing-teacher`.

These are placeholder passwords for development and demos. Before real people use the deployed site, set stronger ones: change the password in `backend/seed.js` and reseed, or create new accounts from the admin dashboard and remove the old ones.

`npm run seed` deletes every user before it recreates them. Do not run it against a database whose accounts you want to keep. Use `npm run create-admin` if you only need the admin account.

## API overview

All routes are under the backend address. "Login" means a token in the `Authorization: Bearer <token>` header.

| Area | Routes | Who |
| --- | --- | --- |
| Auth | `POST /api/auth/login` | Anyone |
| Funds | `GET /api/funds/my-committee` | Student, faculty |
| Expenses | `POST /api/transactions`, `GET /api/transactions/my-transactions` | Student |
| | `GET /api/transactions/committee`, `PUT /api/transactions/:id/status` | Faculty |
| Sponsorships | `POST /api/sponsorships`, `GET /api/sponsorships/my-sponsorships` | Student |
| | `GET /api/sponsorships/committee`, `PUT /api/sponsorships/:id/status` | Faculty |
| Announcements | `GET /api/announcements` | Anyone |
| | `POST /api/announcements`, `DELETE /api/announcements/:id` | Faculty (own committee), admin (any) |
| Events | `GET /api/events`, `GET /api/events/:id` | Anyone |
| | `POST /api/events`, `DELETE /api/events/:id` | Student |
| Feedback | `POST /api/feedback` | Anyone with a `.vjti.ac.in` email |
| | `GET /api/feedback` | Student, faculty (own committee) |
| Chat | `GET /api/messages`, `POST /api/messages` | Student, faculty, admin |
| Admin | `/api/admin/users`, `/api/admin/events`, `/api/admin/feedback`, `/api/admin/approvals` | Admin |
| Notifications | `GET /api/push/key`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe` | Anyone |
| Version | `GET /api/version` | Anyone (used by the deploy check) |

## Notifications and installing the app

The website is a Progressive Web App, so there is no app store build. The installed app is the same website, which means it updates itself whenever the site is redeployed.

**On Android (Chrome)**
1. Open the website in Chrome.
2. Tap the bell button in the top bar (in the menu on a phone) and allow notifications.
3. Tap the install button, or use Chrome's menu and choose **Install app** or **Add to Home screen**.
4. Log in. Logging in ties the phone to your account, which is how faculty, students and the admin get the notifications meant for them. Logging out unties it.

**On iPhone**, notifications only work after you add the site to the Home Screen from Safari (iOS 16.4 or newer).

Under the hood, `frontend/public/sw.js` is the service worker that shows notifications. `frontend/src/push.js` asks for permission and saves the phone's subscription through `/api/push/subscribe`. `backend/utils/notify.js` sends the messages, and removes subscriptions that the phone has revoked.

## Deployment

Production runs on Render, and everything is described in [`render.yaml`](render.yaml): a Node web service for the backend and a static site for the website. [DEPLOY.md](DEPLOY.md) has the step-by-step setup.

**Updating the live site** takes no extra steps. Push to the `main` branch, and Render rebuilds and redeploys both services. The installed phone app picks up the new version the next time it is opened.

**The deploy check.** Every push to `main` also runs a GitHub Actions workflow:
1. It builds the website, lints it and syntax-checks every backend file.
2. It then waits until the live backend (`/api/version`) and the live website (`/version.json`) both report the commit that was just pushed.

When both are live, the commit gets a green tick on GitHub. A red cross means a check failed, or the deploy did not finish within 20 minutes. Open the failed run in the Actions tab to see where.

Settings kept in the Render dashboard (database address, keys, `FRONTEND_URL`) are not changed by a push. Change those in the dashboard under the service's **Environment** tab.

## Adding a committee

1. Add `{ id, name }` to [`backend/committees.js`](backend/committees.js).
2. Add `{ id, name, logo }` to [`frontend/src/committees.js`](frontend/src/committees.js), and put the logo in `frontend/public/assets/logos/`. The id must be identical in both files, it is used in URLs and on every account.
3. Add its faculty advisor to [`frontend/src/mockData.js`](frontend/src/mockData.js), with a photo in `frontend/public/assets/faculty_pics/`.
4. Create the committee's accounts from the admin dashboard (**Committees & Accounts**), or reseed.

## Contributing

Bug reports, ideas and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for how to fork, clone, run the project, make a change and open a pull request.

## License

Released under the [MIT License](LICENSE).
