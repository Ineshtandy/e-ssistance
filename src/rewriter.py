from dotenv import load_dotenv
from src.formats import ResponseFormatter
from langchain.schema import SystemMessage, HumanMessage
load_dotenv()

class Rewriter:
    def __init__(self,model):
        self.formatter = model.with_structured_output(ResponseFormatter)

    def rewrite(self,email_content: str, user_query: str, purpose: str, intent: str, style: str = 'professional') -> ResponseFormatter:
        messages = [
            SystemMessage(content=(
                "You are a professional email assistant. You will be given:\n"
                "- `email_content`: the original email text\n"
                "- `user_query`: what the user wants to write\n"
                "- `purpose`: whether the user is writing a new email or replying\n"
                "- `intent`: the goal of the email (e.g. requesting, thanking, informing, etc.)\n\n"
                f"Use this context to reformulate the user query into a **retrieval query** that captures the user's intent "
                f"and tone, optimized for semantic similarity search over email response templates.\n"
                f"The tone should match the style: {style}.\n\n"
                "Return:\n"
                "- `retrieval_query`: one concise natural language sentence\n"
                "- `retrieval_keywords`: a space-separated list of keywords"
            )),
            HumanMessage(content=f"Email Content:\n{email_content}"),
            HumanMessage(content=f"User Query:\n{user_query}"),
            HumanMessage(content=f"Purpose: {purpose}"),
            HumanMessage(content=f"Intent: {intent}")
        ]

        response = self.formatter.invoke(messages)
        return response