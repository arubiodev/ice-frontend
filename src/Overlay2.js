import React, { useEffect, useState } from "react";
import axios from "axios";
import Pusher from "pusher-js";

const App = () => {
  const positiveWords = ["kekw", "kekleo", "omegalul", "clap"];
  const negativeWords = ["patrickboo", "angry"];
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
    let normalizedMessage = message.toLowerCase();
    let classification = "Neutral";
    let scoreChange = 0;
  
    const client_id = "l4k98digi2umfz0lk7slsij8zggyn2yg";
    const access_token = "lz2h595clx8dlfx89rduj6g3lc9swjtf4e1fwjfa2f0u96njj8pvp4xejyvszdg1"; // Replace with your actual token
  
    // Check for positive or negative words
    if (negativeWords.some((word) => normalizedMessage.includes(word))) {
      classification = "Negative";
      scoreChange = -10;
    } else if (positiveWords.some((word) => normalizedMessage.includes(word))) {
      classification = "Positive";
      scoreChange = 10;
    } else {
      // If not matched, classify via Nyckel API
      try {
        const response = await axios.post(
          nyckelAPI,
          { data: message }, // Request body
          {
            headers: {
              Authorization: `Bearer ${access_token}`, // Include the access token in the headers
            },
            params: {
              client_id: client_id, // Add the client_id as a query parameter (if required)
            },
          }
        );
        const { labelName } = response.data;
  
        classification = labelName;
        if (labelName === "Negative") {
          scoreChange = -10;
        } else if (labelName === "Positive") {
          scoreChange = 10;
        }
      } catch (error) {
        console.error("Error classifying message:", error);
      }
    }

    setMessages((prevMessages) => {
      // Update messages with a rolling window size
      const updatedMessages = [...prevMessages, { text: message, sentiment: classification }];
      if (updatedMessages.length > rollingWindowSize) {
        updatedMessages.shift();
      }

      // Calculate the new mood score based on the rolling window
      const newMoodScore = updatedMessages.reduce((acc, msg) => {
        if (msg.sentiment === "Positive") return acc + 10;
        if (msg.sentiment === "Negative") return acc - 10;
        return acc;
      }, 0);

      setCurrentMoodScore(newMoodScore); // Update state
      return updatedMessages;
    });
  };

  const getMoodColor = () => {
    if (currentMoodScore > 0) return "green";
    if (currentMoodScore < 0) return "red";
    return "gray";
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>Chat Mood Overlay</h1>

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
