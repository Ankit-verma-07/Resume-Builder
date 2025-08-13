import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hi! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await axios.post("http://localhost:5001/chat", {
        message: input
      });
      setMessages([
        ...newMessages,
        { sender: "ai", text: res.data.reply || "No response" }
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        { sender: "ai", text: "Sorry, something went wrong." }
      ]);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 999 }}>
      {isOpen && (
        <div
          style={{
            width: "320px",
            height: "420px",
            background: "#fff",
            borderRadius: "15px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
            overflow: "hidden",
            animation: "fadeIn 0.3s ease"
          }}
        >
          {/* Header */}
<div
  style={{
    background: "linear-gradient(45deg, #4A90E2, #8E44AD)",
    color: "white",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "bold",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
  }}
>
  <span>🤖 AI Assistant</span>
  <button
    onClick={() => setIsOpen(false)}
    style={{
      background: "transparent",
      border: "none",
      color: "white",
      fontSize: "18px",
      cursor: "pointer",
    
    }}
  >
    ✖
  </button>
</div>


          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "8px"
                }}
              >
                <span
                  style={{
                    background:
                      msg.sender === "user"
                        ? "linear-gradient(45deg, #4A90E2, #8E44AD)"
                        : "#e5e5e5",
                    color: msg.sender === "user" ? "white" : "black",
                    padding: "8px 12px",
                    borderRadius: "20px",
                    maxWidth: "75%",
                    wordBreak: "break-word",
                    fontSize: "14px"
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

  {/* Input Area */}
<div style={{
  padding: "8px",
  borderTop: "1px solid #ddd",
  display: "flex",
  alignItems: "center",
  gap: "8px",
}}>
  <textarea
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKeyPress}
    placeholder="Type a message..."
    style={{
      flex: 1,
      padding: "10px 12px",
      borderRadius: "20px",
      border: "1px solid #ccc",
      outline: "none",
      resize: "none",
      fontSize: "14px",
      height: "45px",
      background: "#fff",
      color: "#000",
    }}
  />

  {/* Send Button */}
  <button
    onClick={sendMessage}
    style={{
      background: "linear-gradient(45deg, #4A90E2, #8E44AD)",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "white",
      fontSize: "16px",
      boxShadow: "0px 4px 6px rgba(0,0,0,0.2)",
    }}
  >
    ➤
  </button>
</div>



        </div>
      )}

   {/* Floating Button */}
{!isOpen && (
  <button
    onClick={() => setIsOpen(true)}
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "linear-gradient(45deg, #4A90E2, #8E44AD)",
      border: "none",
      borderRadius: "50%",
      width: "60px",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "26px",
      cursor: "pointer",
      boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
      color: "white",
    }}
  >
    💬
  </button>
)}


    </div>
  );
}
