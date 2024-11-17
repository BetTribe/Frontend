"use client"
import React,{useState} from 'react'
const page = () => {
    const [newMemberAddress, setNewMemberAddress] = useState('');
    const [memberAddresses, setMemberAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
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
  return (
    <div>
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
  )
}

export default page
