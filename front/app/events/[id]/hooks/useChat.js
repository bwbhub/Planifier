/**
 * Hook personnalisé pour gérer le chat d'un événement
 */

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * @param {Object} user - Utilisateur connecté
 * @returns {Object} État et fonctions du chat
 */
export function useChat(user) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      // TODO: Implémenter l'API du chat
      const mockMessage = {
        id: Date.now().toString(),
        text: newMessage,
        author: user,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, mockMessage]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, user]);

  return {
    messages,
    newMessage,
    setNewMessage,
    sendingMessage,
    handleSendMessage,
    chatEndRef,
  };
}
