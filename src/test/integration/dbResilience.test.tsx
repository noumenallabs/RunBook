import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../../app/App';
import * as matchStore from '../../db/matchStore';

describe('Database Resilience & Error Boundary Tests', () => {
  it('should display Toast error when starting a match fails due to storage limits', async () => {
    const user = userEvent.setup();

    // Mock saveEvent to simulate IndexedDB QuotaExceededError
    const saveEventSpy = vi.spyOn(matchStore, 'saveEvent').mockRejectedValue(new Error('QuotaExceededError'));

    render(<App />);

    // Start a new match setup
    const newMatchBtn = await screen.findByRole('button', { name: /New Match/i });
    await user.click(newMatchBtn);

    // Step 1: Team names configuration
    const teamAInput = screen.getByPlaceholderText(/Team A Name/i);
    const teamBInput = screen.getByPlaceholderText(/Team B Name/i);
    await user.clear(teamAInput);
    await user.type(teamAInput, 'Strikers');
    await user.clear(teamBInput);
    await user.type(teamBInput, 'Chargers');

    const nextBtn = screen.getByRole('button', { name: /^Next$/i });
    await user.click(nextBtn);

    // Verify toast notification warns the user that starting match failed
    await waitFor(() => {
      expect(screen.getByText(/Failed to start match: storage is full or unavailable/i)).toBeInTheDocument();
    });

    // Clean up spy
    saveEventSpy.mockRestore();
  });

  it('should display Toast warning when recording a delivery fails mid-match', async () => {
    const user = userEvent.setup();

    // Render normally first
    render(<App />);

    // Start a new match setup
    const newMatchBtn = await screen.findByRole('button', { name: /New Match/i });
    await user.click(newMatchBtn);

    // Step 1: Team names configuration
    const teamAInput = screen.getByPlaceholderText(/Team A Name/i);
    const teamBInput = screen.getByPlaceholderText(/Team B Name/i);
    await user.clear(teamAInput);
    await user.type(teamAInput, 'Strikers');
    await user.clear(teamBInput);
    await user.type(teamBInput, 'Chargers');

    const nextBtn = screen.getByRole('button', { name: /^Next$/i });
    await user.click(nextBtn);

    // Step 2: Roster Screen Team A
    await screen.findByText(/Roster: Strikers/i);
    const playerNameInput = screen.getByPlaceholderText('Player Name');
    const addBtn = screen.getByRole('button', { name: /Add/i });

    await user.type(playerNameInput, 'Striker A');
    await user.click(addBtn);
    await user.type(playerNameInput, 'Non-Striker A');
    await user.click(addBtn);

    const saveTeamBBtn = screen.getByRole('button', { name: /Save & Set Up Team B/i });
    await user.click(saveTeamBBtn);

    // Step 3: Roster Screen Team B
    await screen.findByText(/Roster: Chargers/i);
    await user.type(playerNameInput, 'Bowler B');
    await user.click(addBtn);
    await user.type(playerNameInput, 'Fielder B');
    await user.click(addBtn);

    const doneRosterBtn = screen.getByRole('button', { name: /Done & Proceed to Toss/i });
    await user.click(doneRosterBtn);

    // Step 4: Coin Toss Screen
    await screen.findByText(/Coin Toss/i);
    const skipTossBtn = screen.getByText(/Skip toss/i);
    await user.click(skipTossBtn);

    const startMatchBtn = screen.getByRole('button', { name: /Start Match/i });
    await user.click(startMatchBtn);

    // Step 5: Innings 1 Setup Screen
    await screen.findByText(/Innings 1 Setup/i);
    const startInnings1Btn = screen.getByRole('button', { name: /Start Innings/i });
    await user.click(startInnings1Btn);

    // We are now on the scoring screen.
    await screen.findByRole('region', { name: /Ball Entry Keypad/i });

    // Spy on saveEvent to fail for subsequent scoring actions
    const saveEventSpy = vi.spyOn(matchStore, 'saveEvent').mockRejectedValue(new Error('QuotaExceededError'));

    // Try to score a single run
    const dotBallBtn = await screen.findByRole('button', { name: /Score 1 run/i });
    await user.click(dotBallBtn);

    // Verify toast notification warns the user that saving match data failed
    await waitFor(() => {
      expect(screen.getByText(/Failed to save match data: storage is full or unavailable/i)).toBeInTheDocument();
    });

    saveEventSpy.mockRestore();
  });
});
