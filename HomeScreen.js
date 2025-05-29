// ----- IMPORTS --------
import { Animated } from 'react-native';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { View, Text, StyleSheet, TouchableOpacity,Pressable, FlatList, Image, TextInput, Linking,} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as streamingAvailability from 'streaming-availability';
import { Dimensions } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { debounce, orderBy } from 'lodash';
import{ SvgUri }from 'react-native-svg';
import { useAuth } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth,db } from "./firebase";
import { doc, setDoc, collection, deleteDoc, serverTimestamp , query  } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import ActionButton from 'react-native-circular-action-menu';
import ActionButtonItem from 'react-native-vector-icons/Ionicons';
import {RAPID_API_KEY} from '@env';
// ---- Top-level constant -----
// Get the size of the screen disregarding the component
const { width, height } = Dimensions.get('window');

// ---- Export component -----
export default function HomeScreen({ navigation }) {
  
  const { userID } = useAuth()
  const [userEmail, setUserEmail] = useState('');
  const userRef = doc(db, "users", userID); 
  const fadeAnim = useRef(new Animated.Value(0)).current; 

  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [entries, setEntries] = useState([]);

  const [text, onChangeText] = useState('');
  const [searchText, setSearchText] =useState('')
  const [open, setOpen] = useState(false);
  const [openSearch, setOpenSearch] = useState(false)
  const [showMenu, setShowMenu] = useState(false);

  const [showAdded, setShowAdded] = useState(false);
  const [message, setMessage] = useState('')
  const [checkedItems, setCheckedItems] = useState({});

  const [movieOrderAsc, setMovieOrderAsc] = useState(false);
  const [seriesOrderAsc, setSeriesOrderAsc] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [filteredSeries, setFilteredSeries] =useState([]);
   
// --- HELPER FUNCTIONS ----

//--- On Mounted ----

//### LOGIN ###
  //Get user
  useEffect(() => {
    // Get the currently authenticated user from Firebase Auth
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email);
    }
  }, []);

  // Logout
  function handleLogout(){
    signOut(auth).
    then(()=> navigation.navigate('Login')).
    catch(error => console.log(error))
  }

//--- Handle items ---  

//### FETCH FROM DATABASE ###
  //Fetch the movies/series for user in database
  const fetchUserContent = async () => {
    // Fetch movies
    // Create a query to get movies 
    const moviesQuery = query(collection(userRef, "movies"), orderBy("localCreatedAt"));
    // Execute query (read-only representation of the data )
    const moviesSnapshot = await getDocs(moviesQuery);
    // Map through each document and extract the data along with its ID
    const fetchedMovies = moviesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // sort the list by created date (orderby not working), and setting the movies list
    setMovies(sortList(fetchedMovies, 'movies'));
      
    // Fetch TV Shows - TODO: Chnage to 'series'
    const tvShowsSnapshot = await getDocs(collection(userRef, "tvShows"));
    const fetchedSeries = tvShowsSnapshot.docs.map(doc =>({
      id: doc.id,          
      ...doc.data()
    }));
    setSeries(sortList(fetchedSeries,'series'));
  };

  // fetch contentn when userID changes
  useEffect(() => {
     fetchUserContent();
  }, [userID]);


//### SEARCH WITH API ###

  //seach api by title and country. 
  const fetchEntries = async () => {
    console.log(RAPID_API_KEY);
    // initiate api Client. 
    const client = new streamingAvailability.Client(
      new streamingAvailability.Configuration( {
       apiKey: RAPID_API_KEY,
      })
    )   
    //only search if text is not empty
    if (!text) return;
    try {
      const data = await client.showsApi.searchShowsByTitle({
        title: text,
        country: "dk",
      });
      //add found api titles to the shown entries list              
      setEntries(data);
    } catch (err) {
      console.error("API error:", err);
      }
  };

//  Calling fetchEntries when changing text in api-search field
  useEffect(() => {     
    //Wait for the user to finish writing before callling fecthEntries. 
    //Reduces the api calls
    const debouncedFetch = debounce(fetchEntries, 500);
    debouncedFetch();
        
    return () => debouncedFetch.cancel(); // cleanup on unmount or re-run
  }, [text]);
   
