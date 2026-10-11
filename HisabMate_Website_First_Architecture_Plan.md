# Shreekar no Hisab — Website-First Product & Development Plan

> **Goal:** Build and deploy a responsive website first, use it with hostel friends, improve it from real feedback, and later build a mobile app using the same backend API and database.

## 1. Product vision

PaisaNakhne helps hostel friends, roommates, and trip groups record shared expenses, calculate who owes whom, track repayments, and share friendly payment reminders.

The first deliverable is a **website**, not a mobile app. The website should work well on both laptop and mobile browsers.

## 2. Development phases

### Phase 1 — Website MVP
- Build the responsive React website.
- Create a Node.js + Express REST API.
- Store accounts, groups, expenses, splits, and settlements in PostgreSQL.
- Deploy it so a small group of friends can use it.

### Phase 2 — Real-world testing
- Invite hostel friends to use the website.
- Test expense splitting, balances, repayments, and reminders.
- Collect feedback and fix confusing workflows or calculation errors.

### Phase 3 — Mobile app
- Build a React Native app.
- Reuse the same backend API, database, authentication approach, and expense/business logic wherever appropriate.
- Add mobile-specific features only when needed.

## 3. Website architecture

```mermaid
flowchart TD
    USER[User: laptop or phone browser] --> WEB[React + Vite website]
    WEB -->|HTTPS / JSON| API[Node.js + Express REST API]
    API --> AUTH[Authentication and authorization]
    AUTH --> VALID[Request validation]
    VALID --> SERVICE[Application services]
    SERVICE --> EXP[Expense splitting]
    SERVICE --> BAL[Balances and settlements]
    SERVICE --> REPORT[Reports]
    EXP --> DB[(PostgreSQL)]
    BAL --> DB
    REPORT --> DB
    WEB -->|Explicit user action| SHARE[WhatsApp / SMS / device share sheet]
```

### Request flow
1. A user performs an action on the website.
2. React sends a request to the Express API.
3. The server authenticates the user and checks access to the requested group.
4. The server validates the data and applies business rules.
5. PostgreSQL stores or retrieves the information.
6. The API returns JSON and the website updates the screen.

## 4. Recommended technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Website UI |
| Styling | Tailwind CSS | Responsive design |
| Routing | React Router | Page navigation |
| Backend | Node.js + Express | API and business logic |
| Validation | Zod or equivalent | Validate requests |
| Database | PostgreSQL | Persistent relational data |
| Database access | `pg` (node-postgres) | Parameterized SQL queries |
| Charts | Recharts (optional) | Spending reports |
| Frontend hosting | Vercel or similar | Deploy the website |
| Backend hosting | Node-compatible host | Deploy the API |
| Database hosting | Managed PostgreSQL | Host the database |

Use PostgreSQL `NUMERIC` for money, not floating-point types. Use INR as the initial group currency.

## 5. First-version features

### Dashboard
- Today's or this month's spending.
- Amount you owe.
- Amount others owe you.
- Recent expenses and settlements.

### Groups
- Create a group for hostel friends, roommates, or a trip.
- View members and group activity.
- Add or invite members.

### Expense management
- Add a title, amount, payer, date, and category.
- Select participants.
- Split equally or enter custom shares.
- View, edit, and void expenses with appropriate authorization and history.

### Balances and repayments
- Calculate each member's net balance.
- Show who owes money and who should receive money.
- Suggest settlements between members.
- Record repayments as pending, confirmed, or cancelled.

### Reminders
- Generate an editable, polite reminder message.
- Share it through WhatsApp, SMS, or the device share sheet after a user action.
- Never treat a sent reminder as proof of payment.

### History and reports
- View past expenses.
- Summarize spending by day, month, and category.

## 6. Main website pages

1. **Sign up / Log in**
2. **Dashboard**
3. **Groups list**
4. **Group details** — members, expenses, balances, settlements
5. **Add expense**
6. **Balances / Settle up**
7. **Settlement history**
8. **Reports**
9. **Profile and settings**

## 7. Important product decisions

Confirm these choices before implementation. The defaults below are recommendations, not fixed requirements.

### A. How should friends join a group?
- **Recommended:** Both invitation links and group codes.
- Alternative: email/invitation link only.
- Alternative: group code only.

Invitation links and codes should be random, revocable, and optionally time-limited. Do not expose private group data to people who have not joined.

### B. Website design
- **Recommended:** Modern SaaS dashboard with a clean layout and dark/light mode.
- Alternative: minimal design optimized for quick expense entry.
- Alternative: colorful, college-student-friendly design.

### C. Repayments
- **Recommended for MVP:** Friends pay each other separately and record the repayment in the website.
- Optional later feature: provide UPI payment links where supported.
- Do not store UPI PINs, bank credentials, or claim that money has transferred without reliable confirmation.

