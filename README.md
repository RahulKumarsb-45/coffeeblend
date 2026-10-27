# ☕ CoffeeBlend — Product Management & Business Analytics Platform

A full-stack coffee shop e-commerce application extended with product management workflows, business operations, customer engagement, and analytics capabilities.

**Built with:** HTML, CSS, JavaScript, Bootstrap, Node.js, Express.js, MongoDB, and Mongoose.

**Deployment:** Vercel (Frontend) · Render (Backend)

---

## 📌 Table of Contents

1. [Overview](#-overview)
2. [Project Vision](#-project-vision)
3. [Problem Statement](#-problem-statement)
4. [Key Features](#-key-features)
5. [Product Management Capabilities](#-product-management-capabilities)
6. [System Architecture](#-system-architecture)
7. [Technology Stack](#-technology-stack)
8. [Project Structure](#-project-structure)
9. [Getting Started](#-getting-started)
10. [Environment Variables](#-environment-variables)
11. [Database Models](#-database-models)
12. [API Documentation](#-api-documentation)
13. [Authentication and Authorization](#-authentication-and-authorization)
14. [Product Metrics and KPIs](#-product-metrics-and-kpis)
15. [Testing and Quality Assurance](#-testing-and-quality-assurance)
16. [Deployment](#-deployment)
17. [Security Considerations](#-security-considerations)
18. [Product Management Case Study](#-product-management-case-study)
19. [Future Improvements](#-future-improvements)
20. [Learning Outcomes](#-learning-outcomes)
21. [Contributing](#-contributing)
22. [License](#-license)

---

## 🚀 Overview

CoffeeBlend is a full-stack coffee shop e-commerce platform designed to manage the customer shopping experience and support product and business management workflows.

The application combines a customer-facing storefront with backend services for authentication, menu management, cart operations, orders, table bookings, and customer communication.

The project has also been extended with product management-oriented modules for:

- Product goals and decisions
- Feature prioritization
- Product roadmap planning
- Problem backlog management
- Product analytics and funnel events
- Experiment management
- Inventory management
- Coupons and loyalty programs
- Customer reviews and recommendations
- Marketing campaign management
- Business settings and activity logs

The objective is to demonstrate how software development, product thinking, customer experience, and business operations can work together in one application.

**Project category:** Full-Stack Development · Product Management · E-commerce · Business Analytics

## 🎯 Project Vision

Build a unified platform that helps a coffee shop manage its digital storefront while providing a foundation for making product and business decisions using structured data.

The project aims to connect three areas:

1. **Customer experience:** Make browsing, ordering, booking, and account management straightforward.
2. **Business operations:** Support inventory, promotions, loyalty, and customer feedback workflows.
3. **Product management:** Organize goals, prioritization, roadmaps, experiments, and analytics-related data.

## ❗ Problem Statement

A small coffee business may use separate tools to manage online orders, inventory, promotions, customer feedback, and product planning.

This separation can make it difficult to:

- Understand customer behavior across the shopping journey.
- Identify problems in the checkout and ordering experience.
- Prioritize improvements based on business impact.
- Coordinate feature development and product roadmaps.
- Organize customer feedback and retention initiatives.
- Maintain a consistent view of product and business operations.

CoffeeBlend explores how these workflows can be organized within one extensible application.

The actual business impact of the platform should be evaluated using measured usage, conversion, retention, and operational data rather than assumed improvements.

---

## ✨ Key Features

### 1. Customer-Facing E-commerce

- Coffee menu and product browsing.
- Product categories and featured items.
- Shopping cart management.
- Quantity updates and item removal.
- Checkout and order placement.
- Customer order history.
- User registration and login.
- Customer profile management.
- Table booking.
- Contact form submission.
- Customer-facing pages for the coffee shop.

### 2. Product Management

- Product goals and objectives.
- Product decision records.
- Feature prioritization.
- Product roadmap items.
- Problem backlog.
- Experiment records.
- Funnel event tracking.
- Product and business analytics foundations.

### 3. Business Management

- Inventory management.
- Coupon management.
- Loyalty program records.
- Customer reviews.
- Product recommendations.
- Marketing campaign records.
- Cafe settings.
- Activity log records.

### 4. Backend and Security

- REST-style API routes.
- JWT-based authentication.
- Password hashing with bcryptjs.
- Role-based admin authorization.
- MongoDB persistence through Mongoose.
- Request body size limits.
- Configurable CORS.
- Centralized error handling.
- Environment-based configuration.

*Feature availability and access controls should be verified against the implementation and the deployed application.*

---

## 🧭 Product Management Capabilities

CoffeeBlend is intended to demonstrate product management workflows in the context of a real-world e-commerce use case.

### 1. Product Goals

**Relevant files:** `backend/models/ProductGoal.js`

Organize product objectives and maintain structured records of goals.

Potential product questions:

- What outcome should a product improvement achieve?
- Which customer problem does the goal address?
- How will progress be evaluated?
- Which business metric should be monitored?

Examples of possible goals include improving checkout completion, increasing repeat purchases, and reducing order-related customer complaints.

### 2. Product Decisions

**Relevant files:** `backend/models/ProductDecision.js`

Maintain records of product decisions and the reasoning behind them.

A useful product decision record may include:

- Decision context.
- Customer problem.
- Available alternatives.
- Chosen approach.
- Trade-offs and risks.
- Expected outcome.
- Success criteria.

The exact fields depend on the implemented schema.

### 3. Feature Prioritization

**Relevant files:** `backend/models/FeaturePrioritization.js`

Organize feature requests and prioritization-related information.

Possible prioritization approaches include:

- RICE: Reach, Impact, Confidence, Effort.
- MoSCoW: Must have, Should have, Could have, Won't have.
- Impact versus effort analysis.

These frameworks are recommended approaches for product planning. Their existence as working calculations or interactive features must be verified separately.

### 4. Product Roadmap

**Relevant files:** `backend/models/RoadmapItem.js`

Maintain structured records of planned product work.

A roadmap can help communicate:

- Product priorities.
- Planned improvements.
- Milestones.
- Dependencies.
- Expected outcomes.
- Delivery status.

A roadmap should communicate the direction and intended outcomes of product development, rather than merely listing tasks.

### 5. Problem Backlog

**Relevant files:** `backend/models/ProblemBacklog.js`

Organize customer problems and potential improvements.

A product team can use a backlog to record problem descriptions, supporting evidence, priority, and proposed next steps, depending on the fields implemented.

### 6. Product Analytics and Funnel Events

**Relevant files:** `backend/models/FunnelEvent.js`, `backend/routes/analytics.js`

Provide a foundation for storing product activity and analytics-related information.

Potential funnel stages for a coffee shop include:

1. Menu viewed.
2. Product selected.
3. Item added to cart.
4. Checkout started.
5. Order completed.

These events can help identify where users abandon a journey, provided that the corresponding event instrumentation and metric calculations are implemented.

### 7. Experiment Management

**Relevant files:** `backend/models/Experiment.js`, `backend/routes/experiments.js`

Organize product experiments and their associated records.

A product experiment should ideally document:

- Hypothesis.
- Target user group.
- Control and variant.
- Primary success metric.
- Experiment duration.
- Sample size.
- Results.
- Decision and learnings.

An experiment management module does not, by itself, guarantee that A/B assignment, statistical analysis, or automatic experiment execution is implemented.

### 8. Inventory Management

**Relevant files:** `backend/models/Inventory.js`, `backend/routes/inventory.js`

Support inventory-related business workflows.

Potential use cases include tracking available quantities, monitoring stock levels, and coordinating inventory updates with product operations.

Automatic stock deduction, low-stock alerts, and order-to-inventory synchronization should be verified against the actual route and model logic.

### 9. Coupons and Loyalty

**Relevant files:**
- `backend/models/Coupon.js`
- `backend/routes/coupons.js`
- `backend/models/Loyalty.js`
- `backend/routes/loyalty.js`

These modules provide the foundation for promotional and loyalty-related workflows.

Potential use cases include coupon records, promotional eligibility, loyalty point records, and repeat-customer initiatives.

Discount validation, expiration handling, redemption limits, and loyalty point calculations must be enforced by the backend if those features are enabled.

### 10. Customer Reviews and Recommendations

**Relevant files:**
- `backend/models/Review.js`
- `backend/routes/reviews.js`
- `backend/routes/recommendations.js`

These modules support customer feedback and product discovery workflows.

Possible product opportunities include analyzing review themes, identifying frequently purchased items, and improving product discovery.

The specific recommendation algorithm and review moderation behavior depend on the implementation.

### 11. Marketing Campaigns

**Relevant files:** `backend/models/MarketingCampaign.js`

Organize marketing campaign-related data.

A campaign workflow may track its objective, target audience, schedule, budget, and results, depending on the implemented schema.

Actual email delivery, campaign scheduling, audience segmentation, and campaign attribution should not be assumed without implementation evidence.

### 12. Cafe Settings and Activity Logs

**Relevant files:**
- `backend/models/CafeSettings.js`
- `backend/models/ActivityLog.js`
- `backend/routes/management.js`

These modules support business configuration and management-related records.

Activity logs are useful for auditing important actions when the application records the actor, action, timestamp, and relevant context.

Sensitive data such as passwords, authentication tokens, and payment credentials should never be written to logs.

---

## 🏗 System Architecture

CoffeeBlend follows a client-server architecture.

```text
                 CUSTOMER / ADMIN
                        |
                        v
              FRONTEND APPLICATION
              HTML / CSS / JavaScript
                    Bootstrap
                        |
                        | HTTP / JSON
                        v
                EXPRESS.JS SERVER
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
     Auth & JWT     API Routes    Error Handling
          |             |
          |       +-----+--------------------+
          |       |     |        |           |
          v       v     v        v           v
        USERS   ORDERS CART   INVENTORY   PRODUCT TOOLS
                        |
                        v
                   MONGODB
                   MONGOOSE
```

### Request flow

1. The customer interacts with the frontend.
2. The frontend sends an HTTP request to the backend.
3. Express routes validate and process the request.
4. Protected routes verify the JWT and authorization requirements.
5. Mongoose reads or updates MongoDB documents.
6. The backend returns a JSON response.
7. The frontend displays the result.

### Deployment architecture

- **Frontend:** Vercel.
- **Backend:** Render.
- **Database:** MongoDB Atlas or another configured MongoDB deployment.
- **Version control:** GitHub.

The deployed frontend must point to the correct backend API URL, and the backend must allow the frontend's production origin.

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| UI framework | Bootstrap |
| Backend runtime | Node.js |
| Backend framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Password security | bcryptjs |
| Cross-origin requests | CORS |
| Configuration | dotenv |
| API requests | Axios, where used |
| Payment integration | PayPal SDK dependency; verify actual integration and configured provider |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Version control | Git and GitHub |

The technologies above reflect the project's dependencies and architecture. The exact usage of each dependency should be verified in the source code.

---

## 📁 Project Structure

```text
coffeeblend/
│
├── backend/
│   ├── config/
│   │   └── cafe.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Booking.js
│   │   ├── ActivityLog.js
│   │   ├── CafeSettings.js
│   │   ├── Coupon.js
│   │   ├── Experiment.js
│   │   ├── FeaturePrioritization.js
│   │   ├── FunnelEvent.js
│   │   ├── Inventory.js
│   │   ├── Loyalty.js
│   │   ├── MarketingCampaign.js
│   │   ├── ProblemBacklog.js
│   │   ├── ProductDecision.js
│   │   ├── ProductGoal.js
│   │   ├── Review.js
│   │   └── RoadmapItem.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── menu.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── bookings.js
│   │   ├── contact.js
│   │   ├── payment.js
│   │   ├── inventory.js
│   │   ├── coupons.js
│   │   ├── loyalty.js
│   │   ├── reviews.js
│   │   ├── recommendations.js
│   │   ├── experiments.js
│   │   ├── analytics.js
│   │   └── management.js
│   │
│   ├── test_management.js
│   ├── test_suite.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── css/
│   │   └── business-management.css
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── main.js
│   │   └── business-management.js
│   │
│   ├── index.html
│   ├── about.html
│   ├── menu.html
│   ├── cart.html
│   ├── checkout.html
│   ├── orders.html
│   ├── bookings.html
│   ├── contact.html
│   ├── login.html
│   ├── register.html
│   ├── profile.html
│   ├── pay.html
│   └── services.html
│
├── .gitignore
└── README.md
```

This structure reflects the files identified during development. Confirm the current repository contents before treating it as an exhaustive file listing.

---

## ⚙️ Getting Started

### Prerequisites

Install the following before running the application:

- Node.js and npm.
- Git.
- A MongoDB database, such as MongoDB Atlas.
- A code editor such as Visual Studio Code.
- A modern web browser.

Verify Node.js and npm:

```bash
node --version
npm --version
git --version
```

### Step 1: Clone the repository

```bash
git clone https://github.com/RahulKumarsb-45/coffeeblend.git
cd coffeeblend
```

### Step 2: Install backend dependencies

```bash
cd backend
npm install
```

### Step 3: Configure environment variables

Create a local environment file at:

```text
backend/.env
```

Add the required configuration using the variable names shown in the next section. Never commit the real `.env` file.

### Step 4: Start the backend

From the `backend` directory:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The server uses the configured `PORT` value or defaults to port `5000`.

The server connects to MongoDB before starting to listen for HTTP requests.

### Step 5: Open the frontend

If the backend serves the static frontend, open:

```text
http://localhost:5000
```

The backend serves files from the `frontend/` directory.

### Step 6: Test core functionality

Verify the following manually:

- Register a test account.
- Log in with the test account.
- Browse the menu.
- Add and remove cart items.
- Update cart quantities.
- Place a test order.
- View order history.
- Submit a test booking.
- Submit the contact form.
- Verify protected endpoints reject unauthenticated requests.
- Verify ordinary users cannot access admin-only operations.
- Test new management features individually.

Use test data and sandbox payment credentials wherever applicable.

---

## 🔐 Environment Variables

Create `backend/.env` locally.

Example:

```dotenv
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5000
CLIENT_URL=http://localhost:5000
```

These are example values and may need adjustment to match the implementation.

### Variable descriptions

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Determines development or production behavior |
| `PORT` | Backend HTTP port; hosting providers may assign it |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `JWT_EXPIRE` | Token expiration duration |
| `FRONTEND_URL` | Allowed frontend origin |
| `CLIENT_URL` | Additional configured client origin |

### Additional configuration

Review the payment and email route implementations before deploying. If those features use additional credentials, configure their actual required variables in Render or your local `.env`.

Do not invent or assume variable names: use the names read by the corresponding source files.

### Production configuration

For production:

- Set `NODE_ENV=production`.
- Configure the actual production frontend origin.
- Use a strong, unique `JWT_SECRET`.
- Configure the correct MongoDB URI.
- Add payment and email credentials only when required.
- Keep secret values in the hosting provider's environment settings.

Never publish real passwords, database connection strings, JWT secrets, payment credentials, or private API keys.

---

## 🗄 Database Models

The application uses Mongoose models to define structured MongoDB documents.

| Model | Purpose |
|---|---|
| `User.js` | User accounts, authentication, profile and role data |
| `Product.js` | Menu and product records |
| `Cart.js` | Shopping cart data |
| `Order.js` | Customer orders |
| `Booking.js` | Table reservation records |
| `ActivityLog.js` | Activity and audit-related records |
| `CafeSettings.js` | Cafe configuration |
| `Coupon.js` | Coupon-related records |
| `Experiment.js` | Product experiment records |
| `FeaturePrioritization.js` | Feature prioritization data |
| `FunnelEvent.js` | Product funnel event records |
| `Inventory.js` | Inventory-related data |
| `Loyalty.js` | Loyalty-related records |
| `MarketingCampaign.js` | Marketing campaign data |
| `ProblemBacklog.js` | Product problem backlog |
| `ProductDecision.js` | Product decision records |
| `ProductGoal.js` | Product goals |
| `Review.js` | Customer review records |
| `RoadmapItem.js` | Product roadmap items |

The exact schema fields, validation rules, relationships, indexes, and lifecycle behavior are defined in the individual model files.

---

## 🔌 API Documentation

The backend exposes APIs under the `/api` prefix.

Base URLs:

```text
Local:      http://localhost:5000/api
Production: https://YOUR-RENDER-SERVICE.onrender.com/api
```

Replace the production placeholder with the actual deployed Render URL.

### 1. Authentication

Base path: `/api/auth`

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/register` | Register a user | Public |
| POST | `/login` | Authenticate a user | Public |
| GET | `/me` | Retrieve the current user profile | JWT |
| PUT | `/profile` | Update profile details | JWT |
| GET | `/admins` | List admin accounts | Admin |
| POST | `/create-admin` | Create another admin | Admin |
| DELETE | `/admins/:id` | Delete an admin account | Admin |

These endpoints correspond to the authentication route implementation reviewed during development.

### 2. Menu

Base path: `/api/menu`

The menu module supports product/menu-related requests.

Previously documented operations include:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Retrieve menu items |
| GET | `/featured` | Retrieve featured items, if implemented |
| GET | `/?category=coffee` | Filter menu items by category, if supported |

Confirm the exact query parameters and behavior in `backend/routes/menu.js`.

### 3. Shopping Cart

Base path: `/api/cart`

Previously documented operations include:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Retrieve cart |
| POST | `/add` | Add an item |
| PUT | `/update/:id` | Update an item quantity |
| DELETE | `/remove/:id` | Remove an item |

These paths should be checked against the actual cart router before relying on them in external integrations.

### 4. Orders

Base path: `/api/orders`

Previously documented operations include:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/` | Place an order |
| GET | `/my-orders` | Retrieve the current user's orders |

Confirm additional order status, cancellation, and admin operations in `backend/routes/orders.js`.

### 5. Bookings

Base path: `/api/bookings`

The booking module handles table reservation requests.

Previously documented operation:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/` | Submit a booking request |

Verify whether listing, updating, and deleting bookings are implemented and what permissions they require.

### 6. Contact

Base path: `/api/contact`

The contact module handles contact form submissions.

Previously documented operation:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/` | Submit a contact message |

### 7. Payments

Base path: `/api/payment`

Payment-related operations are registered in the backend. Inspect `backend/routes/payment.js` for the exact payment creation, verification, capture, and callback endpoints.

Do not treat a frontend payment-success screen as proof of a verified payment. Payment status must be validated by the backend with the payment provider.

### 8. Inventory

Base path: `/api/inventory`

Supports inventory-related management workflows.

Review `backend/routes/inventory.js` for exact endpoint methods, request bodies, authentication requirements, and inventory validation rules.

### 9. Coupons

Base path: `/api/coupons`

Supports coupon-related operations.

Review `backend/routes/coupons.js` for the implemented CRUD operations, coupon validation, discount rules, and permissions.

### 10. Loyalty

Base path: `/api/loyalty`

Supports loyalty-related workflows.

Review `backend/routes/loyalty.js` for point accrual, redemption, balances, and any implemented eligibility rules.

### 11. Reviews

Base path: `/api/reviews`

Supports customer review operations.

Review `backend/routes/reviews.js` for the available operations, validation, and authorization behavior.

### 12. Recommendations

Base path: `/api/recommendations`

Supports product recommendation-related requests.

Review `backend/routes/recommendations.js` to determine the implemented recommendation logic and exact endpoints.

### 13. Experiments

Base path: `/api/experiments`

Supports experiment management.

Review `backend/routes/experiments.js` for experiment creation, updates, retrieval, results, and access controls.

### 14. Analytics

Base path: `/api/analytics`

Supports analytics-related endpoints.

Review `backend/routes/analytics.js` for the actual metrics, aggregation logic, funnel calculations, and response formats.

### 15. Business Management

Base path: `/api/management`

Supports management-related operations.

Review `backend/routes/management.js` for exact routes, supported business settings, audit behavior, and permissions.

### Authentication format

Protected requests generally use the following header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Example using `curl`:

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

A valid token is required for protected routes. Admin routes also require an admin role.

---

## 🔒 Authentication and Authorization

CoffeeBlend uses JWT-based authentication.

### Registration

The registration route validates user inputs and creates a normal user account. Public registration must not allow users to assign themselves the admin role.

### Login

The login route checks credentials and issues a JWT after successful authentication.

### Protected routes

The authentication middleware:

1. Reads the Bearer token from the request header.
2. Verifies the token.
3. Retrieves the user record.
4. Attaches the authenticated user to the request.
5. Rejects invalid or expired tokens.

### Admin authorization

Admin-only operations check the authenticated user's role.

Important security requirements:

- Never trust an admin role supplied by the frontend.
- Protect every sensitive management endpoint.
- Validate IDs and request bodies.
- Restrict account deletion and sensitive changes.
- Establish the initial admin through a controlled, secure process.

The complete security of the application depends on every route using the appropriate middleware.

---

## 📊 Product Metrics and KPIs

A Product Manager should define metrics based on a specific product goal.

The following are suggested metrics for CoffeeBlend, not claims about metrics already implemented in the application.

| Metric | Definition | Product question |
|---|---|---|
| Conversion rate | Completed orders ÷ eligible visitors or sessions | Are visitors converting? |
| Cart abandonment rate | Eligible carts not completed ÷ eligible carts | Where are users dropping off? |
| Checkout completion rate | Completed checkouts ÷ checkout starts | Is checkout working well? |
| Average order value | Revenue ÷ completed orders | How much does an average order generate? |
| Repeat purchase rate | Eligible customers who purchase again ÷ eligible customers | Are customers returning? |
| Coupon redemption rate | Redeemed eligible coupons ÷ issued eligible coupons | Are promotions being used? |
| Review submission rate | Reviews submitted ÷ eligible completed orders | Are customers providing feedback? |
| Stockout rate | Relevant unavailable product events ÷ relevant product demand events | Are inventory problems affecting sales? |

Metrics require consistent event definitions, timestamps, unique identifiers, and reliable data collection.

### Example product hypothesis

**Problem:** Customers may abandon checkout because the process is confusing.

**Hypothesis:** Simplifying checkout will improve checkout completion without increasing order errors.

**Primary metric:** Checkout completion rate.

**Guardrail metrics:** Payment failure rate, order cancellation rate, and customer complaints.

**Evaluation:** Compare results over a defined period with an appropriate control group before making a rollout decision.

This is an example of a product management workflow, not a claim that this experiment has already been run.

---

## 🧪 Testing and Quality Assurance

The project contains the following test-related files:

```text
backend/test_management.js
backend/test_suite.js
```

The backend package currently defines these scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

A dedicated `npm test` script is not currently configured.

### Syntax checks

From the project root, run:

```bash
find backend -name '*.js' \
  -not -path '*/node_modules/*' \
  -print0 | xargs -0 -n1 node --check
```

Check frontend JavaScript:

```bash
find frontend/js -name '*.js' \
  -print0 | xargs -0 -n1 node --check
```

These commands check JavaScript syntax; they do not verify functional correctness.

### Manual regression tests

- [ ] Registration works with valid inputs.
- [ ] Duplicate accounts are rejected.
- [ ] Login works with correct credentials.
- [ ] Incorrect credentials are rejected.
- [ ] Protected routes reject missing or invalid tokens.
- [ ] Regular users cannot access admin-only endpoints.
- [ ] Products load correctly.
- [ ] Cart operations work.
- [ ] Orders are saved and associated with the correct user.
- [ ] Payment status is verified by the backend.
- [ ] Bookings and contact submissions work.
- [ ] Inventory and coupon operations are validated.
- [ ] Reviews and loyalty operations respect permissions.
- [ ] Analytics and experiment endpoints return expected data.
- [ ] Frontend and backend work together after deployment.

### Important test safety note

Inspect the contents of `test_management.js` and `test_suite.js` before executing them. Tests that modify database records, inventory, loyalty balances, or campaigns should run against a dedicated test database or controlled test fixtures—not production data.

---

## 🌐 Deployment

The project has previously been deployed using Vercel for the frontend and Render for the backend.

### Backend deployment on Render

1. Open the Render dashboard.
2. Select the existing CoffeeBlend backend service.
3. Confirm the connected GitHub repository.
4. Confirm the production branch is `main`.
5. Confirm the backend root directory is `backend`, if the service is configured for that layout.
6. Confirm the start command is `npm start`.
7. Configure required environment variables.
8. Verify that MongoDB allows connections from the deployment environment.
9. Trigger a deployment if automatic deployment is not enabled.
10. Inspect the build and runtime logs.

The backend should start only after the MongoDB connection succeeds.

### Frontend deployment on Vercel

1. Open the Vercel dashboard.
2. Select the existing CoffeeBlend frontend project.
3. Confirm the connected GitHub repository and production branch.
4. Verify the frontend deployment configuration.
5. Ensure frontend API configuration points to the production Render URL.
6. Trigger a new deployment if necessary.
7. Inspect the deployment logs and test the live site.

### After deployment

Test the following against the actual production URLs:

- Homepage and menu.
- Registration and login.
- Authenticated profile access.
- Cart and order placement.
- Booking and contact forms.
- Admin-only functionality.
- New product management and business management features.
- CORS behavior.
- Payment verification, using sandbox mode where applicable.

A successful GitHub push does not guarantee that Render and Vercel deployments will succeed. Deployment status and runtime logs must be checked.

---

## 🛡 Security Considerations

Security is especially important for an application handling accounts, orders, and business operations.

### Environment variables

- Keep `.env` files out of Git.
- Use `.env.example` only for non-secret placeholders.
- Store production secrets in the hosting provider's environment settings.
- Rotate any secret that was accidentally exposed.

### Authentication

- Use strong JWT secrets.
- Hash passwords before storing them.
- Validate user inputs on the backend.
- Keep authorization checks on the server.
- Avoid returning password hashes or sensitive fields.

### Database

- Use a dedicated MongoDB database user with appropriate permissions.
- Restrict network access where practical.
- Avoid destructive operations on production data.
- Back up important production data.

### Payments

- Verify transactions on the backend.
- Use payment-provider sandbox credentials during testing.
- Do not store raw payment card details.
- Never trust a client-submitted payment status.

### API protection

For production use, consider:

- Rate limiting for authentication endpoints.
- Strong request validation.
- Security headers.
- More detailed audit logging for sensitive actions.
- Dependency vulnerability checks.
- Monitoring and alerting.

These are security recommendations; do not assume every listed protection is already implemented.

---

## 🧠 Product Management Case Study

CoffeeBlend can be used as a product management case study as well as a software engineering project.

### Example: Improving the checkout experience

**Objective:** Identify and reduce avoidable checkout abandonment.

**Step 1 — Define the problem**

Understand where customers abandon the ordering process.

**Step 2 — Collect evidence**

Review checkout events, order failures, support messages, and customer feedback.

**Step 3 — Identify opportunities**

Potential opportunities include clearer pricing, fewer checkout steps, improved error messages, and better payment status feedback.

**Step 4 — Prioritize**

Evaluate candidate improvements based on customer impact, business value, confidence, effort, and dependencies.

**Step 5 — Define success metrics**

Choose checkout completion rate as a primary metric and define guardrail metrics for payment failures and order errors.

**Step 6 — Experiment**

Run a controlled test when appropriate and when sufficient traffic and measurement quality are available.

**Step 7 — Evaluate**

Compare the results, document limitations, and decide whether to roll out, iterate, or reject the change.

This case study should be presented as a proposed workflow unless actual user research, experiments, and results have been collected.

---

## 🚀 Future Improvements

Potential future enhancements include:

- Automated unit and integration testing.
- API request validation with a schema validation library.
- Rate limiting and security headers.
- More comprehensive product analytics dashboards.
- Funnel visualization and cohort analysis.
- RICE prioritization calculations.
- Roadmap visualization and milestone tracking.
- Controlled A/B experiment assignment and analysis.
- Better customer feedback categorization.
- Inventory alerts and order synchronization.
- Automated deployment checks.
- API documentation with OpenAPI or Swagger.
- Monitoring, error reporting, and operational dashboards.
- Accessibility and responsive UI improvements.

These are potential improvements, not descriptions of completed functionality.

---

## 🎓 Learning Outcomes

The project offers opportunities to demonstrate:

### Software engineering

- Full-stack application architecture.
- REST API design.
- MongoDB data modeling.
- Authentication and authorization.
- Frontend-backend integration.
- Deployment and environment configuration.

### Product management

- Problem definition.
- Goal setting and success metrics.
- Feature prioritization.
- Roadmap planning.
- Experiment design.
- Product analytics concepts.
- Customer feedback workflows.
- Business and operational thinking.

### Cross-functional thinking

CoffeeBlend connects implementation decisions with customer experience and business outcomes. This makes it a useful foundation for discussing trade-offs between engineering effort, usability, operational complexity, and measurable product impact.

---

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test the change.
4. Keep secrets and production data out of commits.
5. Submit a pull request describing the problem, solution, and testing performed.

For larger changes, document the motivation, expected behavior, and any relevant trade-offs.

---

## 📄 License

Choose and add a license file before describing the project as open source. Until a license is included, the repository should not be assumed to grant general permission to reuse, modify, or redistribute the code.

---

## 👨‍💻 Project

**CoffeeBlend — Product Management & Business Analytics Platform**

GitHub repository: https://github.com/RahulKumarsb-45/coffeeblend

**Built to explore the intersection of full-stack development, product management, customer experience, and business operations.**
