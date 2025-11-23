import React, { useState, useCallback } from "react";
import SingleElimination from "./singleElemination";
import DoubleElimination from "./DoubleElemination,jsx";

// Main App Component
function TournamentBracketApp() {
  const [participants, setParticipants] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [tournamentType, setTournamentType] = useState("single"); // 'single' or 'double'
  const [bracketData, setBracketData] = useState({
    type: "single",
    rounds: [],
    upperBracketRounds: [],
    lowerBracketRounds: [],
    grandFinalMatch: null,
    champion: null,
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const addParticipantsFromInput = () => {
    if (inputValue.trim() === "") {
      setError("Participant input cannot be empty.");
      return;
    }
    const namesArray = inputValue
      .split(/[\n,]+/)
      .map((name) => name.trim())
      .filter((name) => name !== "");
    if (namesArray.length === 0) {
      setError("No valid participant names entered.");
      return;
    }
    let addedCount = 0,
      duplicateCount = 0;
    let newParticipants = [...participants];
    namesArray.forEach((name) => {
      if (!newParticipants.includes(name)) {
        newParticipants.push(name);
        addedCount++;
      } else duplicateCount++;
    });
    setParticipants(newParticipants);
    setInputValue("");
    setError("");
    showSuccess(
      `${addedCount} participant(s) added. ${
        duplicateCount > 0 ? duplicateCount + " duplicate(s) ignored." : ""
      }`
    );
  };

  const handleInputChange = (e) => setInputValue(e.target.value);
  const handleTournamentTypeChange = (e) => {
    setTournamentType(e.target.value);
    // Clear existing bracket data when type changes, as structure is different
    setBracketData({
      type: e.target.value,
      rounds: [],
      upperBracketRounds: [],
      lowerBracketRounds: [],
      grandFinalMatch: null,
      champion: null,
    });
  };
  const removeParticipant = (nameToRemove) => {
    setParticipants(participants.filter((name) => name !== nameToRemove));
    showSuccess(`${nameToRemove} removed.`);
  };
  const clearParticipants = () => {
    setParticipants([]);
    setBracketData({
      type: tournamentType,
      rounds: [],
      upperBracketRounds: [],
      lowerBracketRounds: [],
      grandFinalMatch: null,
      champion: null,
    });
    setError("");
    if (participants.length > 0) showSuccess("All participants cleared.");
  };

  const generateNewBracket = useCallback(() => {
    if (participants.length === 0) {
      setError("Please add at least 1 participant.");
      // Preserve current type, clear data
      setBracketData((prev) => ({
        ...prev,
        rounds: [],
        upperBracketRounds: [],
        lowerBracketRounds: [],
        grandFinalMatch: null,
        champion: null,
      }));
      return;
    }
    setError("");
    let result;
    if (tournamentType === "single") {
      result = SingleElimination(participants);
      if (result.error) {
        setError(result.error);
        setBracketData({ type: "single", rounds: [], champion: null });
      } else {
        setBracketData({
          type: "single",
          rounds: result.rounds || [],
          champion: result.champion || null,
          upperBracketRounds: [],
          lowerBracketRounds: [],
          grandFinalMatch: null,
        });
        showSuccess("Single elimination tournament generated!");
      }
    } else {
      // Double elimination
      result = DoubleElimination(participants);
      if (result.error) {
        setError(result.error);
        setBracketData({
          type: "double",
          upperBracketRounds: [],
          lowerBracketRounds: [],
          grandFinalMatch: null,
          champion: null,
          rounds: [],
        });
      } else {
        setBracketData({
          type: "double",
          upperBracketRounds: result.upperBracketRounds || [],
          lowerBracketRounds: result.lowerBracketRounds || [],
          grandFinalMatch: result.grandFinalMatch || null,
          champion: result.champion || null, // Champion usually TBD for DE until GF
          rounds: [], // Clear single elim rounds
        });
        showSuccess("Double elimination tournament generated!");
      }
    }
  }, [participants, tournamentType]);

  const getPlayerDisplay = (player, isWinner = false) => {
    if (player === null || player === undefined)
      return <span className="text-gray-500">TBD</span>;
    if (player === "BYE")
      return <span className="italic text-gray-400">BYE</span>;
    // Make "Loser of..." and "Winner of..." placeholders more distinct
    if (
      String(player).startsWith("Loser of UB") ||
      String(player).startsWith("Winner of UB") ||
      String(player).startsWith("Loser of LB") ||
      String(player).startsWith("Winner of LB")
    ) {
      return (
        <span className="text-yellow-400 italic text-xs sm:text-sm">
          {player}
        </span>
      );
    }
    return (
      <span
        className={`${isWinner ? "font-bold text-green-400" : ""} truncate`}
      >
        {player}
      </span>
    );
  };

  const exportSchedule = () => {
    const {
      type,
      rounds,
      upperBracketRounds,
      lowerBracketRounds,
      grandFinalMatch,
      champion,
    } = bracketData;
    let hasData = false;
    if (type === "single") hasData = (rounds && rounds.length > 0) || champion;
    else
      hasData =
        (upperBracketRounds && upperBracketRounds.length > 0) ||
        (lowerBracketRounds && lowerBracketRounds.length > 0) ||
        grandFinalMatch ||
        champion;

    if (!hasData) {
      setError("No schedule to export.");
      return;
    }
    setError("");
    let scheduleText = "";

    if (type === "single") {
      scheduleText =
        "Single Elimination Tournament Schedule\n====================================\n\n";
      if (champion && participants.length === 1) {
        scheduleText += `CHAMPION (Auto-Win): ${champion}\n\n`;
      }
      (rounds || []).forEach((round, roundIndex) => {
        if (!Array.isArray(round)) return;
        scheduleText += `Round ${roundIndex + 1}\n---------------------\n`;
        round.forEach((match, matchIdx) => {
          const p1 = match.pair[0] || "TBD";
          const p2 =
            match.pair[1] === "WINNER!" ? "WINNER!" : match.pair[1] || "TBD";
          scheduleText += `  Match ${matchIdx + 1} (ID: ${
            match.id
          }): ${p1} vs ${p2}\n`;
          if (match.winner && match.winner !== "BYE" && match.winner !== null) {
            if (match.pair[1] === "BYE")
              scheduleText += `    Winner: ${match.winner} (advances due to BYE)\n`;
            else if (match.pair[1] === "WINNER!")
              scheduleText += `    Winner: ${match.winner} (Champion)\n`;
          } else if (
            !match.winner &&
            p1 !== "BYE" &&
            p1 !== "TBD" &&
            p2 !== "BYE" &&
            p2 !== "TBD" &&
            p2 !== "WINNER!"
          ) {
            scheduleText += `    Winner: TBD\n`;
          }
          scheduleText += "\n";
        });
      });
      if (champion && participants.length > 1) {
        scheduleText += `====================================\nCHAMPION: ${champion}\n====================================\n`;
      }
    } else {
      // Double Elimination
      scheduleText =
        "Double Elimination Tournament Schedule\n====================================\n\n";
      if (champion && participants.length === 1) {
        scheduleText += `CHAMPION (Auto-Win): ${champion}\n\n`;
      }
      if (upperBracketRounds && upperBracketRounds.length > 0) {
        scheduleText += "--- UPPER BRACKET ---\n";
        upperBracketRounds.forEach((round, roundIndex) => {
          if (!Array.isArray(round)) return;
          scheduleText += `Upper Bracket Round ${
            roundIndex + 1
          }\n---------------------\n`;
          round.forEach((match) => {
            const p1 = match.pair[0] || "TBD";
            const p2 =
              match.pair[1] === "WINNER!" ? "WINNER!" : match.pair[1] || "TBD";
            scheduleText += `  Match ${match.matchIndexInRound + 1} (ID: ${
              match.id
            }): ${p1} vs ${p2}\n`;
            if (
              match.winner &&
              match.winner !== "BYE" &&
              match.winner !== null &&
              !String(match.winner).startsWith("Winner of")
            ) {
              if (match.pair.includes("BYE"))
                scheduleText += `    Winner: ${match.winner} (advances due to BYE)\n`;
              else if (match.pair[1] === "WINNER!")
                scheduleText += `    Winner: ${match.winner} (Champion of UB)\n`;
            } else if (
              !match.winner &&
              p1 !== "BYE" &&
              p1 !== "TBD" &&
              p2 !== "BYE" &&
              p2 !== "TBD" &&
              p2 !== "WINNER!"
            ) {
              scheduleText += `    Winner: TBD\n`;
            }
            scheduleText += "\n";
          });
        });
      }
      if (lowerBracketRounds && lowerBracketRounds.length > 0) {
        scheduleText += "\n--- LOWER BRACKET ---\n";
        lowerBracketRounds.forEach((round, roundIndex) => {
          if (!Array.isArray(round)) return;
          scheduleText += `Lower Bracket Round ${
            roundIndex + 1
          }\n---------------------\n`;
          round.forEach((match) => {
            const p1 = match.pair[0] || "TBD";
            const p2 = match.pair[1] || "TBD";
            scheduleText += `  Match ${match.matchIndexInRound + 1} (ID: ${
              match.id
            }): ${p1} vs ${p2}\n`;
            if (
              match.winner &&
              match.winner !== "BYE" &&
              match.winner !== null &&
              !String(match.winner).startsWith("Winner of")
            ) {
              if (match.pair.includes("BYE"))
                scheduleText += `    Winner: ${match.winner} (advances due to BYE)\n`;
            } else if (
              !match.winner &&
              p1 !== "BYE" &&
              p1 !== "TBD" &&
              p2 !== "BYE" &&
              p2 !== "TBD"
            ) {
              scheduleText += `    Winner: TBD\n`;
            }
            scheduleText += "\n";
          });
        });
      }
      if (grandFinalMatch && grandFinalMatch.length > 0) {
        scheduleText += "\n--- GRAND FINAL ---\n";
        const gf = grandFinalMatch[0];
        scheduleText += `Match ${gf.matchIndexInRound + 1} (ID: ${gf.id}): ${
          gf.pair[0]
        } vs ${gf.pair[1]}\n  Winner: TBD\n\n`;
      }
      if (champion && participants.length > 1) {
        // Overall DE champion (usually TBD unless auto-advanced)
        scheduleText += `====================================\nOVERALL CHAMPION: ${champion}\n====================================\n`;
      }
    }

    const blob = new Blob([scheduleText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_elim_schedule.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showSuccess("Schedule exported successfully!");
  };

  const renderSingleElimination = () => {
    if (!bracketData.rounds || bracketData.rounds.length === 0) return null;
    return bracketData.rounds.map((round, roundIndex) => {
      if (!Array.isArray(round) || round.length === 0) return null;
      const isFinalRound = roundIndex === bracketData.rounds.length - 1;
      let roundTitle = `Round ${roundIndex + 1}`;
      if (
        isFinalRound &&
        participants.length > 1 &&
        !(round.length === 1 && round[0].pair[1] === "WINNER!")
      ) {
        roundTitle += " - Final";
      }
      // Don't render round if it's the single participant winner round (handled by champion display)
      if (
        bracketData.champion &&
        participants.length === 1 &&
        round[0]?.pair[1] === "WINNER!"
      )
        return null;

      return (
        <div key={`sR-${roundIndex}`} className="mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-teal-300 mb-3 border-b-2 border-gray-700 pb-2">
            {roundTitle}
          </h3>
          <ul className="space-y-3">
            {round.map(
              (
                match,
                matchIdx // Added matchIdx for key if IDs are not perfectly unique across regeneration
              ) => (
                <li
                  key={`${match.id}-${matchIdx}`}
                  className="p-3 bg-gray-700 rounded-lg shadow hover:bg-gray-600 transition-colors"
                >
                  <div className="text-xs font-medium text-teal-200 mb-1">
                    Match {matchIdx + 1}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-1 sm:space-y-0">
                    <div className="flex-1 text-center sm:text-left">
                      {getPlayerDisplay(
                        match.pair[0],
                        match.winner === match.pair[0] &&
                          match.pair[0] !== "BYE"
                      )}
                    </div>
                    <span className="mx-2 text-xs text-gray-400 font-semibold">
                      {match.pair[1] === "WINNER!" ? "is the" : "VS"}
                    </span>
                    <div className="flex-1 text-center sm:text-right">
                      {getPlayerDisplay(
                        match.pair[1] === "WINNER!"
                          ? "CHAMPION!"
                          : match.pair[1],
                        match.winner === match.pair[1] &&
                          match.pair[1] !== "BYE"
                      )}
                    </div>
                  </div>
                  {match.pair[1] === "BYE" &&
                    match.winner &&
                    match.winner !== "BYE" &&
                    match.winner !== null && (
                      <p className="text-xs text-green-400 mt-1 text-center">
                        {getPlayerDisplay(match.winner)} advances (BYE)
                      </p>
                    )}
                  {!match.winner &&
                    match.pair[0] !== "BYE" &&
                    match.pair[1] !== "BYE" &&
                    match.pair[0] !== null &&
                    match.pair[1] !== null &&
                    match.pair[1] !== "WINNER!" && (
                      <p className="text-xs text-yellow-400 mt-1 text-center">
                        Winner TBD
                      </p>
                    )}
                </li>
              )
            )}
          </ul>
        </div>
      );
    });
  };

  const renderDoubleEliminationSection = (rounds, titlePrefix) => {
    if (!rounds || rounds.length === 0) return null;
    return rounds.map((round, roundIndex) => {
      if (!Array.isArray(round) || round.length === 0) return null;
      const isFinalBracketRound =
        roundIndex === rounds.length - 1 && round.length === 1;
      let roundTitle = `${titlePrefix} Round ${
        round.length > 0 ? round[0].round + 1 : roundIndex + 1
      }`; // Use round number from match data if available

      if (isFinalBracketRound && titlePrefix !== "Grand Final") {
        // Grand Final is always "Grand Final Round 1"
        const match = round[0];
        if (
          match.winner &&
          match.winner !== "BYE" &&
          match.winner !== null &&
          !String(match.winner).startsWith("Winner of")
        ) {
          roundTitle = `${titlePrefix} Winner: ${getPlayerDisplay(
            match.winner
          )}`;
        } else if (
          !match.winner &&
          !match.pair.includes("BYE") &&
          !match.pair.includes(null)
        ) {
          roundTitle += ` Final`; // e.g. Upper Bracket Final
        }
      }

      return (
        <div
          key={`${titlePrefix}-round-${roundIndex}`}
          className="mb-6 sm:mb-8"
        >
          <h3 className="text-lg sm:text-xl font-semibold text-teal-300 mb-3 border-b-2 border-gray-700 pb-2">
            {roundTitle}
          </h3>
          <ul className="space-y-3">
            {round.map(
              (
                match,
                matchIdx // Added matchIdx for key
              ) => (
                <li
                  key={`${match.id}-${matchIdx}`}
                  className="p-3 bg-gray-700 rounded-lg shadow hover:bg-gray-600"
                >
                  <div className="text-xs font-medium text-teal-200 mb-1">
                    Match {match.matchIndexInRound + 1}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-1 sm:space-y-0">
                    <div className="flex-1 text-center sm:text-left">
                      {getPlayerDisplay(
                        match.pair[0],
                        match.winner === match.pair[0] &&
                          match.pair[0] !== "BYE"
                      )}
                    </div>
                    <span className="mx-2 text-xs text-gray-400 font-semibold">
                      VS
                    </span>
                    <div className="flex-1 text-center sm:text-right">
                      {getPlayerDisplay(
                        match.pair[1],
                        match.winner === match.pair[1] &&
                          match.pair[1] !== "BYE"
                      )}
                    </div>
                  </div>
                  {match.pair.includes("BYE") &&
                    match.winner &&
                    match.winner !== "BYE" &&
                    match.winner !== null && (
                      <p className="text-xs text-green-400 mt-1 text-center">
                        {getPlayerDisplay(match.winner)} advances (BYE)
                      </p>
                    )}
                  {!match.winner &&
                    !match.pair.includes("BYE") &&
                    !match.pair.includes(null) && (
                      <p className="text-xs text-yellow-400 mt-1 text-center">
                        Winner TBD
                      </p>
                    )}
                </li>
              )
            )}
          </ul>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mb-8 p-4 sm:p-6 bg-gray-800 rounded-xl shadow-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-teal-400 mb-6">
          Tournament Manager
        </h1>

        <div className="mb-4">
          <label
            htmlFor="tournamentTypeSelect"
            className="block text-sm font-medium text-teal-300 mb-1"
          >
            Tournament Type:
          </label>
          <select
            id="tournamentTypeSelect"
            value={tournamentType}
            onChange={handleTournamentTypeChange}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          >
            <option value="single">Single Elimination</option>
            <option value="double">Double Elimination</option>
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="participantInput"
            className="block text-sm font-medium text-teal-300 mb-1"
          >
            Enter participant names (one per line or comma-separated):
          </label>
          <textarea
            id="participantInput"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="e.g.&#10;Alice&#10;Bob, Charlie&#10;Diana"
            rows="3"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
          />
        </div>
        <button
          onClick={addParticipantsFromInput}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold p-3 rounded-lg transition-colors mb-4 shadow-md"
        >
          Add Participants
        </button>

        {error && (
          <p className="text-red-400 text-sm mb-3 text-center p-2 bg-red-900 bg-opacity-30 rounded-md">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="text-green-400 text-sm mb-3 text-center p-2 bg-green-900 bg-opacity-30 rounded-md">
            {successMessage}
          </p>
        )}

        {participants.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-teal-300 mb-2">
              Participants ({participants.length}):
            </h2>
            <ul className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto bg-gray-700 p-3 rounded-lg custom-scrollbar">
              {participants.map((name, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-2 bg-gray-600 hover:bg-gray-500 rounded-md"
                >
                  <span className="truncate pr-2">{name}</span>
                  <button
                    onClick={() => removeParticipant(name)}
                    className="text-red-400 hover:text-red-300 text-xs font-medium px-2 py-1 rounded hover:bg-red-700"
                  >
                    {" "}
                    Remove{" "}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={generateNewBracket}
            disabled={
              participants.length === 0 && bracketData.champion === null
            }
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-md"
          >
            Generate Tournament
          </button>
          <button
            onClick={clearParticipants}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Tournament Schedule Display Area */}
      {((bracketData.type === "single" &&
        ((bracketData.rounds && bracketData.rounds.length > 0) ||
          bracketData.champion)) ||
        (bracketData.type === "double" &&
          ((bracketData.upperBracketRounds &&
            bracketData.upperBracketRounds.length > 0) ||
            (bracketData.lowerBracketRounds &&
              bracketData.lowerBracketRounds.length > 0) ||
            bracketData.grandFinalMatch ||
            bracketData.champion))) && (
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl p-4 sm:p-6 bg-gray-800 rounded-xl shadow-2xl mt-8">
          {" "}
          {/* Added mt-8 for spacing */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-teal-400 mb-2 sm:mb-0">
              {bracketData.type === "single"
                ? "Single Elimination Schedule"
                : "Double Elimination Schedule"}
            </h2>
            <button
              onClick={exportSchedule}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md text-sm"
            >
              Export Schedule
            </button>
          </div>
          {bracketData.champion && participants.length === 1 && (
            <div className="mb-6 sm:mb-8 p-4 bg-yellow-500 text-gray-900 rounded-lg shadow-lg text-center">
              <h3 className="text-xl sm:text-2xl font-bold">🏆 CHAMPION 🏆</h3>
              <p className="text-lg sm:text-xl">
                {getPlayerDisplay(bracketData.champion)}
              </p>
            </div>
          )}
          {bracketData.type === "single" &&
            participants.length > 1 &&
            renderSingleElimination()}
          {bracketData.type === "double" && participants.length > 1 && (
            <>
              {bracketData.upperBracketRounds &&
                bracketData.upperBracketRounds.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-2xl font-bold text-center text-sky-400 mb-4">
                      UPPER BRACKET
                    </h2>
                    {renderDoubleEliminationSection(
                      bracketData.upperBracketRounds,
                      "Upper Bracket"
                    )}
                  </section>
                )}
              {bracketData.lowerBracketRounds &&
                bracketData.lowerBracketRounds.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-2xl font-bold text-center text-orange-400 mb-4">
                      LOWER BRACKET
                    </h2>
                    {renderDoubleEliminationSection(
                      bracketData.lowerBracketRounds,
                      "Lower Bracket"
                    )}
                  </section>
                )}
              {bracketData.grandFinalMatch &&
                bracketData.grandFinalMatch.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold text-center text-red-400 mb-4">
                      GRAND FINAL
                    </h2>
                    {renderDoubleEliminationSection(
                      bracketData.grandFinalMatch,
                      "Grand Final"
                    )}
                  </section>
                )}
            </>
          )}
          {bracketData.champion &&
            participants.length > 1 &&
            bracketData.type === "single" && (
              <div className="mt-8 p-4 bg-yellow-500 text-gray-900 rounded-lg shadow-lg text-center">
                <h3 className="text-xl sm:text-2xl font-bold">
                  🏆 CHAMPION 🏆
                </h3>
                <p className="text-lg sm:text-xl">
                  {getPlayerDisplay(bracketData.champion)}
                </p>
              </div>
            )}
          {bracketData.champion &&
            participants.length > 1 &&
            bracketData.type === "double" && (
              <div className="mt-8 p-4 bg-yellow-500 text-gray-900 rounded-lg shadow-lg text-center">
                <h3 className="text-xl sm:text-2xl font-bold">
                  🏆 OVERALL CHAMPION 🏆
                </h3>
                <p className="text-lg sm:text-xl">
                  {getPlayerDisplay(bracketData.champion)}
                </p>
              </div>
            )}
          {((bracketData.type === "single" &&
            bracketData.rounds &&
            bracketData.rounds.length > 0) ||
            (bracketData.type === "double" &&
              ((bracketData.upperBracketRounds &&
                bracketData.upperBracketRounds.length > 0) ||
                (bracketData.lowerBracketRounds &&
                  bracketData.lowerBracketRounds.length > 0)))) &&
            !bracketData.champion &&
            participants.length > 1 && (
              <p className="mt-6 text-sm text-gray-400 text-center">
                Note: Winners are automatically advanced for BYE matches.
                Interactive winner selection is not yet implemented.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

export default TournamentBracketApp;
