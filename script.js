let activeIntervals = [];

function logMessage(message, color = 'inherit') {
    const logs = document.getElementById('logs');
    const time = new Date().toLocaleTimeString();
    logs.innerHTML += `<span style="color: ${color}">[${time}] ${message}</span><br>`;
    logs.scrollTop = logs.scrollHeight;
}

async function sendMessage(channelID, userToken, content) {
    try {
        const response = await fetch(`https://discord.com/api/v9/channels/${channelID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': userToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function runTask(token, channelID, message, delay) {
    const tokenId = `...${token.slice(-6)}`;
    
    const attempt = async () => {
        const success = await sendMessage(channelID, token, message);
        if (success) {
            logMessage(`${tokenId} $\rightarrow$ ${channelID}: Success`, '#4caf50');
        } else {
            logMessage(`${tokenId} $\rightarrow$ ${channelID}: Failed. Stopping loop.`, '#f44336');
            return false;
        }
        return true;
    };

    // Immediate first attempt
    const firstSuccess = await attempt();
    if (!firstSuccess) return;

    // Set up the loop
    const interval = setInterval(async () => {
        const success = await attempt();
        if (!success) {
            clearInterval(interval);
        }
    }, delay * 1000);

    activeIntervals.push(interval);
}

async function startSending() {
    const message = document.getElementById('message').value.trim();
    const delay = parseFloat(document.getElementById('delay').value);
    const mappingText = document.getElementById('mapping').value.trim();

    if (!message || !mappingText || isNaN(delay)) {
        alert('Please fill in the message, mapping, and a valid delay.');
        return;
    }

    stopSending();
    logMessage('Initializing mapping...', '#2196f3');

    const lines = mappingText.split('\n');
    let taskCount = 0;

    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length === 2) {
            const token = parts[0].trim();
            const channel = parts[1].trim();
            if (token && channel) {
                runTask(token, channel, message, delay);
                taskCount++;
            }
        }
    });

    if (taskCount === 0) {
        logMessage('No valid token:channel pairs found.', '#f44336');
    } else {
        logMessage(`Started ${taskCount} active task(s).`, '#2196f3');
    }
}

function stopSending() {
    if (activeIntervals.length > 0) {
        activeIntervals.forEach(clearInterval);
        activeIntervals = [];
        logMessage('All sending loops stopped.', '#ffeb3b');
    }
}
