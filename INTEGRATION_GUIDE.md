# Frontend-Backend Integration Guide

## Overview
The frontend has been updated to connect directly to the backend API instead of using mock data.

## Changes Made

### 1. API Configuration
- Updated `lib/api.ts` to use real backend endpoints
- Added proper authentication headers
- Implemented error handling for API responses

### 2. Authentication Integration
- Updated `lib/auth.ts` to work with backend JWT tokens
- Modified login flow to use backend authentication endpoints
- Added token refresh functionality

### 3. Error Handling
- Added comprehensive error handling to all API calls
- Implemented automatic redirect to login on 401 errors
- Added user-friendly error messages

## Environment Configuration

Create a `.env.local` file in the frontend root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## Running the System

### 1. Start the Backend
```bash
cd backend
npm install
npm run start:dev
```
The backend will run on `http://localhost:3001`

### 2. Start the Frontend
```bash
cd order-crm-system
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`

## API Endpoints Used

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh access token

### Orders
- `GET /api/orders` - Get orders with pagination and filters
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Products
- `GET /api/products` - Get products with pagination and filters
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/categories` - Get all categories

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Features

- **Real-time Data**: All data now comes from the backend database
- **Authentication**: Full JWT-based authentication with Google OAuth
- **Error Handling**: Comprehensive error handling with user feedback
- **Token Management**: Automatic token refresh and session management
- **Responsive Design**: Maintains the existing UI/UX

## Troubleshooting

1. **CORS Issues**: Make sure the backend is running and CORS is configured
2. **Authentication Errors**: Check that JWT tokens are being stored correctly
3. **API Errors**: Check browser console for detailed error messages
4. **Connection Issues**: Verify the API base URL in environment variables
