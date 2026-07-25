// Game State
const gameState = {
    money: 5000,
    level: 1,
    rank: 'Novice',
    totalUnboxed: 0,
    collection: {},
    autoUnbox: false,
    autoBuy: false,
    autoUnboxInterval: null,
    autoUnboxSpeed: 3000, // milliseconds
    selectedBox: null,
    currentFilter: 'all',
};

// Squishy Database
const squishyDatabase = [
    // Common Squishies (Neutral color squishies)
    { id: 1, name: 'Butterscotch', rarity: 'common', value: 50, emoji: '🟤' },
    { id: 2, name: 'Lavender', rarity: 'common', value: 50, emoji: '💜' },
    { id: 3, name: 'Mint', rarity: 'common', value: 50, emoji: '💚' },
    { id: 4, name: 'Blueberry', rarity: 'common', value: 50, emoji: '💙' },
    
    // Rare Squishies
    { id: 5, name: 'Needoh Stress Ball', rarity: 'rare', value: 150, emoji: '🔴' },
    { id: 6, name: 'Squishmallow Cat', rarity: 'rare', value: 150, emoji: '🐱' },
    { id: 7, name: 'Bubble Tea', rarity: 'rare', value: 150, emoji: '🧋' },
    { id: 8, name: 'Strawberry Shortcake', rarity: 'rare', value: 150, emoji: '🍓' },
    
    // Epic Squishies
    { id: 9, name: 'Rainbow Dragon', rarity: 'epic', value: 400, emoji: '🌈' },
    { id: 10, name: 'Galaxy Slime', rarity: 'epic', value: 400, emoji: '✨' },
    { id: 11, name: 'Golden Bear', rarity: 'epic', value: 400, emoji: '🐻' },
    { id: 12, name: 'Crystal Unicorn', rarity: 'epic', value: 400, emoji: '🦄' },
    
    // Legendary Squishies
    { id: 13, name: 'Mythical Phoenix', rarity: 'legendary', value: 1000, emoji: '🔥' },
    { id: 14, name: 'Ancient Dragon', rarity: 'legendary', value: 1000, emoji: '🐉' },
    { id: 15, name: 'Cosmic Jellyfish', rarity: 'legendary', value: 1000, emoji: '👽' },
];

// Box Types with Rarity Tiers
const boxTypes = [
    { id: 1, name: 'Bronze Box', price: 100, rarity: 'bronze', chances: { common: 60, rare: 30, epic: 8, legendary: 2 }, restockTime: 30000, stock: 10 },
    { id: 2, name: 'Silver Box', price: 250, rarity: 'silver', chances: { common: 40, rare: 40, epic: 15, legendary: 5 }, restockTime: 45000, stock: 8 },
    { id: 3, name: 'Gold Box', price: 500, rarity: 'gold', chances: { common: 20, rare: 40, epic: 30, legendary: 10 }, restockTime: 60000, stock: 5 },
    { id: 4, name: 'Legendary Rainbow Box', price: 1000, rarity: 'legendary', chances: { common: 0, rare: 20, epic: 40, legendary: 40 }, restockTime: 90000, stock: 3 },
];

const boxStock = {};
const boxRestockTimers = {};

// Rank System
const rankSystem = [
    { rank: 'Novice', minBoxes: 0, bonusPercent: 0, exclusiveSquishies: [] },
    { rank: 'Collector', minBoxes: 10, bonusPercent: 5, exclusiveSquishies: [] },
    { rank: 'Master Unboxer', minBoxes: 50, bonusPercent: 15, exclusiveSquishies: [] },
    { rank: 'Legendary Hunter', minBoxes: 200, bonusPercent: 25, exclusiveSquishies: [] },
];

// Upgrades
const upgrades = {
    autoUnbox: { cost: 2000, owned: false, name: 'Auto Unbox (3s intervals)' },
    autoBuy: { cost: 3000, owned: false, name: 'Auto Buy (Bronze Boxes)' },
    speedUp: { cost: 1500, owned: false, name: 'Speed Up Auto Unbox' },
    moneyMultiplier: { cost: 2500, owned: false, name: 'Money 1.5x Multiplier' },
};

