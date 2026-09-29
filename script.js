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
    
    // Immediate first attempt
    const success = await sendMessage(channelID, token, message);
    if (success) {
        logMessage(`${tokenId} $\rightarrow$ ${channelID}: Success`, '#4caf50');
    } else {
        logMessage(`${tokenId} $\rightarrow$ ${channelID}: Failed`, '#f44336');
        return; // Stop this specific loop if it fails
    }

    // Set up the loop
    const interval = setInterval(async () => {
        const success = await sendMessage(channelID, token, message);
        if (success) {
            logMessage(`${tokenId} $\rightarrow$ ${channelID}: Success`, '#4caf50');
        } else {
            logMessage(`${tokenId} $\rightarrow$ ${channelID}: Failed. Stopping loop.`, '#f44336');
            clearInterval(interval);
        }
    }, delay * 1000);

    activeIntervals.push(interval);
}

async function startSending() {
    const mode = document.getElementById('mode').value;
    const message = document.getElementById('message').value.trim();
    const delay = parseFloat(document.getElementById('delay').value);
    
    // Parse textareas into arrays, trimming whitespace and removing empty lines
    const tokens = document.getElementById('token').value.split('\n').map(t => t.trim()).filter(t => t !== "");
    const channels = document.getElementById('channel').value.split('\n').map(c => c.trim()).filter(c => c !== "");

    if (!message || tokens.length === 0 || channels.length === 0 || isNaN(delay)) {
        alert('Please ensure message, at least one token, at least one channel, and a valid delay are provided.');
        return;
    }

    stopSending(); // Clear any existing loops before starting new ones
    logMessage(`Starting mode: ${mode}`, '#2196f3');

    let tasks = [];

    if (mode === 'single') {
        tasks.push({ t: tokens[0], c: channels[0] });
    } 
    else if (mode === 'many_to_one') {
        tokens.forEach(t => tasks.push({ t, c: channels[0] }));
    } 
    else if (mode === 'one_to_many') {
        channels.forEach(c => tasks.push({ t: tokens[0], c }));
    } 
    else if (mode === 'many_to_many') {
        // Pair tokens with channels, cycling channels if there are more tokens
        tokens.forEach((t, index) => {
            tasks.push({ t, c: channels[index % channels.length] });
        });
    }

    tasks.forEach(task => {
        runTask(task.t, task.c, message, delay);
    });
}

function stopSending() {
    if (activeIntervals.length > 0) {
        activeIntervals.forEach(clearInterval);
        activeIntervals = [];
        logMessage('All sending loops stopped.', '#ffeb3b');
    }
}