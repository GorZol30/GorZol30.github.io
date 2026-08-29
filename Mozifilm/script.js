/**  Mozifilmek oldalról (www.omdbapi.com) film-infók lekérése - js file ***/
/***************************************************************************/
            // Mozifilm oldalán  page = 1-100 - lapozási lehetőség


var searchWord ="";                     // keresett film címe
var searchYear = "";                    // keresett film éve
var startLap = true;                    // az elso megjelenítéskori beállításhoz

const keresoForm = document.querySelector("#formSearch");
const uresReszHelye = document.querySelector("#emptySection"); //lábléc pozicionálásához
const filmsList = document.querySelector(".filmLista");
const leirElem = document.querySelector(".filmLeiras");


//kereső kifejezések kiolvasása
//*****************************
keresoForm.addEventListener('submit', function(event) {
     event.preventDefault();
     let sWord = event.target.elements.filmCim.value.trim(); 
     let sYear = event.target.elements.filmYear.value.trim(); 
     // az első oldal és ha indokolt a lapozó fülek-sor megjelenítése a keresett kifejezésre
     // a legelső alkalommal, ill. ha megváltozik a keresési feltétel
     if ( (searchWordEllFgv(sWord)) && (searchYearEllFgv(sYear)) ) {
         if ( startLap || ((searchWord!=sWord) || (searchYear!=sYear)) ) {   
            searchWord = sWord;
            searchYear = sYear;
            state.aktPage = "1";                          // a state obj. a js_utils-ban van
            state.firstPageVisible = 1;            
            state.mutatottElemekSzama = 20;               // egyszerre hány filmadat jelenjen meg            
             filmsDownload(searchWord, searchYear);       // filmek számának kiszámítása        
         }
     } else {
        return false;
     }
});

//**  a keresés alapján egy tömb feltöltése és az adott filmek száma
//*******************************************************************
async function filmsDownload(keresettWord, keresettYear) {   
    let noBreakOut;  
    let lapSzam = 0;
    let movieList;
    let url;
    let responsFilm; 
    state.talalatOsszesen = 0;
    state.filmTomb = [];
    loadingShow(true,"yellow");
    do {  
        noBreakOut = false;
        lapSzam += 1;
        url = `https://www.omdbapi.com/?s=${encodeURI(keresettWord)}&y=${keresettYear}&page=${lapSzam.toString()}&apiKey=9606ae0f`;
        
        responsFilm = await fetch(url);
        if (responsFilm.ok) {
            movieList = await responsFilm.json(); 
            if (movieList.Search) {                     // régi: .Response == "True") {
                for (let movie of movieList.Search) {
                    state.filmTomb.push(movie);         // az összes talált obj.adatokat betöltöm egy tömbbe, hogy darabolható legyen
                }
                if (movieList.Search.length >= 10) {    // egyszerre csak 10 filmet lehet letölteni az adatbázisból     
                    noBreakOut = true;
                }
            } else if (state.filmTomb.length === 0) {
                alertSK("Ez a keresés sikertelen, nem találok ilyen filmet!");
            } 
        } else {
                alertSK("Ez a keresés sikertelen ...");
        }                
    } while (noBreakOut);
    
    loadingShow(false);
    if (keresettYear === "") {
        state.filmTomb.sort(function (firstMovie, secondMovie) {
            const firstYear = Number((String(firstMovie.Year).match(/\d{4}/) || ["0"])[0]);
            const secondYear = Number((String(secondMovie.Year).match(/\d{4}/) || ["0"])[0]);

            return secondYear - firstYear;
        });
    }
    state.talalatOsszesen = state.filmTomb.length;         // a talált filmek száma
    if (state.talalatOsszesen > 0) {
      //***   PAGINATION    - lapozó gombsor felhelyezése az oldalra - ha indokolt
      //-------------------
       myLapozas(filmsLoading,state.talalatOsszesen,state.mutatottElemekSzama);     
       filmsLoading();                                      // filmcard-ok letöltése, megjelenítése
    }   
}

// a keresésnek megfelelő kiválasztott oldal letöltése
//****************************************************
function filmsLoading() {                                  // filmek megjelenítése
    const start = (Number(state.aktPage)-1) * state.mutatottElemekSzama;
    const end = (start + state.mutatottElemekSzama < state.talalatOsszesen) ? start + state.mutatottElemekSzama : state.talalatOsszesen;
    filmekMegjelenitese(state.filmTomb.slice(start, end));     
}

