// HomeScreen.js - Main component
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Animated } from 'react-native';
import { debounce } from 'lodash';
import * as streamingAvailability from 'streaming-availability';
import { useAuth } from "../AuthContext";
import { auth, db } from "../firebase";
import { doc, setDoc, collection, deleteDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { signOut } from "firebase/auth";
import { RAPID_API_KEY } from '@env';

// Component imports
import Header from '../components/Header';
import SearchOverlay from '../components/SearchOverlay';
import ContentSections from '../components/ContentSections';
import FloatingActionMenu from '../components/FloatingActionMenu';
import SearchBar from '../components/SearchBar';
import AddedMessage from '../components/AddedMessage';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { userID } = useAuth();
  const [userEmail, setUserEmail] = useState('');
  const userRef = doc(db, "users", userID);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Content state
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [entries, setEntries] = useState([]);

  // UI state
  const [text, onChangeText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [open, setOpen] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [message, setMessage] = useState('');
  const [checkedItems, setCheckedItems] = useState({});

  // Sorting state
  const [movieOrderAsc, setMovieOrderAsc] = useState(false);
  const [seriesOrderAsc, setSeriesOrderAsc] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);

  // Get user email on mount
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email);
    }
  }, []);

  // Fetch user content
  const fetchUserContent = async () => {
    try {
      // Fetch movies
      const moviesQuery = query(collection(userRef, "movies"), orderBy("localCreatedAt"));
      const moviesSnapshot = await getDocs(moviesQuery);
      const fetchedMovies = moviesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMovies(sortList(fetchedMovies, 'movies'));

      // Fetch TV Shows
      const tvShowsSnapshot = await getDocs(collection(userRef, "tvShows"));
      const fetchedSeries = tvShowsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSeries(sortList(fetchedSeries, 'series'));
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  };

  useEffect(() => {
    fetchUserContent();
  }, [userID]);

  // API search functionality
  const fetchEntries = async () => {
    if (!text) return;
    
    try {
      const client = new streamingAvailability.Client(
        new streamingAvailability.Configuration({
          apiKey: RAPID_API_KEY,
        })
      );
      
      const data = await client.showsApi.searchShowsByTitle({
        title: text,
        country: "dk",
      });
      setEntries(data);
    } catch (err) {
      console.error("API error:", err);
    }
  };

  useEffect(() => {
    const debouncedFetch = debounce(fetchEntries, 500);
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [text]);

  // Add item functionality
  const handleAddItem = async (item) => {
    const now = new Date();
    const convertedItem = {
      id: item.id,
      title: item.title,
      image: item.imageSet?.verticalPoster?.w360 || 'default-image-url',
      streamingOptions: item.streamingOptions?.dk || [],
      showType: item.showType,
      createdAt: serverTimestamp(),
      localCreatedAt: now
    };

    const collectionRef = item.showType === 'movie'
      ? collection(userRef, 'movies')
      : collection(userRef, 'tvShows');

    try {
      await setDoc(doc(collectionRef, item.id), convertedItem);

      if (item.showType === 'movie') {
        setMovies((prevMovies) => {
          if (!prevMovies.some(movie => movie.id === item.id)) {
            setMessage("Added");
            return movieOrderAsc 
              ? [...prevMovies, convertedItem]
              : [convertedItem, ...prevMovies];
          }
          setMessage("Already Added");
          return prevMovies;
        });
      } else if (item.showType === 'series') {
        setSeries((prevSeries) => {
          if (!prevSeries.some(seriesItem => seriesItem.id === item.id)) {
            setMessage("Added");
            return seriesOrderAsc
              ? [...prevSeries, convertedItem]
              : [convertedItem, ...prevSeries];
          }
          setMessage("Already Added");
          return prevSeries;
        });
      }

      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    } catch (error) {
      console.error("Error saving item to Firestore: ", error);
    }
  };

  // Remove item functionality
  const removeShow = async (collectionName, showId) => {
    try {
      const showRef = doc(db, "users", userID, collectionName, showId);
      
      if (collectionName === 'movies') {
        setMovies(prev => prev.filter(item => item.id !== showId));
      } else {
        setSeries(prev => prev.filter(item => item.id !== showId));
      }
      
      await deleteDoc(showRef);
      
      setCheckedItems(prevState => {
        const newState = { ...prevState };
        delete newState[showId];
        return newState;
      });
    } catch (err) {
      console.log('Remove failed: ', err);
    }
  };

  // Sorting functionality
  function sortList(list, type) {
    const sortedList = [...list];

    if (type === "movies") {
      const newOrder = !movieOrderAsc;
      setMovieOrderAsc(newOrder);
      sortedList.sort((a, b) => {
        const x = a.createdAt?.toDate?.() || new Date(a.localCreatedAt);
        const y = b.createdAt?.toDate?.() || new Date(b.localCreatedAt);
        return newOrder ? x - y : y - x;
      });
    } else if (type === "series") {
      const newOrder = !seriesOrderAsc;
      setSeriesOrderAsc(newOrder);
      sortedList.sort((a, b) => {
        const x = a.createdAt?.toDate?.() || new Date(a.localCreatedAt);
        const y = b.createdAt?.toDate?.() || new Date(b.localCreatedAt);
        return newOrder ? x - y : y - x;
      });
    }
    return sortedList;
  }

  const toggleSort = (list, type) => {
    const sorted = sortList(list, type);
    if (type === 'movies') {
      setMovies([...sorted]);
    } else {
      setSeries([...sorted]);
    }
  };

  // Filter content based on search
  useEffect(() => {
    const lower = searchText.toLowerCase();
    setFilteredMovies(
      searchText === ''
        ? movies
        : movies.filter(item => item.title.toLowerCase().includes(lower))
    );
    setFilteredSeries(
      searchText === ''
        ? series
        : series.filter(item => item.title.toLowerCase().includes(lower))
    );
  }, [searchText, movies, series]);

  // Menu handlers
  const handleLogout = () => {
    signOut(auth)
      .then(() => navigation.navigate('Login'))
      .catch(error => console.log(error));
  };

  const toggleSearch = () => {
    setSearchText('');
    setOpenSearch(!openSearch);
  };

  const openAdd = () => setOpen(true);
  const closeAdd = () => setOpen(false);
  const toggleShowMenu = () => setShowMenu(prev => !prev);

  // Animation functions
  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (openSearch || showMenu) {
      fadeIn();
    } else {
      fadeOut();
    }
  }, [openSearch, showMenu]);

  return (
    <View style={styles.container}>
      <Header
        userEmail={userEmail}
        showMenu={showMenu}
        fadeAnim={fadeAnim}
        onToggleMenu={toggleShowMenu}
        onLogout={handleLogout}
      />

      <View style={styles.content}>
        {open ? (
          <SearchOverlay
            text={text}
            onChangeText={onChangeText}
            entries={entries}
            onClose={closeAdd}
            onAddItem={handleAddItem}
          />
        ) : (
          <ContentSections
            movies={searchText === '' ? movies : filteredMovies}
            series={searchText === '' ? series : filteredSeries}
            searchText={searchText}
            movieOrderAsc={movieOrderAsc}
            seriesOrderAsc={seriesOrderAsc}
            checkedItems={checkedItems}
            onToggleSort={toggleSort}
            onRemoveShow={removeShow}
          />
        )}
      </View>

      <View style={styles.footer}>
        {openSearch ? (
          <SearchBar
            searchText={searchText}
            onChangeSearchText={setSearchText}
            onClose={toggleSearch}
            fadeAnim={fadeAnim}
          />
        ) : (
          <FloatingActionMenu
            onOpenAdd={openAdd}
            onToggleSearch={toggleSearch}
          />
        )}
      </View>

      {showAdded && (
        <AddedMessage message={message} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.04,
  },
  footer: {
    bottom: height * 0.03,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 20,
  },
});