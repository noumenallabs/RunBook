import { test, expect } from '@playwright/test';

test.describe('StumpScore E2E User Journey', () => {
  test('should allow a user to set up and score a cricket match', async ({ page }) => {
    // 1. Visit App Home
    await page.goto('/');
    await expect(page.locator('span', { hasText: 'RunBook' }).first()).toBeVisible();

    // Verify dark theme configuration on home screen
    await page.click('button[aria-label="Settings"]');
    await expect(page.locator('text=App Settings')).toBeVisible();
    await page.click('button:has-text("DARK")');
    await page.click('button:has-text("Save")');

    // Reload page to verify persistence
    await page.reload();
    let isDarkMode = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkMode).toBe(true);

    // Toggle back to Light mode
    await page.click('button[aria-label="Settings"]');
    await page.click('button:has-text("LIGHT")');
    await page.click('button:has-text("Save")');
    await page.reload();
    isDarkMode = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkMode).toBe(false);

    // 2. Click "New Match"
    await page.click('button:has-text("New Match")');

    // 3. Step 1: Set format and team names
    await expect(page.locator('text=New Match Setup')).toBeVisible();
    await page.click('button:has-text("custom")');

    // Set overs to 1
    const oversInput = page.locator('input[type="number"]').first();
    await oversInput.fill('1');

    await page.fill('input[placeholder="Team A Name"]', 'Titans');
    await page.fill('input[placeholder="Team B Name"]', 'Warriors');

    await page.click('button:has-text("Set Up Rosters →")');

    // 4. Step 2: Team A Roster Setup
    await expect(page.locator('text=Roster: Titans')).toBeVisible();
    const playerNameInput = page.locator('input[placeholder="Player Name"]');
    const addBtn = page.locator('button:has-text("Add")');

    await playerNameInput.fill('Striker A');
    await addBtn.click();
    await playerNameInput.fill('Non-Striker A');
    await addBtn.click();

    await page.click('button:has-text("Save & Set Up Team B")');

    // 5. Step 3: Team B Roster Setup
    await expect(page.locator('text=Roster: Warriors')).toBeVisible();
    await playerNameInput.fill('Bowler B');
    await addBtn.click();
    await playerNameInput.fill('Fielder B');
    await addBtn.click();

    await page.click('button:has-text("Done & Proceed to Toss")');

    // 6. Step 4: Toss Setup
    await expect(page.locator('text=Coin Toss')).toBeVisible();
    await page.click('button:has-text("Skip Toss")');
    await page.click('button:has-text("Start Match")');

    // 7. Step 5: Innings Setup
    await expect(page.locator('text=Innings 1 Setup')).toBeVisible();
    await page.click('button:has-text("Start Innings")');

    // 8. Live Scoring Keypad
    await expect(page.locator('[role="region"][aria-label="Ball Entry Keypad"]')).toBeVisible();

    // Score 1 run (use locator by aria-label)
    await page.click('button[aria-label="Score 1 run"]');
    await expect(page.locator('text=1/0')).toBeVisible();

    // Record Wide (use locator by exact aria-label)
    await page.click('button[aria-label="Record Wide (1 extra)"]');
    await expect(page.locator('text=2/0')).toBeVisible();
  });
});
