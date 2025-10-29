# Deployment Instructions for HealthSync+

## Frontend Deployment
1. **Build the React App**
   ```bash
   cd frontend
   npm run build
   ```
   This will create a `build` folder with the production-ready files.

2. **Deploy to Vercel**
   - Install the Vercel CLI if not already installed:
     ```bash
     npm install -g vercel
     ```
   - Deploy the app:
     ```bash
     vercel --prod
     ```

3. **Configure Environment Variables**
   - Add Firebase configuration and API keys in the Vercel dashboard under Environment Variables.

## Backend Deployment
1. **Prepare the Backend**
   - Ensure all dependencies are installed:
     ```bash
     cd backend
     npm install
     ```

2. **Deploy to Render**
   - Create a new web service on [Render](https://render.com/).
   - Connect your GitHub repository.
   - Set the root directory to `backend`.
   - Add environment variables for database connection, email credentials, and API keys.

3. **Start the Server**
   - Use the following start command:
     ```bash
     node server.js
     ```

## Database Setup
1. **MongoDB Atlas**
   - Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Whitelist your IP address.
   - Create a database user and note the credentials.
   - Update the connection string in the backend `.env` file.

## Final Steps
- Test the application thoroughly in the production environment.
- Monitor logs and performance metrics on Vercel and Render dashboards.
- Set up alerts for any errors or downtime.

---
**HealthSync+ Deployment Complete!**