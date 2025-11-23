// Constants for match types and special values
const MATCH_TYPES = {
  UPPER_BRACKET: "UB",
  LOWER_BRACKET: "LB",
  GRAND_FINAL: "GF",
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
 * Calculates the next power of 2 greater than or equal to the given number
 * @param {number} num - Input number
 * @returns {number} - Next power of 2
 */
const getNextPowerOfTwo = (num) => {
  let power = 2;
  while (power < num) {
    power *= 2;
  }
  return power;
};

/**
 * Creates a match object with consistent structure
 * @param {string} id - Match ID
 * @param {Array} pair - Array of two participants
 * @param {string|null} winner - Winner of the match
 * @param {string|null} loser - Loser of the match
 * @param {string} type - Match type (UB, LB, GF)
 * @param {number} round - Round number
 * @param {number} matchIndexInRound - Index of match within the round
 * @returns {Object} - Match object
 */
const createMatch = (
  id,
  pair,
  winner,
  loser,
  type,
  round,
  matchIndexInRound
) => ({
  id,
  pair,
  winner,
  loser,
  type,
  round,
  matchIndexInRound,
});

/**
 * Determines winner and loser for a match based on participants
 * @param {*} p1 - First participant
 * @param {*} p2 - Second participant
 * @param {string} matchId - Match ID for placeholder generation
 * @returns {Object} - Object with winner and loser
 */
const determineMatchOutcome = (p1, p2, matchId) => {
  if (p1 === SPECIAL_VALUES.BYE && p2 === SPECIAL_VALUES.BYE) {
    return { winner: SPECIAL_VALUES.BYE, loser: SPECIAL_VALUES.BYE };
  }
  if (p1 === SPECIAL_VALUES.BYE) {
    return { winner: p2, loser: p1 };
  }
  if (p2 === SPECIAL_VALUES.BYE) {
    return { winner: p1, loser: p2 };
  }
  // Real match - winner/loser TBD
  return {
    winner: null,
    loser: `Loser of ${matchId}`,
  };
};

/**
 * Extracts losers from upper bracket rounds for lower bracket
 * @param {Array} upperBracketRound - Upper bracket round matches
 * @returns {Array} - Array of losers (excluding BYEs)
 */
const extractUbLosers = (upperBracketRound) => {
  if (!Array.isArray(upperBracketRound)) return [];
  return upperBracketRound
    .map((match) => {
      if (match.loser && match.loser !== SPECIAL_VALUES.BYE) {
        return match.loser;
      }
      return null;
    })
    .filter((loser) => loser !== null);
};

/**
 * Generates upper bracket rounds for double elimination tournament
 * @param {Array<string>} players - Array of participant names
 * @returns {Object} - Object containing upperBracketRounds and ubWinner
 */
const generateUpperBracket = (players) => {
  // Pad to next power of 2
  const targetSize = getNextPowerOfTwo(players.length);
  const byesToAdd = targetSize - players.length;
  const ubPlayers = [...players];
  for (let i = 0; i < byesToAdd; i++) {
    ubPlayers.push(SPECIAL_VALUES.BYE);
  }

  // Shuffle participants and BYEs
  const shuffledPlayers = shuffleArray(ubPlayers);

  const upperBracketRounds = [];
  let ubCurrentEntrants = [...shuffledPlayers];
  let ubRoundNum = 0;
  const maxUbRounds = Math.ceil(Math.log2(targetSize)) + 2;

  while (ubCurrentEntrants.length > 1 && ubRoundNum < maxUbRounds) {
    // Safety: if only BYEs or nulls left, break
    if (
      ubCurrentEntrants.every((p) => p === SPECIAL_VALUES.BYE || p === null)
    ) {
      break;
    }

    const ubCurrentRoundMatches = [];
    const ubNextRoundEntrants = [];

    for (let i = 0; i < ubCurrentEntrants.length; i += 2) {
      const p1 = ubCurrentEntrants[i];
      const p2 = ubCurrentEntrants[i + 1];

      // Safety check for undefined p2
      if (p2 === undefined) {
        ubNextRoundEntrants.push(p1);
        continue;
      }

      const matchId = `ubR${ubRoundNum}M${ubCurrentRoundMatches.length}`;
      const { winner, loser } = determineMatchOutcome(p1, p2, matchId);

      const match = createMatch(
        matchId,
        [p1, p2],
        winner,
        loser,
        MATCH_TYPES.UPPER_BRACKET,
        ubRoundNum,
        ubCurrentRoundMatches.length
      );

      ubCurrentRoundMatches.push(match);
      ubNextRoundEntrants.push(winner);
    }

    if (ubCurrentRoundMatches.length > 0) {
      upperBracketRounds.push(ubCurrentRoundMatches);
    }

    // Filter out BYEs that don't advance alone
    ubCurrentEntrants = ubNextRoundEntrants.filter(
      (p) => p !== SPECIAL_VALUES.BYE || ubNextRoundEntrants.length > 1
    );
    if (
      ubCurrentEntrants.length === 1 &&
      ubCurrentEntrants[0] === SPECIAL_VALUES.BYE
    ) {
      ubCurrentEntrants = []; // A lone BYE cannot win the UB
    }

    ubRoundNum++;
  }

  // Determine UB Winner
  const ubWinner =
    ubCurrentEntrants.length === 1 &&
    ubCurrentEntrants[0] !== SPECIAL_VALUES.BYE &&
    ubCurrentEntrants[0] !== null
      ? ubCurrentEntrants[0]
      : upperBracketRounds.length > 0 &&
        upperBracketRounds[upperBracketRounds.length - 1].length === 1
      ? `Winner of ${upperBracketRounds[upperBracketRounds.length - 1][0].id}`
      : `Winner of UB (TBD)`;

  return { upperBracketRounds, ubWinner };
};

/**
 * Creates a bye match for a single entrant
 * @param {*} entrant - The entrant receiving the bye
 * @param {number} roundNum - Current round number
 * @param {number} matchIndex - Index of match in round
 * @param {string} bracketType - Type of bracket (LB)
 * @returns {Object} - Match object
 */
const createByeMatch = (entrant, roundNum, matchIndex, bracketType) => {
  return createMatch(
    `${bracketType.toLowerCase()}R${roundNum}M${matchIndex}`,
    [entrant, SPECIAL_VALUES.BYE],
    entrant,
    SPECIAL_VALUES.BYE,
    bracketType,
    roundNum,
    matchIndex
  );
};

/**
 * Generates lower bracket rounds for double elimination tournament
 * @param {Array} upperBracketRounds - Upper bracket rounds
 * @param {number} numPlayers - Number of initial players
 * @returns {Object} - Object containing lowerBracketRounds and lbWinner
 */
const generateLowerBracket = (upperBracketRounds, numPlayers) => {
  const lowerBracketRounds = [];
  const numActualUbRounds = upperBracketRounds.length;

  if (numActualUbRounds === 0) {
    return { lowerBracketRounds, lbWinner: null };
  }

  let lbRoundNumGlobal = 0;
  let previousLbRoundWinnersAndByes = [];
  const maxLbRounds = numPlayers * 2 + 5; // Safety limit

  // Process lower bracket stages
  for (
    let lbProcessingStage = 0;
    lbProcessingStage < 2 * numActualUbRounds && lbRoundNumGlobal < maxLbRounds;
    lbProcessingStage++
  ) {
    const currentLbRoundMatches = [];
    let entrantsForThisLbRound = [];

    // Determine entrants for this LB stage
    if (lbProcessingStage % 2 === 0) {
      // STAGE TYPE A: UB Losers drop and are potentially paired
      const ubRoundIndexToDropFrom = lbProcessingStage / 2;
      if (ubRoundIndexToDropFrom < numActualUbRounds) {
        const ubLosersToDrop = extractUbLosers(
          upperBracketRounds[ubRoundIndexToDropFrom]
        );
        entrantsForThisLbRound.push(...ubLosersToDrop);
      }

      // If not initial drop, use previous LB winners
      if (lbProcessingStage > 0 && entrantsForThisLbRound.length === 0) {
        entrantsForThisLbRound = [
          ...previousLbRoundWinnersAndByes.filter(
            (p) => p !== SPECIAL_VALUES.BYE
          ),
        ];
      }
    } else {
      // STAGE TYPE B: Winners from previous LB round play newly dropped UB Losers
      const ubRoundIndexToDropFrom = (lbProcessingStage - 1) / 2 + 1;
      let newUbLosersToDrop = [];
      if (ubRoundIndexToDropFrom < numActualUbRounds) {
        newUbLosersToDrop = extractUbLosers(
          upperBracketRounds[ubRoundIndexToDropFrom]
        );
      }
      entrantsForThisLbRound = [
        ...previousLbRoundWinnersAndByes.filter(
          (p) => p !== SPECIAL_VALUES.BYE
        ),
        ...newUbLosersToDrop,
      ];
    }

    // Shuffle entrants before pairing
    const shuffledEntrants = shuffleArray(entrantsForThisLbRound);
    let activeLbEntrantsForPairing = shuffledEntrants.filter(
      (p) => p !== null && p !== SPECIAL_VALUES.BYE
    );
    previousLbRoundWinnersAndByes = [];

    // Handle empty entrants case
    if (activeLbEntrantsForPairing.length === 0 && lbProcessingStage > 0) {
      if (lowerBracketRounds.length > 0) {
        const lastLbRoundMatches =
          lowerBracketRounds[lowerBracketRounds.length - 1];
        if (
          Array.isArray(lastLbRoundMatches) &&
          lastLbRoundMatches.length === 1 &&
          lastLbRoundMatches[0].winner
        ) {
          previousLbRoundWinnersAndByes.push(lastLbRoundMatches[0].winner);
        }
      }
      break;
    }

    // Handle single entrant (gets bye)
    if (activeLbEntrantsForPairing.length === 1) {
      const p1 = activeLbEntrantsForPairing[0];
      const byeMatch = createByeMatch(
        p1,
        lbRoundNumGlobal,
        currentLbRoundMatches.length,
        MATCH_TYPES.LOWER_BRACKET
      );
      currentLbRoundMatches.push(byeMatch);
      previousLbRoundWinnersAndByes.push(p1);
    } else if (
      activeLbEntrantsForPairing.length % 2 !== 0 &&
      activeLbEntrantsForPairing.length > 1
    ) {
      // Odd number > 1: one gets a bye
      const byeRecipient = activeLbEntrantsForPairing.pop();
      const byeMatch = createByeMatch(
        byeRecipient,
        lbRoundNumGlobal,
        currentLbRoundMatches.length,
        MATCH_TYPES.LOWER_BRACKET
      );
      currentLbRoundMatches.push(byeMatch);
      previousLbRoundWinnersAndByes.push(byeRecipient);
    }

    // Pair remaining entrants
    for (let j = 0; j < activeLbEntrantsForPairing.length; j += 2) {
      const p1 = activeLbEntrantsForPairing[j];
      const p2 = activeLbEntrantsForPairing[j + 1];

      if (p2 === undefined) {
        // Odd number after bye handling
        previousLbRoundWinnersAndByes.push(p1);
        continue;
      }

      const match = createMatch(
        `lbR${lbRoundNumGlobal}M${currentLbRoundMatches.length}`,
        [p1, p2],
        null,
        null,
        MATCH_TYPES.LOWER_BRACKET,
        lbRoundNumGlobal,
        currentLbRoundMatches.length
      );

      currentLbRoundMatches.push(match);
      previousLbRoundWinnersAndByes.push(null); // Placeholder for winner
    }

    if (currentLbRoundMatches.length > 0) {
      lowerBracketRounds.push(currentLbRoundMatches);
      lbRoundNumGlobal++;
    }

    // Check if LB is complete
    const actualLbAdvancers = previousLbRoundWinnersAndByes.filter(
      (w) => w !== null && w !== SPECIAL_VALUES.BYE
    );

    if (actualLbAdvancers.length === 1) {
      // Check if more UB losers are expected
      let moreUbDropsExpected = false;
      for (
        let futureStage = lbProcessingStage + 1;
        futureStage < 2 * numActualUbRounds;
        futureStage++
      ) {
        if (futureStage % 2 !== 0) {
          const futureUbDropRound = (futureStage - 1) / 2 + 1;
          if (futureUbDropRound < numActualUbRounds) {
            moreUbDropsExpected = true;
            break;
          }
        }
      }
      if (!moreUbDropsExpected) {
        break; // LB winner found
      }
    }
  }

  // Determine LB Winner
  const lbWinner =
    previousLbRoundWinnersAndByes.length === 1 &&
    previousLbRoundWinnersAndByes[0] !== null &&
    previousLbRoundWinnersAndByes[0] !== SPECIAL_VALUES.BYE
      ? previousLbRoundWinnersAndByes[0]
      : lowerBracketRounds.length > 0 &&
        Array.isArray(lowerBracketRounds[lowerBracketRounds.length - 1]) &&
        lowerBracketRounds[lowerBracketRounds.length - 1].length === 1
      ? `Winner of ${lowerBracketRounds[lowerBracketRounds.length - 1][0].id}`
      : `Winner of LB (TBD)`;

  return { lowerBracketRounds, lbWinner };
};

/**
 * Generates a double elimination tournament bracket
 * @param {Array<string>} participantsArray - Array of participant names
 * @returns {Object} - Tournament bracket data with rounds, champion, and error
 */
const DoubleElimination = (participantsArray) => {
  // Input validation
  if (!Array.isArray(participantsArray)) {
    return {
      upperBracketRounds: [],
      lowerBracketRounds: [],
      grandFinalMatch: null,
      champion: null,
      error: "Invalid input: participants must be an array.",
    };
  }

  const initialPlayers = participantsArray.filter(
    (p) => p !== null && p !== undefined && p !== ""
  );

  // Edge case: No participants
  if (initialPlayers.length === 0) {
    return {
      upperBracketRounds: [],
      lowerBracketRounds: [],
      grandFinalMatch: null,
      champion: null,
      error: "No participants.",
    };
  }

  // Edge case: Single participant is automatic champion
  if (initialPlayers.length === 1) {
    const champion = initialPlayers[0];
    return {
      upperBracketRounds: [
        [
          createMatch(
            "ubR0M0",
            [champion, SPECIAL_VALUES.WINNER],
            champion,
            null,
            MATCH_TYPES.UPPER_BRACKET,
            0,
            0
          ),
        ],
      ],
      lowerBracketRounds: [],
      grandFinalMatch: null,
      champion: champion,
      error: null,
    };
  }

  // Generate Upper Bracket
  const { upperBracketRounds, ubWinner } = generateUpperBracket(initialPlayers);

  // Early return if UB didn't generate properly
  if (upperBracketRounds.length === 0) {
    return {
      upperBracketRounds,
      lowerBracketRounds: [],
      grandFinalMatch: null,
      champion:
        ubWinner && !String(ubWinner).startsWith("Winner of") ? ubWinner : null,
      error: null,
    };
  }

  // Generate Lower Bracket
  const { lowerBracketRounds, lbWinner } = generateLowerBracket(
    upperBracketRounds,
    initialPlayers.length
  );

  // Generate Grand Final
  let grandFinalMatch = null;
  if (initialPlayers.length >= 2 && ubWinner && lbWinner) {
    grandFinalMatch = createMatch(
      "gfM0",
      [ubWinner, lbWinner],
      null,
      null,
      MATCH_TYPES.GRAND_FINAL,
      0,
      0
    );
  }

  return {
    upperBracketRounds,
    lowerBracketRounds,
    grandFinalMatch: grandFinalMatch ? [grandFinalMatch] : null,
    champion: null, // Champion determined after GF (not implemented interactively)
    error: null,
  };
};

export default DoubleElimination;
