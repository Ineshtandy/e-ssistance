import os.path
import json
import base64
from datetime import datetime, date, timedelta
import email
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def convert_date_pattern(s: str) -> str:
    # input 'YYYY-MM-DD' -> 'YYYY/MM/DD'
    return s.replace('-', '/')
    
def get_message_basic(service, msg_id: str):
    """
    Fetch basic metadata using 'metadata' format (faster than 'raw').
    Also captures internalDate (epoch ms when Gmail received it).
    """
    msg = (
        service.users()
        .messages()
        .get(userId="me", id=msg_id, format="metadata", metadataHeaders=["From", "Subject", "Date"])
        .execute()
    )
    headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
    return {
        "id": msg_id,
        "from": headers.get("From", ""),
        "subject": headers.get("Subject", ""),
        "date_header": headers.get("Date", ""),
        "snippet": msg.get("snippet", "")
    }

def _require_file(path, label):
    if not os.path.isfile(path):
        raise FileNotFoundError(f"{label} missing or not a file at {path}")

def _build_gmail_service():
    creds_path = os.getenv("GMAIL_CREDENTIALS_PATH", "/gmail_auth/credentials.json")
    token_path = os.getenv("GMAIL_TOKEN_PATH", "/gmail_auth/token.json")
    _require_file(creds_path, "credentials.json")
    _require_file(token_path, "token.json")

    creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_path, "w") as token:
                token.write(creds.to_json())
        else:
            raise RuntimeError(
                "Invalid or missing Gmail token. Generate token.json on your host "
                "with the same credentials.json and mount it into the container."
            )

    return build("gmail", "v1", credentials=creds)


def get_email_info(cur_day = True, start_date = "", end_date = ""):
  """Shows basic usage of the Gmail API.
  Lists the user's Gmail labels.
  """
  # FOR INITIAL SETUP TO GET TOKEN.JSON AND 
  # CREDENTIALS.JSON (COME FROM OAUTH SETUP)
  # creds = None
  # # The file token.json stores the user's access and refresh tokens, and is
  # # created automatically when the authorization flow completes for the first
  # # time.
  # if os.path.exists("token.json"):
  #   creds = Credentials.from_authorized_user_file("token.json", SCOPES)
  # # If there are no (valid) credentials available, let the user log in.
  # if not creds or not creds.valid:
  #   if creds and creds.expired and creds.refresh_token:
  #     creds.refresh(Request())
  #   else:
  #     flow = InstalledAppFlow.from_client_secrets_file(
  #         "credentials.json", SCOPES
  #     )
  #     creds = flow.run_local_server(port=0)
  #   # Save the credentials for the next run
  #   with open("token.json", "w") as token:
  #     token.write(creds.to_json())

  try:
    # Call the Gmail API
    # service = build("gmail", "v1", credentials=creds)
    service = _build_gmail_service()
    # results = service.users().labels().list(userId="me").execute()
    # results = service.users().messages().list(userId="me", labelIds=["INBOX"]).execute()

    # start_date, end_date = convert_date_pattern(start_date), convert_date_pattern(end_date)
    # query = ""
    # if cur_day is False:
    #   query = " ".join([f"after:{start_date}", f"before:{end_date}"])
    # else:
    #   today = date.today()
    #   tomorrow = today + timedelta(days=1)
    #   today = today.strftime("%Y/%m/%d")
    #   tomorrow = tomorrow.strftime("%Y/%m/%d")
    #   start_date,end_date = today, tomorrow

    start_dt,end_dt = "",""

    if not cur_day:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt   = datetime.strptime(end_date, "%Y-%m-%d").date() + timedelta(days=1)  # make before: exclusive
    else:
        start_dt = date.today()
        end_dt   = start_dt + timedelta(days=1)

    q_start = start_dt.strftime("%Y/%m/%d")
    q_end = end_dt.strftime("%Y/%m/%d")
    query = f"after:{q_start} before:{q_end}"

    resp = service.users().messages().list(
                userId="me",
                q=query,
            ).execute()
    
    ids = [m['id'] for m in resp.get('messages',[])]

    rows = [get_message_basic(service, mid) for mid in ids]

    res = [f"{r['from']} | {r['subject']}" for r in rows]
    return res

  except HttpError as error:
    return [f"An error occurred: {error}"]


if __name__ == "__main__":
  get_email_info(False,'2025/08/22','2025/08/23')