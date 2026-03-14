from chatbot.chat_service import chat

print("=== Agri-Guide Chatbot Test ===\n")

result = chat(
    message="How do I improve soil fertility organically?",
    session_id="test-session-1"
)
print("Q: How do I improve soil fertility organically?")
print(f"A: {result['reply']}")
print(f"Sources: {result['sources']}\n")

result2 = chat(
    message="What should I spray?",
    session_id="test-session-2",
    prediction_context={
        "feature": "disease_detection",
        "disease": "Tomato___Early_blight",
        "confidence": 0.92
    }
)
print("Q: What should I spray? [Context: Tomato Early Blight, 92%]")
print(f"A: {result2['reply']}")
print(f"Sources: {result2['sources']}\n")

result3 = chat(
    message="What should I spray?",
    session_id="test-session-3",
    prediction_context={
        "feature": "disease_detection",
        "disease": "Tomato___Early_blight",
        "confidence": 0.40
    }
)
print("Q: What should I spray? [Context: Low confidence 40%]")
print(f"A: {result3['reply']}")