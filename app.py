

from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
import re

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = '162577'

# Configure cache control for static files
@app.after_request
def add_header(response):
    if 'static' in request.path and app.debug:
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
    return response

# MySQL configurations
app.config['MYSQL_HOST'] = 'yourhostname'  # Replace with your MySQL host
app.config['MYSQL_USER'] = 'username'  # Replace with your MySQL username
app.config['MYSQL_PASSWORD'] = 'yourpassword'  # Replace with your MySQL password
app.config['MYSQL_DB'] = 'yourdatabase'  # Replace with your MySQL database name

mysql = MySQL(app)

# Route to handle root URL
@app.route('/')
def root():
    if 'logged_in' not in session:
        return redirect(url_for('index'))
    return redirect(url_for('home'))

# Main page routes
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    first_letter = session.get('name', '')[0].upper() if session.get('name') else ''
    return render_template('home.html', first_letter=first_letter)

@app.route('/cpu')
def cpu():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    first_letter = session.get('name', '')[0].upper() if session.get('name') else ''
    return render_template('cpu.html', first_letter=first_letter)

@app.route('/page')
def page():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    first_letter = session.get('name', '')[0].upper() if session.get('name') else ''
    return render_template('page.html', first_letter=first_letter)

@app.route('/disk')
def disk():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    first_letter = session.get('name', '')[0].upper() if session.get('name') else ''
    return render_template('disk.html', first_letter=first_letter)

@app.route('/contactbl')
def contactbl():
    return render_template('contactbl.html')

@app.route('/contactal')
def contactal():
    if 'logged_in' not in session:
        return redirect(url_for('contactbl'))
    first_letter = session.get('name', '')[0].upper() if session.get('name') else ''
    return render_template('contactal.html', first_letter=first_letter)

@app.route('/check_auth')
def check_auth():
    return jsonify({'isLoggedIn': 'logged_in' in session})

@app.route('/logout', methods=['POST'])
def logout_api():
    session.clear()
    return jsonify({'success': True})

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        
        if user and check_password_hash(user[3], password):
            session['logged_in'] = True
            session['user_id'] = user[0]
            session['email'] = user[2]
            session['name'] = user[1]
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm-password']
        
        if password != confirm_password:
            flash('Passwords do not match!', 'danger')
            return redirect(url_for('register'))
        
        if not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            flash('Invalid email address!', 'danger')
            return redirect(url_for('register'))
        
        hashed_password = generate_password_hash(password)
        
        try:
            cur = mysql.connection.cursor()
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            existing_user = cur.fetchone()
            
            if existing_user:
                flash('Email already registered!', 'danger')
                return redirect(url_for('register'))
            
            cur.execute(
                "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
                (name, email, hashed_password)
            )
            mysql.connection.commit()
            cur.close()
            
            session['email'] = email
            session['name'] = name
            flash('Account Created! Please complete your profile.', 'success')
            return redirect(url_for('newdetails'))
            
        except Exception as e:
            mysql.connection.rollback()
            flash(f'Error: {str(e)}', 'danger')
    
    return render_template('register.html')

@app.route('/newdetails', methods=['GET', 'POST'])
def newdetails():
    if 'email' not in session:
        return redirect(url_for('register'))
    
    if request.method == 'POST':
        mobile = request.form['mobile']
        security_question = request.form['security_question']
        security_answer = request.form['security_answer']
        
        try:
            cur = mysql.connection.cursor()
            cur.execute(
                "UPDATE users SET mobile = %s, security_question = %s, security_answer = %s WHERE email = %s",
                (mobile, security_question, security_answer, session['email'])
            )
            mysql.connection.commit()
            cur.close()
            
            flash('Registered successfully! Please Login', 'success')
            return redirect(url_for('login'))
            
        except Exception as e:
            mysql.connection.rollback()
            flash(f'Error: {str(e)}', 'danger')
    
    return render_template('newdetails.html')

@app.route('/profile')
def profile():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (session['user_id'],))
    user = cur.fetchone()
    cur.close()
    
    if not user:
        flash('User not found', 'danger')
        return redirect(url_for('login'))
    first_letter = session.get('name', '')[0].upper() if session.get('name') else ''
    
    return render_template('profile.html', user=user, first_letter=first_letter)

