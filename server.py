import http.server
import socketserver
import json
import sqlite3
import os
import base64

PORT = 3000
DB_FILE = 'portfolio.db'

# Admin Credentials (for portfolio demonstration)
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'password123'

# Initialize Database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS inquiries
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  email TEXT NOT NULL,
                  subject TEXT NOT NULL,
                  message TEXT NOT NULL,
                  status TEXT DEFAULT 'Active',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="public", **kwargs)

    def do_GET(self):
        if self.path == '/api/admin/inquiries':
            self.handle_admin_inquiries()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/inquiries':
            self.handle_create_inquiry()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_create_inquiry(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data.decode('utf-8'))
            
            name = data.get('name')
            email = data.get('email')
            subject = data.get('subject')
            message = data.get('message')
            
            if not name or not email or not subject or not message:
                self.send_error_response(400, 'Missing required fields')
                return
            
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('''INSERT INTO inquiries (name, email, subject, message) 
                         VALUES (?, ?, ?, ?)''', 
                      (name, email, subject, message))
            conn.commit()
            inquiry_id = c.lastrowid
            conn.close()
            
            self.send_success_response(201, {'inquiry_id': inquiry_id, 'message': 'Inquiry submitted successfully!'})
        except Exception as e:
            self.send_error_response(500, str(e))

    def handle_admin_inquiries(self):
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Basic '):
            self.send_response(401)
            self.send_header('WWW-Authenticate', 'Basic realm="Admin Access"')
            self.end_headers()
            return
            
        encoded_credentials = auth_header.split(' ')[1]
        decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
        username, password = decoded_credentials.split(':', 1)
        
        if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
            self.send_response(401)
            self.send_header('WWW-Authenticate', 'Basic realm="Admin Access"')
            self.end_headers()
            return

        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM inquiries ORDER BY id DESC")
        inquiries = [dict(row) for row in c.fetchall()]
        conn.close()
        
        self.send_success_response(200, inquiries)

    def send_success_response(self, status, data):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error_response(self, status, error_message):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': error_message}).encode('utf-8'))

if __name__ == '__main__':
    init_db()
    
    if not os.path.exists('public'):
        os.makedirs('public')
        
    with socketserver.TCPServer(("", PORT), MyRequestHandler) as httpd:
        print(f"Serving HTTP on 0.0.0.0 port {PORT} (http://localhost:{PORT}/) ...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nKeyboard interrupt received, exiting.")
            httpd.server_close()
