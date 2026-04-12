// Ganti API_BASE agar mengarah ke server Stenly
const API_BASE = 'https://anime.api.app.stenly.org'; 

// Tambahkan fungsi penanganan error yang lebih baik di handleSearch
async function handleSearch(manualQuery = null, isListTab = false) {
    const query = manualQuery || getEl('searchInput').value;
    if (!query) return;

    if(!getEl('search-overlay').classList.contains('hidden')) toggleSearch();
    loader(true);

    const targetView = 'list-view';
    const containerId = 'list-results';
    
    switchView(targetView);
    const container = getEl(containerId);
    container.innerHTML = `<div class="section-title"><div class="bar-accent blue"></div><h3>Hasil: "${query}"</h3></div>`;

    try {
        // Tambahkan /v1/ jika API-nya versi 1
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        // Pastikan kita mengambil data dari properti yang benar (misal data.data atau data.results)
        // Jika API Stenly langsung mengembalikan array, kode di bawah sudah benar
        const items = Array.isArray(data) ? data : (data.data || []);

        const grid = document.createElement('div');
        grid.className = 'episode-grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        
        if (items.length === 0) {
            container.innerHTML += '<p style="text-align:center; color:#888;">Tidak ditemukan.</p>';
        } else {
            grid.innerHTML = items.map(anime => `
                <div class="anime-card" onclick="loadDetail('${anime.url}')" style="min-width:auto; max-width:none">
                    <img src="${anime.image}" class="card-img" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="badge-ep">${anime.score || 'N/A'}</div>
                    <div class="card-overlay">
                        <div class="card-title">${anime.title}</div>
                    </div>
                </div>
            `).join('');
            container.appendChild(grid);
        }
    } catch (e) {
        console.error("Search Error:", e);
        container.innerHTML += '<p style="text-align:center; color:red;">Gagal memuat. Cek koneksi API.</p>';
    } finally {
        loader(false);
    }
}