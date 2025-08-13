from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import sys, os
from src.main import generate_email

# Add src to path so you can import from it
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

app = Flask(__name__)
CORS(app)

# @app.route("/generate", methods=["GET", "POST"])
# def index():
#     subject = "sample subject"
#     body = "sample body"
#     if request.method == "POST":
#         user_query = request.form["user_query"]
#         purpose = request.form["purpose"]
#         intent = request.form["intent"]
#         style = request.form["style"]
#         email_content = ""

#         # print("📥 User Input Received:")
#         # print("Query  :", user_query)
#         # print("Purpose:", purpose)
#         # print("Intent :", intent)
#         # print("Style  :", style)

#         subject, body = generate_email(email_content,user_query,purpose,intent,style)
#         print(subject,body)

#     return render_template("index.html", subject=subject, body=body)
#     return f"SUBJECT: {subject}\nBODY: {body}"

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Check if it's a JSON request (from extension)
        if request.is_json:
            data = request.get_json()
            email_content = data.get("email_content")
            user_query = data.get("query")
            purpose = data.get("purpose", "writing")
            intent = data.get("intent", "thanking")
            style = data.get("style", "professional")
            email_content = ""

            subject, body = generate_email(email_content, user_query, purpose, intent, style)
            print(subject,body)
            return jsonify({ "subject": subject, "body": body })
        
        # Otherwise render HTML for browser (if needed)
        return "Expected JSON", 400

if __name__ == "__main__":
    app.run(debug=True)