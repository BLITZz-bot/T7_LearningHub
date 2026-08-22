import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatbotWidget from '../Chatbot/ChatbotWidget';

const AuthenticatedLayout = ({ children }) => {
  const { currentUser, userProfile } = useAuth();

  return (
    <>
      {children}
      {currentUser && (
        <ChatbotWidget 
          geminiApiKey={userProfile?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY} 
          userProfile={userProfile}
        />
      )}
    </>
  );
};

export default AuthenticatedLayout;
