const USERNAME = 'microsoft'; 
const BACKUP_PATH = './assets/data/sample.json'; // SW listesiyle aynı olmalı

async function getRepos() {
    const statusDiv = document.getElementById('api-status-warning');
    const loadingUI = document.getElementById('loading');

    // 1. Önce internet var mı kontrol et
    if (!navigator.onLine) {
        return await loadBackupData(statusDiv);
    }

    try {
        if(loadingUI) loadingUI.style.display = 'block';
        const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=stars&per_page=12`);
        
        if (!response.ok) throw new Error("API hatası");
        
        const data = await response.json();
        const formattedData = data.map(repo => ({
            ...repo,
            image: `https://opengraph.githubassets.com/1/${USERNAME}/${repo.name}`
        }));

        // İnternet varken veriyi LocalStorage'a da yedekleyelim (En sağlam yöntem)
        localStorage.setItem('repos_cache', JSON.stringify(formattedData));
        
        return formattedData;
    } catch (err) {
        console.warn("API hatası, yedeğe dönülüyor:", err);
        return await loadBackupData(statusDiv);
    } finally {
        if(loadingUI) loadingUI.style.display = 'none';
    }
}

async function loadBackupData(statusDiv) {
    if(statusDiv) {
        statusDiv.innerHTML = `<div class="alert alert-warning">📡 Çevrimdışı mod: Kayıtlı veriler yükleniyor.</div>`;
    }

    // İlk tercih: LocalStorage (En hızlı)
    const localData = localStorage.getItem('repos_cache');
    if (localData) return JSON.parse(localData);

    // İkinci tercih: Service Worker Cache veya Yerel JSON
    try {
        const response = await fetch(BACKUP_PATH);
        return await response.json();
    } catch (e) {
        console.error("Yedek veri de yüklenemedi");
        return [];
    }
}

async function getRepoDetail(name) {
    if (!navigator.onLine) {
        // Detay sayfasında da localstorage'dan ilgili repoyu bulmaya çalışabiliriz
        const localData = JSON.parse(localStorage.getItem('repos_cache') || "[]");
        const found = localData.find(r => r.name === name);
        return found || { name: name, description: "Çevrimdışı modda detaylar kısıtlıdır.", image: "" };
    }
    try {
        const res = await fetch(`https://api.github.com/repos/${USERNAME}/${name}`);
        const data = await res.json();
        data.image = `https://opengraph.githubassets.com/1/${USERNAME}/${name}`;
        return data;
    } catch (err) {
        return { name: "Hata", description: "Veri alınamadı." };
    }
}


async function loadBackupData(statusDiv) {
    if(statusDiv) statusDiv.innerHTML = `<div class="alert alert-warning">📡 Çevrimdışı mod: Yedekler yükleniyor.</div>`;

    // 1. Önce LocalStorage kontrolü
    const localData = localStorage.getItem('repos_cache');
    if (localData && localData !== "[]") {
        console.log("LocalStorage verisi bulundu.");
        return JSON.parse(localData);
    }

    // 2. LocalStorage boşsa sample.json dosyasını dene
    try {
        const response = await fetch('./assets/data/sample.json');
        const data = await response.json();
        console.log("JSON dosyasından veri çekildi.");
        return data;
    } catch (e) {
        console.error("Yedek veri yolu hatalı veya dosya yok!");
        return [];
    }
}