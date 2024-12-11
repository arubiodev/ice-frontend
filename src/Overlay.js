import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Overlay = () => {
    const [balance, setBalance] = useState(0);
    const [previousBalance, setPreviousBalance] = useState(0);
    const [effect, setEffect] = useState("");
    const [activeChallenge, setActiveChallenge] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showChallengeDescription, setShowChallengeDescription] = useState(false);
    const [showPermanentDescription, setShowPermanentDescription] = useState(false);
    const [challengeBonus, setChallengeBonus] = useState(0);  // New state for the bonus

    const previousChallengeIdRef = useRef(null);

    const fetchData = async () => {
        try {
            // Fetch balance
            const balanceResponse = await axios.get("https://dbr666-backend-production.up.railway.app/balance");
            const newBalance = balanceResponse.data.balance;

            if (newBalance !== previousBalance) {
                setPreviousBalance(balance);
                setBalance(newBalance);

                if (newBalance > previousBalance) {
                    setEffect("increase");
                } else if (newBalance < previousBalance) {
                    setEffect("decrease");
                }

                setTimeout(() => setEffect(""), 1000);
            }

            // Fetch active challenge
            const challengeResponse = await axios.get("https://dbr666-backend-production.up.railway.app/active-challenge");
            const challenge = challengeResponse.data.challenge;

            if (challenge && challenge._id !== previousChallengeIdRef.current) {
                setActiveChallenge(challenge);
                setTimeLeft(challenge.timeLeft);
                previousChallengeIdRef.current = challenge._id;

                // Fetch difficulty settings
                const settingsResponse = await axios.get("https://dbr666-backend-production.up.railway.app/difficulty-settings");
                const settings = settingsResponse.data.settings;

                let bonus = 0;
                if (challenge.challenge.difficulty === "easy") {
                    bonus = settings.easySubs * 5;
                } else if (challenge.challenge.difficulty === "medium") {
                    bonus = settings.mediumSubs * 5;
                } else if (challenge.challenge.difficulty === "hard") {
                    bonus = settings.hardSubs * 5;
                }

                setChallengeBonus(bonus); // Set the calculated bonus

                setShowPermanentDescription(true);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setActiveChallenge(null);
        }
    };

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            if (timeLeft > 0) {
                setTimeLeft((prev) => prev - 1);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Fetch data every 10 seconds
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [previousBalance, balance]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const formatBalance = (value) => {
        return Number.isInteger(value) ? value : value.toFixed(2);
    };

    return (
        <div style={styles.container}>
            <div style={styles.balanceBox}>
                <div style={styles.balance}>
                    Balance:{" "}
                    <span
                        style={{
                            ...styles.amount,
                            ...(effect === "increase" ? styles.greenFlash : {}),
                            ...(effect === "decrease" ? styles.redFlash : {}),
                        }}
                    >
                        ${formatBalance(balance)}
                    </span>
                </div>

                {activeChallenge && (
                    <div style={styles.balance}>
                        <div style={styles.amount}>
                            Time Left: {formatTime(timeLeft)}
                        </div>
                    </div>
                )}
            </div>

            {/* Challenge Bonus and Description Overlay */}
            {activeChallenge && showPermanentDescription && (
                <div style={styles.permanentChallengeDescription}>
                    <div style={styles.challengeBonus}>
                        ${challengeBonus} - {activeChallenge.challenge.description}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "10px",
        boxSizing: "border-box",
    },
    balanceBox: {
        backgroundColor: "rgba(200, 200, 200, 0.5)",
        borderRadius: "15px",
        padding: "15px 25px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        position: "absolute",
        top: "10px",
        left: "10px",
    },
    balance: {
        fontSize: "48px",
        fontWeight: "bold",
        color: "#000",
        textAlign: "center",
    },
    amount: {
        transition: "color 0.3s ease, transform 0.3s ease",
    },
    greenFlash: {
        color: "#008000",
        transform: "scale(1.2)",
    },
    redFlash: {
        color: "#8B0000",
        transform: "scale(1.2)",
    },
    permanentChallengeDescription: {
        position: "fixed",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "#FFFFFF",
        padding: "10px 20px",
        borderRadius: "10px",
        fontSize: "36px",
        maxWidth: "50%",
        wordWrap: "break-word",
        textAlign: "center",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        zIndex: 1000,
    },
    challengeBonus: {
        fontSize: "36px", // Slightly smaller font for bonus
        color: "#FFFFFF",

    },
};

export default Overlay;
