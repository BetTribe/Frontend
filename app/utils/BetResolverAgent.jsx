import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const BetResolverAgent = ({ betPrompt, onResolution }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentState, setAgentState] = useState({ type: 'start' });
  const [matchData, setMatchData] = useState(null);

  // Function to parse bet prompt into structured data
  const parseBetPrompt = (prompt) => {
    const betTypes = {
      'will win': 'win',
      'will score': 'score',
      'will keep clean sheet': 'cleansheet',
    };

    let betType = null;
    let team = null;
    let condition = null;

    // Find bet type
    for (const [key, value] of Object.entries(betTypes)) {
      if (prompt.toLowerCase().includes(key)) {
        betType = value;
        break;
      }
    }

    // Extract team name - assuming team name is before the bet type
    const words = prompt.split(' ');
    const betTypeIndex = words.findIndex(word => 
      Object.keys(betTypes).some(type => type.includes(word))
    );
    
    if (betTypeIndex > 0) {
      team = words.slice(0, betTypeIndex).join(' ');
    }

    return {
      betType,
      team,
      condition: true // Default condition
    };
  };

  // Function to fetch match data
  const fetchMatchData = async () => {
    try {
      const response = await fetch(
        'https://api.soccersapi.com/v2.2/livescores/?user=mehndirattayashika5&token=0b9e1d1f20057b008d8b43cb43cfc58d&t=ended'
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching match data:', error);
      return null;
    }
  };

  // Function to evaluate bet
  const evaluateBet = (parsedBet, matchData) => {
    const match = matchData.find(match => 
      match.teams.home.name.toLowerCase() === parsedBet.team.toLowerCase() ||
      match.teams.away.name.toLowerCase() === parsedBet.team.toLowerCase()
    );

    if (!match) return null;

    const isHomeTeam = match.teams.home.name.toLowerCase() === parsedBet.team.toLowerCase();
    const homeScore = parseInt(match.scores.home_score);
    const awayScore = parseInt(match.scores.away_score);

    switch (parsedBet.betType) {
      case 'win':
        return isHomeTeam ? homeScore > awayScore : awayScore > homeScore;
      case 'score':
        return isHomeTeam ? homeScore > 0 : awayScore > 0;
      case 'cleansheet':
        return isHomeTeam ? awayScore === 0 : homeScore === 0;
      default:
        return null;
    }
  };

  useEffect(() => {
    const processPrompt = async () => {
      if (!betPrompt) return;

      try {
        setIsProcessing(true);
        
        // START state
        setAgentState({
          type: 'start',
          prompt: betPrompt
        });

        // PLAN state
        const parsedBet = parseBetPrompt(betPrompt);
        setAgentState({
          type: 'plan',
          plan: `Will fetch match data to check if ${parsedBet.team} ${parsedBet.betType}`
        });

        // ACTION state
        const data = await fetchMatchData();
        setMatchData(data);
        setAgentState({
          type: 'action',
          action: 'fetchMatchData',
          input: parsedBet
        });

        // OBSERVATION state
        const result = evaluateBet(parsedBet, data);
        setAgentState({
          type: 'observation',
          observation: result
        });

        // OUTPUT state
        setAgentState({
          type: 'output',
          output: result
        });

        // Notify parent component
        if (onResolution) {
          onResolution(result);
        }

      } catch (error) {
        console.error('Error processing bet:', error);
        setAgentState({
          type: 'error',
          error: error.message
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPrompt();
  }, [betPrompt]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Bet Resolution Agent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Agent State Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Agent State</h3>
            <div className="space-y-2">
              {agentState.type === 'start' && (
                <div className="text-blue-600">
                  Processing prompt: {agentState.prompt}
                </div>
              )}
              {agentState.type === 'plan' && (
                <div className="text-green-600">
                  Plan: {agentState.plan}
                </div>
              )}
              {agentState.type === 'action' && (
                <div className="text-yellow-600">
                  Executing: {agentState.action}
                </div>
              )}
              {agentState.type === 'observation' && (
                <div className="text-purple-600">
                  Observation: {agentState.observation ? 'True' : 'False'}
                </div>
              )}
              {agentState.type === 'output' && (
                <div className="text-indigo-600 font-bold">
                  Result: {agentState.output ? 'Bet Won' : 'Bet Lost'}
                </div>
              )}
              {agentState.type === 'error' && (
                <div className="text-red-600">
                  Error: {agentState.error}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Processing bet...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BetResolverAgent;
