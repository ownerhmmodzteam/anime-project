const PRIMARY_API = 'https://anime.api.app.stenly.org';
const FALLBACK_API = 'https://cors-anywhere.herokuapp.com/https://anime.api.app.stenly.org';

let currentApi = PRIMARY_API;
let currentAnimeEpisodes = [];
let currentWatchContext = {};

const getEl = (id) => document.getElementById(id);
const loader = (active) => active ? getEl('loading').classList.remove('hidden') : getEl('loading').classList.add('hidden');

async function smartFetch(endpoint) {
    try {
        const response = await fetch(`${currentApi}${endpoint}`);
        if (!response.ok) throw new Error();
        return await response.json();
    } catch (err) {
        if (currentApi === PRIMARY_API) {
            currentApi = FALLBACK_API;
            return await smartFetch(endpoint);
        }
        throw err;
    }
}

function switchView(viewId) {
    ['home-view', 'detail-view', 'watch-view', 'list-view', 'profile-view'].forEach(id => getEl(id).classList.add('hidden'));
    getEl(viewId).classList.remove('hidden');
}

function extractEpNumber(title) {
    const match = title.match(/Episode\s+(\d+)/i) || title.match(/(\d+)$/);
    return match ? match[1] : '?';
}

async function loadHomeData() {
    loader(true);
    try {
        const data = await smartFetch('/latest');
        const items = Array.isArray(data) ? data : (data.data || []);
        getEl('home-content').innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px; margin-top:20px">
                ${items.map(anime => `
                    <div onclick="loadDetail('${anime.url}')">
                        <img src="${anime.image}" style="width:100%; border-radius:12px; aspect-ratio:3/4; object-fit:cover">
                        <p style="font-size:0.8rem; margin-top:5px; font-weight:600">${anime.title}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        getEl('home-content').innerHTML = '<p style="text-align:center; padding:20px">Gagal memuat data. Coba lagi nanti.</p>';
    } finally { loader(false); }
}

async function handleSearch() {
    const query = getEl('searchInput').value;
    if (!query) return;
    loader(true);
    getEl('search-overlay').classList.add('hidden');
    switchView('list-view');
    try {
        const data = await smartFetch(`/search?q=${encodeURIComponent(query)}`);
        const items = Array.isArray(data) ? data : (data.data || []);
        getEl('list-results').innerHTML = items.map(anime => `
            <div onclick="loadDetail('${anime.url}')" style="display:flex; gap:15px; margin-bottom:15px; background:var(--bg-card); padding:10px; border-radius:12px">
                <img src="${anime.image}" style="width:80px; border-radius:8px">
                <div><h4 style="font-size:0.9rem">${anime.title}</h4></div>
            </div>
        `).join('');
    } finally { loader(false); }
}

async function loadDetail(url) {
    loader(true);
    switchView('detail-view');
    try {
        const data = await smartFetch(`/detail?url=${encodeURIComponent(url)}`);
        currentAnimeEpisodes = data.episodes;
        currentWatchContext = { title: data.title, image: data.image };
        getEl('anime-info').innerHTML = `
            <img src="${data.image}" style="width:100%; border-radius:15px; margin-bottom:15px">
            <h2>${data.title}</h2>
            <p style="color:var(--text-muted); font-size:0.85rem; margin:10px 0">${data.description}</p>
        `;
        getEl('episode-grid').innerHTML = data.episodes.map(ep => {
            const num = extractEpNumber(ep.title);
            return `<button class="ep-num-btn" onclick="loadVideo('${ep.url}', '${num}')">${num}</button>`;
        }).join('');
    } finally { loader(false); }
}

async function loadVideo(epUrl, epNum) {
    loader(true);
    switchView('watch-view');
    getEl('video-title').innerText = `${currentWatchContext.title} - Ep ${epNum}`;
    
    getEl('watch-episode-list').innerHTML = currentAnimeEpisodes.map(ep => {
        const num = extractEpNumber(ep.title);
        return `<div class="ep-num-btn ${num == epNum ? 'active' : ''}" onclick="loadVideo('${ep.url}', '${num}')">${num}</div>`;
    }).join('');

    getEl('mini-detail-content').innerHTML = `
        <img src="${currentWatchContext.image}" class="mini-poster">
        <div class="mini-info-text"><h4>${currentWatchContext.title}</h4><p>Sedang menonton Episode ${epNum}</p></div>
    `;

    try {
        const data = await smartFetch(`/watch?url=${encodeURIComponent(epUrl)}`);
        if (data.streams && data.streams.length > 0) {
            getEl('video-player').src = data.streams[0].url;
            getEl('server-options').innerHTML = data.streams.map(s => `<button class="ep-num-btn" style="width:auto; padding:0 15px; height:35px" onclick="getEl('video-player').src='${s.url}'">${s.server}</button>`).join('');
        }
    } finally { loader(false); }
}

function goHome() { switchView('home-view'); loadHomeData(); }
function goProfile() { switchView('profile-view'); }
function backToDetail() { switchView('detail-view'); }
function toggleSearch() { getEl('search-overlay').classList.toggle('hidden'); }

document.addEventListener('DOMContentLoaded', goHome);