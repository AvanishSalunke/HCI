# Deploying to Render

The project runs as two Render services, both created from [`render.yaml`](render.yaml) (a Blueprint):

| Service | Type | Folder | What it is |
| --- | --- | --- | --- |
| `committee-coordinator-api` | Web service (Node) | `backend` | The API, chat sockets and notification sender |
| `committee-coordinator-vjti` | Static site | `frontend` | The website and installable app |

The database is MongoDB Atlas. Both services redeploy by themselves whenever you push to `main`.

## One-time setup

### 1. Database (MongoDB Atlas)

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. **Database Access:** add a database user with a password (letters and numbers only keeps the connection string simple) and the role **Read and write to any database**.
3. **Network Access:** add `0.0.0.0/0` (allow access from anywhere). Render's addresses change, so a fixed address does not work on the free plan. The database password is what protects the data, so make it strong.
4. **Connect, Drivers:** copy the connection string and write it like this, with your password and the database name after the host:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/committee-coordinator?retryWrites=true&w=majority
   ```

### 2. Keys you need to generate

```bash
# a secret for login tokens
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# the key pair for push notifications
npx web-push generate-vapid-keys
```

### 3. Create both services

1. Push the repository to GitHub.
2. On https://render.com sign in with GitHub, then **New + > Blueprint**, choose the repository and connect it.
3. Render lists both services and asks for the values marked `sync: false` in `render.yaml`:

   **committee-coordinator-api**

   | Name | Value |
   | --- | --- |
   | `MONGO_URI` | The Atlas connection string from step 1 |
   | `JWT_SECRET` | The secret you generated |
   | `FRONTEND_URL` | The website address (see step 4). Use a placeholder for now |
   | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | The key pair you generated |
   | `VAPID_SUBJECT` | `mailto:` followed by a contact address |

   **committee-coordinator-vjti**

   | Name | Value |
   | --- | --- |
   | `VITE_API_URL` | The API address (see step 4). Use a placeholder for now |

4. Click **Deploy Blueprint**. When both are live, copy their addresses from the top of each service page.
5. Fix the placeholders:
   - On the **website** service, **Environment**, set `VITE_API_URL` to the API address (no slash at the end), then **Manual Deploy > Deploy latest commit**. The address is built into the site, so it has to be rebuilt.
   - On the **API** service, **Environment**, set `FRONTEND_URL` to the website address (no slash at the end). The service restarts by itself.

### 4. Create the accounts

From your own computer, with `backend/.env` pointing at the same database:

```bash
cd backend
npm install
npm run seed
```

This creates the committee accounts and the admin (see [Seeded accounts](README.md#seeded-accounts)). Run it once. It deletes all existing users first.

### 5. Check it

- Open the API address. You should see `{"message":"Welcome to the VJTI Fund Tracker API!"}`.
- Open the website, click **Login** and sign in.
- If the browser console says a request was "blocked by CORS policy", `FRONTEND_URL` on the API does not match the website address exactly. Check for a trailing slash, `http` instead of `https`, or a typo.

## Updating the live site

Push to `main`. Render rebuilds both services. Each push also runs the GitHub Actions workflow in `.github/workflows/deploy-check.yml`, which builds and lints the code, then waits until the live API (`/api/version`) and website (`/version.json`) report the pushed commit. The commit then gets a green tick on GitHub, or a red cross if something failed.

The checks need the two live addresses. They are written at the top of the workflow file. If the services are ever recreated with new addresses, update them there.

Settings in the Render dashboard are not touched by a push. Change them under the service's **Environment** tab.

## Notes

- Free Render web services sleep after about 15 minutes of no traffic. The first request afterwards can take up to a minute.
- `FRONTEND_URL` accepts several addresses separated by commas.
- Page links such as `/feedback` work because of the rewrite rule in `render.yaml`. The `no-cache` headers on `sw.js` and `index.html` make sure phones get new versions of the app.
- Notifications need `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. Without them the app still works and the API prints a warning at start-up.
