window.onload = function () {

    const PRODUSE_PE_PAGINA = 3; 
    let produseFiltrateGlobal = []; 

    // --- SETUP BONUS 6 (Butoane Produs) ---
    // Citim produsele ascunse in sesiunea curenta
    let produseAscunseSesiune = JSON.parse(sessionStorage.getItem("produseAscunseSesiune") || "[]");
    
    let produseDOM = document.querySelectorAll(".produs");
    produseDOM.forEach(prod => {
        let idProdus = prod.id;
        
        // Daca a fost sters pe sesiune, ii punem o clasa ca sa il ignoram la filtrari
        if (produseAscunseSesiune.includes(idProdus)) {
            prod.classList.add("ascuns-sesiune");
        }

        // 1. Buton Fixare/Pin
        let btnPin = prod.querySelector(".btn-pin");
        if(btnPin) {
            btnPin.onclick = function() {
                prod.classList.toggle("produs-fixat");
                if(prod.classList.contains("produs-fixat")) {
                    btnPin.classList.replace("btn-outline-success", "btn-success");
                } else {
                    btnPin.classList.replace("btn-success", "btn-outline-success");
                }
                executaFiltrare(); 
            };
        }

        // 2. Buton Ascundere Temporara
        // 2. Buton Ascundere Temporara
        let btnTempHide = prod.querySelector(".btn-temp-hide");
        if(btnTempHide) {
            btnTempHide.onclick = function() {
                let paginaCurenta = 1;
                let btnActiv = document.querySelector("#paginare button.btn-primary");
                if (btnActiv) paginaCurenta = parseInt(btnActiv.innerText);

                // Ascundem produsul vizual de pe ecran IMEDIAT
                prod.style.display = "none";

                // Il scoatem din array-ul global ca sa nu mai fie luat in considerare la pagini
                produseFiltrateGlobal = Array.from(produseFiltrateGlobal).filter(p => p !== prod);
                
                // Re-generam paginarea cu produsele ramase
                genereazaPaginare(produseFiltrateGlobal);
                let maxPages = Math.ceil(produseFiltrateGlobal.length / PRODUSE_PE_PAGINA);
                if (paginaCurenta > maxPages) paginaCurenta = maxPages;
                if (paginaCurenta < 1) paginaCurenta = 1;
                
                // Afisam din nou pagina curenta (acum curatata de produsul sters)
                if (produseFiltrateGlobal.length > 0) {
                    afiseazaPagina(produseFiltrateGlobal, paginaCurenta);
                } else {
                    let mesajLipsa = document.getElementById("mesaj-lipsa-produse");
                    if(mesajLipsa) mesajLipsa.style.display = "block";
                }
            };
        }
        
        // 3. Buton Stergere pe Sesiune
        let btnSessionHide = prod.querySelector(".btn-session-hide");
        if(btnSessionHide) {
            btnSessionHide.onclick = function() {
                let currentHidden = JSON.parse(sessionStorage.getItem("produseAscunseSesiune") || "[]");
                if(!currentHidden.includes(idProdus)) {
                    currentHidden.push(idProdus);
                    sessionStorage.setItem("produseAscunseSesiune", JSON.stringify(currentHidden));
                }
                prod.classList.add("ascuns-sesiune"); // Marcam
                executaFiltrare(); // Rulam filtrarea ca sa dispara de pe ecran complet
            };
        }
    });

    // --- FUNCTII PAGINARE ---
    function afiseazaPagina(produseArray, pagina) {
        for(let prod of produseArray) {
            prod.style.display = "none";
        }
        
        let start = (pagina - 1) * PRODUSE_PE_PAGINA;
        let end = start + PRODUSE_PE_PAGINA; 
        
        for(let i = start; i < end && i < produseArray.length; i++) {
            produseArray[i].style.display = "block";
        }

        let butoane = document.querySelectorAll("#paginare button");
        butoane.forEach(btn => {
            if(parseInt(btn.innerText) === pagina) {
                btn.classList.replace("btn-outline-primary", "btn-primary");
            } else {
                btn.classList.replace("btn-primary", "btn-outline-primary");
            }
        });
    }

    function genereazaPaginare(produseArray) {
        let divPaginare = document.getElementById("paginare");
        if(!divPaginare) return;
        divPaginare.innerHTML = ""; 
        
        let nrl = Math.ceil(produseArray.length / PRODUSE_PE_PAGINA);
        if(nrl <= 1) return; 

        for(let i = 1; i <= nrl; i++) {
            let btn = document.createElement("button");
            btn.className = "btn btn-outline-primary fw-bold";
            btn.innerText = i;
            btn.onclick = function() { afiseazaPagina(produseArray, i); };
            divPaginare.appendChild(btn);
        }
    }

    // --- FUNCTIE PT ELIMINARE DIACRITICE (BONUS 7) ---
    function eliminaDiacritice(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    // --- FUNCTIA PRINCIPALA DE FILTRARE ---
    function executaFiltrare() {
        let inpNumeTest = document.getElementById("inp-nume").value.trim();
        if (inpNumeTest.match(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/)) return;
        if (document.getElementById("inp-descriere").classList.contains("is-invalid")) return;

        // Aplicam eliminarea diacriticelor pe textul introdus de utilizator
        let inpNume = eliminaDiacritice(inpNumeTest.toLowerCase());
        
        let inpPaginiMin = parseInt(document.getElementById("inp-pagini").value);
        let inpLimba = document.getElementById("inp-limba").value.trim().toLowerCase();
        let inpCategorie = document.getElementById("inp-categorie").value.trim().toLowerCase();
        let inpSemn = document.getElementById("inp-semn").checked;

        let radCoperta = "toate";
        let grupRadio = document.getElementsByName("gr_rad");
        for (let r of grupRadio) {
            if (r.checked) { radCoperta = r.value; break; }
        }

        let selPret = document.getElementById("inp-pret");
        let intervalePret = Array.from(selPret.selectedOptions).map(opt => opt.value);

        // Eliminam diacriticele si din textul scris in zona de descriere
        let valDescriere = eliminaDiacritice(document.getElementById("inp-descriere").value.trim().toLowerCase());
        let cuvintePlus = [];
        let cuvinteMinus = [];
        if (valDescriere) {
            let cuvinte = valDescriere.split(/\s+/);
            for (let c of cuvinte) {
                if (c.startsWith('+')) cuvintePlus.push(c.substring(1));
                else if (c.startsWith('-')) cuvinteMinus.push(c.substring(1));
            }
        }

        let produseToate = document.getElementsByClassName("produs");
        produseFiltrateGlobal = []; 

        for (let prod of produseToate) {
            prod.style.display = "none"; 

            if(prod.classList.contains("ascuns-sesiune")) continue;

            let isPinned = prod.classList.contains("produs-fixat");

            // Eliminam diacriticele din textele citite de pe ecran
            let nume = prod.querySelector(".val-nume") ? eliminaDiacritice(prod.querySelector(".val-nume").innerText.toLowerCase()) : "";
            let descriere = prod.querySelector(".val-descriere") ? eliminaDiacritice(prod.querySelector(".val-descriere").innerText.toLowerCase()) : "";
            
            let pret = parseFloat(prod.querySelector(".val-pret").innerText);
            let pagini = parseInt(prod.querySelector(".val-pagini").innerText);
            let limba = prod.querySelector(".val-limba").innerText.toLowerCase();
            let categorie = prod.querySelector(".val-categorie").innerText.toLowerCase();
            let coperta = prod.querySelector(".val-coperta").innerText.toLowerCase();
            let semn = prod.querySelector(".val-semn").innerText === "Da";

            let condNume = nume.includes(inpNume);
            let condPagini = pagini >= inpPaginiMin;
            let condLimba = inpLimba === "" || limba === inpLimba;
            let condCategorie = inpCategorie === "toate" || categorie === inpCategorie;
            let condCoperta = radCoperta === "toate" || coperta === radCoperta;
            let condSemn = !inpSemn || semn === true;

            let condDescriere = true;
            if (cuvintePlus.length > 0) condDescriere = cuvintePlus.some(cuv => descriere.includes(cuv));
            if (condDescriere && cuvinteMinus.length > 0) {
                let areMinus = cuvinteMinus.some(cuv => descriere.includes(cuv));
                if (areMinus) condDescriere = false;
            }

            let condPret = intervalePret.length === 0; 
            for (let interval of intervalePret) {
                let [min, max] = interval.split("-").map(Number);
                if (pret >= min && pret <= max) { condPret = true; break; }
            }

            if (isPinned || (condNume && condPagini && condLimba && condCategorie && condCoperta && condDescriere && condPret && condSemn)) {
                produseFiltrateGlobal.push(prod);
            }
        }

        let mesajLipsa = document.getElementById("mesaj-lipsa-produse");
        if(mesajLipsa) {
            if(produseFiltrateGlobal.length === 0) mesajLipsa.style.display = "block"; 
            else mesajLipsa.style.display = "none";  
        }

        genereazaPaginare(produseFiltrateGlobal);
        afiseazaPagina(produseFiltrateGlobal, 1);
    }

    // --- EVENIMENTE FILTRARE LIVE ---
    document.getElementById("inp-nume").oninput = executaFiltrare;
    document.getElementById("inp-limba").oninput = executaFiltrare;
    document.getElementById("inp-categorie").onchange = executaFiltrare;
    document.getElementById("inp-pret").onchange = executaFiltrare;
    document.getElementById("inp-semn").onchange = executaFiltrare;

    let radioButtons = document.getElementsByName("gr_rad");
    for (let r of radioButtons) r.onchange = executaFiltrare;

    let inpDescriere = document.getElementById("inp-descriere");
    inpDescriere.oninput = function () {
        let val = this.value.trim();
        let eValid = true;
        if (val.length > 0) {
            let cuvinte = val.split(/\s+/);
            for (let c of cuvinte) {
                if (!c.startsWith('+') && !c.startsWith('-')) { eValid = false; break; }
            }
        }
        if (!eValid) this.classList.add("is-invalid");
        else this.classList.remove("is-invalid");
        executaFiltrare();
    };

    document.getElementById("inp-pagini").oninput = function () {
        document.getElementById("infoRange").innerHTML = `(${this.value})`;
        executaFiltrare();
    };

    // --- BUTON RESETARE ---
    document.getElementById("resetare").onclick = function () {
        if (confirm("Resetați filtrele și sortarea?")) {
            document.getElementById("inp-nume").value = "";
            let range = document.getElementById("inp-pagini");
            range.value = range.min;
            document.getElementById("infoRange").innerHTML = `(${range.min})`;
            
            document.getElementById("inp-limba").value = "";
            document.getElementById("inp-categorie").value = "toate";
            document.getElementById("sort-cheie1").value = "pret";
            document.getElementById("sort-cheie2").value = "nume";
            document.getElementById("inp-descriere").value = "";
            document.getElementById("inp-pret").selectedIndex = -1;
            document.getElementById("inp-semn").checked = false;
            document.getElementById("i_rad_all").checked = true;

            let mesajLipsa = document.getElementById("mesaj-lipsa-produse");
            if(mesajLipsa) mesajLipsa.style.display = "none";
            
            let grid = document.querySelector(".grid-produse");
            let produseArr = Array.from(document.getElementsByClassName("produs"));
            
            produseArr.sort((a, b) => parseInt(a.id.split('_')[1]) - parseInt(b.id.split('_')[1]));
            for (let prod of produseArr) grid.appendChild(prod);

            executaFiltrare();
        }
    };

   // --- SORTARE MULTIPLA (BONUS 8) ---
    // Functie ajutatoare ca sa extragem rapid valoarea corecta din HTML
    function getValoareSortare(produs, cheie) {
        switch(cheie) {
            case "pret": 
                return parseFloat(produs.querySelector(".val-pret").innerText);
            case "pagini": 
                return parseInt(produs.querySelector(".val-pagini").innerText);
            case "nume": 
                return eliminaDiacritice(produs.querySelector(".val-nume").innerText.toLowerCase());
            case "categorie": 
                return eliminaDiacritice(produs.querySelector(".val-categorie").innerText.toLowerCase());
            default: 
                return "";
        }
    }

    function sorteaza(semn) {
        let grid = document.querySelector(".grid-produse");
        let produseToate = Array.from(document.getElementsByClassName("produs"));

        if(produseFiltrateGlobal.length === 0) {
            alert("Nu există produse afișate pe care să le sortăm!"); return;
        }

        let cheie1 = document.getElementById("sort-cheie1").value;
        let cheie2 = document.getElementById("sort-cheie2").value;

        if(cheie1 === cheie2) {
            alert("Te rog să alegi două chei de sortare diferite!"); return;
        }

        produseToate.sort(function (a, b) {
            let valA1 = getValoareSortare(a, cheie1);
            let valB1 = getValoareSortare(b, cheie1);

            // Daca la prima cheie sunt egale (ex: ambele au pretul 50 lei)
            if (valA1 === valB1) {
                let valA2 = getValoareSortare(a, cheie2);
                let valB2 = getValoareSortare(b, cheie2);
                
                // Sortam dupa a doua cheie
                if (typeof valA2 === "string") return semn * valA2.localeCompare(valB2);
                return semn * (valA2 - valB2);
            }
            
            // Daca nu sunt egale, sortam dupa prima cheie
            if (typeof valA1 === "string") return semn * valA1.localeCompare(valB1);
            return semn * (valA1 - valB1);
        });

        // Aplicam ordinea
        for (let p of produseToate) grid.appendChild(p);
        executaFiltrare(); // Recalculam paginarea cu noua ordine
    }

    document.getElementById("sortCrescNume").onclick = () => sorteaza(1);
    document.getElementById("sortDescrescNume").onclick = () => sorteaza(-1);

    

    // --- CALCUL PRET ---
    document.getElementById("btn-calcul").onclick = function() {
        let suma = 0, count = 0;
        for (let p of produseFiltrateGlobal) {
            suma += parseFloat(p.querySelector(".val-pret").innerText);
            count++;
        }

        if(count === 0) {
            alert("Nu există produse pentru a calcula prețul mediu!"); return;
        }

        let medie = count > 0 ? (suma/count).toFixed(2) : 0;
        let div = document.createElement("div");
        div.id = "div-calcul";
        div.innerHTML = `Media prețurilor afișate: <b>${medie} lei</b>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    };

    // --- TEME ---
    let selTema = document.getElementById("sel-tema");
    let temaSalvata = localStorage.getItem("tema") || "light"; 
    document.body.classList.remove("tema-dark", "tema-vintage");
    if (temaSalvata !== "light") document.body.classList.add("tema-" + temaSalvata);

    if (selTema) {
        selTema.value = temaSalvata;
        selTema.onchange = function () {
            let temaAleasa = this.value;
            document.body.classList.remove("tema-dark", "tema-vintage");
            if (temaAleasa !== "light") document.body.classList.add("tema-" + temaAleasa);
            localStorage.setItem("tema", temaAleasa);
        };
    }

    // --- PORNIM PAGINAREA LA INCARCAREA PAGINII ---
    executaFiltrare();
};