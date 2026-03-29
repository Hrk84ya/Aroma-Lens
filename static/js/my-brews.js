const HISTORY_KEY = 'coffee_brew_history';

function getHistory() {
	return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function saveHistory(history) {
	localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function deleteEntry(id) {
	const history = getHistory().filter(h => h.id !== id);
	saveHistory(history);
	render();
}

function clearAll() {
	if (!confirm('Delete all brew history? This cannot be undone.')) return;
	localStorage.removeItem(HISTORY_KEY);
	render();
}

function reuseBrew(entry) {
	const p = entry.params;
	const qs = new URLSearchParams({
		m: p.brewing_method, b: p.bean_type, r: p.roast_level, g: p.grind_size,
		wt: p.water_temp, bt: p.brew_time, cr: p.ratio, ac: p.acidity, bi: p.bitterness
	});
	window.location.href = '/?' + qs.toString();
}

function scoreClass(score) {
	if (score >= 7) return 'score-high';
	if (score >= 5) return 'score-mid';
	return 'score-low';
}

function formatDate(iso) {
	const d = new Date(iso);
	const now = new Date();
	const diff = now - d;
	if (diff < 60000) return 'Just now';
	if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
	if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
	if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderStats(history) {
	const row = document.getElementById('statsRow');
	if (history.length === 0) { row.style.display = 'none'; return; }
	row.style.display = 'grid';

	const scores = history.map(h => h.result.score);
	const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
	const best = Math.max(...scores).toFixed(1);

	// Most common method
	const methods = {};
	history.forEach(h => {
		const m = h.params.brewing_method;
		methods[m] = (methods[m] || 0) + 1;
	});
	const favMethod = Object.entries(methods).sort((a, b) => b[1] - a[1])[0][0];

	document.getElementById('statAvg').textContent = avg;
	document.getElementById('statBest').textContent = best;
	document.getElementById('statTotal').textContent = history.length;
	document.getElementById('statFavMethod').textContent = favMethod;
}

function renderList(history) {
	const container = document.getElementById('brewsList');
	if (history.length === 0) {
		container.innerHTML = '';
		return;
	}

	container.innerHTML = history.map(entry => {
		const p = entry.params;
		const r = entry.result;
		const cls = scoreClass(r.score);
		return `
		<div class="brew-card">
			<div class="brew-score-badge ${cls}">
				<span class="num">${r.score}</span>
				<span class="lbl">/ 10</span>
			</div>
			<div class="brew-details">
				<div class="brew-meta">
					<span class="brew-method">${p.brewing_method}</span>
					<span class="brew-date">${formatDate(entry.timestamp)}</span>
				</div>
				<div class="brew-params">
					<span class="brew-tag">${p.bean_type}</span>
					<span class="brew-tag">${p.roast_level}</span>
					<span class="brew-tag">${p.grind_size}</span>
					<span class="brew-tag">${p.water_temp}°C</span>
					<span class="brew-tag">${p.brew_time}s</span>
					<span class="brew-tag">1:${p.ratio}</span>
				</div>
				<p class="brew-interpretation">${r.interpretation || ''}</p>
			</div>
			<div class="brew-actions">
				<button class="brew-action-btn" onclick="reuseBrew(${JSON.stringify(entry).replace(/"/g, '&quot;')})" title="Reuse these parameters">
					<i class="fas fa-redo"></i>
				</button>
				<button class="brew-action-btn delete" onclick="deleteEntry(${entry.id})" title="Delete">
					<i class="fas fa-times"></i>
				</button>
			</div>
		</div>`;
	}).join('');
}

function render() {
	let history = getHistory();

	// Filter
	const filterVal = document.getElementById('filterMethod').value;
	if (filterVal) history = history.filter(h => h.params.brewing_method === filterVal);

	// Sort
	const sortVal = document.getElementById('sortBy').value;
	switch (sortVal) {
		case 'oldest':  history.sort((a, b) => a.id - b.id); break;
		case 'highest': history.sort((a, b) => b.result.score - a.result.score); break;
		case 'lowest':  history.sort((a, b) => a.result.score - b.result.score); break;
		default:        history.sort((a, b) => b.id - a.id);
	}

	const allHistory = getHistory();
	document.getElementById('brewCount').textContent = allHistory.length + (allHistory.length === 1 ? ' brew' : ' brews');

	renderStats(allHistory);
	renderList(history);

	const toolbar = document.getElementById('brewsToolbar');
	const empty = document.getElementById('emptyState');
	if (allHistory.length === 0) {
		toolbar.style.display = 'none';
		empty.style.display = 'block';
	} else {
		toolbar.style.display = 'flex';
		empty.style.display = 'none';
	}
}

document.addEventListener('DOMContentLoaded', () => {
	render();
	document.getElementById('clearHistory').addEventListener('click', clearAll);
	document.getElementById('filterMethod').addEventListener('change', render);
	document.getElementById('sortBy').addEventListener('change', render);
});
