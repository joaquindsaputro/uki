let projectState = {
    topic: "",
    era: "",
    structure: "Linear",
    type: "Real Event (True Crime Documentary)",
    lang: "Indonesian", 
    intro: null,
    acts: [], 
    narrations: {} 
};

let currentSelectedScene = null; 

document.addEventListener('DOMContentLoaded', () => {
    loadProjectData();
    
    const inputs = ['sysTopic', 'sysEra', 'sysStructure', 'sysType', 'sysLang'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateStateObj);
        document.getElementById(id).addEventListener('change', updateStateObj);
    });

    document.getElementById('btnResetTop').addEventListener('click', resetProject);
    document.getElementById('btnSaveTop').addEventListener('click', saveProjectData);
    document.getElementById('btnGenerateSkeleton').addEventListener('click', generateSkeletonPrompt);
    document.getElementById('btnCopySysOutput').addEventListener('click', function() {
        copyFromElement('sysOutput', this);
    });
    document.getElementById('btnProcessJSON').addEventListener('click', processSkeletonJSON);
    document.getElementById('btnCopyFullScript').addEventListener('click', function() {
        copyFullScript(this);
    });
    document.getElementById('btnGenerateMediaPrompts').addEventListener('click', generateMediaPrompts);
    document.getElementById('btnCopyImage').addEventListener('click', function() {
        copyFromElement('outImage', this);
    });
    document.getElementById('btnCopyVideo').addEventListener('click', function() {
        copyFromElement('outVideo', this);
    });

    const stepSummaries = document.querySelectorAll('.step-panel > summary');
    stepSummaries.forEach(summary => {
        summary.addEventListener('click', (e) => {
            const currentPanel = summary.parentElement;
            if (!currentPanel.hasAttribute('open')) {
                document.querySelectorAll('.step-panel').forEach(otherPanel => {
                    if (otherPanel !== currentPanel && otherPanel.hasAttribute('open')) {
                        otherPanel.removeAttribute('open');
                    }
                });
            }
        });
    });

    document.getElementById('writerRoomList').addEventListener('click', (e) => {
        const copyBtn = e.target.closest('button[data-action="copy-prompt"]');
        if (copyBtn) {
            copyTextToClipboard(copyBtn.getAttribute('data-prompt'), copyBtn);
        }

        const summaryBtn = e.target.closest('summary.act-summary');
        if (summaryBtn) {
            const actDetails = summaryBtn.parentElement;
            if (!actDetails.hasAttribute('open')) {
                document.querySelectorAll('.act-panel').forEach(otherAct => {
                    if (otherAct !== actDetails && otherAct.hasAttribute('open')) {
                        otherAct.removeAttribute('open');
                    }
                });
            }
        }
    });

    document.getElementById('writerRoomList').addEventListener('input', (e) => {
        if (e.target.tagName === 'TEXTAREA' && e.target.hasAttribute('data-key')) {
            saveNarration(e.target.getAttribute('data-key'), e.target.value, e.target);
        }
    });
});

function updateStateObj() {
    projectState.topic = document.getElementById('sysTopic').value;
    projectState.era = document.getElementById('sysEra').value;
    projectState.structure = document.getElementById('sysStructure').value;
    projectState.type = document.getElementById('sysType').value;
    projectState.lang = document.getElementById('sysLang').value;
}

function copyTextToClipboard(text, btnElement) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        if(btnElement) {
            if (!btnElement.hasAttribute('data-orig-text')) {
                btnElement.setAttribute('data-orig-text', btnElement.innerHTML);
                btnElement.setAttribute('data-orig-class', btnElement.className);
            }
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> COPIED!';
            btnElement.className = "text-[10px] bg-green-600 text-white px-3 py-1 rounded font-bold shadow transition flex items-center gap-1";
            setTimeout(() => {
                btnElement.innerHTML = btnElement.getAttribute('data-orig-text');
                btnElement.className = btnElement.getAttribute('data-orig-class');
            }, 1500);
        }
    } catch (err) {
        alert('Gagal menyalin. Browser memblokir fitur Clipboard.');
    }
    document.body.removeChild(textarea);
}

function copyFromElement(elementId, btnElement) {
    const text = document.getElementById(elementId).value;
    copyTextToClipboard(text, btnElement);
}

