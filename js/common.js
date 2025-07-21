// js/common.js

/**
 * Checks if the user has completed the onboarding process.
 * If not, it displays the onboarding modal.
 */
export function handleOnboarding() {
    const onboardingComplete = localStorage.getItem('ryxide_onboarding_complete');
    if (!onboardingComplete) {
        // Find the modal on the current page. If it exists, show it.
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
