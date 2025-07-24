import React, { useState, useRef, useEffect } from 'react';
import '../assets/styles/AIChatBot.css';

const AIChatBot = ({ isOpen, onClose, reportData }) => {
    // Create initial message based on context
    const getInitialMessage = () => {
        if (reportData?.contextType === 'admin-task-management') {
            return "Hello! I'm your AI assistant for task management. I can help you analyze this maintenance task, provide troubleshooting guidance, suggest solutions, and answer questions about the report details. What would you like to know about this task?";
        }
        return "Hello! I'm your AI assistant. I can help you analyze this report and answer questions about it. What would you like to know?";
    };

    const [messages, setMessages] = useState([
        {
            id: 1,
            text: getInitialMessage(),
            isBot: true,
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Scroll to bottom when new messages are added
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending message to Flowise API
    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            isBot: false,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Create context about the report and task
            const reportContext = reportData ? `
Report Context:
- Report ID: ${reportData._id}
- Category: ${reportData.category}
- Priority: ${reportData.priority}
- Status: ${reportData.status}
- Location: ${reportData.building}, ${reportData.location}, ${reportData.room}
- Description: ${reportData.description}
- Created At: ${reportData.createdAt}
- Reporter: ${reportData.reporter?.username || 'Unknown'}
${reportData.taskId ? `
Task Management Context:
- Task ID: ${reportData.taskId}
- Task Status: ${reportData.taskStatus}
- Assigned Admin: ${reportData.assignedAdmin}
- Task Created: ${reportData.taskCreatedAt}
- Comments Count: ${reportData.comments?.length || 0}
- Task Notes: ${reportData.taskNotes?.length || 0} notes available
- Context: ${reportData.contextType}
` : `
- Assigned To: ${reportData.assignedTo?.username || 'Unassigned'}
`}
User Question: ${inputMessage}
` : inputMessage;

            const response = await fetch('https://gaiadahakavoid-flowise.hf.space/api/v1/prediction/eacdb077-6f74-45da-82e1-9ae6f0441734%22', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: reportContext,
                    overrideConfig: {
                        returnSourceDocuments: false
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            console.log('AI Response data:', data);
            console.log('Response text length:', data.text?.length || data.answer?.length || 0);
            console.log('Full response text:', data.text || data.answer);
            
            const botMessage = {
                id: Date.now() + 1,
                text: data.text || data.answer || "I'm sorry, I couldn't process your request at the moment.",
                isBot: true,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message to AI:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "I'm sorry, I'm experiencing technical difficulties. Please try again later.",
                isBot: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleClose = () => {
        onClose();
        // Reset chat after a brief delay to allow animation
        setTimeout(() => {
            setMessages([
                {
                    id: 1,
                    text: "Hello! I'm your AI assistant. I can help you analyze this report and answer questions about it. What would you like to know?",
                    isBot: true,
                    timestamp: new Date()
                }
            ]);
            setInputMessage('');
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="ai-chat-overlay">
            <div className="ai-chat-popup" ref={chatContainerRef}>
                <div className="ai-chat-header">
                    <div className="ai-chat-title">
                        <img src="/images/Chat Icon.svg" alt="AI Chat" width="20" height="20" />
                        <span>AI Report Assistant</span>
                    </div>
                    <button className="ai-chat-close" onClick={handleClose}>
                        ×
                    </button>
                </div>
                
                <div className="ai-chat-messages">
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}>
                            <div className="message-content" style={{
                                overflow: 'visible',
                                textOverflow: 'initial',
                                maxHeight: 'none',
                                height: 'auto'
                            }}>
                                <div 
                                    className="message-text" 
                                    style={{ 
                                        whiteSpace: 'pre-wrap', 
                                        wordWrap: 'break-word', 
                                        overflowWrap: 'break-word',
                                        textOverflow: 'initial',
                                        overflow: 'visible',
                                        width: '100%',
                                        maxWidth: 'none',
                                        height: 'auto',
                                        maxHeight: 'none',
                                        display: 'block'
                                    }}
                                    title={message.text} // Add title for debugging
                                >
                                    {message.text}
                                </div>
                                <div className="message-time">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message bot-message">
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="ai-chat-input">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about this report..."
                        rows="1"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={sendMessage} 
                        disabled={!inputMessage.trim() || isLoading}
                        className="send-button"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatBot;