function resetProject() {
    if(!confirm("Apakah Anda yakin ingin mereset seluruh project? Semua data yang belum tersimpan akan hilang.")) return;
    
    localStorage.removeItem('ukiyo_project_v10');
    
    projectState = {
        topic: "", era: "", structure: "Linear", type: "Real Event (True Crime Documentary)", lang: "Indonesian",
        intro: null, acts: [], narrations: {}
    };
    currentSelectedScene = null;
    
    document.getElementById('sysTopic').value = "";
    document.getElementById('sysEra').value = "";
    document.getElementById('sysStructure').value = "Linear";
    document.getElementById('sysType').value = "Real Event (True Crime Documentary)";
    document.getElementById('sysLang').value = "Indonesian";
    document.getElementById('batchInput').value = "";
    document.getElementById('sysOutput').value = "";
    document.getElementById('visForeground').value = "";
    document.getElementById('visBackground').value = "";
    document.getElementById('visAction').value = "";
    document.getElementById('outImage').value = "";
    document.getElementById('outVideo').value = "";
    document.getElementById('lockedEra').innerText = "...";
    
    document.getElementById('skeletonOutputContainer').classList.add('hidden');
    document.getElementById('writerRoomList').classList.add('hidden');
    document.getElementById('writerRoomList').innerHTML = "";
    document.getElementById('btnCopyFullScript').classList.add('hidden');
    
    const visualList = document.getElementById('visualSceneList');
    visualList.innerHTML = '<p class="text-xs text-slate-500 text-center mt-10">Load JSON di Step 2 dulu.</p>';
    
    const btn = document.getElementById('btnResetTop');
    const origHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.classList.add('bg-rose-600', 'text-white');
    setTimeout(() => {
        btn.innerHTML = origHTML;
        btn.classList.remove('bg-rose-600', 'text-white');
    }, 1000);
}

