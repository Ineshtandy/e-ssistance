# E-ssistance 🧑🏻‍💻 📬

## Project Overview

**e-ssistance** is a productivity tool designed to simplify two common everyday tasks: writing/replying to emails and checking emails, all integrated into a user-friendly web extension. The project was developed to address personal recurring challenges in email management, aiming to save time and enhance efficiency.

** NEW FEATURE ADDED: Get personalized e-ssistance when applying for jobs!

### Key Features

1. **Personalized Application Helper** 📝✨  
	- Upload your **resume (PDF or image format)** and pair it with a job description or company information.  
	- Ask any **application-related query** (e.g., “Draft a cover letter for this role” or “How can I highlight my skills for this position?”).  
	- The system links your user profile with the provided context and generates precise, tailored responses.  
	- Saves significant time and effort in preparing application materials by ensuring alignment between your background and the opportunity.  

2. **AI-Powered Email Generation**
	- Compose or reply to emails with the desired tone, intent, and style.
	- Utilizes a backend server built with Flask, leveraging LangChain and Retrieval-Augmented Generation (RAG) for user-context-aware responses.
	- Seamlessly integrates with the browser via a web extension for quick access.

3. **Efficient Email Retrieval**
	- Instantly fetch emails from your Gmail account for any desired date range without visiting the email website.
	- Saves time by providing direct access to your inbox through the extension interface.

## Product View

| **Welcome Index** | **Email Generator** | **Email Summarizer** | **Application Helper** |
|-------------------|---------------------|-----------------------| -------------------------|
<img width="291" height="166" alt="Screenshot 2025-08-26 at 1 51 00 AM" src="https://github.com/user-attachments/assets/59f73927-9198-4fda-a55b-609a13f68e6a" /> | <img width="283" height="706" alt="Screenshot 2025-08-26 at 1 51 25 AM" src="https://github.com/user-attachments/assets/b585f923-4ed4-40f7-993f-29b783773867" /> | <img width="280" height="470" alt="Screenshot 2025-08-26 at 1 51 36 AM" src="https://github.com/user-attachments/assets/abcea5a2-5282-49c7-afa8-cf9ea947733f" />

## Architecture

- **Web Extension**: Provides the user interface for both email generation and retrieval.
- **Backend Server**: Flask-based API that handles email generation using AI and processes email retrieval requests.
- **LangChain with RAG**: Enhances email generation by building user context for more relevant and personalized responses.
- **Gmail API**: For personal email access and retrieval

## Setup Instructions

### 1. Email Generation (AI Email Writer)

1. **Clone the repository:**
	```bash
	git clone https://github.com/Ineshtandy/e-ssistance.git
	cd e-ssistance
	```
2. **Create a `.env` file:**
	- Add your Gemini API key in the `.env` file as follows:
	  ```env
	  GEMINI_API_KEY=your_gemini_api_key_here
	  ```
3. **Open chrome://extensions/**
    - Enable developer mode and click ```load unpacked``` to upload ```ext_explr/extension``` folder

### 2. Email Access (Gmail Integration)

1. **Obtain Google OAuth Credentials:**
	- Register a project in the [Google Cloud Console](https://console.cloud.google.com/).
	- Enable the Gmail API and create OAuth 2.0 credentials.
	- Download the `credentials.json` file.
2. **Generate `token.json`:**
	- Run the provided sample script (see `src/email_retriever.py` or relevant script) to authenticate and generate `token.json`.
3. **Place Credentials:**
	- Move both `credentials.json` and `token.json` into the `src/gmail_auth/` directory.

## Usage

1. **Start the Backend Server:**
	- Use Docker Compose or run the Flask app directly to start the backend server.
2. **Install the Web Extension:**
	- Load the extension from the `ext_explr/extension/` directory in your browser's extension settings (Developer Mode).
3. **Interact via the Extension:**
	- Use the extension to generate emails or retrieve emails for a specific date range.

## Technologies Used

- Python (Flask, LangChain)
- Gemini API
- JavaScript, HTML, CSS (Web Extension)
- Docker

## License

This project is for personal use and learning purposes.
