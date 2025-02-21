import React, { useState, useEffect, useRef } from 'react'
// import dotenv from 'dotenv';
import './ChatBotApp.css'

// dotenv.config()

const ChatBotApp = ({ onGoBack, chats, setChats, activeChat, setActiveChat, onNewChat }) => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState(chats[0]?.messages || [])
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)

  // fetch the apiKey from the local .env file !
  const apiKey = import.meta.env.VITE_REACT_APP_OPENAI_API_KEY || 'no key found';

  useEffect(() => {
    // get the active chat object
    const activeChatObj = chats.find(chat => chat.id === activeChat)
    // set the messages to the active chat messages or an empty array if no active chat are available
    setMessages(activeChatObj ? activeChatObj.messages : [])
  }, [activeChat, chats])

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const sendMessage = async () => {
    if(inputValue.trim() === '') return
    
    // create a new message
    const newMessage = {
      type: 'prompt',
      text: inputValue,
      timestamp: new Date().toLocaleString()
    }

    // if there is no active chat, create a new chat with the input value
    if(!activeChat) {
      onNewChat(inputValue)
      setInputValue('')
    } else {
      // if there is an active chat, get the messages of the active chat
      const updatedMessages = [...messages, newMessage]
      setMessages(updatedMessages)
      
      // clear the input field by setting the input field value to an empty string
      setInputValue('')
  
      // updatedChats: update the chats with the new messages, if the chat is the first chat
      // in the chats array, update the messages with the updated messages
      const updatedChats = chats.map((chat) => {
        // if the chat is the active chat in the chats array we update the messages
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: updatedMessages
          }
        }
        // otherwise we return the chat as it is
        return chat
      })
      setChats(updatedChats)
      setIsTyping(true)

      // fetch response from openAi 
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{role: 'user', content: inputValue}],
          max_tokens: 150,
        }),
      })

      const data = await response.json();
      console.log("API Response:", data);
      
      // Check for errors
      if (!response.ok) {
        console.error("Error:", response.status, response.statusText, data);
        return;
      }
 
      // mostly the response is in the first choice and removes the leading and trailing whitespaces
      const chatResponse = data.choices[0].message.content.trim();

      // create a new response message (internal message type response)
      const newResponse = {
        type: 'response',
        text: chatResponse,
        timestamp: new Date().toLocaleTimeString()
      }

      // update the messages with the new response from Chat-GPT
      const updatedMessagesWithResponse = [...updatedMessages, newResponse]
      setMessages(updatedMessagesWithResponse)
      // thinking period is over - no more typing
      setIsTyping(false)

      // update the curretn chatId with the new messages: updatedMessagesWithResponse
      const updatedChatsWithResponse = chats.map((chat) => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: updatedMessagesWithResponse
          }
        }
        // return the chat as it is
        return chat
      })
      // update the chats with the new response from Chat-GPT
      setChats(updatedChatsWithResponse)
    }
  }


  // keyboard event listener for enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  // handle selected which is active chat
  const handleSelectedChat = (id) => {
    // setActiveChat is a state setter in the App.jsx component
    setActiveChat(id)
  }

  // handle delete chat function
  const handleDeleteChat = (id) => {
    // filter out the chat with the id to be deleted (all chats except the chat with the id)
    const updatedChats = chats.filter((chat) => chat.id !== id)
    setChats(updatedChats)

    // if the chat to be deleted is the active chat, set the active chat to the first chat in the updated chats
    if(id === activeChat) {
      const newActiveChat = updatedChats.length > 0 ? updatedChats[0].id : null
      setActiveChat(newActiveChat)
    }
  }

  //TODO: useEffect with useRef to scroll to the end of the chat window

  return (
    <div className='chat-app'>
      <div className='chat-list'>
        <div className='chat-list-header'>
          <h2>Chat List</h2>
          <i className='bx bx-message-add new-chat'
              onClick={() => onNewChat(inputValue)}>
              </i>
        </div>
        {chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-list-item ${chat.id === activeChat ? 'active' : ''}`}
              onClick={() => handleSelectedChat(chat.id)}
              >
              <h4>Chat display Id:{chat.displayId}</h4>
              <i 
                className='bx bx-x-circle'
                onClick={(e)=> {
                  e.stopPropagation()
                  handleDeleteChat(chat.id)
                }}></i>
            </div>
        ))}
      </div>
      <div className='chat-window'>
        <div className='chat-title'>
          <h2>Chat with AI</h2>
          <i className='bx bx-arrow-back arrow'
             onClick={onGoBack}>
          </i>
        </div>
        <div className='chat'>
            {messages.map((msg, index) => (
              <div key={index} className={msg.type === 'prompt' ? 'prompt' : 'response'}>
                <p>{msg.text}</p>
                <span>{msg.timestamp}</span>
              </div>
            ))}
          {isTyping && <div className='typing'>Bot is responding...</div>}
        </div>
        <form className='msg-form'
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}>
          <i className='fa-solid  fa-face-smile emoji'></i>
          <input 
            type='text' 
            placeholder='Ask me anything... FLX chatbot may help you - or not'  
            className='msg-input' 
            value={inputValue} 
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown} />
          <i 
            className='fa-solid fa-paper-plane' 
            onClick={sendMessage}>
            </i>
        </form>
      </div>
    </div>
  )
}

export default ChatBotApp