function generateSkeletonPrompt() {
    updateStateObj();
    const { topic, era, structure, type, lang } = projectState;
    
    if(!era || !topic) {
        alert("Mohon isi Topic dan Era/Tahun terlebih dahulu!");
        return;
    }

    const isEng = lang === "English";
    const promptLanguage = isEng ? 
        `Write the premise and instructions in English.` : 
        `Tuliskan premise dan instruksi dalam Bahasa Indonesia.`;

    let structureInstruction = "";
    if (structure === "In Media Res") {
        structureInstruction = isEng ?
            `NARRATIVE STRUCTURE (IN MEDIA RES): Make Act 1 the absolute climax or the most shocking/chaotic discovery of the case. Use Act 2 and subsequent acts to rewind and explain the chronological events leading up to that climax.` :
            `STRUKTUR ALUR (IN MEDIA RES): Jadikan Babak 1 (Act 1) sebagai puncak ketegangan, klimaks, atau penemuan paling mengejutkan dari kasus ini. Gunakan Babak 2 dan seterusnya untuk mundur dan menjelaskan rentetan kejadian kronologis yang mengarah ke klimaks tersebut.`;
    } else if (structure === "Rabbit Hole") {
        structureInstruction = isEng ?
            `NARRATIVE STRUCTURE (THE RABBIT HOLE): Start Act 1 with a seemingly small, bizarre, or harmless anomaly. Use subsequent acts to dig deeper, showing how this small detail unravels into a massive, dark mystery or conspiracy.` :
            `STRUKTUR ALUR (THE RABBIT HOLE): Mulai Babak 1 (Act 1) dengan sebuah kejanggalan kecil yang aneh namun terlihat sepele. Gunakan babak-babak berikutnya untuk menggali lebih dalam, menunjukkan bagaimana detail kecil ini membongkar misteri atau konspirasi yang jauh lebih besar dan gelap.`;
    } else if (structure === "False Narrative") {
        structureInstruction = isEng ?
            `NARRATIVE STRUCTURE (FALSE NARRATIVE): In the first half (Acts 1-2), build a compelling but FALSE theory or the initial incorrect police conclusion. In the middle (Act 3), introduce a major plot twist that shatters the false theory, revealing the true events in the remaining acts.` :
            `STRUKTUR ALUR (FALSE NARRATIVE): Di paruh awal cerita (Babak 1-2), bangun teori yang seolah masuk akal namun SALAH, atau kesimpulan awal pihak berwenang yang keliru. Di pertengahan (Babak 3), berikan plot twist besar yang mematahkan teori palsu tersebut, lalu ungkap fakta kejadian sebenarnya di babak-babak tersisa.`;
    } else {
        structureInstruction = isEng ?
            `NARRATIVE STRUCTURE (LINEAR): Tell the story in a standard, chronological linear progression from the beginning of the events to the end.` :
            `STRUKTUR ALUR (LINEAR): Ceritakan kisah ini dalam alur maju kronologis standar, dari awal mula rentetan kejadian hingga akhir penyelesaiannya.`;
    }

    const coreFactRule = isEng ?
        `ABSOLUTE RULE: Despite the narrative structure used, DO NOT hide the main facts at the end. Ensure the ultimate fate of the main characters (e.g., how they died, who the perpetrator is, or their final status) is explained clearly, accurately, and does not end on a cliffhanger.` :
        `ATURAN MUTLAK: Meskipun menggunakan struktur alur di atas, JANGAN menyembunyikan fakta utama kasus di akhir cerita. Pastikan nasib akhir karakter utama (misal: bagaimana mereka meninggal, siapa pelakunya, atau status akhir mereka) dijelaskan secara gamblang, akurat, dan tidak menggantung.`;

    const prompt = isEng ?
        `As the lead scriptwriter, create a DETAILED 5-Act Skeleton for a story about: "${topic}".\nTime Setting/Era: ${era}.\nStory Style: ${type}.\n${promptLanguage}\n\n${structureInstruction}\n\n${coreFactRule}\n\nCONTINUITY & DETAIL RULES (CRUCIAL):\n- Create AS MANY SCENES AS NEEDED in each Act to tell the full detail (more than 5 scenes per Act is fine as long as the timeline is clear without plot holes).\n- Keep transitions between Acts logical and unhurried.\n\nOTHER IMPORTANT NOTES:\n1. Include a special "intro" object for B-ROLL FOOTAGE (real footage) to hook the audience in the first seconds.\n2. DO NOT write full narrations, just "scene_premise" (1 core sentence of the event per scene).\n3. Separate FOREGROUND and BACKGROUND for each scene to ensure logical visual composition.\n\nOutput MUST be valid JSON with this exact structure:\n{\n  "intro": {\n    "scene_premise": "One iconic scene or shocking statement to hook the audience.",\n    "b_roll_idea": "Real footage idea (e.g., blurry 1998 empty street CCTV)",\n    "action": "Slow camera movement / Slow zoom"\n  },\n  "acts": [\n    {\n      "act_title": "Act 1: Act Title",\n      "scenes": [\n        {\n          "scene_premise": "Specific fact/event building the case timeline.",\n          "visual_foreground": "One specific evidence/subject in front",\n          "visual_background": "Background environment",\n          "action": "Camera movement instructions"\n        }\n      ]\n    }\n  ]\n}\nOutput ONLY the JSON format without other markdown blocks if possible.` :
        `Sebagai penulis naskah utama, buatkan kerangka (Skeleton) cerita 5 Babak (Act) yang SANGAT DETAIL tentang topik: "${topic}".\nSetting Waktu / Era: ${era}.\nGaya Cerita: ${type}.\n${promptLanguage}\n\n${structureInstruction}\n\n${coreFactRule}\n\nATURAN KONTINUITAS & DETAIL (SANGAT PENTING):\n- Buat jumlah scene di tiap Act SEBANYAK YANG DIBUTUHKAN untuk menceritakan detail utuh (tidak masalah jika lebih dari 5 scene per Act asalkan kronologinya jelas tanpa plot hole).\n- Jaga transisi antar Act agar mengalir logis dan tidak terburu-buru.\n\nPENTING LAINNYA:\n1. Sertakan objek "intro" khusus untuk B-ROLL FOOTAGE (rekaman asli). Berikan ide rekaman asli apa yang cocok untuk memancing penonton di detik pertama.\n2. JANGAN tulis narasi lengkap, cukup "scene_premise" (1 kalimat inti kejadian per scene).\n3. Pisahkan FOREGROUND dan BACKGROUND untuk setiap adegan agar komposisi gambar logis.\n\nOutput WAJIB berupa JSON valid dengan struktur persis seperti ini:\n{\n  "intro": {\n    "scene_premise": "Satu adegan ikonik atau pernyataan mengejutkan untuk memancing penonton.",\n    "b_roll_idea": "Ide footage asli (misal: Rekaman CCTV buram jalanan sepi 1998)",\n    "action": "Kamera bergerak lambat / Zoom perlahan"\n  },\n  "acts": [\n    {\n      "act_title": "Act 1: Judul Babak",\n      "scenes": [\n        {\n          "scene_premise": "Kejadian/fakta spesifik yang membangun cerita.",\n          "visual_foreground": "Satu barang bukti/subjek spesifik di depan",\n          "visual_background": "Lingkungan latar belakang",\n          "action": "Instruksi pergerakan kamera"\n        }\n      ]\n    }\n  ]\n}\nOutput HANYA format JSON tanpa block markdown lain jika memungkinkan.`;

    document.getElementById('sysOutput').value = prompt;
    document.getElementById('skeletonOutputContainer').classList.remove('hidden');
    document.getElementById('step2').open = true;
    saveProjectData();
}

