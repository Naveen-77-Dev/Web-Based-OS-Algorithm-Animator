# 🧠 OS Algorithm Animator with AI Chat Box

This project is a web-based platform that visually demonstrates Operating System (OS) algorithms such as CPU scheduling, Disk scheduling, and Page replacement, with an integrated AI chatbot to explain the logic behind each algorithm. Users can interactively explore algorithms and get guided responses from the AI.

---

## 💻 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask (Python), JavaScript (for animations)
- **Database**: MySQL (connected via Flask)
- **AI Component**: Chatbot to explain OS concepts

---

## 🚀 Features

- Visual animations for core OS algorithms
- AI-powered chatbot for educational assistance
- User login and secure password management
- Contact form to reach admin
- Clean UI for ease of interaction

---

## 🤖 AI Chatbox (Current Functionality)

The current version of the AI Chatbox can answer:

- Basic Operating System-related questions (e.g., scheduling, memory, deadlocks)
- General computer science concepts
- Simple algorithm explanations

### 🔧 Coming Soon

In future updates, the chatbot will be enhanced with:

- Deeper integration with animations (explain what's happening live)
- Personalized responses based on selected algorithms
- Voice input and output (TTS/STT)
- Memory of previous queries (conversation context)

Stay tuned for upcoming versions!

---

## 📁 Project Structure
os-algorithm-animator-ai-chat/
├── static/
│ ├── css/
│ ├── js/
├── templates/
│ ├── index.html
│ ├── login.html
│ ├── register.html
│ └── ...
├── app.py
├── requirements.txt
└── README.md


---

## ⚙️ Database Configuration

Before running the app, open `app.py` and replace the following lines with your own MySQL credentials:

```python
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'yourpassword'
app.config['MYSQL_DB'] = 'DB_name'

🛠️ Setup Instructions
1. Create and activate a virtual environment

    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
2. Install dependencies

    pip install -r requirements.txt


📦 Required Python Libraries
Your app.py depends on the following Python packages:

flask – Web framework

flask_mysqldb – MySQL integration with Flask

werkzeug – Used for password hashing and security

re – Built-in regex module (no need to install separately)

🗄️ MySQL Database Setup
Create your database and tables using the following SQL:


        CREATE DATABASE IF NOT EXISTS os_ai_chatbox;
        USE os_ai_chatbox;

        CREATE TABLE users (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            mobile VARCHAR(30),
            security_question VARCHAR(300),
            security_answer VARCHAR(300),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE contacts (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            subject VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );



▶️ Run the App
    python app.py

Then open your browser and visit:
    http://127.0.0.1:5000

📬 Contact
    For any questions, feedback, or support, feel free to raise an issue or use the contact form on the website.

🙌 Contributions
    Contributions are welcome! Feel free to fork this repo, enhance it, and submit pull requests.


        Let me know if you'd like me to generate this as a downloadable `README.md` file or help with up
