from langchain.schema import Document
from langchain.prompts import ChatPromptTemplate
from src.formats import ApplicationContentResponse

class AppHelper:
    def __init__(self,model):
        self.writer = model.with_structured_output(ApplicationContentResponse)

        self.instruction_prompt = ChatPromptTemplate.from_messages([
            ("system", 
            "You write concise, ATS-aware application answers that align a resume to a job/company context.\n"
            "Rules:\n"
            "1) Use only evidence in the resume/context; never invent.\n"
            "2) Lead with the strongest, most relevant proof and quantified results.\n"
            "3) Mirror high-signal keywords from the context when truthful.\n"
            "4) Prefer a tight paragraph unless the question demands otherwise.\n"),
            ("system", "Resume:\n{resume}\n\nJob/Company Context:\n{context}"),
            ("human", "Application Question:\n{user_question}\n\n"
                    "Produce the best possible answer aligned to the context, without fabricating any details.")
        ])

    def write(self,resume_content,context_info,user_query):
        messages = self.instruction_prompt.invoke({
            "resume":resume_content,
            "context":context_info,
            "user_question":user_query
        }).to_messages()

        llm_final_output = self.writer.invoke(messages)
        return llm_final_output