function processSkeletonJSON() {
    const raw = document.getElementById('batchInput').value;
    if(!raw.trim()) return;

    try {
        const jsonStart = raw.indexOf('{');
        const jsonEnd = raw.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("Format JSON tidak ditemukan");
        
        const jsonString = raw.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        
        if(data.acts) {
            projectState.acts = data.acts;
            projectState.intro = data.intro || null;
            renderWritersRoom();
            renderVisualSceneSelector();
            
            document.getElementById('lockedEra').innerText = projectState.era || "Era Tidak Diset";
            document.getElementById('btnCopyFullScript').classList.remove('hidden');
            document.getElementById('step3').open = true;
            saveProjectData();
        }
    } catch(e) {
        alert("Gagal membaca JSON. Pastikan format dari Gemini benar. Error: " + e.message);
    }
}

function renderWritersRoom() {
    const container = document.getElementById('writerRoomList');
    container.innerHTML = "";
    container.classList.remove('hidden');

    let previousPremise = null;

    if (projectState.intro) {
        const introWrapper = document.createElement('div');
        introWrapper.className = "mb-6";
        const savedIntro = projectState.narrations['intro'] || "";
        
        const rawIntroPrompt = projectState.lang === "English" 
            ? `Write an atmospheric, chilling, and highly engaging HOOK/INTRO narration (60-80 words) in ENGLISH. Position the listener as a witness. Based on this premise: "${projectState.intro.scene_premise}". Context: Documentary about "${projectState.topic}" set in ${projectState.era}. SPELL OUT all numbers and years in words (e.g., "two thousand" instead of "2000"). Output ONLY the narration text. NO conversational filler.`
            : `Tuliskan narasi HOOK/INTRO yang sangat mengikat, kelam, dan atmosferik (60-80 kata) dalam BAHASA INDONESIA. Posisikan pendengar sebagai saksi. Berdasarkan premise: "${projectState.intro.scene_premise}". Konteks: Dokumenter tentang "${projectState.topic}" di era ${projectState.era}. SELALU tuliskan angka dan tahun dalam bentuk kata/ejaan (misal: "dua ribu" bukan "2000"). HANYA berikan teks narasi. TANPA penjelasan tambahan.`;

        const safeIntroPrompt = rawIntroPrompt.replace(/"/g, "&quot;");

        introWrapper.innerHTML = `
            <div class="writer-card intro p-4 bg-slate-800 rounded-lg shadow-sm relative ${savedIntro ? 'done' : ''} border border-amber-900/50">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1 pr-4">
                        <span class="tag-badge bg-amber-500 text-slate-900"><i class="fa-solid fa-fire"></i> INTRO / HOOK (B-ROLL MODE)</span>
                        <p class="text-[11px] text-amber-200 mt-2 italic font-serif">"${projectState.intro.scene_premise}"</p>
                    </div>
                    <button data-action="copy-prompt" data-prompt="${safeIntroPrompt}" class="whitespace-nowrap text-[10px] bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded transition shadow font-bold flex items-center gap-1">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> COPY PROMPT HOOK
                    </button>
                </div>
                <textarea data-key="intro" rows="3" placeholder="Paste narasi Hook/Intro di sini..." class="w-full text-xs font-serif p-3 rounded bg-slate-900 border-slate-600 mt-2">${savedIntro}</textarea>
            </div>
        `;
        container.appendChild(introWrapper);
        
        previousPremise = projectState.intro.scene_premise;
    }

    projectState.acts.forEach((act, aIndex) => {
        const actDetails = document.createElement('details');
        actDetails.className = "mb-6 group act-panel"; 
        if (aIndex === 0) actDetails.open = true; 

        const summary = document.createElement('summary');
        summary.className = "text-xs font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition px-3 py-3 rounded-lg group-open:rounded-b-none border border-slate-600 cursor-pointer flex justify-between items-center outline-none list-none act-summary";
        summary.innerHTML = `
            <span><i class="fa-solid fa-folder-open mr-2 text-indigo-400"></i>${act.act_title}</span>
            <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180"></i>
        `;
        actDetails.appendChild(summary);
        
        const sceneWrapper = document.createElement('div');
        sceneWrapper.className = "bg-slate-900/50 p-3 rounded-b-lg border border-slate-700 border-t-0 space-y-3";

        act.scenes.forEach((scene, sIndex) => {
            const key = `${aIndex}_${sIndex}`;
            const savedNarration = projectState.narrations[key] || "";
            const scnCard = document.createElement('div');
            scnCard.className = `writer-card p-4 bg-slate-800 rounded-lg shadow-sm relative ${savedNarration ? 'done' : ''}`;
            
            const prevContextEng = previousPremise ? `Previous scene context: "${previousPremise}". ` : "";
            const prevContextInd = previousPremise ? `Konteks kejadian sebelumnya: "${previousPremise}". ` : "";

            const rawPromptText = projectState.lang === "English"
                ? `Write a voice-over narration of 70-90 words in ENGLISH for this current scene: "${scene.scene_premise}". ${prevContextEng}Context: A documentary about "${projectState.topic}" set in ${projectState.era}. CRITICAL INSTRUCTION: This is a CONTINUATION of a flowing script. DO NOT re-introduce the main topic, the setting, or use repetitive formulaic openings. Bridge naturally from the previous scene context. SPELL OUT all numbers and years in words (e.g., "two thousand"). Output ONLY the narration text. NO conversational filler.`
                : `Tuliskan Voice Over (70-90 kata) dalam BAHASA INDONESIA untuk adegan ini: "${scene.scene_premise}". ${prevContextInd}Konteks keseluruhan: Dokumenter "${projectState.topic}" era ${projectState.era}. INSTRUKSI KRITIS: Ini adalah KELANJUTAN dari naskah yang sedang berjalan. JANGAN mengulang perkenalan kasus, latar waktu, atau memakai kalimat pembuka klise yang diulang-ulang. Buat transisinya mengalir natural sebagai kelanjutan langsung dari adegan sebelumnya. SELALU tuliskan angka dan tahun dalam bentuk kata/ejaan. HANYA berikan teks narasi.`;
                
            const safePromptText = rawPromptText.replace(/"/g, "&quot;");

            scnCard.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1 pr-4">
                        <span class="tag-badge bg-indigo-900 text-indigo-200"><i class="fa-solid fa-clapperboard"></i> Scene ${sIndex + 1}</span>
                        <p class="text-[11px] text-slate-300 mt-2 italic font-serif">"${scene.scene_premise}"</p>
                    </div>
                    <button data-action="copy-prompt" data-prompt="${safePromptText}" class="whitespace-nowrap text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded transition shadow border border-indigo-500 font-bold flex items-center gap-1">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> COPY PROMPT PENULIS
                    </button>
                </div>
                <textarea data-key="${key}" rows="3" placeholder="Paste hasil narasi di sini..." class="w-full text-xs font-serif p-3 rounded bg-slate-900 border-slate-600 mt-2">${savedNarration}</textarea>
            `;
            sceneWrapper.appendChild(scnCard);

            previousPremise = scene.scene_premise;
        });

        actDetails.appendChild(sceneWrapper);
        container.appendChild(actDetails);
    });
}

function saveNarration(key, value, textareaElement) {
    projectState.narrations[key] = value;
    const card = textareaElement.closest('.writer-card');
    if(value.trim().length > 0) {
        card.classList.add('done');
    } else {
        card.classList.remove('done');
    }
    localStorage.setItem('ukiyo_project_v10', JSON.stringify(projectState));
}

function copyFullScript(btnElement) {
    let fullScript = "";
    if (projectState.intro && projectState.narrations['intro']) {
        fullScript += `--- INTRO / HOOK ---\n\n${projectState.narrations['intro'].trim()}\n\n`;
    }
    projectState.acts.forEach((act, aIndex) => {
        fullScript += `--- ${act.act_title.toUpperCase()} ---\n\n`;
        act.scenes.forEach((_, sIndex) => {
            const text = projectState.narrations[`${aIndex}_${sIndex}`];
            if(text) fullScript += text.trim() + "\n\n";
        });
    });
    if(!fullScript.trim()) { alert("Script masih kosong!"); return; }
    copyTextToClipboard(fullScript.trim(), btnElement);
}

function renderVisualSceneSelector() {
    const list = document.getElementById('visualSceneList');
    list.innerHTML = "";
    
    if (projectState.intro) {
        const introHeader = document.createElement('div');
        introHeader.className = "text-[10px] font-bold text-amber-500 mt-1 mb-1 tracking-widest";
        introHeader.innerHTML = '<i class="fa-solid fa-fire"></i> INTRO / HOOK';
        list.appendChild(introHeader);

        const introBtn = document.createElement('div');
        introBtn.className = "scene-card p-2 mb-3 bg-slate-800 rounded cursor-pointer text-[10px] text-slate-300 flex flex-col gap-1 border border-amber-700";
        introBtn.innerHTML = `
            <span class="font-bold text-amber-400">Real B-Roll Footage</span>
            <span class="truncate">${projectState.intro.b_roll_idea || "..."}</span>
        `;
        
        introBtn.addEventListener('click', () => {
            currentSelectedScene = 'intro';
            document.querySelectorAll('.scene-card').forEach(el => el.classList.remove('active'));
            introBtn.classList.add('active');
            
            document.getElementById('visForeground').value = projectState.intro.b_roll_idea || "";
            document.getElementById('visBackground').value = "(Not applicable for B-Roll)";
            document.getElementById('visAction').value = projectState.intro.action || "";
            
            generateMediaPrompts();
            document.getElementById('step4').open = true;
        });
        list.appendChild(introBtn);
    }

    projectState.acts.forEach((act, aIndex) => {
        const header = document.createElement('div');
        header.className = "text-[10px] font-bold text-slate-500 mt-2 mb-1 uppercase tracking-widest";
        header.innerText = act.act_title;
        list.appendChild(header);

        act.scenes.forEach((scene, sIndex) => {
            const btn = document.createElement('div');
            btn.className = "scene-card p-2 mb-1 bg-slate-800 rounded cursor-pointer text-[10px] text-slate-300 flex flex-col gap-1 border border-slate-700";
            btn.innerHTML = `
                <span class="font-bold text-pink-300">Sc ${sIndex + 1}</span>
                <span class="truncate">${scene.visual_foreground || scene.visual_subject || "..."}</span>
            `;
            
            btn.addEventListener('click', () => {
                currentSelectedScene = 'scene';
                document.querySelectorAll('.scene-card').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                
                document.getElementById('visForeground').value = scene.visual_foreground || scene.visual_subject || "";
                document.getElementById('visBackground').value = scene.visual_background || scene.visual_environment || "";
                document.getElementById('visAction').value = scene.action || "";
                
                generateMediaPrompts();
                document.getElementById('step4').open = true;
            });
            
            list.appendChild(btn);
        });
    });
}

function generateMediaPrompts() {
    const { era, lang } = projectState;
    const isIndo = lang === "Indonesian";
    
    const fg = document.getElementById('visForeground').value || "[Foreground]";
    const bg = document.getElementById('visBackground').value || "[Background]";
    const action = document.getElementById('visAction').value || "[Action]";
    const ratio = document.getElementById('visRatio').value;

    const boxImg = document.getElementById('boxImagePrompt');
    const boxVid = document.getElementById('boxVideoPrompt');
    const labelImg = document.getElementById('labelOutImage');
    const labelVid = document.getElementById('labelOutVideo');

    if (currentSelectedScene === 'intro') {
        boxImg.classList.add('b-roll-mode');
        boxVid.classList.add('b-roll-mode');
        
        labelImg.innerHTML = `<i class="fa-solid fa-clapperboard mr-1"></i> ${isIndo ? "SARAN B-ROLL (TANPA AI)" : "B-ROLL SUGGESTION (NO AI)"}`;
        labelVid.innerHTML = `<i class="fa-solid fa-film mr-1"></i> ${isIndo ? "CATATAN FOOTAGE" : "FOOTAGE NOTE"}`;
        
        document.getElementById('outImage').value = isIndo ? 
            `--- MODE FOOTAGE ASLI ---\n\nJangan gunakan Gemini AI. Silakan cari footage video arsip atau stok asli (B-Roll) untuk membangun kredibilitas.\n\nKonsep Pencarian:\n${fg}\n\nEra yang dicocokkan: ${era || "Modern"}` :
            `--- REAL FOOTAGE MODE ---\n\nDo not use Gemini AI. Please search for real archival or stock video footage (B-Roll) to establish credibility.\n\nSearch Concept:\n${fg}\n\nEra to match: ${era || "Modern"}`;
            
        document.getElementById('outVideo').value = isIndo ?
            `--- TIDAK PERLU META AI ---\n\nGunakan software editing Anda untuk menerapkan instruksi ini pada footage B-Roll asli Anda:\n\nAksi: ${action}` :
            `--- NO META AI NEEDED ---\n\nUse your editing software to apply this action to your real B-Roll footage:\n\nAction: ${action}`;
    } else {
        boxImg.classList.remove('b-roll-mode');
        boxVid.classList.remove('b-roll-mode');
        labelImg.innerHTML = `<i class="fa-regular fa-image mr-1"></i> GEMINI IMAGE PROMPT`;
        labelVid.innerHTML = `<i class="fa-solid fa-video mr-1"></i> META AI VIDEO PROMPT`;

        const imgPrompt = isIndo ?
            `Buat gambar dengan rasio aspek [${ratio}]. Gaya seni: Campuran sinematik antara estetika cetak blok kayu Ukiyo-e tradisional Jepang dan pencahayaan Noir yang gelap dan berpasir. Era: [${era || "Modern"}]. Komposisi Adegan: FOREGROUND menampilkan [${fg}]. BACKGROUND menampilkan [${bg}]. Aksi: [${action}]. Penting: Jaga agar objek, pakaian, dan arsitektur mencerminkan era ${era}. SANGAT DILARANG ada teks, kanji, watermark, atau bingkai.` :
            `Generate an image in [${ratio}] aspect ratio. Art style: A cinematic mix of traditional Japanese Ukiyo-e woodblock print aesthetics and dark, gritty Noir lighting. Era: [${era || "Modern"}]. Scene Composition: FOREGROUND shows [${fg}]. BACKGROUND shows [${bg}]. Action: [${action}]. Important: Keep objects, clothing, and architecture accurately reflective of the ${era} era. STRICTLY NO text, NO kanji, NO watermarks, NO borders.`;

        const vidPrompt = isIndo ? 
            `Animasikan gambar ini secara alami. Buat foreground: [${fg}] dan background: [${bg}] bereaksi terhadap aksi: [${action}]. Kamera harus melengkapi adegan secara alami.` :
            `Animate this image naturally. Make the foreground: [${fg}] and background: [${bg}] react to the action: [${action}]. The camera should complement the scene naturally.`;

        document.getElementById('outImage').value = imgPrompt;
        document.getElementById('outVideo').value = vidPrompt;
    }
}

function saveProjectData() {
    updateStateObj();
    projectState.batchInputRaw = document.getElementById('batchInput').value;
    localStorage.setItem('ukiyo_project_v10', JSON.stringify(projectState)); 
    
    const btn = document.getElementById('btnSaveTop');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.classList.replace('border-slate-600', 'border-emerald-500');
    btn.classList.add('text-emerald-400');
    setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.replace('border-emerald-500', 'border-slate-600');
        btn.classList.remove('text-emerald-400');
    }, 1000);
}

function loadProjectData() {
    const saved = localStorage.getItem('ukiyo_project_v10');
    if(saved) {
        try {
            const loaded = JSON.parse(saved);
            projectState = { ...projectState, ...loaded };
            
            document.getElementById('sysTopic').value = projectState.topic || "";
            document.getElementById('sysEra').value = projectState.era || "";
            document.getElementById('sysType').value = projectState.type || "Real Event (True Crime Documentary)";
            
            if (!projectState.structure) projectState.structure = "Linear";
            document.getElementById('sysStructure').value = projectState.structure;

            if (!projectState.lang) projectState.lang = "Indonesian";
            document.getElementById('sysLang').value = projectState.lang;
            
            if(projectState.batchInputRaw) {
                document.getElementById('batchInput').value = projectState.batchInputRaw;
            }

            if(projectState.acts && projectState.acts.length > 0) {
                renderWritersRoom();
                renderVisualSceneSelector();
                document.getElementById('lockedEra').innerText = projectState.era || "Modern";
                document.getElementById('btnCopyFullScript').classList.remove('hidden');
            }
        } catch(e) {}
    }
}

