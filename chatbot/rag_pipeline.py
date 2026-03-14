import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

load_dotenv()

VECTOR_DB_DIR = "vector_db"
_vectorstore  = None


def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        print("Loading vector database (first request)...")
        embeddings = HuggingFaceEmbeddings(
            model_name    = "all-MiniLM-L6-v2",
            model_kwargs  = {"device": "cpu"},
            encode_kwargs = {"normalize_embeddings": True}
        )
        _vectorstore = FAISS.load_local(
            VECTOR_DB_DIR,
            embeddings,
            allow_dangerous_deserialization=True
        )
        print("Vector database loaded.")
    return _vectorstore


def retrieve_context(query: str, prediction_context: dict = None, k: int = 4) -> tuple[str, list[str]]:
    vectorstore = get_vectorstore()

    enriched_query = query

    if prediction_context:
        feature = prediction_context.get("feature", "")

        if feature == "disease_detection":
            disease        = prediction_context.get("disease", "")
            enriched_query = f"{disease} disease treatment symptoms causes {query}"

        elif feature == "crop_recommendation":
            crop           = prediction_context.get("crop", "")
            enriched_query = f"{crop} crop cultivation soil water requirements {query}"

        elif feature == "yield_prediction":
            crop           = prediction_context.get("crop", "")
            season         = prediction_context.get("season", "")
            enriched_query = f"{crop} {season} yield improvement farming practices {query}"

        elif feature == "soil_health":
            fertilizer     = prediction_context.get("fertilizer", "")
            enriched_query = f"{fertilizer} fertilizer application soil health {query}"

    docs = vectorstore.similarity_search(enriched_query, k=k)

    context_parts = []
    sources       = []

    for doc in docs:
        context_parts.append(doc.page_content)
        source = doc.metadata.get("source", "knowledge base")
        if source not in sources:
            sources.append(source)

    return "\n\n---\n\n".join(context_parts), sources