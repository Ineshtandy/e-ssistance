from langchain_google_genai import ChatGoogleGenerativeAI
from src.rewriter import Rewriter
from src.rag import RAG
from src.config import GEMINI_MODEL

# function formation makes main.py callable from app.py
def generate_email(email_content,user_query,purpose,intent,style):
    llm = ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )

    # Example email content and user query for writing a new email
    # email_content = ""  # Empty since we're writing a new email, not replying
    # user_query = "write an email to thank my manager for the opportunity to work on the new project"
    # purpose = "writing"
    # intent = "thanking"
    # style = "professional"

    # Initialize Rewriter and RAG
    rewriter = Rewriter(llm)
    rag = RAG(llm)

    # Step 1: Rewrite the user query for retrieval
    rewritten_query = rewriter.rewrite(email_content, user_query, purpose, intent, style)
    # print("Rewritten Query:", rewritten_query)

    # Step 2: Retrieve relevant templates from the vectorstore
    retrieved_context = rag.retrieve(rewritten_query, num_docs=3)
    # print("Retrieved Context:", retrieved_context)

    # Step 3: Generate the final email using RAG
    final_output = rag.write(retrieved_context, email_content, user_query, purpose, intent, style)
    # print("Subject:", final_output.subject)
    # print("Body:", final_output.body)

    return final_output.subject, final_output.body