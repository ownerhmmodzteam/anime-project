const API_BASE = 'https://anime.api.app.stenly.org'; 
const getEl = (id) => document.getElementById(id);
const loader = (active) => active ? getEl('loading').classList.remove('hidden') : getEl('loading').classList.add('hidden');

function switchView(viewId) {
    ['home-view', 'detail-view', 'watch-view', 'list-view', 'profile-view'].forEach(id => getEl(id).classList.add('hidden'));
    getEl(viewId).classList.remove('hidden');
}

async function handleSearch(manualQuery = null) {
    const query = manualQuery || getEl('searchInput').value;
    if (!query) return;
    
    loader(true);
    switchView('list-view');
    const container = getEl('list-results');
    container.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const result = await res.json();
        const items = Array.isArray(result) ? result : (result.data || []);

        items.forEach(anime => {
            container.innerHTML += `
                <div class="anime-card" onclick="loadDetail('${anime.url}')">
                    <img src="${anime.image}" style="width:100%; border-radius:8px;">
                    <p>${anime.title}</p>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
    } finally {
        loader(false);
    }
}

async function loadDetail(url) {
    loader(true);
    switchView('detail-view');
    try {
        const res = await fetch(`${API_BASE}/detail?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        // Render detail & episode list logic here
    } finally {
        loader(false);
    }
}

function backToDetail() { switchView('detail-view'); }
function goHome() { switchView('home-view'); }
function goProfile() { switchView('profile-view'); }
function toggleSearch() { getEl('search-overlay').classList.toggle('hidden'); }
