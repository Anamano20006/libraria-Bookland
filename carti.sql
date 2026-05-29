DROP TABLE IF EXISTS carti;
DROP TYPE IF EXISTS gen_literar;
DROP TYPE IF EXISTS tip_coperta;

CREATE TYPE gen_literar AS ENUM('fantasy', 'fictiune', 'dezvoltare', 'pentru copii', 'thriller');
CREATE TYPE tip_coperta AS ENUM('cartonata', 'simpla', 'editie de buzunar');

CREATE TABLE carti (
   id serial PRIMARY KEY,
   nume VARCHAR(100) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) NOT NULL,
   numar_pagini INT NOT NULL CHECK (numar_pagini > 0),
   categorie gen_literar DEFAULT 'fictiune',
   subcategorie tip_coperta DEFAULT 'simpla',
   limba VARCHAR(50) NOT NULL,
   taguri VARCHAR[],
   include_semn_carte BOOLEAN NOT NULL DEFAULT FALSE,
   imagine VARCHAR(300),
   data_adaugare TIMESTAMP DEFAULT current_timestamp
);

INSERT INTO carti (nume, descriere, pret, numar_pagini, categorie, subcategorie, limba, taguri, include_semn_carte, imagine) VALUES 
('Tronul de cleștar', 'O asasină celebră este adusă la curtea regală pentru a deveni campioana regelui, dar descoperă secrete și o magie întunecată.', 55.00, 520, 'fantasy', 'simpla', 'Romana', '{"asasin","magie","regat"}', TRUE, 'throne-of-glass.jpg'),
('Calea Regilor', 'Pe o lume bântuită de furtuni devastatoare, destinele unui sclav, unui prinț și unei tinere rebele se împletesc într-un mod epic.', 95.00, 1250, 'fantasy', 'cartonata', 'Romana', '{"epic","magie","razboi"}', TRUE, 'calea-regilor.jpg'),
('Jocurile Foamei', 'Într-un viitor distopic, tinerii sunt forțați să lupte pe viață și pe moarte într-un spectacol televizat controlat de Capitoliu.', 45.00, 374, 'fictiune', 'simpla', 'Romana', '{"distopie","supravietuire","actiune"}', FALSE, 'hunger-games.jpg'),
('The Naturals', 'Un grup de adolescenți cu abilități extraordinare este recrutat de FBI pentru a rezolva cazuri complicate și crime nerezolvate.', 49.90, 384, 'thriller', 'simpla', 'Engleza', '{"fbi","mister","crima"}', FALSE, 'the-naturals.jpg'),
('Stăpânul Inelelor', 'O aventură epică în care un grup de oameni, elfi și un pitic încearcă să distrugă un inel periculos.', 85.50, 1200, 'fantasy', 'cartonata', 'Romana', '{"magie","aventura","clasic"}', TRUE, 'lotr.jpg'),
('Atomic Habits', 'Cum să îți construiești obiceiuri bune și să scapi de cele rele, un pas mic pe rând.', 55.00, 320, 'dezvoltare', 'simpla', 'Romana', '{"motivational","psihologie","bestseller"}', FALSE, 'atomic-habits.jpg'),
('1984', 'Un roman distopic despre cum Big Brother te privește tot timpul.', 35.00, 350, 'fictiune', 'cartonata', 'Engleza', '{"distopie","politica","clasic"}', TRUE, '1984.jpg'),
('Fata din tren', 'O femeie merge zilnic cu trenul, se uită pe geam și ajunge să rezolve o crimă misterioasă.', 42.00, 400, 'thriller', 'simpla', 'Romana', '{"mister","crima","suspans"}', FALSE, 'fata-din-tren.jpg'),
('Micul Prinț', 'O poveste profundă și emoționantă despre un băiețel care călătorește printre stele.', 25.00, 120, 'pentru copii', 'cartonata', 'Franceza', '{"filozofie","poveste","ilustratii"}', TRUE, 'micul-print.jpg'),
('Pacientul Tăcut', 'Un thriller despre o femeie care își împușcă soțul și apoi refuză să mai vorbească.', 50.00, 360, 'thriller', 'cartonata', 'Romana', '{"psihologic","mister","crima"}', TRUE, 'pacientul-tacut.jpg'),
('Dune', 'O poveste cu viermi uriași de nisip și o resursă valoroasă numită Mirodenie, plasată într-un viitor îndepărtat.', 70.00, 800, 'fantasy', 'cartonata', 'Engleza', '{"sf","desert","ecranizat"}', TRUE, 'dune.jpg'),
('Mândrie și Prejudecată', 'O poveste clasică despre iubire, prejudecăți și diferențe de clasă în Anglia secolului 19.', 30.00, 450, 'fictiune', 'simpla', 'Romana', '{"romance","clasic","drama"}', FALSE, 'mandrie.jpg'),
('Harry Potter', 'Un băiat află că este vrăjitor și începe cursurile la faimoasa școală de magie Hogwarts.', 65.00, 350, 'fantasy', 'simpla', 'Engleza', '{"magie","scoala","ecranizat"}', TRUE, 'harry-potter.jpg'),
('Gândește rapid, gândește lent', 'Explorarea modului în care creierul nostru ia decizii și cum suntem influențați de intuiție și logică.', 60.00, 500, 'dezvoltare', 'cartonata', 'Romana', '{"psihologie","stiinta","bestseller"}', TRUE, 'gandeste.jpg'),
('Ghici cine moare', 'Un grup de prieteni se trezește prins într-un joc periculos în care fiecare secret poate fi fatal.', 38.00, 310, 'thriller', 'editie de buzunar', 'Romana', '{"suspans","crima"}', FALSE, 'ghici.jpg'),
('Alchimistul', 'Un tânăr păstor andaluz pleacă în căutarea unei comori ascunse la piramidele din Egipt.', 32.00, 200, 'fictiune', 'editie de buzunar', 'Romana', '{"filozofie","calatorie","motivational"}', FALSE, 'alchimistul.jpg'),
('Matilda', 'O fetiță genială care citește mult, are puteri telekinetice și o învățătoare foarte rea. Visul oricărui elev nemulțumit.', 35.00, 240, 'pentru copii', 'simpla', 'Romana', '{"magie","scoala","clasic"}', TRUE, 'matilda.jpg'),
('Winnie-the-Pooh', 'Un ursuleț care iubește mierea mai mult decât orice pe lume. Un exemplu perfect de priorități clare în viață.', 28.00, 160, 'pentru copii', 'cartonata', 'Engleza', '{"animale","prietenie","clasic"}', FALSE, 'pooh.jpg'),
('Alice în Țara Minunilor', 'O fetiță cade într-o gaură de iepure și dă peste o lume în care logica a luat o pauză lungă.', 30.00, 200, 'pentru copii', 'editie de buzunar', 'Romana', '{"fantezie","aventura","absurd"}', TRUE, 'alice.jpg'),
('Cum să-ți faci prieteni și să devii influent', 'Dacă titlul pare manipulator, cartea de fapt te învață să nu mai fii enervant la petreceri.', 45.00, 300, 'dezvoltare', 'simpla', 'Romana', '{"comunicare","succes","psihologie"}', FALSE, 'prieteni.jpg'),
('Inteligența Emoțională', 'O carte care îți explică de ce un IQ mare nu te ajută cu nimic dacă nu știi să reacționezi când cineva îți fură locul de parcare.', 55.00, 420, 'dezvoltare', 'cartonata', 'Romana', '{"psihologie","emotii","stiinta"}', TRUE, 'inteligenta-emotionala.jpg'),
('Tată bogat, tată sărac', 'Secretul suprem dezvăluit: e mai bine să fii bogat decât sărac. Plus câteva sfaturi reale despre investiții.', 50.00, 336, 'dezvoltare', 'editie de buzunar', 'Engleza', '{"financiar","bani","motivational"}', FALSE, 'rich-dad.jpg'),
('Numele Vântului', 'O poveste uimitoare pe care autorul promite de 10 ani să o termine. Citești pe riscul tău de a rămâne în suspans.', 80.00, 850, 'fantasy', 'simpla', 'Romana', '{"magie","muzica","epic"}', TRUE, 'numele-vantului.jpg'),
('Hoțul de cărți', 'O poveste emoționantă narată chiar de Moarte, despre o fetiță care fură cărți în timpul războiului.', 48.00, 580, 'fictiune', 'simpla', 'Romana', '{"istorie","razboi","drama"}', FALSE, 'hotul-de-carti.jpg'),
('Zece negri mititei', 'Cea mai celebră insulă unde cu siguranță nu ai vrea să îți petreci vacanța. Până la final nu mai rămâne nimeni.', 38.00, 280, 'thriller', 'editie de buzunar', 'Romana', '{"mister","crima","clasic"}', TRUE, 'zece-negri.jpg'),
('Sapiens: Scurtă istorie a omenirii', 'Cum am evoluat de la maimuțe la oameni care stau cu orele pe TikTok.', 65.00, 500, 'dezvoltare', 'cartonata', 'Romana', '{"istorie","evolutie","stiinta"}', FALSE, 'sapiens.jpg'),
('Eragon', 'Băiat găsește piatră, piatra e de fapt ou, oul face un dragon albastru. Apoi trebuie să salveze lumea.', 45.00, 520, 'fantasy', 'simpla', 'Engleza', '{"dragoni","magie","aventura"}', TRUE, 'eragon.jpg'),
('Ursul păcălit de vulpe', 'Lecția fundamentală de economie a copilăriei românești: ai grijă la pește.', 12.00, 30, 'pentru copii', 'editie de buzunar', 'Romana', '{"poveste","animale","romanesc"}', FALSE, 'ursul-pacalit.jpg');