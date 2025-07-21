// js/common.js

/**
 * Checks if the user has completed the onboarding process.
 * If not, it displays the onboarding modal.
 */
export function handleOnboarding() {
    const onboardingComplete = localStorage.getItem('ryxide_onboarding_complete');
    if (!onboardingComplete) {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            const startButton = document.getElementById('start-onboarding-btn');
            if (startButton) {
                startButton.addEventListener('click', () => {
                    localStorage.setItem('ryxide_onboarding_complete', 'true');
                    overlay.classList.add('hidden');
                });
            }
        }
    }
}

/**
 * Generates a file-safe timestamp string for exports.
 * Format: HH-MM-SS_MM-DD-YYYY
 * @returns {string} The formatted timestamp.
 */
export function getFormattedTimestamp() {
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, '0');

    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const month = pad(now.getMonth() + 1); // Months are 0-indexed
    const day = pad(now.getDate());
    const year = now.getFullYear();

    return `${hours}-${minutes}-${seconds}_${month}-${day}-${year}`;
}
