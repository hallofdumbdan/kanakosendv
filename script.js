let activeIntervals = [];

function logMessage(message, color = 'inherit') {
    const logs = document.getElementById('logs');
    const time = new Date().toLocaleTimeString();
    logs.innerHTML += `<span style="color: ${color}">[${time}] ${message}</span><br>`;
    logs.scrollTop = logs.scrollHeight;
}

function addRow() {
    const container = document.getElementById('mapping-container');
    const row = document.createElement('div');
    row.className = 'mapping-row';
    
    row.innerHTML = `
        <input type="password" class="row-token" placeholder="Token">
        <span class="separator">:</span>
        <input type="text" class="row-channel" placeholder="Channel ID">
        <button onclick="removeRow(this)" class="remove-btn">−</button>
    `;
    
    container.appendChild(row);
}

function removeRow(btn) {
    const row = btn.parentElement;
    row.remove();
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

    const firstSuccess = await attempt();
    if (!firstSuccess) return;

    const interval = setInterval(async () => {
        const success = await attempt();
        if (!success) clearInterval(interval);
    }, delay * 1000);

    activeIntervals.push(interval);
}

async function startSending() {
    const message = document.getElementById('message').value.trim();
    const delay = parseFloat(document.getElementById('delay').value);
    const rows = document.querySelectorAll('.mapping-row');

    if (!message || rows.length === 0 || isNaN(delay)) {
        alert('Please enter a message, add at least one account pair, and a valid delay.');
        return;
    }

    stopSending();
    logMessage('Initializing tasks...', '#2196f3');

    let taskCount = 0;
    rows.forEach(row => {
        const token = row.querySelector('.row-token').value.trim();
        const channel = row.querySelector('.row-channel').value.trim();
        
        if (token && channel) {
            runTask(token, channel, message, delay);
            taskCount++;
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

// Initialize with one empty row
window.onload = addRow;
