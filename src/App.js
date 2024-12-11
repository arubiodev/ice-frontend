import React, { useEffect, useState } from "react";
import axios from "axios";
import Pusher from "pusher-js";

const App = () => {
  const nyckelAPI = "https://www.nyckel.com/v1/functions/text-sentiment-analyzer/invoke";

  const [messages, setMessages] = useState([]);
  const [currentMoodScore, setCurrentMoodScore] = useState(0);
  const rollingWindowSize = 10; // Last 10 messages

  useEffect(() => {
    const pusher = new Pusher("32cbd69e4b950bf97679", {
      cluster: "us2",
      forceTLS: true,
    });
    const channel = pusher.subscribe(`chatrooms.145222.v2`);

    channel.bind("App\\Events\\ChatMessageEvent", (data) => {
      const message = data.content;
      handleMessage(message);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  const handleMessage = async (message) => {
    try {
      // Send message to backend for sentiment classification
      const response = await axios.post("https://ice-backend-production.up.railway.app/analyze", { text: message });
      const classification = response.data.sentiment;
      let scoreChange = 0;

      if (classification === "Negative") {
        scoreChange = -10;
      } else if (classification === "Positive") {
        scoreChange = 10;
      }

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, { text: message, sentiment: classification }];
        if (updatedMessages.length > rollingWindowSize) {
          updatedMessages.shift();
        }

        const newMoodScore = updatedMessages.reduce((acc, msg) => {
          if (msg.sentiment === "Positive") return acc + 10;
          if (msg.sentiment === "Negative") return acc - 10;
          return acc;
        }, 0);

        setCurrentMoodScore(newMoodScore);
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error classifying message:", error);
    }
  };

  const getMoodColor = () => {
    if (currentMoodScore > 0) return "green";
    if (currentMoodScore < 0) return "red";
    return "gray";
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>Not Rigged AI Chat Mood Detector</h1>

      {/* Mood Bar */}
      <div
        style={{
          height: "30px",
          background: getMoodColor(),
          width: `${Math.min(100, Math.abs(currentMoodScore))}%`,
          transition: "width 0.5s ease",
          margin: "10px 0",
        }}
      ></div>
      <p>Current Score: {currentMoodScore}</p>

      {/* Message List */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((msg, index) => (
          <li
            key={index}
            style={{
              marginBottom: "10px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              backgroundColor:
                msg.sentiment === "Positive"
                  ? "#e6ffe6"
                  : msg.sentiment === "Negative"
                  ? "#ffe6e6"
                  : "#f0f0f0",
            }}
          >
            <strong>{msg.sentiment}</strong>: {msg.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
