document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const storageKey = 'antigravity-theme';

    // 1. Check for saved user preference
    const savedTheme = localStorage.getItem(storageKey);

    // 2. Default to 'dark' if no preference, or respect saved preference
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    } else {
        // Explicitly set dark as default if not set (matches HTML default)
        htmlElement.setAttribute('data-theme', 'dark');
    }

    // 3. Toggle Logic
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(storageKey, newTheme);
    });
});
