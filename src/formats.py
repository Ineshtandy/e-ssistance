from pydantic import BaseModel, Field

class ResponseFormatter(BaseModel):
    """Structured output for rewriting a query for semantic search over email templates."""
    retrieval_query: str = Field(
        description="The optimized query to retrieve semantically similar email responses."
    )
    retrieval_keywords: str = Field(
        description="Essential keywords (space separated) that capture the core intent of the user query."
    )

class EmailResponse(BaseModel):
    subject: str = Field(description="Subject line of the email")
    body: str = Field(description="Body of the email in plain text")

class ApplicationContentResponse(BaseModel):
    body: str = Field(
        description = "Answer to the query with appropriate keywords matching the profile with the context information, displaying perfect alignment of the profile with context information."
    )