let activeIntervals = [];

function logMessage(message, color = '#e0e0e0') {
    const logs = document.getElementById('logs');
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logs.innerHTML += `<div class="log-entry"><span class="log-time">${time}</span> <span style="color: ${color}">${message}</span></div>`;
    logs.scrollTop = logs.scrollHeight;
}

function addRow() {
    const container = document.getElementById('mapping-container');
    const row = document.createElement('div');
    row.className = 'mapping-row';
    
    row.innerHTML = `
        <div class="input-group">
            <input type="password" class="row-token" placeholder="Token">
        </div>
        <span class="row-sep">→</span>
        <div class="input-group">
            <input type="text" class="row-channel" placeholder="Channel ID">
        </div>
        <button onclick="removeRow(this)" class="remove-row-btn" title="Remove">&times;</button>
    `;
    
    container.appendChild(row);
}

function removeRow(btn) {
    btn.closest('.mapping-row').remove();
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
            logMessage(`${tokenId} $\rightarrow$ ${channelID}: Success`, '#43b581');
        } else {
            logMessage(`${tokenId} $\rightarrow$ ${channelID}: Failed. Stopping loop.`, '#f04747');
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
        alert('Please ensure message, at least one account pair, and a valid delay are provided.');
        return;
    }

    stopSending();
    logMessage('Initializing deployment...', '#5865f2');

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
        logMessage('No valid account pairs found.', '#f04747');
    } else {
        logMessage(`${taskCount} active threads deployed.`, '#5865f2');
    }
}

function stopSending() {
    if (activeIntervals.length > 0) {
        activeIntervals.forEach(clearInterval);
        activeIntervals = [];
        logMessage('All threads terminated.', '#faa61a');
    }
}

window.onload = addRow;
