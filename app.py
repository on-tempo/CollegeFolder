from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///college_folder.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Helper function to get exam reminders
def get_exam_reminders(user_id):
    """Get list of exams happening in the next 3 days"""
    today = datetime.now().date()
    three_days_later = today + timedelta(days=3)
    reminders = []
    
    user = User.query.get(user_id)
    if not user:
        return reminders
    
    for course in user.courses:
        # Check midterm
        if course.midterm_date and today < course.midterm_date <= three_days_later:
            days_until = (course.midterm_date - today).days
            reminders.append({
                'course': course.name,
                'exam_type': 'midterm',
                'date': course.midterm_date,
                'days_until': days_until
            })
        # Check final
        if course.final_date and today < course.final_date <= three_days_later:
            days_until = (course.final_date - today).days
            reminders.append({
                'course': course.name,
                'exam_type': 'final',
                'date': course.final_date,
                'days_until': days_until
            })
    
    return reminders

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    year = db.Column(db.String(50), nullable=False)
    semester = db.Column(db.String(50), nullable=False)
    courses = db.relationship('Course', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    midterm_date = db.Column(db.Date, nullable=True)
    final_date = db.Column(db.Date, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    todos = db.relationship('Todo', backref='course', lazy=True, cascade='all, delete-orphan')

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.String(500), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if user and user.check_password(password):
        session['user_id'] = user.id
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    year = data.get('year')
    semester = data.get('semester')
    courses = data.get('courses', [])
    
    # Check if user exists
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    # Create new user
    user = User(email=email, year=year, semester=semester)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # Get user ID
    
    # Add courses
    for course_data in courses:
        midterm = None
        final = None
        
        if course_data.get('midterm'):
            midterm = datetime.strptime(course_data['midterm'], '%Y-%m-%d').date()
        if course_data.get('final'):
            final = datetime.strptime(course_data['final'], '%Y-%m-%d').date()
        
        course = Course(
            name=course_data['name'],
            midterm_date=midterm,
            final_date=final,
            user_id=user.id
        )
        db.session.add(course)
    
    db.session.commit()
    session['user_id'] = user.id
    
    return jsonify({'success': True})

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    
    user = User.query.get(session['user_id'])
    reminders = get_exam_reminders(session['user_id'])
    return render_template('dashboard.html', user=user, reminders=reminders)

@app.route('/course/<int:course_id>')
def course_detail(course_id):
    if 'user_id' not in session:
        return redirect(url_for('index'))
    
    course = Course.query.get_or_404(course_id)
    
    # Make sure course belongs to logged-in user
    if course.user_id != session['user_id']:
        return redirect(url_for('dashboard'))
    
    reminders = get_exam_reminders(session['user_id'])
    return render_template('course.html', course=course, reminders=reminders)

@app.route('/api/todos/<int:course_id>', methods=['GET'])
def get_todos(course_id):
    if 'user_id' not in session:
        return jsonify({'success': False}), 401
    
    course = Course.query.get_or_404(course_id)
    if course.user_id != session['user_id']:
        return jsonify({'success': False}), 401
    
    todos = [{'id': t.id, 'task': t.task, 'completed': t.completed} for t in course.todos]
    return jsonify({'success': True, 'todos': todos})

@app.route('/api/todos/<int:course_id>', methods=['POST'])
def add_todo(course_id):
    if 'user_id' not in session:
        return jsonify({'success': False}), 401
    
    course = Course.query.get_or_404(course_id)
    if course.user_id != session['user_id']:
        return jsonify({'success': False}), 401
    
    data = request.json
    todo = Todo(task=data['task'], course_id=course_id)
    db.session.add(todo)
    db.session.commit()
    
    return jsonify({'success': True, 'todo': {'id': todo.id, 'task': todo.task, 'completed': todo.completed}})

@app.route('/api/todos/<int:todo_id>/toggle', methods=['PUT'])
def toggle_todo(todo_id):
    if 'user_id' not in session:
        return jsonify({'success': False}), 401
    
    todo = Todo.query.get_or_404(todo_id)
    if todo.course.user_id != session['user_id']:
        return jsonify({'success': False}), 401
    
    todo.completed = not todo.completed
    db.session.commit()
    
    return jsonify({'success': True, 'completed': todo.completed})

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    if 'user_id' not in session:
        return jsonify({'success': False}), 401
    
    todo = Todo.query.get_or_404(todo_id)
    if todo.course.user_id != session['user_id']:
        return jsonify({'success': False}), 401
    
    db.session.delete(todo)
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
