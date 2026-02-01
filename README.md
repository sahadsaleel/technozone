# TechnoZone - Shop Management App

A complete shop management solution built with React Native (Frontend) and Node.js/Express/MongoDB (Backend).

## Features
- **Product Management**: Add, update, delete, and list products.
- **Daily Purchases**: Record new stock purchases.
- **Expense Tracking**: Track operational expenses (Rent, Salary, etc.).
- **Reports**: View financial summaries and profit/loss status.
- **Authentication**: Secure login and registration.

## Prerequisites
- **Node.js**: Installed on your machine.
- **MongoDB**: Installed and running locally (or use a cloud URI).
- **React Native Environment**: Set up for Android or iOS development (Android Studio/Xcode).

## Getting Started

### 1. Backend Setup (Server)

The backend handles the database and API logic.

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    - The `.env` file is already created with default settings:
        ```
        PORT=5000
        MONGO_URI=mongodb://localhost:27017/technozone
        JWT_SECRET=your_secret_key
        ```
    - Ensure your local MongoDB is running.
4.  Start the server:
    ```bash
    npm run dev
    ```
    - You should see: `MongoDB Connected` and `Server running on port 5000`.

### 2. Frontend Setup (App)

The frontend is the React Native mobile application.

1.  Open a new terminal window and navigate to the project root:
    ```bash
    cd "d:\Sahad Saleel\TechnoZone"
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Metro Bundler:
    ```bash
    npm start
    ```
4.  Run on Android Emulator:
    - Press `a` in the terminal running `npm start`.
    - OR run: `npm run android`

### Important Note for Android Emulator
If you are using the Android Emulator, the backend running on `localhost:5000` needs to be accessible. React Native uses `10.0.2.2` to access the host machine's localhost, which is already configured in `src/services/api.js`.

If you face connection issues, try running this command to reverse the port (requires ADB):
```bash
adb reverse tcp:5000 tcp:5000
```
Then you can use `localhost:5000` in your API config or stick to `10.0.2.2`.

## Project Structure
- `src/screens`: UI Screens (Products, Expenses, Reports, etc.)
- `src/services`: API configuration (`api.js`)
- `server/models`: Database schemas
- `server/controllers`: Logic for API endpoints
- `server/routes`: API route definitions

## Usage
1.  **Register/Login**: Create an account to access the dashboard.
2.  **Dashboard**: View quick stats.
3.  **Products**: Add your inventory items.
4.  **Purchases**: Record when you buy new stock.
5.  **Expenses**: Log daily costs.
6.  **Reports**: check your profit/loss.