let moneyMultiplier = 1;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeBoxStock();
    renderBoxes();
    updateDisplay();
    setupEventListeners();
    setupModalListeners();
});

function initializeBoxStock() {
    boxTypes.forEach(box => {
        boxStock[box.id] = box.stock;
    });
}

function setupEventListeners() {
    document.getElementById('unboxBtn').addEventListener('click', performUnbox);
    document.getElementById('sellRandomBtn').addEventListener('click', sellRandom);
    document.getElementById('sellDuplicatesBtn').addEventListener('click', sellDuplicates);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentFilter = e.target.dataset.filter;
            renderCollection();
        });
    });
}

function setupModalListeners() {
    const modal = document.getElementById('squishyModal');
    const resultModal = document.getElementById('resultModal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
        if (e.target === resultModal) resultModal.style.display = 'none';
    });
    
    document.getElementById('continueBtn').addEventListener('click', () => {
        document.getElementById('resultModal').style.display = 'none';
    });
}

function renderBoxes() {
    const boxesGrid = document.getElementById('boxesGrid');
    boxesGrid.innerHTML = '';
    
    boxTypes.forEach(box => {
        const stock = boxStock[box.id];
        const boxEl = document.createElement('div');
        boxEl.className = `box-option ${gameState.selectedBox?.id === box.id ? 'selected' : ''} ${stock === 0 ? 'out-of-stock' : ''}`;
        boxEl.innerHTML = `
            <div class="box-name">${box.name}</div>
            <div class="box-price">💰 ${box.price}</div>
            <div class="box-rarity">${box.rarity.toUpperCase()}</div>
            <div class="box-stock">Stock: ${stock}/${box.stock}</div>
        `;
        
        if (stock > 0) {
            boxEl.addEventListener('click', () => selectBox(box));
        }
        
        boxesGrid.appendChild(boxEl);
    });
}

function selectBox(box) {
    if (boxStock[box.id] <= 0) return;
    
    gameState.selectedBox = box;
    document.getElementById('unboxBtn').disabled = false;
    document.getElementById('unboxBtn').textContent = `Unbox (💰${box.price})`;
    renderBoxes();
}

function performUnbox() {
    if (!gameState.selectedBox) return;
    if (gameState.money < gameState.selectedBox.price) {
        alert('Not enough money!');
        return;
    }
    
    const box = gameState.selectedBox;
    gameState.money -= box.price;
    boxStock[box.id]--;
    
    // Schedule restock
    if (boxStock[box.id] === 0) {
        scheduleRestock(box.id, box.restockTime);
    }
    
    // Determine squishy rarity
    const rarity = determineSquishy(box);
    const squishy = squishyDatabase.find(s => s.rarity === rarity);
    
    // Award money based on squishy value and rank bonus
    const rankBonus = getRankBonus();
    const earnedMoney = Math.floor(squishy.value * moneyMultiplier * (1 + rankBonus / 100));
    gameState.money += earnedMoney;
    
    // Add to collection
    addToCollection(squishy.id, earnedMoney, rankBonus);
    
    // Update stats
    gameState.totalUnboxed++;
    updateRank();
    
    // Show result
    showUnboxResult(squishy, earnedMoney, rankBonus);
    renderBoxes();
    updateDisplay();
}

function determineSquishy(box) {
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, chance] of Object.entries(box.chances)) {
        cumulative += chance;
        if (rand < cumulative) {
            return rarity;
        }
    }
    
    return 'common';
}

function addToCollection(squishyId, earnedMoney, rankBonus) {
    if (!gameState.collection[squishyId]) {
        gameState.collection[squishyId] = { count: 0, squishy: squishyDatabase.find(s => s.id === squishyId) };
    }
    gameState.collection[squishyId].count++;
}

function showUnboxResult(squishy, earnedMoney, rankBonus) {
    const modal = document.getElementById('resultModal');
    document.getElementById('resultImage').src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle'%3E${squishy.emoji}%3C/text%3E%3C/svg%3E`;
    document.getElementById('resultName').textContent = squishy.name;
    document.getElementById('resultRarity').textContent = squishy.rarity.toUpperCase();
    document.getElementById('earnedMoney').textContent = earnedMoney;
    document.getElementById('rankBonus').textContent = rankBonus;
    modal.style.display = 'block';
}

