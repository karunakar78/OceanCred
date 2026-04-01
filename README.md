# SeaCred

OceanCred includes three apps:
- Backend API in backend
- Web app in web
- Mobile app in mobile

## Prerequisites

- Python 3.10+ (python3 command available)
- Node.js 18+ and npm
- npx available (comes with npm)

## First-Time Setup

### 1) Backend setup

From project root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

Note:
- The root launcher automatically uses backend/venv/bin/python if it exists.

### 2) Web dependencies

From project root:

```bash
cd web
npm install
cd ..
```

### 3) Mobile dependencies

From project root:

```bash
cd mobile
npm install
cd ..
```

## Run Entire Project (Recommended)

From project root:

```bash
python3 run.py
```

This starts all services together:
- Backend API on http://0.0.0.0:8080
- Web app on http://localhost:5173
- Mobile app with Expo via npx expo start

Stop all with Ctrl+C.

## Run Services Individually

### Backend only

```bash
cd backend
source venv/bin/activate
python run.py
```

### Web only

```bash
cd web
npm run dev
```

### Mobile only

```bash
cd mobile
npx expo start
```

## Expo QR Code

When mobile starts, Expo prints a QR code in the terminal.
- Android: scan with Expo Go
- iOS: scan with Camera app or Expo Go

If QR is not visible, press ? in the Expo terminal to see available commands.

## Troubleshooting

- Error: python command not found
	- Use python3 run.py from project root.

- Error: backend venv not found
	- Create it in backend with python3 -m venv venv and install requirements.

- Port conflict (for example 8080 or 5173)
	- Stop conflicting processes, then restart.