// filmek megjelenítéséhez html-elemek összeállítása
//***************************************************
function filmsTemplateMaker(movies) {
    let filmekTemplate="";
    for(let movie of movies) {
        filmekTemplate += `
          <li class="filmElemTabla">
            <div class="filmCard" data-filmid="${movie.imdbID}">
               <div class="filmPoster">
                   <a><img src="${movie.Poster}" alt="Film-poster" class="moviePoster"></a>
               </div>      
               <p class="egyFilmLeiras">
                   <span class="movieTitle">
                      ${movie.Title}
                   </span>
               </p> 
               <div class="alsoResz clearfix">
                 <span class="movieYear">
                  ${movie.Year}
                 </span>
                 <input class="form-control" type="button" value="Részletek">
               </div>   
            </div>   
          </li>              
        `
    }
    return filmekTemplate;
}

// a kiválasztott film részletes infójákhoz a html-elemek összeállítása
//**********************************************************************
function filmDetailsTemplateMaker(infoFilm) {
    let showReszlet = `
    <div class="infoBox">
        <span class="leirasCloseBtn clearfix">&times;</span>
        <br>
        <h5>${infoFilm.Title}</h5>               
        <div class="tartalomDiv">
            <span>Tartalom: </span>
            <span class="plotFilm">
              ${infoFilm.Plot}
            </span> 
        </div>               
        <p><span style="float:right">${infoFilm.Runtime}</span></p>                
        <p>Rendezte: <span>${infoFilm.Director}</span></p>
        <div class="tartalomDiv">
            <span>Főszereplők: </span>
            <span class="actorsFilm">
              ${infoFilm.Actors}
            </span> 
        </div>                                        
        <p>imdb: <span>${infoFilm.imdbRating}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${infoFilm.imdbVotes} szavazat</span></p>            
    </div>
    `;
    return showReszlet;
}

//*****************************************************************
// az egyszerre megjelenítendő filmek megmutatása - kártyaszerűen
//*****************************************************************
function filmekMegjelenitese(moziFilmek) {
    if (startLap) {  
       uresReszHelye.classList.remove("uresResz");  // lábléc feletti üres terület eltörlése
       startLap = false;                            // csak az első lista megjelenítése előtt kell
    }
    if (state.talalatOsszesen < 5) {
        uresReszHelye.classList.add("uresResz2");
    } 

    // összeállított html-tartalom megjelenítése az oldalon 
    filmsList.innerHTML = filmsTemplateMaker(moziFilmek);

    // részletek megjelenítése - a kiválasztott film ID-je alapján a teljes adatrekord lekérhető
    document.querySelectorAll('.alsoResz input').forEach(gomb => gomb.addEventListener('click',event => {
        filmDetailShow(event.target.parentElement.parentElement.dataset.filmid);
    }));
}

// a kiválasztott filmhez részletes információk megjelenítése
//***********************************************************
async function filmDetailShow(aktID) {     
    let url = `https://www.omdbapi.com/?i=${aktID}&apiKey=9606ae0f`;

    let respFilm = await fetch(url);
    if (respFilm.ok) {
        let infoFilm = await respFilm.json();
        if (infoFilm.Response == "True") {  
            // összeállított html-tartalom megjelenítése a film-részletekről 
            leirElem.innerHTML = filmDetailsTemplateMaker(infoFilm);
            leirElem.classList.add("dispBox");
                            
            document.querySelector(".leirasCloseBtn").onclick = function(ev) {  // ablak bezárásához
                leirElem.classList.remove("dispBox");
            }  

        } else {
            alertSK("Sikertelen az adatbázis elérése, kísérelje meg újra!");        
        }
        
    } else {    
        alertSK("Sikertelen a lekérdezés ...");            
    }
}


//**********  Adatbevitel ellenőrző függyvények  ******** */
//******************************************************* */
function searchWordEllFgv(inputValue) {
    if (inputValue.length < 3) {     
        alertSK('A kereséshez a film címéhez legaláb 3 betű beírása szükséges!',"black","orange",3);
        return false;
    } else {
        const lehetBenne = new RegExp("^[ a-zA-Z1-9]+$");
        if ( !lehetBenne.test(inputValue) ) {
           alertSK('A keresett film címe illetéktelen karaktereket tartalmaz !!',"black","orange",4);
           return false;    
        }
    }
    return true;
}
//----------------------------------------
function searchYearEllFgv(inputValue) {
    if (inputValue.length != 0) {
        let presentDate = new Date();
        if (isNaN(inputValue)===true) {  
            alertSK("A keresett évszám csak számjegyeket tartalmazhat !!","black","orange",3);
            return false
        } else if (inputValue.length != 4) {
            alertSK('A keresett évszámnak vagy üresnek, vagy 4 jegyűnek kell lennie!',"black","orange",3);
            return false;
        } else if ((Number(inputValue) < 1900) || (Number(inputValue) > presentDate.getFullYear()) ) {
            alertSK("A keresett évszám valótlan évet tartalmaz !!","black","orange",4);
            return false
        }
    }
    return true;
}
