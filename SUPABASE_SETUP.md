# Supabase Authentication Setup

This application uses Supabase for user authentication. Follow these steps to set up authentication:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be set up

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key

## 3. Configure Environment Variables

1. Create a `.env` file in the root directory of your project
2. Add the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Replace the placeholder values with your actual Supabase credentials.

## 4. Configure Authentication Settings

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: Set to your application URL (e.g., `http://localhost:5173` for development)
   - **Redirect URLs**: Add your application URLs
   - **Email Templates**: Customize if needed

## 5. Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Configure email settings as needed

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to your application
3. Try signing up with a new account
4. Check your email for verification
5. Sign in with your credentials

## Troubleshooting

- **Environment variables not loading**: Make sure your `.env` file is in the root directory and you've restarted your development server
- **Authentication errors**: Check your Supabase project settings and make sure the URL and key are correct
- **Email not sending**: Verify your Supabase project email settings and check spam folders

## Security Notes

- Never commit your `.env` file to version control
- The `VITE_SUPABASE_ANON_KEY` is safe to expose in the frontend as it's designed for public use 