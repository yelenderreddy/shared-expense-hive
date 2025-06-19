# Deployment Guide for Netlify

## Prerequisites
- Your Supabase project is set up and running
- Your database schema is created and RLS policies are configured
- Your application is working locally

## Step 1: Build the Application

```bash
npm run build
```

This will create a `dist` folder with your production build.

## Step 2: Deploy to Netlify

### Option A: Drag and Drop (Quick)
1. Go to [Netlify](https://netlify.com)
2. Sign up/Login
3. Drag and drop your `dist` folder to the Netlify dashboard
4. Your site will be deployed automatically

### Option B: Git Integration (Recommended)
1. Push your code to GitHub/GitLab
2. Connect your repository to Netlify
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy

## Step 3: Configure Environment Variables in Netlify

After deployment, you need to add your Supabase environment variables:

1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:

```
VITE_SUPABASE_URL=https://dxkrszxpfvbhasnpyezo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4a3JzenhwZnZiaGFzbnB5ZXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMjk1NjYsImV4cCI6MjA2NTgwNTU2Nn0.jwyYdLm4RbQdUqMTGJPrfMHZCK_Vf87KcQfkkXd8XkI
```

## Step 4: Configure Supabase for Production

### 1. Update Supabase Auth Settings
1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Netlify domain to **Site URL**:
   - `https://your-app-name.netlify.app`
4. Add your Netlify domain to **Redirect URLs**:
   - `https://your-app-name.netlify.app/**`
   - `https://your-app-name.netlify.app/signin`
   - `https://your-app-name.netlify.app/signup`

### 2. Verify RLS Policies
Make sure your Row Level Security policies are properly configured:
- Run the `fix_rls_final.sql` script in your Supabase SQL editor
- Test that authenticated users can create/access their trips

## Step 5: Test Your Deployment

1. Visit your Netlify URL
2. Test user registration and login
3. Test creating a new trip
4. Test adding expenses and managing the trip
5. Verify all functionality works as expected

## Troubleshooting

### Common Issues:

1. **Authentication not working**
   - Check that your Netlify domain is added to Supabase Auth settings
   - Verify environment variables are set correctly

2. **Database errors**
   - Ensure RLS policies are configured properly
   - Check that the database schema is created

3. **Build errors**
   - Make sure all dependencies are in `package.json`
   - Check that the build command is correct

### Environment Variables Check:
Your app will work even without environment variables because of the fallback values, but it's recommended to set them properly for production.

## Security Notes

- The Supabase anon key is safe to expose in the frontend
- Never expose your Supabase service role key
- RLS policies ensure data security at the database level
- Environment variables are encrypted in Netlify

## Performance Optimization

- Your app is already optimized with Vite
- Netlify provides CDN and caching automatically
- Consider enabling Netlify's image optimization if you add images later

## Monitoring

- Use Netlify's built-in analytics
- Monitor Supabase dashboard for database performance
- Set up error tracking if needed

Your app should now be fully functional on Netlify! 🚀 