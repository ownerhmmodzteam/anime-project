const API_BASE = 'https://anime.api.app.stenly.org';

const HOME_SECTIONS = [
    { title: "LayarOtaku Update", type: "latest", badge: "Ongoing", color: "pink" },
    { title: "Trending Action", type: "query", queries: ["jujutsu", "solo leveling", "kaiju", "wind breaker"], badge: "Hot", color: "blue" }
];

const getEl = (id) => document.getElementById(id);
const showEl = (id) => getEl(id)?.classList.remove('hidden');
const hideEl = (id) => getEl(id)?.classList.add('hidden');
const loader = (active) => active ? showEl('loading') : hideEl('loading');

let currentAnimeEpisodes = []; 
let currentWatchContext = {};  
let watchTimer = null;         
let trackedSeconds = 0;        

function switchView(viewId) {
    ['home-view', 'detail-view', 'watch-view', 'list-view', 'profile-view'].forEach(id => hideEl(id));
    showEl(viewId);
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (viewId === 'home-view') getEl('nav-home')?.classList.add('active');
    if (viewId === 'profile-view') getEl('nav-profile')?.classList.add('active');
    
    if (viewId !== 'watch-view') stopWatchTimer();
}

function goHome() { switchView('home-view'); loadHomeData(); }
function goProfile() { switchView('profile-view'); }

function extractEpNumber(title) {
    if (!title) return '?';
    let match = title.match(/Episode\s+(\d+)/i);
    if (match) return match[1];
    match = title.match(/(\d+)$/);
    if (match) return match[1];
    return '?';
}

async function handleSearch(manualQuery = null) {
    const query = manualQuery || getEl('searchInput').value;
    if (!query) return;
    loader(true);
    switchView('list-view');
    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        getEl('list-results').innerHTML = data.map(anime => `
            <div class="anime-card" onclick="loadDetail('${anime.url}')">
                <img src="${anime.image}" class="card-img">
                <div class="card-title">${anime.title}</div>
            </div>
        `).join('');
    } catch (e) { console.error(e); } finally { loader(false); }
}

async function loadDetail(url, mode = 'view') {
    if (mode === 'view') { loader(true); switchView('detail-view'); }
    try {
        const res = await fetch(`${API_BASE}/detail?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        currentAnimeEpisodes = data.episodes;
        currentWatchContext = { title: data.title, image: data.image, mainUrl: url };
        if (mode === 'view') {
            getEl('anime-info').innerHTML = `<h2>${data.title}</h2><p>${data.description}</p>`;
            getEl('episode-grid').innerHTML = data.episodes.map(ep => {
                const epNum = extractEpNumber(ep.title);
                return `<div class="ep-btn" onclick="startWatchSession('${ep.url}', '${epNum}')">${epNum}</div>`
            }).join('');
        }
        return true;
    } catch (e) { return false; } finally { if (mode === 'view') loader(false); }
}

function startWatchSession(epUrl, epNum, startTime = 0) {
    trackedSeconds = startTime;
    loadVideo(epUrl, epNum);
}

async function loadVideo(epUrl, epNum) {
    loader(true);
    switchView('watch-view');
    getEl('video-title').innerText = `${currentWatchContext.title} - Ep ${epNum}`;
    
    renderWatchPlaylist(epNum);
    try {
        const res = await fetch(`${API_BASE}/watch?url=${encodeURIComponent(epUrl)}`);
        const data = await res.json();
        const player = getEl('video-player');
        if (data.streams.length > 0) {
            player.src = data.streams[0].url;
            getEl('server-options').innerHTML = data.streams.map(s => `<button class="server-btn" onclick="getEl('video-player').src='${s.url}'">${s.server}</button>`).join('');
        }
    } finally { loader(false); }
}

function renderWatchPlaylist(currentEpNum) {
    const container = getEl('watch-episode-list');
    container.innerHTML = currentAnimeEpisodes.map(ep => {
        const num = extractEpNumber(ep.title);
        const isActive = (num == currentEpNum) ? 'active' : ''; 
        return `<div class="ep-num-btn ${isActive}" onclick="startWatchSession('${ep.url}', '${num}')">${num}</div>`;
    }).join('');

    const miniDetail = getEl('mini-detail-content');
    if (currentWatchContext.title) {
        miniDetail.innerHTML = `<img src="${currentWatchContext.image}" class="mini-poster"><div class="mini-info-text"><h4>${currentWatchContext.title}</h4><p>Episode ${currentEpNum}</p></div>`;
    }
}

function stopWatchTimer() { if (watchTimer) clearInterval(watchTimer); }
function backToDetail() { switchView('detail-view'); }
function toggleSearch() { getEl('search-overlay').classList.toggle('hidden'); }

document.addEventListener('DOMContentLoaded', () => goHome());