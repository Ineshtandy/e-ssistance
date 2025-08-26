from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import sys
import os, os.path, json
from src.main import generate_email
from src.main import generate_summary

# Add src to path so you can import from it
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

app = Flask(__name__)
CORS(app)

@app.get("/health")
def health():
    return {"ok":True}

@app.route("/", methods=["GET", "POST"])
def email_generator():
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
    
# @app.route("/emsummary", methods=['POST'])
# def email_summary():
#     if request.method == '[POST]':
#         if request.is_json:
#             data = request.get_json()
#             cur_day = data.get('cur_day')
#             start_date = data.get('start_date')
#             end_date = data.get('end_date')

#             email_summaries_list = generate_summary(cur_day,start_date,end_date)
#             res = '\n'.join(email_summaries_list)

#             return jsonify({'summary': res})
        
#         return "Expected JSON", 400

@app.route("/emsummary", methods=['POST'])
def email_summary():
    if not request.is_json:
        return "Expected JSON", 400

    data = request.get_json(silent=True) or {}
    cur_day = data.get('cur_day')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    try:
        email_summaries_list = generate_summary(cur_day, start_date, end_date)
        res = '\n'.join(email_summaries_list)
        return jsonify({'summary': res})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

# # testing for gmail creds path inside docker
# @app.get("/_diag/gmail")
# def gmail_diag():
#     creds_path = os.getenv("GMAIL_CREDENTIALS_PATH", "/gmail_auth/credentials.json")
#     token_path = os.getenv("GMAIL_TOKEN_PATH", "/gmail_auth/token.json")

#     info = {
#         "pwd": os.getcwd(),
#         "creds_path": creds_path,
#         "token_path": token_path,
#         "creds_exists": os.path.isfile(creds_path),
#         "token_exists": os.path.isfile(token_path),
#     }

#     if info["creds_exists"]:
#         info["creds_size"] = os.path.getsize(creds_path)
#         try:
#             c = json.load(open(creds_path))
#             info["creds_kind"] = "installed" if "installed" in c else ("web" if "web" in c else "unknown")
#             # don’t return secrets
#         except Exception as e:
#             info["creds_json_error"] = f"{type(e).__name__}: {e}"

#     if info["token_exists"]:
#         info["token_size"] = os.path.getsize(token_path)
#         try:
#             t = json.load(open(token_path))
#             # minimal sanity without secrets:
#             info["token_has_fields"] = [k for k in ("token", "refresh_token", "client_id", "scopes") if k in t]
#             info["token_scopes"] = t.get("scopes", [])
#         except Exception as e:
#             info["token_json_error"] = f"{type(e).__name__}: {e}"

#     return jsonify(info)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)