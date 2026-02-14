# College Folder - Python Flask Application

A functional web application with real database storage for managing college courses and to-do lists.

## Features
✅ **Real user authentication** with password hashing
✅ **SQLite database** - stores all data permanently
✅ **User accounts** - each user has their own data
✅ **Course management** - add courses with exam dates
✅ **To-do lists** - separate task lists for each course
✅ **Session management** - stay logged in

## Where Data is Stored

All user data is stored in a **SQLite database file** (`college_folder.db`) which will be created automatically when you run the app. This includes:
- User accounts (email, password hash, year, semester)
- Courses (name, midterm date, final date)
- To-do tasks (task name, completed status)

**The data persists permanently** - even if you restart the server or computer!

## Project Structure

```
college-folder-app/
├── app.py                  # Main Flask application (backend)
├── requirements.txt        # Python dependencies
├── college_folder.db       # Database (created automatically)
├── templates/
│   ├── login.html         # Login/signup page
│   ├── dashboard.html     # Course selection page
│   └── course.html        # To-do list page
└── static/
    └── style.css          # Stylesheet
```

## Installation & Setup

### Step 1: Install Python
Make sure you have Python 3.8+ installed:
```bash
python --version
```

### Step 2: Install Dependencies
Open terminal/command prompt in the project folder and run:
```bash
pip install -r requirements.txt
```

Or install individually:
```bash
pip install Flask Flask-SQLAlchemy Werkzeug
```

### Step 3: Run the Application
```bash
python app.py
```

You should see:
```
* Running on http://127.0.0.1:5000
```

### Step 4: Open in Browser
Go to: **http://localhost:5000**

## How to Use

1. **First Time Setup:**
   - Click "New User? Set Up Account"
   - Enter email and password
   - Select year and semester
   - Add your courses with exam dates
   - Click "Create Account"

2. **View Your Courses:**
   - You'll see all your courses as cards
   - Each card shows number of tasks and exam dates

3. **Manage To-Do Lists:**
   - Click any course card
   - Add tasks for that course
   - Check off completed tasks
   - Delete tasks when done

4. **Logout/Login:**
   - Click logout to sign out
   - Your data is saved - log back in anytime!

## Deploying to GitHub

### Option 1: Just Store the Code on GitHub
```bash
cd college-folder-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/college-folder.git
git push -u origin main
```

### Option 2: Deploy Online (Make it Accessible on the Internet)

To make your app accessible online, you'll need to deploy it to a hosting service. Here are the easiest options:

#### A) Deploy to Render (Free, Easiest)
1. Push your code to GitHub (see Option 1 above)
2. Go to [render.com](https://render.com) and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Settings:
   - **Name:** college-folder
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
6. Click "Create Web Service"
7. Your app will be live at: `https://college-folder.onrender.com`

**Important:** Add this to requirements.txt:
```
gunicorn==21.2.0
```

#### B) Deploy to PythonAnywhere (Free, Easy)
1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Go to "Web" → "Add a new web app"
3. Choose "Flask" and Python 3.10
4. Upload your files using the "Files" tab
5. Your app will be live at: `https://yourusername.pythonanywhere.com`

#### C) Deploy to Heroku
Similar to Render but requires a credit card (still free tier available)

## Database Backup

To backup your data:
```bash
# The database file is: college_folder.db
# Simply copy this file to save all your data
cp college_folder.db college_folder_backup.db
```

## Customizing

### Change Colors
Edit `static/style.css`:
- Line 17: `background: #f5f5f5;` - Page background
- Line 30: `background: #4a5568;` - Header/buttons/cards color

### Change App Name
Edit templates and change "College Folder" to your preferred name

### Add More Features
Edit `app.py` to add new routes and database models

## Troubleshooting

**Error: "Address already in use"**
- Another app is using port 5000
- Solution: `python app.py` will automatically try port 5001

**Error: "Module not found"**
- You didn't install dependencies
- Solution: `pip install -r requirements.txt`

**Can't log in after creating account**
- Check if database file exists: `college_folder.db`
- Try deleting it and creating a new account

**Want to reset everything**
- Delete `college_folder.db` file
- Restart the app
- Fresh start!

## Security Notes

⚠️ **Important for Production:**
1. Change `SECRET_KEY` in `app.py` to something random and secure
2. Use PostgreSQL instead of SQLite for production
3. Add email verification for signups
4. Enable HTTPS
5. Add rate limiting for login attempts

## Why This is Better Than the HTML-Only Version

| Feature | HTML Only | Flask App |
|---------|-----------|-----------|
| **Data Storage** | Browser only (localStorage) | Real database |
| **Multi-device** | ❌ No | ✅ Yes |
| **Data Backup** | ❌ No | ✅ Yes |
| **Multiple Users** | ❌ No | ✅ Yes |
| **Production Ready** | ❌ No | ✅ Yes |
| **Deploy Online** | Limited | ✅ Full support |

## Need Help?

If you run into issues, check:
1. Python version (must be 3.8+)
2. All dependencies installed
3. Running from correct directory
4. Port 5000 is available