@app.route('/reset', methods=['GET', 'POST'])
def reset():
    if request.method == 'POST':
        try:
            data = request.get_json() if request.is_json else request.form
            email = data.get('email')
            security_question = data.get('security_question')
            security_answer = data.get('security_answer')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')

            cur = mysql.connection.cursor()

            # Verification phase
            if not new_password:
                # Check if email exists
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = cur.fetchone()
                
                if not user:
                    return jsonify({'success': False, 'message': 'No account found with this email'}), 404
                
                # Verify security question/answer
                if user[5] != security_question or user[6] != security_answer:
                    return jsonify({'success': False, 'message': 'Security answer is wrong'}), 401
                
                # Store verification in session
                session['reset_email'] = email
                session['reset_verified'] = True
                return jsonify({'success': True, 'message': 'Verification successful'})

            # Password reset phase
            if new_password != confirm_password:
                return jsonify({'success': False, 'message': 'Passwords do not match'}), 400

            if len(new_password) < 8:
                return jsonify({'success': False, 'message': 'Password must be at least 8 characters'}), 400

            hashed_password = generate_password_hash(new_password)
            cur.execute(
                "UPDATE users SET password = %s WHERE email = %s",
                (hashed_password, session.get('reset_email'))
            )
            mysql.connection.commit()
            
            # Clear session
            session.pop('reset_email', None)
            session.pop('reset_verified', None)
            
            return jsonify({'success': True, 'message': 'Password reset successfully!'})

        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'success': False, 'message': str(e)}), 500
        finally:
            cur.close()

    return render_template('reset.html')



@app.route('/get_user_data')
def get_user_data():
    if 'logged_in' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT name, email, mobile, created_at FROM users WHERE id = %s", (session['user_id'],))
        user = cur.fetchone()
        cur.close()
        
        if user:
            return jsonify({
                'name': user[0],
                'email': user[1],
                'mobile': user[2] if user[2] else 'Not provided',
                'created_at': user[3].strftime('%Y-%m-%d') if user[3] else None
            })
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('root'))

# Redirects for .html URLs
@app.route('/<page>.html')
def html_redirect(page):
    if page in ['index', 'home', 'cpu', 'page', 'disk', 'contactbl', 'contactal', 'login', 'register', 'profile', 'reset']:
        return redirect(url_for(page))
    abort(404)

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data received'}), 400

        required_fields = ['name', 'email', 'subject', 'message']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'error': 'All fields are required'}), 400

        user_id = session.get('user_id') if 'logged_in' in session else None

        cur = mysql.connection.cursor()
        
        if user_id:
            cur.execute("""
                SELECT COUNT(*) FROM contacts 
                WHERE user_id = %s AND email = %s AND subject = %s 
                AND created_at > NOW() - INTERVAL 5 MINUTE
            """, (user_id, data['email'], data['subject']))
        else:
            cur.execute("""
                SELECT COUNT(*) FROM contacts 
                WHERE email = %s AND subject = %s 
                AND created_at > NOW() - INTERVAL 5 MINUTE
            """, (data['email'], data['subject']))
            
        duplicate_count = cur.fetchone()[0]
        if duplicate_count > 0:
            return jsonify({
                'success': False, 
                'error': 'Similar message was recently submitted. Please wait before submitting again.'
            }), 429

        cur.execute(
            "INSERT INTO contacts (user_id, name, email, subject, message) VALUES (%s, %s, %s, %s, %s)",
            (user_id, data['name'], data['email'], data['subject'], data['message'])
        )
        mysql.connection.commit()
        cur.close()
        
        return jsonify({
            'success': True, 
            'message': 'Your message has been sent successfully!'
        })
        
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/static/<path:filename>')
def static_files(filename):
    return app.send_static_file(filename)

@app.route('/profile/update', methods=['POST'])
def update_profile():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    try:
        name = request.form['name']
        mobile = request.form['mobile']
        current_password = request.form.get('current_password', '')
        new_password = request.form.get('new_password', '')
        
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (session['user_id'],))
        user = cur.fetchone()
        
        if not user:
            flash('User not found', 'danger')
            return redirect(url_for('profile'))
        
        if current_password and new_password:
            if not check_password_hash(user[3], current_password):
                flash('Current password is incorrect', 'danger')
                return redirect(url_for('profile'))
            
            hashed_password = generate_password_hash(new_password)
            cur.execute(
                "UPDATE users SET name = %s, mobile = %s, password = %s WHERE id = %s",
                (name, mobile, hashed_password, session['user_id'])
            )
            flash('Profile and password updated successfully!', 'success')
        else:
            cur.execute(
                "UPDATE users SET name = %s, mobile = %s WHERE id = %s",
                (name, mobile, session['user_id'])
            )
            flash('Profile updated successfully!', 'success')
        
        mysql.connection.commit()
        cur.close()
        session['name'] = name
        
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Error updating profile: {str(e)}', 'danger')
    
    return redirect(url_for('profile'))

@app.route('/check_password', methods=['POST'])
def check_password():
    if 'logged_in' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.get_json()
    current_password = data.get('current_password', '')
    
    cur = mysql.connection.cursor()
    cur.execute("SELECT password FROM users WHERE id = %s", (session['user_id'],))
    user = cur.fetchone()
    cur.close()
    
    if user and check_password_hash(user[0], current_password):
        return jsonify({'valid': True})
    return jsonify({'valid': False})

if __name__ == '__main__':
    app.run(debug=True)