// Constants for match types and special values
const MATCH_TYPES = {
  SINGLE_ELIMINATION: "SE",
};

const SPECIAL_VALUES = {
  BYE: "BYE",
  WINNER: "WINNER!",
};

/**
 * Fisher-Yates shuffle algorithm for truly random array shuffling
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generates a single elimination tournament bracket
 * @param {Array<string>} participantsArray - Array of participant names
 * @returns {Object} - Tournament bracket data with rounds, champion, and error
 */
const SingleElimination = (participantsArray) => {
  // Input validation
  if (!Array.isArray(participantsArray)) {
    return {
      rounds: [],
      champion: null,
      error: "Invalid input: participants must be an array.",
    };
  }

  const players = participantsArray.filter(
    (p) => p !== null && p !== undefined && p !== ""
  );

  // Edge case: No participants
  if (players.length === 0) {
    return {
      rounds: [],
      champion: null,
      error: "Please add at least 1 participant.",
    };
  }

  // Edge case: Single participant is automatic champion
  if (players.length === 1) {
    return {
      rounds: [
        [
          {
            id: "sR0M0",
            pair: [players[0], SPECIAL_VALUES.WINNER],
            winner: players[0],
            type: MATCH_TYPES.SINGLE_ELIMINATION,
          },
        ],
      ],
      champion: players[0],
      error: null,
    };
  }

  // Shuffle players for fairness using Fisher-Yates algorithm
  const shuffledPlayers = shuffleArray(players);

  const allRounds = [];
  let currentEntrants = [...shuffledPlayers];
  let roundNum = 0;
  const maxRounds = Math.ceil(Math.log2(players.length)) + 2; // More precise safety limit

  // Generate rounds until only one winner remains
  while (currentEntrants.length > 1 && roundNum < maxRounds) {
    const currentRoundMatches = [];
    const nextRoundEntrants = [];
    const activeEntrantsThisRound = [...currentEntrants];

    // Handle odd number of entrants (one gets a bye)
    if (activeEntrantsThisRound.length % 2 !== 0) {
      const byeRecipient = selectByeRecipient(activeEntrantsThisRound);
      const byeRecipientIndex = activeEntrantsThisRound.indexOf(byeRecipient);

      if (byeRecipientIndex !== -1) {
        // Remove bye recipient from active entrants
        activeEntrantsThisRound.splice(byeRecipientIndex, 1);

        // Create bye match
        currentRoundMatches.push({
          id: `sR${roundNum}M${currentRoundMatches.length}`,
          pair: [byeRecipient, SPECIAL_VALUES.BYE],
          winner: byeRecipient,
          type: MATCH_TYPES.SINGLE_ELIMINATION,
        });

        // Bye recipient advances to next round
        nextRoundEntrants.push(byeRecipient);
      }
    }

    // Pair remaining entrants
    for (let i = 0; i < activeEntrantsThisRound.length; i += 2) {
      const p1 = activeEntrantsThisRound[i];
      const p2 = activeEntrantsThisRound[i + 1];

      // Safety check: ensure p2 exists
      if (p2 === undefined) {
        // If odd number after bye handling, last player gets a bye
        nextRoundEntrants.push(p1);
        continue;
      }

      currentRoundMatches.push({
        id: `sR${roundNum}M${currentRoundMatches.length}`,
        pair: [p1, p2],
        winner: null, // Winner to be determined
        type: MATCH_TYPES.SINGLE_ELIMINATION,
      });

      // Placeholder for winner (TBD)
      nextRoundEntrants.push(null);
    }

    // Add round if it has matches
    if (currentRoundMatches.length > 0) {
      allRounds.push(currentRoundMatches);
    }

    // Filter out undefined values and prepare for next round
    currentEntrants = nextRoundEntrants.filter((e) => e !== undefined);
    roundNum++;
  }

  // Determine final champion
  const finalChampion = determineChampion(allRounds, players);

  return {
    rounds: allRounds,
    champion: finalChampion,
    error: null,
  };
};

/**
 * Selects a bye recipient from active entrants
 * Prefers actual players over null/TBD values
 * @param {Array} entrants - Array of entrants
 * @returns {*} - Selected bye recipient
 */
const selectByeRecipient = (entrants) => {
  // Shuffle to randomize bye selection
  const shuffled = shuffleArray(entrants);

  // Prefer actual players (non-null values)
  const actualPlayer = shuffled.find((entrant) => entrant !== null);
  if (actualPlayer !== undefined) {
    return actualPlayer;
  }

  // If all are null/TBD, return first one
  return entrants[0];
};

/**
 * Determines the champion from the bracket rounds
 * @param {Array} allRounds - All tournament rounds
 * @param {Array} originalPlayers - Original player list
 * @returns {string|null} - Champion name or null
 */
const determineChampion = (allRounds, originalPlayers) => {
  if (allRounds.length === 0) {
    return originalPlayers.length === 1 ? originalPlayers[0] : null;
  }

  const lastRound = allRounds[allRounds.length - 1];

  // Champion is the winner of the final match
  if (
    Array.isArray(lastRound) &&
    lastRound.length === 1 &&
    lastRound[0].winner &&
    lastRound[0].winner !== null
  ) {
    return lastRound[0].winner;
  }

  return null;
};

export default SingleElimination;