function getRankBonus() {
    const currentRank = rankSystem.find(r => r.rank === gameState.rank);
    return currentRank ? currentRank.bonusPercent : 0;
}

function updateRank() {
    for (let i = rankSystem.length - 1; i >= 0; i--) {
        if (gameState.totalUnboxed >= rankSystem[i].minBoxes) {
            gameState.rank = rankSystem[i].rank;
            gameState.level = i + 1;
            break;
        }
    }
}

function scheduleRestock(boxId, time) {
    if (boxRestockTimers[boxId]) clearTimeout(boxRestockTimers[boxId]);
    
    boxRestockTimers[boxId] = setTimeout(() => {
        const box = boxTypes.find(b => b.id === boxId);
        boxStock[boxId] = box.stock;
        renderBoxes();
        showNotification(`${box.name} has been restocked!`);
    }, time);
}

function sellRandom() {
    const squishies = Object.values(gameState.collection);
    if (squishies.length === 0) {
        alert('No squishies to sell!');
        return;
    }
    
    const randomSquishy = squishies[Math.floor(Math.random() * squishies.length)];
    if (randomSquishy.count > 0) {
        const earnedMoney = randomSquishy.squishy.value * moneyMultiplier;
        gameState.money += earnedMoney;
        randomSquishy.count--;
        if (randomSquishy.count === 0) {
            delete gameState.collection[randomSquishy.squishy.id];
        }
        showNotification(`Sold ${randomSquishy.squishy.name} for 💰${earnedMoney}!`);
        updateDisplay();
        renderCollection();
    }
}

function sellDuplicates() {
    let totalEarned = 0;
    
    Object.values(gameState.collection).forEach(item => {
        if (item.count > 1) {
            const earnedMoney = item.squishy.value * moneyMultiplier * (item.count - 1);
            totalEarned += earnedMoney;
            item.count = 1;
        }
    });
    
    if (totalEarned > 0) {
        gameState.money += totalEarned;
        showNotification(`Sold duplicates for 💰${totalEarned}!`);
        updateDisplay();
        renderCollection();
    } else {
        alert('No duplicates to sell!');
    }
}

function renderCollection() {
    const collection = document.getElementById('collection');
    collection.innerHTML = '';
    
    Object.values(gameState.collection).forEach(item => {
        if (gameState.currentFilter === 'all' || item.squishy.rarity === gameState.currentFilter) {
            const card = document.createElement('div');
            card.className = 'squishy-card';
            card.innerHTML = `
                <div style="font-size: 3em;">${item.squishy.emoji}</div>
                <div class="squishy-count">${item.count}</div>
            `;
            card.addEventListener('click', () => showSquishyDetails(item.squishy, item.count));
            collection.appendChild(card);
        }
    });
}

