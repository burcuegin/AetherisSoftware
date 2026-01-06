// --- SERVICE WORKER KAYDI ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('%c[AETHERIS] Service Worker Kaydedildi!', 'color: #3b82f6; font-weight: bold;', reg.scope);
            })
            .catch(err => {
                console.log('%c[AETHERIS] SW Kayıt Hatası:', 'color: #ef4444;', err);
            });
    });
}

// Mevcut DOMContentLoaded ve diğer kodların buradan devam etsin...
document.addEventListener('DOMContentLoaded', async () => {
    // ...
});








document.addEventListener('DOMContentLoaded', async () => {
    const listElement = document.getElementById('repo-list');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('#filter-buttons button');
    let allRepos = []; // Veriyi her yerde kullanabilmek için yukarı tanımladık

    // --- REPOLARI EKRANA BASMA FONKSİYONU ---
    function displayRepos(repos) {
        if (!listElement) return;
        
        if (repos.length === 0) {
            listElement.innerHTML = `<div class="col-12 text-center text-secondary py-5">Aranan kriterlere uygun proje bulunamadı.</div>`;
            return;
        }

        listElement.innerHTML = repos.map(repo => `
            <div class="col-lg-4 col-md-6 d-flex align-items-stretch">
                <div class="project-card-v2 w-100">
                    <div class="card-img-wrapper">
                    <img src="${repo.image || 'assets/img/default2.png'}" alt="${repo.name}" onerror="this.src='assets/img/default2.png';">
                    </div>
                    <div class="card-content-wrapper">
                        <h5 class="repo-title">${repo.name}</h5>
                        <p class="repo-desc">${repo.description || 'Proje açıklaması bulunmuyor.'}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="lang-badge">${repo.language || 'CORE'}</span>
                            <a href="detail.html?name=${repo.name}" class="btn-modern">İncele</a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- VERİ ÇEKME VE BAŞLATMA ---
    try {
        allRepos = await getRepos(); // api.js'den veriyi çek
        displayRepos(allRepos);

        // 1. ETKİLEŞİM: Arama Çubuğu
        searchInput?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allRepos.filter(r => r.name.toLowerCase().includes(term));
            displayRepos(filtered);
            
            // Arama yaparken filtre butonlarını sıfırla (Görsel tutarlılık için)
            resetFilterButtons();
        });

        // 2. ETKİLEŞİM: Filtreleme Butonları (Ödev Zorunluluğu)
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Aktif butonu görsel olarak güncelle
                resetFilterButtons();
                button.classList.add('active', 'btn-primary');
                button.classList.remove('btn-outline-secondary');

                const filter = button.getAttribute('data-filter');
                
                const filtered = filter === 'all' 
                    ? allRepos 
                    : allRepos.filter(r => {
                        const repoLang = r.language ? r.language.trim() : 'CORE';
                        return repoLang === filter;
                    });

                displayRepos(filtered);
                if(searchInput) searchInput.value = ""; // Filtre seçilince aramayı temizle
            });
        });

    } catch (err) { 
        console.error("Hata:", err); 
        if(listElement) listElement.innerHTML = "Veriler yüklenirken bir hata oluştu.";
    }

    function resetFilterButtons() {
        filterButtons.forEach(btn => {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-secondary');
        });
    }

    // --- TEMA DEĞİŞTİRME MANTIK ---
    const toggleSwitch = document.querySelector('#checkbox');
    const currentTheme = localStorage.getItem('theme') || 'dark';

    if (currentTheme === 'dark') {
        if(toggleSwitch) toggleSwitch.checked = true;
        document.body.classList.add('dark-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        if(toggleSwitch) toggleSwitch.checked = false;
        document.body.classList.remove('dark-mode');
        document.documentElement.setAttribute('data-theme', 'light');
    }

    toggleSwitch?.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }    
    });
});