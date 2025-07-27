import weaviate
from src.formats import EmailResponse
from src.config import EMBEDDING_MODEL
from langchain.schema import Document
from langchain.prompts import ChatPromptTemplate
# from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_weaviate.vectorstores import WeaviateVectorStore

class RAG:
    def __init__(self,model):
        self.writer = model.with_structured_output(EmailResponse)
        embedder = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        _client = weaviate.connect_to_local()
        # for fist time creation use:
        """
        vectorstore = WeaviateVectorStore.from_documents(
            documents=email_documents,  # email_documents is a list of templates in Document objects
            client=client,
            index_name='EmailTemplates',
            text_key='content',
            embedding=embedder,
            by_text=False
        )
        """
        self.vectorstore = WeaviateVectorStore(
            client=_client,
            index_name='EmailTemplates',
            text_key='content',
            embedding=embedder
        )
        self.rag_prompt = ChatPromptTemplate.from_template("""
            You are a helpful email assistant. Use the retrieved email templates below to help the user craft a response.

            - Purpose: {purpose}
            - Intent: {intent}
            - Style: {style}

            Original Email:
            {email_content}

            User Request:
            {user_query}

            Relevant Examples:
            {context}

            Based on the above, write a clear, well-structured email. Do not copy the templates verbatim. Tailor the tone and content appropriately.
            """)
        
    def retrieve(self,rewritten_user_query, num_docs, threshold=0.7):
        retriever = self.vectorstore.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={"k": num_docs, "score_threshold": threshold}
        )
        retrieved_templates = retriever.invoke(rewritten_user_query.retrieval_query)
        retrieved_context = "\n\n".join([f'SUBJECT: {template.metadata['subject']} {template.page_content}\n\n' for template in retrieved_templates])
        return retrieved_context

    def write(self, retrieved_context,email,user_query,purpose,intent,style='professional'):
        messages = self.rag_prompt.invoke({
            "context": retrieved_context,
            "email_content": email,
            "user_query": user_query,
            "purpose": purpose,
            "intent": intent,
            "style": style
        }).to_messages()
        
        llm_final_output = self.writer.invoke(messages)
        self.updatedb(llm_final_output)
        return llm_final_output

    def updatedb(self,llm_output):
        # add a similarity check to avoid insertion of duplicates
        # add PII removal feature before db update
        new_template = Document(
            page_content=llm_output.body,
            metadata={
                "subject":llm_output.subject
            }
        )

        self.vectorstore.add_documents([new_template])