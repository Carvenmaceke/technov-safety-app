# TechNov — Personal Safety SOS (Prototype)

A clickable prototype of **TechNov**, a personal-safety app that lets a person in danger send an SOS with their location to trusted contacts — fast, and even when they have no signal.

Built for the **FNB App of the Year Hackathon 2026**.

> **Live demo (installable):** https://carvenmaceke.github.io/technov-safety-app/
> It is web-based, but it is a **Progressive Web App** — on a phone, open the link and choose **Add to Home Screen** (Android shows an install prompt after you log in). It then opens full-screen with its own icon and works offline, like a downloaded app. A native build can follow later.

On a phone the app fills the screen like a normal app. The offline / helper-network / theft demos are in a **Demo** button at the bottom-right. (A separate split-screen "Security Inspector" view, used to show judges what the backend and database do, lives in the chat prototype.)

---

## What this prototype shows

The screen is split in two:

- **Left — the phone.** The actual app: welcome, registration, email verification, login, home dashboard with a big SOS button, trusted contacts, alert status, location, history, and settings.
- **Right — the Security Inspector.** A judge-facing panel that shows what the backend and database are doing behind the app: the users table, a live audit log, the encrypted offline queue, the helper network, the evidence vault, and buttons that prove the access-control rules.

Everything that is **not** a real integration is tagged **Simulated** (SMS sending, GPS, camera, the fingerprint prompt, Bluetooth, and police/EMS). Nothing is claimed to be delivered unless a channel is actually available — this follows the project brief's rule about honest delivery states.

### Demo accounts

| Role | Email | Password | Safe PIN |
|------|-------|----------|----------|
| User | `lerato@demo.co.za` | `Safe@2026` | `1357` |
| User | `thandi@demo.co.za` | `Thandi#2026` | `2468` |
| Admin | `admin@technov.co.za` | `Admin@2026` | `9021` |

---

## Security measures (these run for real in your browser)

| Measure | How it works here |
|---|---|
| Password hashing | PBKDF2-SHA256, 100,000 iterations, unique salt per user (Web Crypto) |
| Brute-force lockout | 5 wrong passwords locks the account for 60 seconds |
| No account enumeration | Same error message for a wrong email and a wrong password |
| Email verification | 6-digit code, expires in 10 minutes, limited attempts |
| Sessions | Random 256-bit token, auto sign-out after 3 minutes idle |
| Access control | Every API call checks the token, the role, and the record owner |
| SQL injection | Parameterised queries only (shown in the audit log) |
| Offline queue | AES-256-GCM encrypted on the device until it can be sent |
| Duress PIN | The Safe PIN entered backwards fakes a cancel while the alert stays active |
| XSS | All user input is escaped before it is displayed |

### Access-control tests

Five buttons in the Security Inspector prove:

1. A signed-in user gets **403** when reading another user's alert.
2. A request with no token gets **401**.
3. An admin can list alerts — **metadata only**, no location or recordings.
4. An admin opening a recording **without a written reason** is refused and logged.
5. An admin opening a recording **with a break-glass reason** succeeds and is written to the privileged-access log.

---

## Standout features

### 1. Offline SOS with an encrypted queue
If there is no internet, the alert is encrypted with AES-256-GCM and stored on the phone. When the phone reconnects, it is sent automatically. With cellular only, an SMS fallback is used (simulated). The app never shows an alert as delivered when it has only been saved locally.

### 2. Helper Network (Bluetooth relay)
When a phone has no signal, it broadcasts an **encrypted Bluetooth SOS beacon**. Other nearby TechNov phones that *do* have signal forward the beacon to the server along with their own GPS. The server then **estimates the victim's position** from those phones using signal strength:

```
distance (m) = 10 ^ ((-59 - RSSI) / 22)
position     = weighted average of helper GPS, weight = 1 / distance²
```

While the victim stays offline, each new phone that hears them adds a point to a **movement trail** on the map. Helper identities are never stored, and beacon IDs rotate every 15 minutes for privacy.

### 3. Theft Lock
If someone enters the wrong PIN three times, or swaps the SIM, the phone **locks**, openly warns the holder that it is recording (a deterrent), keeps the SOS active, and uploads photo frames to the server. The evidence table grants **INSERT only** — no UPDATE, no DELETE for any role, admins included — so wiping the phone cannot erase what is already stored.

**Honest limitation, stated in the app:** a normal app cannot fully block a forced power-off. On Android, device-admin/kiosk mode makes it harder; the real protection is that the alert and photos have already left the device.

---

## Proposed production architecture

The simulated backend in this prototype maps one-to-one onto a real stack:

- **Mobile app** — the UI, permissions, SOS activation, local emergency state.
- **Secure REST API** (e.g. Spring Boot) — authentication, authorisation, owner checks, alert handling, notifications.
- **MySQL** — users, trusted contacts, alert metadata, relay sightings, evidence references.

The mobile app never connects directly to MySQL; all access goes through the API. Transport is HTTPS/TLS; sensitive data is encrypted at rest.

---

## Tech

- Single `index.html`, vanilla JavaScript, no framework.
- Web Crypto API for real PBKDF2 and AES-GCM.
- Inline SVG for the map and icons.

## Status

Prototype for demonstration. Camera, GPS, SMS, Bluetooth and emergency-service integrations are simulated and clearly labelled. Not for real emergency use — in a real emergency call **10111** (SAPS) or **112** from a mobile.
