// Range input live values
const sliders = [
	{ el: 'brew_time',          out: 'brew_time_value',      fmt: v => v + 's' },
	{ el: 'water_temp',         out: 'water_temp_value',     fmt: v => v + '°C' },
	{ el: 'coffee_water_ratio', out: 'ratio_value',          fmt: v => '1:' + v },
	{ el: 'acidity_pref',       out: 'acidity_pref_value',   fmt: v => parseFloat(v).toFixed(1) },
	{ el: 'bitterness_pref',    out: 'bitterness_pref_value',fmt: v => parseFloat(v).toFixed(1) },
];
sliders.forEach(s => {
	const el = document.getElementById(s.el);
	if (el) el.addEventListener('input', () => {
		document.getElementById(s.out).textContent = s.fmt(el.value);
	});
});

// Score ring animation
function animateScoreRing(score) {
	const arc = document.getElementById('scoreArc');
	if (!arc) return;
	const circumference = 2 * Math.PI * 52; // r=52
	const pct = Math.min(score / 10, 1);
	arc.style.strokeDasharray = circumference;
	arc.style.strokeDashoffset = circumference * (1 - pct);
}

// Form submission
const formEl = document.getElementById('coffeeForm');
if (formEl) formEl.addEventListener('submit', async function(e) {
	e.preventDefault();

	const submitBtn = document.getElementById('predictBtn');
	const originalBtnText = submitBtn.innerHTML;
	submitBtn.disabled = true;
	submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Analyzing...';
	document.getElementById('loading').style.display = 'block';
	document.getElementById('results').style.display = 'none';

	try {
		const formData = new URLSearchParams({
			brewing_method: document.getElementById('brewing_method').value,
			bean_type: document.getElementById('bean_type').value,
			roast_level: document.getElementById('roast_level').value,
			grind_size: document.getElementById('grind_size').value,
			water_temp: document.getElementById('water_temp').value,
			brew_time: document.getElementById('brew_time').value,
			coffee_water_ratio: (1 / parseFloat(document.getElementById('coffee_water_ratio').value)).toFixed(4),
			acidity_pref: document.getElementById('acidity_pref').value,
			bitterness_pref: document.getElementById('bitterness_pref').value
		});

		const response = await fetch('/predict', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData
		});
		const data = await response.json();
		const resultsDiv = document.getElementById('results');

		if (data.success) {
			document.getElementById('predictionScore').textContent = data.prediction.score;
			document.getElementById('confidence').textContent = data.prediction.confidence;
			document.getElementById('interpretation').textContent = data.prediction.interpretation || '';

			// Animate score ring
			animateScoreRing(data.prediction.score);

			// Flavor chips
			const chips = buildFlavorChips(data.prediction.interpretation);
			const container = document.getElementById('flavorChips');
			container.innerHTML = '';
			chips.forEach(ch => container.appendChild(ch));

			// Save to history
			savePrediction({
				brewing_method: document.getElementById('brewing_method').value,
				bean_type: document.getElementById('bean_type').value,
				roast_level: document.getElementById('roast_level').value,
				grind_size: document.getElementById('grind_size').value,
				water_temp: document.getElementById('water_temp').value,
				brew_time: document.getElementById('brew_time').value,
				ratio: document.getElementById('coffee_water_ratio').value,
				acidity: document.getElementById('acidity_pref').value,
				bitterness: document.getElementById('bitterness_pref').value,
			}, data.prediction);

			resultsDiv.style.setProperty('display', 'block', 'important');
			resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
		} else {
			resultsDiv.innerHTML = `
				<div class="results-card">
					<h3>Something went wrong</h3>
					<p class="interpretation-text">${data.error || 'An unknown error occurred'}</p>
				</div>`;
			resultsDiv.style.display = 'block';
		}
	} catch (error) {
		alert('Error: ' + error.message);
	} finally {
		submitBtn.disabled = false;
		submitBtn.innerHTML = originalBtnText;
		document.getElementById('loading').style.display = 'none';
	}
});

function buildFlavorChips(interpretation) {
	const keywords = [
		{ key: 'exceptional', icon: 'fa-solid fa-crown',       color: '#E8C88A' },
		{ key: 'excellent',   icon: 'fa-solid fa-star',        color: '#D4A054' },
		{ key: 'balanced',    icon: 'fa-solid fa-yin-yang',    color: '#9CAF88' },
		{ key: 'chocolate',   icon: 'fa-solid fa-square',      color: '#8B6F47' },
		{ key: 'cocoa',       icon: 'fa-solid fa-square',      color: '#6F4E37' },
		{ key: 'caramel',     icon: 'fa-solid fa-square',      color: '#C4834E' },
		{ key: 'nut',         icon: 'fa-solid fa-square',      color: '#a67c52' },
		{ key: 'citrus',      icon: 'fa-solid fa-lemon',       color: '#d4a514' },
		{ key: 'berry',       icon: 'fa-solid fa-seedling',    color: '#9CAF88' },
		{ key: 'floral',      icon: 'fa-solid fa-seedling',    color: '#9CAF88' },
		{ key: 'spice',       icon: 'fa-solid fa-pepper-hot',  color: '#C45B4A' },
		{ key: 'extraction',  icon: 'fa-solid fa-flask',       color: '#D4A054' },
	];
	const chips = [];
	const text = (interpretation || '').toLowerCase();
	keywords.forEach(k => {
		if (text.includes(k.key)) {
			chips.push(createChip(k.icon, capitalize(k.key), k.color));
		}
	});
	if (chips.length === 0) {
		chips.push(createChip('fa-solid fa-mug-hot', 'Smooth', '#9CAF88'));
	}
	return chips;
}

function createChip(iconClass, label, color) {
	const chip = document.createElement('span');
	chip.className = 'flavor-chip';
	chip.innerHTML = `<i class="${iconClass}" style="color:${color}"></i> ${label}`;
	return chip;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }


// ── Prediction History (localStorage) ──
const HISTORY_KEY = 'coffee_brew_history';
const MAX_HISTORY = 50;

function savePrediction(params, result) {
	const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
	history.unshift({
		id: Date.now(),
		timestamp: new Date().toISOString(),
		params,
		result
	});
	if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
	localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}


// ── Auto-fill form from URL params (reuse from My Brews) ──
(function() {
	const params = new URLSearchParams(window.location.search);
	if (!params.has('m')) return;

	const map = {
		m: 'brewing_method', b: 'bean_type', r: 'roast_level', g: 'grind_size',
		wt: 'water_temp', bt: 'brew_time', cr: 'coffee_water_ratio',
		ac: 'acidity_pref', bi: 'bitterness_pref'
	};

	Object.entries(map).forEach(([key, id]) => {
		const el = document.getElementById(id);
		const val = params.get(key);
		if (el && val) {
			el.value = val;
			el.dispatchEvent(new Event('input'));
		}
	});

	// Clean URL without reload
	window.history.replaceState({}, '', '/');
})();
