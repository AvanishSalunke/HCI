# Contributing

Thanks for wanting to help with Committee Coordinator VJTI. This page walks through the whole path from "I found something" to "my change is merged", including the Git steps, so you can follow it even if you have never contributed to an open source project before.

## Contents

- [Ways to help](#ways-to-help)
- [Before you start](#before-you-start)
- [Step 1: Fork the repository](#step-1-fork-the-repository)
- [Step 2: Clone your fork](#step-2-clone-your-fork)
- [Step 3: Connect the original repository](#step-3-connect-the-original-repository)
- [Step 4: Run the project](#step-4-run-the-project)
- [Step 5: Make a branch](#step-5-make-a-branch)
- [Step 6: Make your change](#step-6-make-your-change)
- [Step 7: Check your work](#step-7-check-your-work)
- [Step 8: Commit](#step-8-commit)
- [Step 9: Push and open a pull request](#step-9-push-and-open-a-pull-request)
- [After you open the pull request](#after-you-open-the-pull-request)
- [Keeping your fork up to date](#keeping-your-fork-up-to-date)
- [Project rules of thumb](#project-rules-of-thumb)
- [Reporting a bug or suggesting a feature](#reporting-a-bug-or-suggesting-a-feature)
- [Security problems](#security-problems)
- [License of contributions](#license-of-contributions)

## Ways to help

- Report a bug, or something that confuses you.
- Suggest an improvement.
- Fix a bug or build a feature.
- Improve the documentation, the wording on the site, or the layout on a phone.
- Test the app on a device or browser we have not tried.

You do not need to write code to help. A clear bug report is a real contribution.

## Before you start

- For anything bigger than a small fix, open an issue first and describe what you want to change. It saves you from building something that conflicts with other work or with how the app is meant to behave.
- Look through the open issues and pull requests to make sure nobody is already on it.
- Read the [README](README.md) so you know how the app is put together, especially the [flow](README.md#how-the-pieces-fit-together) and the [project layout](README.md#project-layout).

You will need Git, Node.js 20 or newer, and a MongoDB database (a free MongoDB Atlas cluster is fine). Details are in the README.

## Step 1: Fork the repository

A fork is your own copy of the project on GitHub, where you are free to make changes.

1. Sign in to GitHub and open https://github.com/AvanishSalunke/HCI.
2. Click **Fork** at the top right.
3. Keep the default settings and click **Create fork**.

You now have `https://github.com/<your-username>/HCI`.

## Step 2: Clone your fork

Cloning downloads your fork to your computer.

```bash
git clone https://github.com/<your-username>/HCI.git
cd HCI
```

Replace `<your-username>` with your GitHub username.

## Step 3: Connect the original repository

Your fork is a snapshot. To receive later changes from the original project, add it as a second remote called `upstream`.

```bash
git remote add upstream https://github.com/AvanishSalunke/HCI.git
git remote -v
```

You should see `origin` (your fork) and `upstream` (the original), each listed twice.

## Step 4: Run the project

Follow [Running it on your own machine](README.md#running-it-on-your-own-machine) in the README. In short:

```bash
cd backend
npm install
# create backend/.env from .env.example and fill in MONGO_URI and JWT_SECRET
npm run seed
npm run dev
```

and in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Use your own database for development. Never point your local copy at the production database, and never commit `.env` files, passwords, connection strings or keys.

## Step 5: Make a branch

Do your work on a new branch, never directly on `main`. That keeps `main` in your fork clean so you can update it from the original later.

```bash
git checkout main
git pull upstream main
git checkout -b fix-faculty-table-on-phones
```

Pick a short name that says what the branch does, in lowercase with dashes. Some examples: `fix-login-error-message`, `add-event-search`, `docs-deploy-steps`.

## Step 6: Make your change

- Keep each branch about one thing. A small, focused pull request is reviewed and merged much faster than a big one that mixes several changes.
- Follow the way the existing code is written, and put new code where similar code already lives (see the [project layout](README.md#project-layout)).
- Do not reformat files you are not otherwise changing. It makes the real change hard to see.

## Step 7: Check your work

Run these before you commit. The same build and lint checks run on GitHub for every pull request, and a pull request whose checks fail will not be merged until they are fixed.

```bash
cd frontend
npm run lint
npm run build
```

For the backend there is no test suite yet, so check that the files you touched load:

```bash
cd backend
node --check path/to/the/file.js
```

Then try the feature yourself, in the browser, as each kind of user it affects. A few things worth doing:

- **Follow the flow.** If you changed expenses, submit one as `<committee>-student`, approve it as `<committee>-teacher`, and check that it shows up for `admin`.
- **Try the error cases.** Empty fields, a bad link, a wrong password, the wrong role.
- **Check a phone-sized screen.** Open the browser developer tools and switch to a device view around 375 px wide. Nothing should overlap or scroll sideways. The site is used mostly on phones.
- **Check the console.** There should be no red errors.

If you changed the look, keep to the existing colours (the blue and white palette is defined as variables at the top of `frontend/src/index.css`) and use those variables instead of hard-coded colours.

## Step 8: Commit

Stage your changes and commit them. Several small commits are better than one huge one, because they are easier to review and easier to undo.

```bash
git add path/to/changed/file
git commit -m "Show a clear message when the receipt link is not valid"
```

Write the message as one or two short lines in plain English that say what changed. Some examples:

- `Fix the expense table overflowing on small screens`
- `Let faculty add a note when approving an expense`
- `Explain how to run the seed script in the README`

Avoid vague messages like `update`, `fix`, `changes` or `final`. Do not commit generated folders such as `node_modules` or `dist`, or any file with secrets.

## Step 9: Push and open a pull request

Push your branch to your fork:

```bash
git push -u origin fix-faculty-table-on-phones
```

Then open your fork on GitHub. A banner offers **Compare & pull request**. Click it, make sure the base is `AvanishSalunke/HCI` on `main` and the compare branch is yours, and fill in the description:

- **What** you changed, and **why**.
- **How you tested it**, including which roles you tried and which screen sizes you checked.
- **Screenshots** for any change that affects how something looks, ideally one for desktop and one for a phone.
- The issue it solves, if there is one (write `Closes #12` and GitHub will link and close it).

Mark the pull request as a draft if it is not ready yet.

## After you open the pull request

- The automated checks run. If one fails, open the details, fix the problem on your branch, commit and push again. The pull request updates by itself.
- A maintainer will review it. They may ask for changes. This is normal and nothing personal, it is how the code stays consistent.
- To change something, just commit more on the same branch and push. You do not need a new pull request.
- When it is approved, a maintainer merges it. Once merged, the live site updates by itself through the normal deploy.
- If nobody has replied after about a week, leave a polite comment on the pull request.

After the merge you can delete your branch.

## Keeping your fork up to date

The original project keeps moving. Before you start new work, and if your pull request falls behind, bring your fork up to date:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

If your feature branch needs the newest changes:

```bash
git checkout your-branch-name
git merge main
```

If Git reports a conflict, it marks the conflicting parts inside the files with `<<<<<<<`, `=======` and `>>>>>>>`. Open those files, keep the correct version, remove the markers, then run `git add` on the files and `git commit`.

## Project rules of thumb

These are the conventions the project already follows. Keeping to them makes reviews quick.

**Roles and permissions**
- Every backend route that changes data must check who is asking (`protect`, plus `isStudent`, `isTeacher` or `isAdmin` from `backend/middleware/authMiddleware.js`).
- A faculty member or student may only touch data of their own committee. Check `req.user.committee` against the record.
- Never trust the browser. Validate input on the server even when the form already checks it.

**Money**
- Approving an expense or confirming a sponsorship changes the committee's totals. Keep the status check and the update in one database operation so a double click cannot count something twice.

**Backend**
- One controller file per feature, in `backend/controllers/`, wired up in `backend/routes/`.
- Return a clear `message` in error responses (the website shows it to the user), with a sensible status code: 400 for bad input, 401 for not allowed, 404 for not found. Keep 500 for real server faults.
- Notifications go through `notify()` in `backend/utils/notify.js`. It never throws, so a failed notification cannot break the request that triggered it.

**Website**
- One page per file in `frontend/src/pages/`, with its own CSS file next to it.
- Read the backend address from `frontend/src/api.js` (`API_BASE`), do not type it into components.
- Check every new screen at phone width. Use the shared classes in `App.css` (`card`, `btn`, `form-group`, `stat-card`, `dashboard-tabs`, `transaction-table`) before inventing new ones.
- Do not call the backend from components for things that need a login without sending the token.

**Committees**
- Committee ids (`coc`, `vjti-racing`, ...) are used in URLs and on every account. If you add or rename one, change it in `backend/committees.js` and `frontend/src/committees.js` together. See [Adding a committee](README.md#adding-a-committee).

**Secrets and data**
- No `.env` files, tokens, passwords, VAPID keys or connection strings in commits, issues or pull requests. If one is committed by accident, tell a maintainer straight away. The secret must be replaced, deleting it from the next commit is not enough.
- Do not include real student data or real email addresses in screenshots or test data.

## Reporting a bug or suggesting a feature

Open an issue at https://github.com/AvanishSalunke/HCI/issues. For a bug, please include:

- What you did, step by step.
- What you expected, and what happened instead.
- Which account type you were using (student, faculty, admin, or not logged in).
- The device and browser, and whether you used the installed app.
- A screenshot, and any red errors from the browser console (press F12, then open the **Console** tab).

For a feature, describe the problem you are trying to solve first, then your idea. Say who would use it (student, faculty, admin or visitors).

## Security problems

Please do not post a security problem in a public issue. Examples are a way to see another committee's data, to act as another user, or to read the database. Contact the maintainer privately through the email on their GitHub profile, with the steps to reproduce it. You will get a reply as soon as possible, and the fix will be released before the details are made public.

## License of contributions

By sending a pull request you agree that your contribution is released under the project's [MIT License](LICENSE).
