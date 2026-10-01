# Komal RO System

RO Purifier E-commerce + Service Booking app (Amazon-style shop + Urban Company-style services).

## Stack

| Layer | Tech |
|-------|------|
| Mobile | Expo / React Native (Android + iOS) |
| Backend | FastAPI + SQLAlchemy |
| Database | MySQL |
| Auth | JWT + Email OTP (printed to console in dev) |
| ML | scikit-learn linear regression for sales prediction |

---

## 1. Backend setup

### Prerequisites
- Python 3.10+
- MySQL running (XAMPP, Docker, or local)
- Database name: `komal_ro`

### Create DB (once)

```sql
CREATE DATABASE IF NOT EXISTS komal_ro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Install & run

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Configure your database credentials in backend/.env
python seed_data.py

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: http://localhost:8000/docs  
- Admin: `admin@komalro.com` / the password configured in `ADMIN_PASSWORD`  
- OTP appears in the **terminal** when you register (no email service required)

---

## 2. Frontend setup (Expo)

```bash
cd frontend
npm install
npx expo start
```

Then press `a` for Android emulator or scan QR with Expo Go on a real phone.

### Important: API URL

Edit `frontend/src/api/config.js`:

| Environment | Value |
|-------------|--------|
| Android Emulator | `http://10.0.2.2:8000` |
| iOS Simulator | `http://127.0.0.1:8000` |
| Physical phone | `http://YOUR_PC_LAN_IP:8000` (e.g. `http://192.168.31.126:8000`) |

PC and phone must be on the same Wi‑Fi. Backend must bind `0.0.0.0` (already set in uvicorn command above).

---

## 3. Test flow

### Client
1. Register with name + email + password  
2. Copy OTP from backend terminal  
3. Verify OTP → Login  
4. Browse products → Add to cart → Checkout  
5. Book a service  
6. File a complaint from Profile  

### Admin
1. Login: `admin@komalro.com` / the password configured in `ADMIN_PASSWORD`  
2. View AI sales prediction  
3. Accept / ship / deliver orders  
4. Accept / complete service bookings  

---

## Project structure

```
komal-ro/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── seed_data.py
│   ├── requirements.txt
│   └── app/
│       ├── models/
│       ├── schemas/
│       ├── routers/     # auth, client, services, admin
│       ├── middleware/
│       ├── ml_engine/
│       └── utils/
└── frontend/
    ├── App.js
    ├── src/
    │   ├── api/
    │   ├── context/
    │   ├── navigation/
    │   └── screens/
    └── package.json
```

---

## Fixed issues (from original code)

- Login used phone but API expects **email**
- Register field names mismatched (`name` → `full_name`, missing email)
- `AuthContext.login(token, role)` was called with phone/password
- OTP screen did not call API or receive email
- `clientApi` missing `getCart`, `addToCart`, `checkout`
- Named vs default export mismatches
- `python-decouple` removed (use dotenv)
- Admin ManageServices was a broken placeholder
- Timezone-safe OTP expiry check

The app is ready to run end-to-end after MySQL + seed + API URL are configured.