// #### ADD NEW ITEM ####

  // Add show to list + database
  const handleAddItem = async (item) => {
    const now = new Date();
    // Convert API item to an object that only contains what we need
    const convertedItem = {
      id: item.id,
      title: item.title,
      image: item.imageSet?.verticalPoster?.w360 || 'default-image-url', //TODOO find a defult image
      streamingOptions: item.streamingOptions?.dk || [], 
      showType: item.showType,
      createdAt: serverTimestamp(),   
      localCreatedAt: now  //use local timestamp to sort until object is fetched from database. 
    };
    
    const userRef = doc(db, "users", userID);  
    //Assert where to save the item in the databse
    const collectionRef = item.showType === 'movie' 
    ? collection(userRef, 'movies')   //the user's movies subcollection
    : collection(userRef, 'tvShows');  //the user's tvShows subcollection
  
    // Create a new document for the movie/show in Firestore
    try {
      //add the documention
      await setDoc(doc(collectionRef, item.id), convertedItem);
      console.log("Current movie IDs:", movies.map(m => m.id));
      console.log("Trying to add movie ID:", item.id);

      // add to local list 
      if (item.showType === 'movie') {
        setMovies((prevMovies) => {
          //ensure that there are no duplicates - firestore handles that itself.
          if (!prevMovies.some(movie => movie.id === item.id)) {
            setMessage("Added")
            if( movieOrderAsc){ // add in the correct order
            return   [...prevMovies, convertedItem];} //if asc is true then add last
            else {return[convertedItem, ...prevMovies];
            }
          } //if already exist:
          setMessage("Already Added")
          return prevMovies;  // no change  
        });

      } else if (item.showType === 'series') {
        setSeries((prevSeries) => {
          if (!prevSeries.some(seriesItem => seriesItem.id === item.id)) {
            setMessage("Added")
            if(seriesOrderAsc){
              return [...prevSeries, convertedItem];
            } else {
              return [convertedItem,...prevSeries];
            }
          }
          setMessage("Already Added")
          return prevSeries;  // no change  
        });
      }
    // only show if added succesfully 
    setShowAdded(true);  // Show the "Added" message
    setTimeout(() => setShowAdded(false), 2000);  // Hide "Added" message after 2 seconds
  } catch (error) {
    console.error("Error saving item to Firestore: ", error);
  }
};

//### REMOVE ITEMS ###

  const removeShow = async (collectionName, showId) => {
    try{
      //find the show in the database
      const showRef = doc(db, "users", userID, collectionName, showId);
      //filter out the list, removing the id
      if (collectionName === 'movies') {
        setMovies(prev => prev.filter(item => item.id !== showId));
      } else {
        setSeries(prev => prev.filter(item => item.id !== showId));
      }
      await deleteDoc(showRef);
    
    // Ensure the checkbox state is cleared
    setCheckedItems(prevState => {
    // Create a shallow copy of the previous checkbox state
    const newState = { ...prevState };
    // Remove the checkbox entry corresponding to the removed showId
    delete newState[showId];
    // Return the updated state without the deleted checkbox
    });

  
    } catch (err) {
      console.log('remove failed: ', err)
    }
  }
  
