// Instalar dependências: npm install lucide-react

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, LogOut, MessageSquare } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:4001/api';
const WS_URL = 'ws://localhost:4002';

export default function MessagingApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    if (!currentUser) return;
    
    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      websocket.send(JSON.stringify({ type: 'register', userId: currentUser.id }));
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        if (selectedContact && 
            (data.message.sender_id === selectedContact.id || 
             data.message.receiver_id === selectedContact.id)) {
          setMessages(prev => [...prev, data.message]);
        }
      }
    };
    
    return () => {
      websocket.close();
    };
  }, [currentUser, selectedContact]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        loadContacts(data.user.id);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Erro ao fazer login');
    }
  };

  // Load contacts
  const loadContacts = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`);
      const data = await res.json();
      setContacts(data.users);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
    }
  };

  // Load messages
  const loadMessages = async (contactId) => {
    try {
      const res = await fetch(`${API_URL}/messages/${currentUser.id}/${contactId}`);
      const data = await res.json();
      setMessages(data.messages);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  // Select contact
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    loadMessages(contact.id);
  };

  // Send message
  const handleSend = async () => {
    if (inputText.trim() && selectedContact) {
      try {
        const res = await fetch(`${API_URL}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_id: currentUser.id,
            receiver_id: selectedContact.id,
            message: inputText
          })
        });
        const data = await res.json();
        setMessages([...messages, data.message]);
        setInputText('');
      } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div className="login-container">
        <div className="login-bg-overlay"></div>
        <div className="login-bg-effect">
          <div className="login-bg-circle-1"></div>
          <div className="login-bg-circle-2"></div>
        </div>
        
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <MessageSquare />
            </div>
            <h1 className="login-title">ChatApp</h1>
            <p className="login-subtitle">Conecte-se com seus amigos</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Usuário</label>
              <input
                type="text"
                placeholder="usuario1 ou usuario2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>
            
            <button type="submit" className="login-button">
              Entrar
            </button>
            
            <p className="login-hint">
              Use: usuario1 ou usuario2 | Senha: 123456
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Main App Screen
  return (
    <div className="chat-container">
      {/* Sidebar - Contacts */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              <User />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-username">{currentUser.username}</span>
              <div className="sidebar-status">
                <div className="status-dot"></div>
                <span className="sidebar-status-text">Online</span>
              </div>
            </div>
          </div>
          <button onClick={() => setCurrentUser(null)} className="logout-button" title="Sair">
            <LogOut />
          </button>
        </div>
        
        <div className="contacts-header">
          <h2 className="contacts-title">Conversas</h2>
        </div>
        
        <div className="contacts-list">
          {contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => handleSelectContact(contact)}
              className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
            >
              <div className="contact-content">
                <div className="contact-avatar-wrapper">
                  <div className="contact-avatar">
                    <User />
                  </div>
                  <div className="contact-status-dot"></div>
                </div>
                <div className="contact-info">
                  <h3 className="contact-name">{contact.username}</h3>
                  <p className="contact-action">Clique para conversar</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-content">
                <div className="chat-avatar-wrapper">
                  <div className="chat-avatar">
                    <User />
                  </div>
                  <div className="chat-status-dot"></div>
                </div>
                <div className="chat-user-info">
                  <h2>{selectedContact.username}</h2>
                  <p className="chat-online-status">
                    <span className="chat-online-dot"></span>
                    Online agora
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message-wrapper ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                >
                  <div className={`message-bubble ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}>
                    <p className="message-text">{msg.message}</p>
                    <p className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="message-input"
                  rows="1"
                />
                <button
                  onClick={handleSend}
                  className="send-button"
                  disabled={!inputText.trim()}
                >
                  <Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <div className="empty-state-icon">
                <MessageSquare />
              </div>
              <p className="empty-state-title">Selecione uma conversa</p>
              <p className="empty-state-subtitle">Escolha um contato para começar a conversar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}