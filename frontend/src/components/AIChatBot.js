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

    // Test connection to Flowise API on component mount
    useEffect(() => {
        if (isOpen) {
            testFlowiseConnection();
        }
    }, [isOpen]);

    // Test Flowise API connection
    const testFlowiseConnection = async () => {
        try {
            console.log('Testing Flowise API connection...');
            // Use the same endpoint as the main chat for consistency
            const response = await fetch('https://gaiadahakavoid-flowise.hf.space/api/v1/prediction/108ffeb9-4efe-4345-8402-e1b9bfbf883c', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: "Hello, are you working?",
                    overrideConfig: {
                        returnSourceDocuments: false
                    }
                })
            });
            
            if (response.ok) {
                console.log('✅ Flowise API connection successful');
                const data = await response.json();
                console.log('✅ Test response:', data);
            } else {
                console.warn('⚠️ Flowise API connection test failed:', response.status);
                const errorText = await response.text();
                console.warn('⚠️ Error details:', errorText);
            }
        } catch (error) {
            console.error('❌ Flowise API connection test error:', error);
        }
    };

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
        const currentInput = inputMessage;
        setInputMessage('');
        setIsLoading(true);

        try {
            // Validate input length
            if (currentInput.trim().length > 2000) {
                throw new Error('Message too long. Please keep your question under 2000 characters.');
            }

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
User Question: ${currentInput}
` : currentInput;

            console.log('Sending to Flowise API:', {
                endpoint: 'https://gaiadahakavoid-flowise.hf.space/api/v1/prediction/108ffeb9-4efe-4345-8402-e1b9bfbf883c',
                contextLength: reportContext.length,
                hasReportData: !!reportData
            });

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch('https://gaiadahakavoid-flowise.hf.space/api/v1/prediction/108ffeb9-4efe-4345-8402-e1b9bfbf883c', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    question: reportContext,
                    overrideConfig: {
                        returnSourceDocuments: false
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            
            console.log('AI Response data structure:', {
                hasText: !!data.text,
                hasAnswer: !!data.answer,
                dataType: typeof data,
                keys: Object.keys(data),
                fullData: data
            });
            
            // Handle different response formats from Flowise
            let responseText = '';
            if (data.text && typeof data.text === 'string') {
                responseText = data.text.trim();
            } else if (data.answer && typeof data.answer === 'string') {
                responseText = data.answer.trim();
            } else if (data.response && typeof data.response === 'string') {
                responseText = data.response.trim();
            } else if (typeof data === 'string') {
                responseText = data.trim();
            } else if (data.message && typeof data.message === 'string') {
                responseText = data.message.trim();
            } else {
                console.warn('Unexpected response format:', data);
                responseText = "I received your message but couldn't process the response format. Please try again.";
            }
            
            if (!responseText || responseText.length === 0) {
                responseText = "I understand your question but couldn't generate a response. Please try rephrasing your question.";
            }
            
            console.log('Final response text:', responseText);
            
            const botMessage = {
                id: Date.now() + 1,
                text: responseText || "I'm sorry, I couldn't process your request at the moment.",
                isBot: true,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message to AI:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                type: error.constructor.name
            });
            
            let errorText = "I'm sorry, I'm experiencing technical difficulties. Please try again later.";
            
            // Provide more specific error messages based on error type
            if (error.name === 'AbortError') {
                errorText = "The request timed out. The AI service might be busy. Please try again.";
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorText = "I'm unable to connect to the AI service. Please check your internet connection and try again.";
            } else if (error.message.includes('HTTP error! status: 4')) {
                errorText = "I'm having trouble processing your request. Please try rephrasing your question.";
            } else if (error.message.includes('HTTP error! status: 5')) {
                errorText = "The AI service is temporarily unavailable. Please try again in a few moments.";
            } else if (error.message.includes('Message too long')) {
                errorText = error.message;
            } else if (error.message.includes('JSON')) {
                errorText = "I received an invalid response from the AI service. Please try again.";
            }
            
            const errorMessage = {
                id: Date.now() + 1,
                text: errorText,
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
