import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../app/App";

describe("Cricket Scorer Integration - Settings and Help Center Journey", () => {
  it("should simulate preferences modification and help center interactive usage", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Verify Home header buttons exist
    const settingsBtn = await screen.findByRole("button", { name: /Settings/i });
    const helpBtn = screen.getByRole("button", { name: /Help Center/i });
    expect(settingsBtn).toBeInTheDocument();
    expect(helpBtn).toBeInTheDocument();

    // 2. Open Help Center
    await user.click(helpBtn);
    await screen.findByText("RunBook Help Center");

    // Check default tab is "Quick Start"
    expect(screen.getByText("1. Create a Match")).toBeInTheDocument();

    // Switch to Keypad Legend tab
    const keypadTabBtn = screen.getByRole("button", { name: /Keypad Legend/i });
    await user.click(keypadTabBtn);
    expect(screen.getByText("No Key Selected")).toBeInTheDocument();

    // Tap 'W' key in the mock keypad legend
    const keyW = screen.getByRole("button", { name: /^W$/ });
    await user.click(keyW);
    expect(screen.queryByText("No Key Selected")).not.toBeInTheDocument();
    expect(screen.getByText("Wicket fell. Opens Wicket Sheet to input details (batsman, fielder, type).")).toBeInTheDocument();

    // Switch to Rules & Formats tab
    const rulesTabBtn = screen.getByRole("button", { name: /Rules & Formats/i });
    await user.click(rulesTabBtn);
    expect(screen.getByText("Supported Cricket Formats")).toBeInTheDocument();

    // Switch to FAQs tab
    const faqTabBtn = screen.getByRole("button", { name: /FAQs/i });
    await user.click(faqTabBtn);
    expect(screen.getByPlaceholderText(/Search FAQs/i)).toBeInTheDocument();

    // Type query "mistake"
    const searchInput = screen.getByPlaceholderText(/Search FAQs/i);
    await user.type(searchInput, "mistake");

    // Click back out of Help to Home
    const backBtn = screen.getByRole("button", { name: /Go Back/i });
    await user.click(backBtn);
    await screen.findByRole("button", { name: /New Match/i });

    // 3. Open Settings Screen
    const settingsBtnReloaded = screen.getByRole("button", { name: /Settings/i });
    await user.click(settingsBtnReloaded);
    await screen.findByText("App Settings");

    // Toggle Theme settings (Click DARK)
    const darkThemeBtn = screen.getByRole("button", { name: /DARK/ });
    await user.click(darkThemeBtn);

    // Save changes
    const saveSettingsBtn = screen.getByRole("button", { name: /Save/i });
    await user.click(saveSettingsBtn);

    // Should return to Home
    await screen.findByRole("button", { name: /New Match/i });

    // Check theme was applied in document element class list
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