function showSquishyDetails(squishy, count) {
    const modal = document.getElementById('squishyModal');
    document.getElementById('modalImage').src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='70' font-size='80' text-anchor='middle'%3E${squishy.emoji}%3C/text%3E%3C/svg%3E`;
    document.getElementById('modalName').textContent = squishy.name;
    document.getElementById('modalRarity').textContent = squishy.rarity.toUpperCase();
    document.getElementById('modalValue').textContent = squishy.value * moneyMultiplier;
    document.getElementById('modalCount').textContent = count;
    
    document.getElementById('sellBtn').onclick = () => {
        gameState.money += squishy.value * moneyMultiplier;
        gameState.collection[squishy.id].count--;
        if (gameState.collection[squishy.id].count === 0) {
            delete gameState.collection[squishy.id];
        }
        modal.style.display = 'none';
        showNotification(`Sold ${squishy.name} for 💰${squishy.value * moneyMultiplier}!`);
        updateDisplay();
        renderCollection();
    };
    
    modal.style.display = 'block';
}

function updateDisplay() {
    document.getElementById('money').textContent = gameState.money.toFixed(0);
    document.getElementById('rank').textContent = gameState.rank;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('totalUnboxed').textContent = gameState.totalUnboxed;
    
    const rankProgress = getRankProgress();
    document.getElementById('rankProgress').textContent = rankProgress + '%';
    
    const rarestSquishy = getRarestSquishy();
    document.getElementById('rarestSquishy').textContent = rarestSquishy || 'None';
    
    renderCollection();
    updateUpgradePanel();
    updateRankInfo();
}

function getRankProgress() {
    const currentRankIndex = rankSystem.findIndex(r => r.rank === gameState.rank);
    if (currentRankIndex === rankSystem.length - 1) return 100;
    
    const currentMin = rankSystem[currentRankIndex].minBoxes;
    const nextMin = rankSystem[currentRankIndex + 1].minBoxes;
    const progress = ((gameState.totalUnboxed - currentMin) / (nextMin - currentMin)) * 100;
    return Math.min(100, Math.max(0, Math.floor(progress)));
}

function getRarestSquishy() {
    let rarest = null;
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    
    Object.values(gameState.collection).forEach(item => {
        if (!rarest || rarityOrder[item.squishy.rarity] > rarityOrder[rarest.rarity]) {
            rarest = item.squishy;
        }
    });
    
    return rarest ? rarest.name : null;
}

function updateUpgradePanel() {
    const panel = document.querySelector('.stats-panel');
    
    // Remove old upgrade buttons if they exist
    const oldUpgrades = panel.querySelector('.upgrades-section');
    if (oldUpgrades) oldUpgrades.remove();
    
    const upgradesSection = document.createElement('div');
    upgradesSection.className = 'upgrades-section';
    upgradesSection.innerHTML = '<h2>🛒 Upgrades</h2>';
    
    Object.entries(upgrades).forEach(([key, upgrade]) => {
        if (!upgrade.owned) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = `${upgrade.name} - 💰${upgrade.cost}`;
            btn.style.marginBottom = '8px';
            btn.disabled = gameState.money < upgrade.cost;
            btn.onclick = () => purchaseUpgrade(key, upgrade);
            upgradesSection.appendChild(btn);
        }
    });
    
    const hr = panel.querySelector('hr:nth-of-type(1)');
    if (hr) {
        hr.parentNode.insertBefore(upgradesSection, hr);
    }
}

function purchaseUpgrade(key, upgrade) {
    if (gameState.money < upgrade.cost) {
        alert('Not enough money!');
        return;
    }
    
    gameState.money -= upgrade.cost;
    upgrades[key].owned = true;
    
    if (key === 'autoUnbox') {
        startAutoUnbox();
    } else if (key === 'autoBuy') {
        startAutoBuy();
    } else if (key === 'speedUp') {
        gameState.autoUnboxSpeed = 1500;
        if (gameState.autoUnboxInterval) {
            clearInterval(gameState.autoUnboxInterval);
            startAutoUnbox();
        }
    } else if (key === 'moneyMultiplier') {
        moneyMultiplier = 1.5;
    }
    
    showNotification(`Purchased ${upgrade.name}!`);
    updateDisplay();
}

function startAutoUnbox() {
    if (gameState.autoUnboxInterval) clearInterval(gameState.autoUnboxInterval);
    
    gameState.autoUnboxInterval = setInterval(() => {
        if (gameState.selectedBox && gameState.money >= gameState.selectedBox.price) {
            performUnbox();
        }
    }, gameState.autoUnboxSpeed);
}

function startAutoBuy() {
    const bronzeBox = boxTypes[0];
    setInterval(() => {
        if (gameState.money >= bronzeBox.price && boxStock[bronzeBox.id] > 0) {
            gameState.selectedBox = bronzeBox;
            performUnbox();
        }
    }, 2000);
}

function updateRankInfo() {
    const rankInfo = document.getElementById('rankInfo');
    rankInfo.innerHTML = '';
    
    rankSystem.forEach((tier, index) => {
        const tierEl = document.createElement('div');
        tierEl.className = 'rank-tier';
        tierEl.innerHTML = `
            <div class="rank-tier-name">${tier.rank}</div>
            <div class="rank-tier-info">
                <p>📊 Unbox: ${tier.minBoxes}+</p>
                <p>💰 Bonus: +${tier.bonusPercent}%</p>
            </div>
        `;
        rankInfo.appendChild(tierEl);
    });
}

function showNotification(message) {
    // Simple notification (can be enhanced with toast library)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
