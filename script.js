document.addEventListener('DOMContentLoaded', () => {
    // State
    let timeOffset = 0; // Difference between server time and local time (ms)
    let isSynced = false;

    // Elements
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const dateEl = document.getElementById('date');
    const ampmEl = document.getElementById('ampm');
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Create sync indicator
    const syncIndicator = document.createElement('div');
    syncIndicator.className = 'sync-indicator';
    syncIndicator.textContent = 'Syncing...';
    document.querySelector('.clock-container').appendChild(syncIndicator);

    // NTP Sync Function
    async function syncTime() {
        try {
            syncIndicator.textContent = 'Syncing...';
            syncIndicator.style.opacity = '1';

            const start = performance.now();
            const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Tokyo');
            const data = await response.json();
            const end = performance.now();

            // Network latency adjustment (rough estimate: half of round trip)
            const latency = (end - start) / 2;

            const serverTime = new Date(data.datetime).getTime();
            const localTime = Date.now();

            // Calculate offset: Server Time - Local Time
            // We adding the latency to serverTime because it took `latency` ms to get here
            timeOffset = (serverTime + latency) - localTime;

            isSynced = true;
            syncIndicator.textContent = 'Synced (NTP)';
            setTimeout(() => { syncIndicator.style.opacity = '0.5'; }, 2000);

            console.log(`Time synced. Offset: ${Math.round(timeOffset)}ms`);
        } catch (error) {
            console.error('Sync failed:', error);
            // If running strictly locally without a server, this is expected.
            syncIndicator.textContent = 'Standard Mode (Offline)';
            syncIndicator.style.opacity = '0.5';
            // Retry in 1 minute
            setTimeout(syncTime, 60000);
        }
    }

    // High Precision Clock Loop
    function updateClock() {
        const nowMs = Date.now() + timeOffset;
        const now = new Date(nowMs);

        // Time components
        let h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();
        const ms = now.getMilliseconds();

        // Date components
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
        const dayName = daysOfWeek[now.getDay()];

        // Zero padding and formatting
        hoursEl.textContent = String(h).padStart(2, '0');
        minutesEl.textContent = String(m).padStart(2, '0');
        secondsEl.textContent = String(s).padStart(2, '0');

        // Date String
        dateEl.textContent = `${year}年${month}月${day}日 (${dayName})`;

        // Schedule next update for the start of the next second to be efficient?
        // Actually, requestAnimationFrame is better for smooth verification, 
        // but for a digital clock, we just need to ensure we catch the second change immediately.
        // Running every frame ensures we change the number exactly when ms rolls over 0.
        requestAnimationFrame(updateClock);
    }

    // Theme Logic
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);

    function toggleTheme() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    // Event Listeners
    themeToggle.addEventListener('click', toggleTheme);

    // Initial Start
    syncTime();
    // Re-sync every 10 minutes
    setInterval(syncTime, 600000);

    // Start loop immediately
    requestAnimationFrame(updateClock);
});