// #### SORTING #####

  // Sorts a list either newest to latets or vice verca. 
  function sortList(list, type) {
    // create shallow copy
    const sortedList = [...list];

    if (type === "movies") {
      const newOrder = !movieOrderAsc; // reverse the current order
      setMovieOrderAsc(newOrder);
      // Sort the list of movies by their creation date
      sortedList.sort((a, b) => {
        // Get the creation date for movie 'a'
        // Use 'createdAt.toDate()' if it exists (from Firestore), otherwise fall back to a local date
        const x = a.createdAt?.toDate?.() || new Date(a.localCreatedAt);
        const y = b.createdAt?.toDate?.() || new Date(b.localCreatedAt);
        // Compare the dates
        // If 'newOrder' is true (ascending), return x - y
        // If false (descending), return y - x
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
// Calls sortList and sets the Movies or Series list to be 
// the new sorted list. 
  const toggleSort = (list, type) => {
    const sorted = sortList(list, type);
    if (type === 'movies') {
      setMovies([...sorted]);
    } else {
      setSeries([...sorted]);
    }
  };
  
// #### SEARCH IN LIST ####
// filter lists based on search text
  useEffect(() => {
    const lower = searchText.toLowerCase();
    // filter movies, if search text is in any title, keep it. 
    setFilteredMovies(
      searchText === ''
        ? movies
        : movies.filter(item => item.title.toLowerCase().includes(lower))
    );
    // filter series
    setFilteredSeries(
      searchText === ''
        ? series
        : series.filter(item => item.title.toLowerCase().includes(lower))
    );
  }, [searchText]); // run evertime searchText changes




  //### TOGLE MENUS ####
   // Open or close search bar and reset search text
  const toggleSearch = async () => {
      setSearchText('');
      setOpenSearch(!openSearch);
    }
  const openAdd = async () =>  {
    setOpen(true)
  }
  const closeAdd = async () => {
    setOpen(false);
  }
  const toggleShowMenu = async () =>{
    setShowMenu(prev => !prev);
  }


 //### ANIMATIONS ####

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

  // add animations when search field is toggled
  useEffect(() => {
    if (openSearch) {
     fadeIn();
    } else {
      fadeOut();; 
    }
  }, [openSearch]);
  // add animations when menu is toggled
  useEffect(() => {
    if (showMenu) {
      fadeIn(); 
    } else {
      fadeOut();;  
    }
  }, [showMenu]); 


  

    

    
   


      return (
        <View style={styles.container}>
          {/* Fixed Header */}
          <View style={styles.header}>
            <Text style={styles.H1}>MovieTracker</Text>

            {/* Logout menu button */}
            <TouchableOpacity onPress={() => toggleShowMenu()} style={styles.profileIcon}>
              <Text style={styles.profileText}>☰</Text>
            </TouchableOpacity>
          </View>

          {/*Show menu if toggled, else show nothing*/}
          {showMenu && (
            <Animated.View style={[styles.dropdownMenu, { opacity: fadeAnim }]}>
              <Text style={styles.dropdownText}>Logged in as:</Text>
              <Text style={styles.dropdownText}>
                {userEmail.split('@')[0]}  {/*only show user part from email*/}
                </Text>
                <Pressable onPress={handleLogout} style={styles.logoutContainer}>
                  <Icon name="sign-out" size={24} color="white" />
                </Pressable>
            </Animated.View>
          )}
          
          {/* Main Content Area */}
          <View style={styles.content}>
            {/* If search is toggled then show search api view, else show normal homescreen*/}
            {open ? (
              /*SEARCH API*/
              <View style={styles.searchOverlay}>
                <View style={styles.inputField}>
                  <View style={styles.closeContainer}>
                    <TouchableOpacity onPress={closeAdd}>
                      <Text style={styles.close}>x</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    onChangeText={onChangeText}
                    value={text}
                  />
                </View>
                {/*Show list of found titles */}
                <FlatList
                  horizontal
                  data={entries}
                  keyExtractor={(item, index) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleAddItem(item)}  
                      style={styles.movieItem}>
                          <View style={styles.searchImageContainer}>
                            <Image
                              source={{
                              uri:
                                item.imageSet?.verticalPoster?.w360 ||
                                'https://via.placeholder.com/150',
                              }}
                              style={styles.image}
                              resizeMode="cover"
                            />
                          </View>

                      <Text style={styles.searchTitle}>{item.title}</Text>
                      <View style={styles.gridContainer}>   
                      {item.streamingOptions?.dk ? (
                        Array.from( //removes duplicates
                          new Map(
                            item.streamingOptions.dk.map((platform) => [
                              platform.service.id,
                              platform,
                            ])
                          ).values()
                        ).slice(0, 6) //max 6 platforms
                        .map((platform, index) => ( //create button for each platform in array
                          <TouchableOpacity
                            key={index}
                            onPress={() => Linking.openURL(platform.link)}
                            style={styles.logoButton}>
                            <SvgUri
                              width="50"
                              height="50"
                              uri={platform.service.imageSet.darkThemeImage}
                            />
                      
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.platform}>No streaming info</Text>
                      )}
                       </View>
                    </TouchableOpacity>
                  )}
                  //styles the inner section of the list
                  contentContainerStyle={styles.flatlistContainer}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
         
            ) : (
              // RENDER NORMAL HOME SCREEN
              <View style={styles.splitContainer}>
                {/* Movies Section */}
                <View style={styles.section}>
                  <View style={styles.sort}>
                  <Text style={styles.H2}>Movies</Text>

                  {/*Sort button*/}
                  <Pressable onPress={() => toggleSort(movies, 'movies')}
                     style={styles.sortButton}>
                    {movieOrderAsc ? (
                      <ActionButtonItem name="caret-up-outline" style={styles.actionButtonIcon} />
                    ) : (
                      <ActionButtonItem name="caret-down-outline" style={styles.actionButtonIcon} />
                    )}
                  </Pressable>
                  </View>

                  {/*MOVIES*/}
                  <FlatList
                    horizontal
                    //If there is a search text then show the filtered list otherwise normal*
                    data={searchText === '' ? movies : filteredMovies} 
                    keyExtractor={(item, index) => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.contentItem}>
                            {/*Image and title*/}
                            <View style={styles.contentImageContainer}>
                            <BouncyCheckbox
                              style={styles.checkbox}
                              size={30}
                              fillColor="white"
                              unFillColor="#FFFFFF"
                              iconStyle={{ borderColor: "red" }}
                              innerIconStyle={{ borderWidth: 2 }}
                              onPress={() => removeShow("movies", item.id)
                              }
                              isChecked={!!checkedItems[item.id]}  
                            
                            />
                            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                          </View>
                        <Text style={styles.contentTitle}>{item.title}</Text>
                        {/* Logos */}
                        <View style={styles.contentGridContainer}> 
                        {item.streamingOptions ? (
                          Array.from(
                            new Map(
                              item.streamingOptions.map((platform) => [
                                platform.service.id,
                                platform,
                              ])
                            ).values()
                          ).map((platform, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => Linking.openURL(platform.link)}
                              style={styles.contentLogoButton}>
                            
                              <SvgUri
                                width="30"
                                height="30"
                                uri={platform.service.imageSet.darkThemeImage}
                              />
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.platform}>No streaming info</Text>
                        )}
                        </View>
                     </View>
                    )}
                    contentContainerStyle={styles.flatlistContainer}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
                
    
                {/* Tv Section */}
                <View style={styles.section}>
                <View style={styles.sort}>
                  <Text style={styles.H2}>TV</Text>
                  {/* Sort button */}
                  <Pressable onPress={() => toggleSort(series, 'series')}
                    style={styles.sortButton}>
                      {seriesOrderAsc ? (
                        <ActionButtonItem name="caret-up-outline" style={styles.actionButtonIcon} />
                      ) : (
                        <ActionButtonItem name="caret-down-outline" style={styles.actionButtonIcon} />
                      )}
                  </Pressable>
                </View>
                {/*SERIES*/}
                <FlatList
                    horizontal
                    data={searchText === '' ? series : filteredSeries}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.contentItem}>
                         <View style={styles.contentImageContainer}>
                          <BouncyCheckbox
                            style={styles.checkbox}
                            size={30}
                            fillColor="white"
                            unFillColor="#FFFFFF"
                            iconStyle={{ borderColor: "red" }}
                            innerIconStyle={{ borderWidth: 2 }}
                            onPress={() => removeShow("tvShows", item.id)}
                            isChecked={!!checkedItems[item.id]}  
                          
                          />
                          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                        </View>
                        <Text style={styles.contentTitle}>{item.title}</Text>
                        <View style={styles.contentGridContainer}> 
                        {item.streamingOptions ? (
                          Array.from(
                            new Map(
                              item.streamingOptions.map((platform) => [
                                platform.service.id,
                                platform,
                              ])
                            ).values()
                          ).map((platform, index) => (
                            <TouchableOpacity
                            key={index}
                            onPress={() => Linking.openURL(platform.link)}
                            style={styles.contentLogoButton}>
                            <SvgUri
                              width="30"
                              height="30"
                              uri={platform.service.imageSet.darkThemeImage}
                            />
                          </TouchableOpacity>
                        ))
                        ) : (
                          <Text style={styles.platform}>No streaming info</Text>
                        )}
                        </View>
                     </View>
                    )}
                    contentContainerStyle={styles.flatlistContainer}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              </View>
            )}
          </View>
    
          {/* Functions Button */}
          <View style={styles.footer}>
            {/* is search is toggle then show search bar */}
            {openSearch ? (
              <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
              <View style={styles.searchContainer}>
                <View style={styles.inputField}>
                  <View style={styles.closeContainer}>
                    <TouchableOpacity onPress={() => toggleSearch()}>
                      <Text style={styles.close}>x</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    onChangeText={setSearchText}
                    value={searchText}
                  />
                </View>
                </View>
                </Animated.View>
            ):
            // Else show functions button
            <ActionButton buttonColor="rgba(231,76,60,1)" style={styles.addButton}>
              <ActionButton.Item  title="New Task" >
                <ActionButtonItem name="" style={styles.actionButtonIcon} />
              </ActionButton.Item>
              <ActionButton.Item buttonColor='#rgba(231,76,60,1)' title="Notifications" onPress={() => {openAdd()}}>
                <ActionButtonItem name="add-outline"style={styles.actionButtonIcon} />
              </ActionButton.Item>
                <ActionButton.Item buttonColor='#rgba(231,76,60,1)' title="Notifications" onPress={() => {toggleSearch()}}>
              <ActionButtonItem name="search-outline" style={styles.actionButtonIcon} />
                </ActionButton.Item>
              <ActionButton.Item  >
                <ActionButtonItem name="" style={styles.actionButtonIcon} />
              </ActionButton.Item>
            </ActionButton>
          }
          </View>
    

          {/* "Added" message when adding items  */}
          {showAdded && (
            <View style={styles.addedMessage}>
              <Text style={styles.addedText}>{message}</Text>
            </View>
          )}
        </View>
      );
    }
    const styles = StyleSheet.create({
      flatlistContainer: {
        paddingTop: height * 0.01,
        paddingBottom: height * 0.025,
        justifyContent: 'center',
        alignItems: 'center',
      },
      container: {
        flex: 1,
        backgroundColor: 'black',
      },
      header: {
        paddingTop: height * 0.06,
        paddingBottom: height * 0.015,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      },
      H1: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: RFValue(28, height),
        textAlign: 'center',
      },
      content: {
        flex: 1,
        paddingHorizontal: width * 0.04,
      },
      splitContainer: {
        flex: 1,
        flexDirection: 'column',
        
      },
      section: {
        paddingHorizontal: width * 0.03,
        paddingTop: height * 0.02,
        borderBottomColor: '#444',
        borderBottomWidth: 0,
      
      },
      H2: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: RFValue(18, height),
      },
      searchTitle: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: RFValue(18, height),
        borderBottomColor: '#444',
        borderBottomWidth: 1,
        height: height * 0.06,
      },
      footer: {
        bottom: height * 0.03,
        padding: 0,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 20,
      },
      button: {
        position: 'absolute',
        backgroundColor: '#FF4500',
        paddingVertical: height * 0.008,
        paddingHorizontal: width * 0.06,
        borderRadius: width * 0.08,
        shadowColor: '#FF4500',
        shadowOpacity: 0.2,
        zIndex: 20,
      },
      logoutButton: {
        backgroundColor: '#FF4500',
        paddingVertical: height * 0.007,
        paddingHorizontal: width * 0.035,
        borderRadius: width * 0.05,
      },
      logout: {
        color: 'white',
        fontSize: RFValue(14, height),
        fontWeight: 'bold',
      },
      add: {
        color: 'white',
        fontSize: RFValue(32, height),
      },
      searchOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        zIndex: 1000,
        paddingHorizontal: width * 0.06,
        paddingTop: height * 0.025,
      },
      inputField: {
        marginBottom: 0,
      },
      input: {
        height: height * 0.05,
        borderWidth: 1,
        borderColor: 'white',
        backgroundColor: 'white',
        paddingHorizontal: width * 0.03,
        borderRadius: width * 0.02,
      
      },
      closeContainer: {
        alignItems: 'flex-end',
        marginBottom: height * 0.01,
      },
      close: {
        color: 'white',
        fontSize: RFValue(22, height),
      },
      movieItem: {
        marginVertical: height * 0.015,
        marginHorizontal: width * 0.025,
        backgroundColor: '#1e1e1e',
        padding: width * 0.03,
        borderRadius: width * 0.035,
        width: width * 0.6,
        height: height * 0.5,
      },
      contentItem: {
        marginVertical: height * 0.015,
        marginHorizontal: width * 0.02,
        backgroundColor: '#1e1e1e',
        padding: width * 0.02,
        borderRadius: width * 0.03,
        width: width * 0.4,
        height: height * 0.33,
        position: 'relative',
      },
      image: {
        width: '100%',
        height: '100%',
        borderRadius: width * 0.025,
      },
      contentTitle: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: RFValue(10, height),
        height: height * 0.04,
      },
    
      platform: {
        color: 'white',
        fontSize: RFValue(12, height),
      },
      platformImage: {
        height: height * 0.01,
        width: width * 0.01,
      },
      addedMessage: {
        position: 'absolute',
        bottom: height * 0.1,
        padding: width * 0.03,
        backgroundColor: 'green',
        alignItems: 'center',
        justifyContent: 'center',
        width: width * 0.3,
        borderRadius: width * 0.02,
        zIndex: 10000,
        alignSelf: 'center',

      },
      addedText: {
        color: 'white',
        fontSize: RFValue(16, height),
        zIndex: 100,
      },
      profileIcon: {
        position: 'absolute',
        right: width * 0.05,
        top: height * 0.075,
        zIndex: 10,
      },
      profileText: {
        fontSize: RFValue(22, height),
        color: 'white',
      },
      dropdownMenu: {
        position: 'absolute',
        top: height * 0.12,
        right: width * 0.05,
        backgroundColor: '#222',
        padding: width * 0.04,
        borderRadius: width * 0.03,
        zIndex: 100000,
        width: width * 0.4, // Ensure the dropdown has a width
        alignItems: 'center', // Center the text horizontally
      },
      
      dropdownText: {
        color: 'white',
        marginBottom: height * 0.01,
        width: '100%', // Ensure it takes full width
        textAlign: 'center', // Center the text inside the container
      },
      contentImageContainer: {
        position: 'relative',
        width: '90%',
        height: '60%',
        left: '5%',
        marginBottom: height * 0.015,
      },
      searchImageContainer: {
        position: 'relative',
        width: '100%',
        height: '60%',
        marginBottom: height * 0.015,
        padding: width * 0.015,
      },
      checkbox: {
        position: 'absolute',
        left: width * 0.25,
        top: -height * 0.005,
        zIndex: 10,
      },
      contentGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        maxWidth: width * 0.5,
        gap: width * 0.02,
      },
      gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        maxWidth: width * 0.9,
        gap: width * 0.02,
      },
      logoButton: {
        width: width * 0.15,
        height: height * 0.03,
        margin: width * 0.015,
      },
      contentLogoButton: {
        width: width * 0.1,
        height: height * 0.015,
       
      },
      logoutContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
      },
      actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
      },
      sort: {
        flexDirection:'row',
        paddingHorizontal:5,

      },
      sortButton: {
        paddingHorizontal:5,
        paddingTop:2,
      },
      searchContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 20,
        backgroundColor: 'black',
        zIndex: 1000,
        paddingHorizontal: width * 0.09,
        height:height*0.08
        
      },
    });
    