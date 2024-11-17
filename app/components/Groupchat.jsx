"use client"
import React, { useState, useEffect,useCallback} from 'react';
import { ethers } from 'ethers';
import { parseEther } from 'viem';
import { Client } from "@xmtp/xmtp-js";
import { useAccount } from 'wagmi';
import { useReadContract, useWriteContract } from 'wagmi';
import {contract_address, abi} from "../utils/config"
import { Search, Settings, Plus, Send, MessageSquare, Users, ArrowLeft } from 'lucide-react';
const GroupChat = () => {
  const [client, setClient] = useState(null);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [memberAddresses, setMemberAddresses] = useState([]);
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState(null);
  const [isInitializingXMTP, setIsInitializingXMTP] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  console.log(address);
  // Initialize XMTP for the current user
  const initializeXMTP = async () => {
    try {
      setIsInitializingXMTP(true);
      setError('');

      if (!wallet) {
        throw new Error('Please connect your wallet first');
      }

      // Create XMTP client - this will trigger the initialization if needed
      const xmtp = await Client.create(wallet, { env: 'production' });
      setClient(xmtp);
      console.log('XMTP client initialized successfully');
    } catch (error) {
      console.error('Error initializing XMTP:', error);
      setError(error.message || 'Failed to initialize XMTP. Please try again.');
    } finally {
      setIsInitializingXMTP(false);
    }
  };

  // Check if an address is XMTP-enabled
  const checkXMTPEnabled = async (address) => {
    try {
      if (!client) return false;
      return await client.canMessage(address);
    } catch (error) {
      console.error('Error checking XMTP status:', error);
      return false;
    }
  };

  // Modified initializeClient function
  const initializeClient = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{
          eth_accounts: {}
        }]
      });
      // This will now show account selector
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Store wallet and address in state
      setWallet(signer);
      setUserAddress(address);
      
      loadUserGroups();

    } catch (error) {
      console.error(error);
    }
  };

  // Create new group chat
  const createGroup = async () => {
    if (!client) {
      setError('XMTP client not initialized');
      return;
    }

    if (memberAddresses.length === 0) {
      setError('Please add at least one member to the group');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Validate addresses
      const validationPromises = memberAddresses.map(async (address) => {
        const canMessage = await client.canMessage(address);
        if (!canMessage) {
          throw new Error(`Address ${address} is not XMTP-enabled`);
        }
      });

      await Promise.all(validationPromises);
      
      // Create conversations
      const conversationPromises = memberAddresses.map(async (address) => {
        try {
          const conversation = await client.conversations.newConversation(address);
          await conversation.send('Group chat created');
          return conversation;
        } catch (err) {
          throw new Error(`Failed to create conversation with ${address}: ${err.message}`);
        }
      });

      const conversations = await Promise.all(conversationPromises);
      
      // Save group and get groupId
      const groupId = await saveGroup(conversations);
      
      setGroup(conversations);
      loadUserGroups(); // Refresh groups list
      
      // Start message streams
      conversations.forEach(conv => {
        startMessageStream(conv).catch(err => {
          console.error('Error starting message stream:', err);
        });
      });

      setShowCreateGroup(false);
      setSelectedGroupId(groupId);
      setMemberAddresses([]);
      
      console.log('Group created successfully:', groupId);
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error.message || 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for new messages
  const startMessageStream = async (conversation) => {
    if (!conversation) {
      console.error('Invalid conversation object');
      return;
    }
  
    try {
      const stream = await conversation.streamMessages();
      
      for await (const message of stream) {
        setMessages(prevMessages => {
          // Avoid duplicate messages by checking ID
          const isDuplicate = prevMessages.some(
            msg => msg.id === message.id
          );
          if (isDuplicate) return prevMessages;
          
          // Add new message and sort by timestamp
          const updatedMessages = [...prevMessages, message];
          return updatedMessages.sort((a, b) => 
            a.sent.getTime() - b.sent.getTime()
          );
        });
      }
    } catch (error) {
      console.error('Error streaming messages:', error);
      setError('Failed to stream messages. Please refresh the page.');
    }
  };

  // Send message to group
  const sendMessage = async () => {
    if (!group) {
      setError('Group not initialized');
      return;
    }

    if (!newMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      let messageToSend = newMessage;
      if (newMessage.startsWith('/')) {
        const commandResponse = await processCommand(newMessage);
        if (commandResponse) {
          messageToSend = commandResponse;
        }
      }
      const sendPromises = group.map(async (conversation) => {
        try {
          await conversation.send(messageToSend);
        } catch (err) {
          throw new Error(`Failed to send message to ${conversation.peerAddress}: ${err.message}`);
        }
      });

      await Promise.all(sendPromises);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // const handleChatCommand= async(message)=>{
  //   try{
  //     const words = message.trim().split(' ');
  //     const command = words[0].toLowerCase();
  //     switch (command) {
  //       case '/createbet': {
  //         if (words.length < 3) throw new Error('Usage: /createbet <amount> <prompt>');
          
  //         const amount = ethers.parseEther(words[1]);
  //         const prompt = words.slice(2).join(' ');
  //           const betNo= useReadContract({
  //             contract_address, 
  //             abi, 
  //             functionName:'totalBets'
  //           })
  //         await writeContractAsync({
  //           contract_address,abi,
  //           functionName: 'createBet',
  //           args: [prompt, amount]
  //         });
          
  //         return `Creating bet: "${prompt}" for ${words[1]} ETH with id ${betNo-1}`;
  //       }
        
  //       case '/agree':
  //       case '/disagree': {
  //         if (words.length !== 2) throw new Error(`Usage: ${command} <betId>`);
          
  //         const betId = parseInt(words[1]);
  //         const agree = command === '/agree';
          
  //         await writeContractAsync({
  //           contract_address,abi,
  //           functionName: 'participateInBet',
  //           args: [betId, agree]
  //         });
          
  //         return `${agree ? 'Agreeing' : 'Disagreeing'} to bet #${betId}`;
  //       }
        
  //       case '/resolvebet': {
  //         if (!address) throw new Error('Must be connected to resolve bets');
  //         if (words.length !== 3) throw new Error('Usage: /resolvebet <betId> <true|false>');
          
  //         const betId = parseInt(words[1]);
  //         const result = words[2].toLowerCase() === 'true';
          
  //         await writeContractAsync({
  //           contract_address,abi,
  //           functionName: 'resolveBet',
  //           args: [betId, result]
  //         });
          
  //         return `Resolving bet #${betId} as ${result}`;
  //       }
        
  //       default:
  //         return null;
  //     }
  //   }
  //   catch(error){
  //     console.error('Error handling command:', error);
  //     return `Error: ${error.message}`;
  //   }
  // }

  // Add new member
  const addMember = async () => {
    if (!newMemberAddress) {
      setError('Please enter an address');
      return;
    }

    try {
      setIsLoading(true);

      if (!ethers.isAddress(newMemberAddress)) {
        setError('Invalid Ethereum address');
        return;
      }

      if (memberAddresses.includes(newMemberAddress)) {
        setError('Address already added');
        return;
      }

      if (newMemberAddress.toLowerCase() === userAddress.toLowerCase()) {
        setError('Cannot add your own address');
        return;
      }

      // Check if the address is XMTP-enabled
      const isXMTPEnabled = await checkXMTPEnabled(newMemberAddress);
      if (!isXMTPEnabled) {
        setError(`Address ${newMemberAddress} is not XMTP-enabled. They need to initialize XMTP first.`);
        return;
      }

      setMemberAddresses(prev => [...prev, newMemberAddress]);
      setNewMemberAddress('');
      setError('');
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

    // Function to save group data to localStorage
    const saveGroup = async (groupData) => {
      try {
        const existingGroups = JSON.parse(localStorage.getItem('xmtpGroups') || '[]');
        const groupId = `group_${Date.now()}`;
        
        // Include the current user's address in the group members
        const allMembers = [
          userAddress,
          ...groupData.map(conv => conv.peerAddress)
        ].map(addr => addr.toLowerCase()); // Normalize all addresses to lowercase
        
        const newGroup = {
          id: groupId,
          members: allMembers,
          createdAt: Date.now(),
          lastMessage: null
        };
        
        console.log('Saving new group:', newGroup);
        existingGroups.push(newGroup);
        localStorage.setItem('xmtpGroups', JSON.stringify(existingGroups));
        return groupId;
      } catch (error) {
        console.error('Error saving group:', error);
        throw error;
      }
    };
    let currentBetId=0;
    const { data: totalBets } = useReadContract({
      address: contract_address,
      abi: abi,
      functionName: 'totalBets'
    });
    const { data: bet }= useReadContract({
      address: contract_address,
      abi: abi,
      functionName: 'groupBets',
      args: [BigInt(currentBetId)]
    });
    // Separate non-hook functions for contract interactions
    const handleCreateBet = async (prompt, amount) => {
      try {
        await writeContract({
          address: contract_address,
          abi: abi,
          functionName: 'createBet',
          args: [prompt, parseEther(amount)]
        });
        const newBetId = Number(totalBets);
        return newBetId;
      } catch (error) {
        console.error('Error creating bet:', error);
        throw error;
      }
    };
  
    const handleParticipateBet = async (betId, agree) => {
      try {
        console.log("AGREE BET ID", betId)
        currentBetId= betId;
        console.log("CURRENT",currentBetId)
        console.log("group bets",bet);
        console.log("group bets amount",bet[2])
        await writeContract({
          address: contract_address,
          abi: abi,
          functionName: 'participateInBet',
          args: [BigInt(betId), agree],
          value: bet[2]
        });
      } catch (error) {
        console.error('Error participating in bet:', error);
        throw error;
      }
    };
  
    const handleResolveBet = async (betId, result) => {
      if (!address) throw new Error('Must be connected to resolve bets');
      try {
        console.log("entered")
        await writeContract({
          address: contract_address,
          abi: abi,
          functionName: 'resolveBet',
          args: [BigInt(betId), true]
        });
      } catch (error) {
        console.error('Error resolving bet:', error);
        throw error;
      }
    };
  
    // Command processcor without hooks
    const processCommand = useCallback(async (message) => {
      try {
        const words = message.trim().split(' ');
        const command = words[0].toLowerCase();
        switch (command) {
          case '/createbet': {
            if (words.length < 3) throw new Error('Usage: /createbet <amount> <prompt>');
            
            const amount = words[1];
            const prompt = words.slice(2).join(' ');
            const betId = await handleCreateBet(prompt, amount);
            return `Creating bet: "${prompt}" for ${amount} ETH with id ${betId-1}`;
          }
          
          case '/agree':
          case '/disagree': {
            if (words.length !== 2) throw new Error(`Usage: ${command} <betId>`);
            
            const betId = parseInt(words[1]);
            const agree = command === '/agree';
            console.log("AGREE",agree)
            await handleParticipateBet(betId, agree);
            console.log("currentBetId",currentBetId)
            return `${agree ? 'Agreeing' : 'Disagreeing'} to bet #${betId}`;
          }
          
          case '/resolvebet': {
            if (words.length !== 2) throw new Error('Usage: /resolvebet <betId>');
            
            const betId = parseInt(words[1]);
            await handleResolveBet(betId, true);
            return `Resolving bet #${betId}`;
          }
          
          default:
            return null;
        }
      } catch (error) {
        console.error('Error processing command:', error);
        return `Error: ${error.message}`;
      }
    }, [address, writeContract, totalBets]);
  
    // Function to load user's groups from localStorage
    const loadUserGroups = () => {
      try {
        if (!userAddress) {
          console.log('No user address available');
          return;
        }
        
        const allGroups = JSON.parse(localStorage.getItem('xmtpGroups') || '[]');
        console.log('All groups:', allGroups);
        console.log('Current user address:', userAddress);
        
        const userGroups = allGroups.filter(group => 
          group.members.some(member => 
            member.toLowerCase() === userAddress.toLowerCase()
          )
        );
        
        console.log('Filtered user groups:', userGroups);
        setUserGroups(userGroups);
      } catch (error) {
        console.error('Error loading groups:', error);
        setError('Failed to load groups');
      }
    };

  // Function to load a specific group's conversations
  const loadGroup = async (groupId) => {
    try {
      setIsLoading(true);
      setError('');
      
      const allGroups = JSON.parse(localStorage.getItem('xmtpGroups') || '[]');
      const groupData = allGroups.find(g => g.id === groupId);
      
      if (!groupData) {
        throw new Error('Group not found');
      }
  
      // Create conversations for all group members
      const conversationPromises = groupData.members.map(async (address) => {
        if (address.toLowerCase() === userAddress.toLowerCase()) return null;
        return await client.conversations.newConversation(address);
      });
  
      const conversations = (await Promise.all(conversationPromises)).filter(Boolean);
      setGroup(conversations);
      setSelectedGroupId(groupId);
      setMessages([]); // Clear existing messages
  
      // Fetch message history for each conversation
      const messagePromises = conversations.map(async (conversation) => {
        try {
          // Fetch last 100 messages from each conversation
          const messages = await conversation.messages();
          return messages;
        } catch (err) {
          console.error(`Error fetching messages for ${conversation.peerAddress}:`, err);
          return [];
        }
      });
  
      // Wait for all message histories to be fetched
      const allMessageHistories = await Promise.all(messagePromises);
      
      // Combine all messages and sort by timestamp
      const allMessages = allMessageHistories
        .flat()
        .sort((a, b) => a.sent.getTime() - b.sent.getTime());
  
      // Update messages state with historical messages
      setMessages(allMessages);
      
      // Start streaming new messages from all conversations
      conversations.forEach(conv => {
        startMessageStream(conv).catch(err => {
          console.error('Error starting message stream:', err);
        });
      });
    } catch (error) {
      console.error('Error loading group:', error);
      setError(error.message || 'Failed to load group');
    } finally {
      setIsLoading(false);
    }
  };


  // Listen for wallet changes
  useEffect(() => {
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        setWallet(null);
        setClient(null);
        setGroup(null);
        setMessages([]);
        setMemberAddresses([]);
        setUserAddress('');
        setUserGroups([]); 
      });
    }
    // Only load groups if we have both user address and client
    if (userAddress && client) {
      console.log('Loading user groups for address:', userAddress);
      loadUserGroups();
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, [userAddress, client,messages]);

  return (
    <div className="h-screen bg-gray-50 text-black">
      <div className="h-full flex">
        {/* Left Sidebar */}
        <div className="w-80 bg-white text-gray-800 flex flex-col border-r border-gray-200">
          {/* Sidebar Header */}
          <div className="p-4 bg-white flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                {userAddress ? userAddress.slice(0, 2) : '?'}
              </div>
              <div className="font-medium truncate text-gray-700">
                {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Not Connected'}
              </div>
            </div>
            <Settings className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
          </div>

          {/* Search Bar */}
          <div className="p-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups"
                className="w-full bg-gray-50 text-gray-700 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto">
            {!wallet ? (
              <div className="p-6 text-center">
                <button
                  onClick={initializeClient}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                >
                  Connect Wallet
                </button>
              </div>
            ) : !client ? (
              <div className="p-6 text-center">
                <button
                  onClick={initializeXMTP}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                >
                  Initialize XMTP
                </button>
              </div>
            ) : (
              <>
                {userGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      loadGroup(group.id);
                      setShowCreateGroup(false);
                    }}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-all ${
                      selectedGroupId === group.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Group {group.id.slice(-4)}</div>
                        <div className="text-sm text-gray-500">
                          {group.members.length} members
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* New Group Button */}
          {client && (
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="p-4 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center space-x-2 border-t border-gray-200"
            >
              <Plus className="w-5 h-5" />
              <span>New Group</span>
            </button>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {client && (showCreateGroup ? (
            // Create Group Form
            <div className="flex-1 bg-white">
              <div className="p-4 bg-white text-gray-800 flex items-center space-x-4 border-b border-gray-200">
                <button 
                  onClick={() => {
                    if (selectedGroupId) {
                      setShowCreateGroup(false);
                    }
                  }}
                  className="hover:bg-gray-100 p-2 rounded-full transition-all"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold">Create New Group</h2>
              </div>
              
              <div className="p-6 max-w-2xl mx-auto">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <input
                      type="text"
                      value={newMemberAddress}
                      onChange={(e) => setNewMemberAddress(e.target.value)}
                      placeholder="Enter wallet address"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <button
                      onClick={addMember}
                      disabled={isLoading || !newMemberAddress}
                      className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      Add Member
                    </button>
                  </div>

                  {memberAddresses.length > 0 && (
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="text-lg font-medium mb-4 text-gray-700">Added Members</h3>
                      <div className="space-y-3">
                        {memberAddresses.map((address, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <span className="font-mono text-sm text-gray-600">{address}</span>
                            <button
                              onClick={() => setMemberAddresses(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={createGroup}
                    disabled={isLoading || memberAddresses.length === 0}
                    className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isLoading ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </div>
            </div>
          ) : selectedGroupId && group ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white text-gray-800 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-medium text-lg text-gray-700">Group {selectedGroupId.slice(-4)}</div>
                    <div className="text-sm text-gray-500">
                      {group.length} members
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div 
                id="message-container"
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.senderAddress === userAddress ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl px-6 py-3 shadow-sm ${
                        msg.senderAddress === userAddress
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <div className={`text-xs ${msg.senderAddress === userAddress ? 'text-blue-100' : 'text-gray-500'} mb-1`}>
                        {msg.senderAddress?.slice(0, 6)}...{msg.senderAddress?.slice(-4)}
                      </div>
                      <div>
                        {msg.content}
                      </div>
                      <div className={`text-xs ${msg.senderAddress === userAddress ? 'text-blue-100' : 'text-gray-400'} text-right mt-1`}>
                        {new Date(msg.sent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="bg-white p-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message"
                    className="flex-1 p-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !newMessage.trim()}
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            // No chat selected state
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-medium text-gray-800">Welcome to XMTP Chat</h3>
                <p className="text-gray-500 mt-2">Select a group or create a new one to start chatting</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupChat;