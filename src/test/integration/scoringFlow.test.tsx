import React from "react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../app/App";

describe("Cricket Scorer Integration - Scoring Flow", () => {
  it("should simulate a complete match scoring journey with real user behaviors", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Home Screen: Tap New Match
    const newMatchBtn = await screen.findByRole("button", { name: /New Match/i });
    expect(newMatchBtn).toBeInTheDocument();
    await user.click(newMatchBtn);

    // 2. Match Setup Screen (Step 1 of 5)
    await screen.findByText(/New Match Setup/i);
    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();

    // Select custom format to set a 1-over match
    const customFormatBtn = screen.getByRole("button", { name: /^custom$/i });
    await user.click(customFormatBtn);

    // Edit custom total overs to 1 over
    const customOversInput = screen.getAllByRole("spinbutton")[0];
    fireEvent.change(customOversInput, { target: { value: "1" } });

    // Fill in Team names
    const teamAInput = screen.getByPlaceholderText("Team A Name");
    const teamBInput = screen.getByPlaceholderText("Team B Name");
    await user.clear(teamAInput);
    await user.type(teamAInput, "Strikers");
    await user.clear(teamBInput);
    await user.type(teamBInput, "Chargers");

    // Click Next
    const nextBtn = screen.getByRole("button", { name: /^Next$/i });
    await user.click(nextBtn);

    // 3. Roster Screen: Team A (Step 2 of 5)
    await screen.findByText(/Roster: Strikers/i);
    expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();

    // Add Player A1 (striker)
    const playerNameInput = screen.getByPlaceholderText("Player Name");
    await user.type(playerNameInput, "Striker A");
    const addBtn = screen.getByRole("button", { name: /Add/i });
    await user.click(addBtn);

    // Add Player A2 (non-striker)
    await user.type(playerNameInput, "Non-Striker A");
    await user.click(addBtn);

    // Click Save & Set Up Team B
    const saveTeamBBtn = screen.getByRole("button", { name: /Save & Set Up Team B/i });
    await user.click(saveTeamBBtn);

    // 4. Roster Screen: Team B (Step 3 of 5)
    await screen.findByText(/Roster: Chargers/i);
    expect(screen.getByText(/Step 3 of 5/i)).toBeInTheDocument();

    // Add Player B1
    await user.type(playerNameInput, "Bowler B");
    await user.click(addBtn);

    // Add Player B2
    await user.type(playerNameInput, "Fielder B");
    await user.click(addBtn);

    // Add Player B3 (to trigger unequal team size warning!)
    await user.type(playerNameInput, "Extra B");
    await user.click(addBtn);

    // Click Done & Proceed to Toss
    const doneRosterBtn = screen.getByRole("button", { name: /Done & Proceed to Toss/i });
    await user.click(doneRosterBtn);

    // Verify Unequal Team Sizes warning modal is shown
    await screen.findByText(/Unequal Team Sizes/i);
    const proceedAnywayBtn = screen.getByRole("button", { name: /Proceed Anyway/i });
    await user.click(proceedAnywayBtn);

    // 5. Toss Screen (Step 4 of 5)
    await screen.findByText(/Coin Toss/i);
    expect(screen.getByText(/Step 4 of 5/i)).toBeInTheDocument();

    // Skip toss
    const skipTossBtn = screen.getByText(/Skip toss/i);
    await user.click(skipTossBtn);

    // Select BAT (default should match selection)
    const batOptionBtn = await screen.findByRole("button", { name: /BAT/i });
    await user.click(batOptionBtn);

    // Start Match
    const startMatchBtn = screen.getByRole("button", { name: /Start Match/i });
    await user.click(startMatchBtn);

    // 6. Innings 1 Setup (Step 5 of 5)
    await screen.findByText(/Innings 1 Setup/i);
    const startInnings1Btn = screen.getByRole("button", { name: /Start Innings/i });
    await user.click(startInnings1Btn);

    // 7. Live Scoring Screen (Scoring Innings 1)
    await screen.findByRole("region", { name: /Ball Entry Keypad/i });

    // Tap 1 (Single)
    const key1 = screen.getByRole("button", { name: /Score 1 run/i });
    await user.click(key1);
    await waitFor(() => {
      // Verify score is 1/0
      expect(screen.getByText(/1\/0/i)).toBeInTheDocument();
    });

    // Tap WD (Wide extra)
    const keyWD = screen.getByRole("button", { name: /Record Wide/i });
    await user.click(keyWD);
    await waitFor(() => {
      // Score increases by 1 extra, now 2/0, but balls count remains 1 ball (0.1 overs)
      expect(screen.getByText(/2\/0/i)).toBeInTheDocument();
    });

    // Tap NB (No-ball extra)
    const keyNB = screen.getByRole("button", { name: /Record No-Ball/i });
    await user.click(keyNB);
    await waitFor(() => {
      // Score increases by 1 extra, now 3/0, balls count remains 1 ball (0.1 overs)
      // Free hit banner should appear
      expect(screen.getByText(/3\/0/i)).toBeInTheDocument();
      expect(screen.getByText(/Free Hit/i)).toBeInTheDocument();
    });

    // Tap 6 (Six)
    const key6 = screen.getByRole("button", { name: /Score 6 runs/i });
    await user.click(key6);
    await waitFor(() => {
      // Score becomes 9/0 (3 + 6)
      expect(screen.getByText(/9\/0/i)).toBeInTheDocument();
    });

    // Tap W (Wicket)
    const keyW = screen.getByRole("button", { name: /Record a Wicket/i });
    await user.click(keyW);
 
    // Wicket Sheet Dialog should appear
    await screen.findByText(/Confirm Wicket/i);
    // Click Bowled (which should be the default)
    const confirmWicketBtn = screen.getByRole("button", { name: /Confirm Wicket/i });
    await user.click(confirmWicketBtn);
 
    // Wicket count increases to 1. Since team only has 2 players, they are now all out!
    // The screen transitions directly to the Innings Break screen.
    await screen.findByText(/End of Innings 1/i);
    expect(screen.getByText(/Target Set/i)).toBeInTheDocument();
 
    // Start Innings 2
    const startInnings2Btn = screen.getByRole("button", { name: /Start Innings 2/i });
    await user.click(startInnings2Btn);
 
    // Innings 2 setup screen
    await screen.findByText(/Opening Batters/i);
    const startInnings2ConfirmBtn = screen.getByRole("button", { name: /Start Innings/i });
    await user.click(startInnings2ConfirmBtn);
 
    // Score Innings 2 to complete match
    // Target is 10 runs to win. Let's score a six and a four!
    await screen.findByRole("region", { name: /Ball Entry Keypad/i });
    const key6Innings2 = screen.getByRole("button", { name: /Score 6 runs/i });
    await user.click(key6Innings2);
    await waitFor(() => {
      expect(screen.getByText(/6\/0/i)).toBeInTheDocument();
    });
 
    const key4Innings2 = screen.getByRole("button", { name: /Score 4 runs/i });
    await user.click(key4Innings2);
 
    // Match completed, should redirect to Result/Summary screen
    await waitFor(() => {
      expect(screen.getByText(/^Player of the Match$/i)).toBeInTheDocument();
    }, { timeout: 8000 });
    expect(screen.getByText(/won by/i)).toBeInTheDocument();
  }, 15000);
});
