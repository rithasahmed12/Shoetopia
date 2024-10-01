# Shoetopia - E-commerce Platform

Shoetopia is a full-featured eCommerce platform built with two distinct modules: **Admin** and **User**.

## Features

### Admin Module
- **Product Management**: Add, update, and manage products.
- **User Management**: View and manage users.
- **Order Management**: Track and manage orders.
- **Offers and Coupons**: Create and manage special offers and discount coupons.
- **Banner Management**: Add and manage promotional banners.

### User Module
- **User Profile**: Manage personal information and account settings.
- **Wallet**: Keep track of wallet balance and transactions.
- **Review System**: Users who have purchased products can leave reviews.

## How to Run Locally

Follow the steps below to set up and run Shoetopia on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/rithasahmed12/Shoetopia.git
```

### 2. Install Dependencies

Navigate to the project directory and install the required dependencies using npm:

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory of the project. Here’s a sample of the environment variables you need to set:

```bash
ADMIN_EMAIL=
ADMIN_PASS=
EMAIL_PASS=
EMAIL_USER=
MONGO_URI=
PORT=
RAZORPAY_ID_KEY=
RAZORPAY_SECRET_KEY=
```

Ensure you fill in the correct values for each variable.

### 4. Run the Application

Once the environment variables are set, you can start the application by running:

```bash
npm start
```

The application will now be running on the port specified in the `.env` file.

---