## 8. Database design overview

Use PostgreSQL with these core tables:

| Table | Purpose |
|---|---|
| `users` | Accounts and login identity |
| `groups` | Hostel, roommate, or trip groups |
| `group_members` | User-to-group membership and role |
| `expenses` | Expense record and person who paid |
| `expense_splits` | Each participant's share |
| `settlements` | Repayment record between two group members |

Core relationships:
- One user can create multiple groups.
- Users join groups through `group_members`.
- A group contains many expenses.
- Each expense has one payer and one or more split rows.
- A group contains settlement records between members.

### Database rules
- The payer and every split participant must belong to the expense's group.
- The sum of split shares must equal the expense amount exactly.
- Save the expense and its splits in one database transaction.
- Distribute leftover paise deterministically. For example, ₹100 among three people can be ₹33.34, ₹33.33, and ₹33.33.
- Only confirmed settlements affect balances.
- Check group membership and permissions on the server for every protected request.

## 9. Balance calculation

For each member:

**Net balance = expenses paid − expense shares − confirmed settlement payments sent + confirmed settlement payments received**

- Positive balance: the member should receive money.
- Negative balance: the member owes money.
- Zero balance: the member is settled.

Balances for all members in a group should sum to zero, subject to correct data and consistent currency handling.

## 10. Suggested repository structure

```text
hisabmate/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── db/
│   │   └── app.js
│   ├── migrations/
│   └── package.json
├── docs/
│   └── architecture.md
├── .env.example
├── .gitignore
└── README.md
```

Keep SQL migrations under version control. Never commit real `.env` secrets.

## 11. Security basics

- Hash passwords using Argon2id or appropriately configured bcrypt.
- Use HTTPS in production.
- Prefer secure, `HttpOnly`, `SameSite` cookies for browser sessions; protect cookie-authenticated state-changing requests against CSRF.
- Validate and authorize all requests on the server.
- Use parameterized SQL queries.
- Rate-limit authentication endpoints.
- Never log passwords or session tokens.
- Configure backups and test restore procedures.
- Provide a way to remove accounts and handle user data responsibly.

## 12. Deployment plan

1. Run the frontend and backend locally.
2. Create a PostgreSQL database and apply versioned migrations.
3. Configure environment variables separately for development and production.
4. Deploy the React frontend to Vercel or a similar host.
5. Deploy the Express API to a Node-compatible host.
6. Use managed PostgreSQL with backups.
7. Configure HTTPS, allowed frontend origin/CORS, and secure cookies.
8. Test sign-up, group access, expense creation, balance calculation, settlement confirmation, and mobile-browser layout.
9. Invite a small group for a controlled trial.

Example `.env.example`:

```dotenv
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
SESSION_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
```

These are placeholders only. Do not commit real secrets.

## 13. Testing checklist

- [ ] User can register, sign in, and sign out.
- [ ] A user cannot access a group they do not belong to.
- [ ] Group invitations/codes can be revoked or expire as designed.
- [ ] Equal split works when the amount divides evenly.
- [ ] Equal split works when leftover paise remain.
- [ ] Custom split shares add up exactly to the expense total.
- [ ] Payer and split participants are group members.
- [ ] Pending/cancelled settlements do not change balances.
- [ ] A confirmed settlement affects balances exactly once.
- [ ] Failed split insertion rolls back the entire expense transaction.
- [ ] Concurrent requests do not cause duplicate or inconsistent records.
- [ ] Website works on laptop and mobile browsers.
- [ ] Secrets are not exposed in frontend code or Git history.

## 14. Development roadmap

1. Create the React + Vite frontend and Express backend.
2. Set up PostgreSQL and migrations.
3. Build registration/login and authorization.
4. Build group creation and membership.
5. Build expense creation and equal/custom splitting.
6. Build balance calculation and test the math thoroughly.
7. Build settlement recording and confirmation.
8. Build the dashboard, group screens, history, and reports.
9. Add reminder sharing.
10. Deploy and test with hostel friends.
11. Improve the website based on feedback.
12. Start the React Native app when the website workflow is stable.

## 15. MVP completion criteria

The website is ready for a small hostel-group trial when:
- Users can register and create groups.
- Members can add shared expenses.
- The app calculates reliable balances with correct rounding.
- Repayments can be recorded and confirmed without double counting.
- Group data is protected by server-side authorization.
- The website works on phone and laptop browsers.
- The deployed app uses HTTPS and keeps secrets out of client code.

**Recommended first coding task:** Set up the repository, PostgreSQL migrations, and expense-splitting service before building advanced charts or automatic reminders.
