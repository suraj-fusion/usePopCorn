import { useState, useEffect,useRef } from "react";

import StarRating from "./StarRating";
import { useMovies } from "./useMovies";
import { useLocalStorageState } from "./useLocalStorageState";
import { useKey } from "./useKey";



const KEY = "2765d32f";
const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
 
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  // const [watched, setWatched] = useState([]);
  
  
  const {movies,isLoading,error}=useMovies(query)

  const [watched,setWatched]=useLocalStorageState([],"watched")
 

  function handleSelectMovie(id) {
    selectedId === id ? setSelectedId(null) : setSelectedId(id);
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie)
  {
    setWatched(watched=>[...watched,movie]);

    // localStorage.setItem('watched',  JSON.stringify([...watched,movie]) )
  }

  function handleDeleteWatched(id)
  {
    setWatched(watched=>watched.filter(movie=>movie.imdbID!==id));
  }


 


  return (
    <>
      <nav className="nav-bar">
        <NavBar>
          <Search query={query} setQuery={setQuery} />
          <NumResults movies={movies} />
        </NavBar>
      </nav>

      <Main>
        <Box>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <MovieList movies={movies} OnSelectMovie={handleSelectMovie} />
          )}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              OnCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
           
              <WatchedSummary watched={watched} />
              <WatchedMoviesList watched={watched} onDeleteWatched={handleDeleteWatched} />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>🔴</span>
      {message}
    </p>
  );
}
function Loader() {
  return <p className="loader">Loading.....</p>;
}

function NavBar({ children }) {
  return (
    <>
      <Logo />
      {children}
    </>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {

  const inputEl=useRef(null);
 
  useKey("Enter",function(){
    if (document.activeElement===inputEl.current) return;
      inputEl.current.focus();
      setQuery("")
  });
 
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen1, setIsOpen1] = useState(true);
  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen1((open) => !open)}
      >
        {isOpen1 ? "–" : "+"}
      </button>

      {isOpen1 && children}
    </div>
  );
}

function MovieList({ movies, OnSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} OnSelectMovie={OnSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({ movie, OnSelectMovie }) {

  return (
    <li
      key={movie.imdbID}
      onClick={() => {
        OnSelectMovie(movie.imdbID);
      }}
    >
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, OnCloseMovie,onAddWatched,watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading,setIsLoading]=useState(false);
  const [userRating,setUserRating]=useState('');
  const countRef = useRef(0);
  const isWatched = watched.map(movie=>movie.imdbID).includes(selectedId);
  const watchedUserrating=watched.find(movie=>movie.imdbID===selectedId)?.userRating;

  useEffect(function(){
    if(userRating){
      countRef.current=countRef.current+1;
    } 
  },[userRating])


  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd()
  {
    const newWatchedMovie={
      imdbID:selectedId,
      title,
      year,
      poster,
      imdbRating:Number(imdbRating),
      runtime:Number(runtime.split(' ').at(0)),
      userRating,
      countRatingDecisions:countRef.current
    };
     onAddWatched(newWatchedMovie);
     OnCloseMovie();
  }

  useEffect(function () {
    async function getMovieDetails() {
      setIsLoading(true);
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
      );
      const data = await res.json();
      setMovie(data);
      setIsLoading(false);
    }
    getMovieDetails();
  }, [selectedId]);


  useEffect(function(){
    if(!title) return 
    document.title=`Movie | ${title}`

    return function()
    {
      document.title='usePopCorn'
    }
  },[title]
  );

  useKey("escape",OnCloseMovie);  

  return (
    <div className="details">
    {isLoading? <Loader/>: 
    <>
      <header>
        <button className="btn-back" onClick={() => OnCloseMovie()}>
          &larr;
        </button>
        <img src={poster} alt={`Poster of ${movie}`} />
        <div className="details-overview">
          <h2>{title}</h2>
          <p>
            {released} &bull;{runtime}
          </p>
          <p>{genre}</p>
          <p>
            <span>🌟</span>
            {imdbRating} IMDb rating
          </p>
        </div>
      </header>

      <section>
        <div className="rating">
          { !isWatched?(
          <> <StarRating maxRating={10} size={24} onSetRating={setUserRating}/>

          {userRating>0 && 
          (<button className="btn-add" onClick={handleAdd}>+ Add to list</button>)
          }
          </>
          )
          :
          <p>You rated this movie {watchedUserrating}⭐</p>

          }
          
        </div>
        <p>
          <en>{plot}</en>
        </p>
        <p>Starring :{actors}</p>
        <p>Directed by {director}</p>
      </section>

    </>
    }
    </div>
    
  );
  }

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched,onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie movie={movie} key={movie.imdbID} onDeleteWatched={onDeleteWatched} />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie,onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>

        <button className="btn-delete" onClick={()=> onDeleteWatched(movie.imdbID)}></button>
      </div>
    </li>
  );
}
