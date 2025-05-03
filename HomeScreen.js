
import React from 'react';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { View, Text, StyleSheet, TouchableOpacity,Pressable, FlatList, Image, TextInput, Linking,} from 'react-native';
import { useState, useEffect } from 'react';
import * as streamingAvailability from 'streaming-availability';
import { Dimensions } from 'react-native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { debounce, orderBy } from 'lodash';
import{ SvgUri }from 'react-native-svg';
import { useAuth } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth,db } from "./firebase";
import { doc, setDoc, collection, deleteDoc, serverTimestamp , query  } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import ActionButton from 'react-native-circular-action-menu';
import IconAction from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
export default function HomeScreen({ navigation }) {
  


  const { userID } = useAuth()
  const [userEmail, setUserEmail] = useState('');
  const [note, setNote] = useState('')
    const [movies, setMovies] = useState([]);
    const [series, setSeries] = useState([]);
    const [entries, setEntries] = useState([]);
    const [text, onChangeText] = useState('');
    const [open, setOpen] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const userRef = doc(db, "users", userID); 
  const [message, setMessage] = useState('')
  const [checkedItems, setCheckedItems] = useState({});
  const [movieOrderAsc, setMovieOrderAsc] = useState(false);
  const [seriesOrderAsc, setSeriesOrderAsc] = useState(false);
  

const toggleSort = (list, type) => {
  const sorted = sortList(list, type);
  if (type === 'movies') {
    setMovies([...sorted]);
  } else {
    setSeries([...sorted]);
  }
};


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

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email);
    }
  }, []);
    useEffect(() => {
        const RAPID_API_KEY = "4b38b286cbmsh1ab51ac7c7ea3a4p161812jsn62ae185280ee" 
        
        const client = new streamingAvailability.Client(
            new streamingAvailability.Configuration( {
             apiKey: RAPID_API_KEY,
             })
            )

            const fetchEntries = async () => {
                if (!text) return;
                try {
                    const data = await client.showsApi.searchShowsByTitle({
                        title: text,
                        country: "dk",
                        order_by: "popularity_alltime", //doesnt work
                       
                    });
                    
                    setEntries(data);
                } catch (err) {
                    console.error("API error:", err);
                }
            };
        
            const debouncedFetch = debounce(fetchEntries, 500);
            debouncedFetch();
        
            return () => debouncedFetch.cancel(); // cleanup on unmount or re-run
        }, [text]);
   
    const openAdd = async () =>  {
        setOpen(true)
    }
    const closeAdd = async () => {
        setOpen(false);
    }
    const toggleShowMenu = async () =>{
      setShowMenu(prev => !prev);
    }

   
    const handleAddItem = async (item) => {
      const now = new Date();
      // Convert API item to the structure required by Firestore
      const convertedItem = {
        id: item.id,
        title: item.title,
        image: item.imageSet?.verticalPoster?.w360 || 'default-image-url', // Use a default image if no image is available
        streamingOptions: item.streamingOptions?.dk || [], // Ensure it's an empty array if no streaming options
        showType: item.showType,
        createdAt: serverTimestamp(),   
        localCreatedAt: now  
      };
      // Check if the item is already added to avoid duplicates
      const userRef = doc(db, "users", userID);  // Reference to the logged-in user's document
    
      const collectionRef = item.showType === 'movie' 
    ? collection(userRef, 'movies')   // Reference to the user's movies subcollection
    : collection(userRef, 'tvShows');  // Reference to the user's tvShows subcollection
  
  // Create a new document for the movie/show in Firestore
  try {
    await setDoc(doc(collectionRef, item.id), convertedItem);
    console.log("Current movie IDs:", movies.map(m => m.id));
console.log("Trying to add movie ID:", item.id);

    // Now that the item is saved, add the converted item to the local state
    if (item.showType === 'movie') {
      setMovies((prevMovies) => {
        if (!prevMovies.some(movie => movie.id === item.id)) {
          setMessage("Added")
          console.log(movieOrderAsc)
          if( movieOrderAsc){
          return   [...prevMovies, convertedItem];}
          else {return[convertedItem, ...prevMovies];

          }
         
        }
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
    setShowAdded(true);  // Show the "Added" message
    
    setTimeout(() => setShowAdded(false), 2000);  // Hide "Added" message after 2 seconds
  } catch (error) {
    console.error("Error saving item to Firestore: ", error);
  }
};


    const fetchUserContent = async () => {
      // Reference to the user's document
    
      // Fetch movies
      const moviesQuery = query(collection(userRef, "movies"), orderBy("localCreatedAt"));
      const moviesSnapshot = await getDocs(moviesQuery);
      
      const fetchedMovies = moviesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMovies(sortList(fetchedMovies, 'movies'));
      
    
      // Fetch TV Shows
      const tvShowsSnapshot = await getDocs(collection(userRef, "tvShows"),orderBy("createdAt","desc"));
      const fetchedSeries = tvShowsSnapshot.docs.map(doc =>({
        id: doc.id,          
        ...doc.data()
      }));
      setSeries(sortList(fetchedSeries,'series'));
    };



    //remove shows
    const removeShow = async (collectionName, showId) => {
      try{
        console.log("Trying to delete from:", collectionName, "ID:", showId);
        const showRef = doc(db, "users", userID, collectionName, showId);

        if (collectionName === 'movies') {
          let filteredList = movies.filter(item => item.id != showId)
          setMovies(filteredList);
       
        } else if (collectionName === 'tvShows') {
          let filteredList = series.filter(item => item.id != showId)
          setSeries(filteredList);
         
        }

      
    await deleteDoc(showRef);

// Ensure the checkbox state is cleared
setCheckedItems(prevState => {
  const newState = { ...prevState };
  delete newState[showId];
  return newState;
});

      } catch (err) {
        console.log('remove failed: ', err)
      }
    }
    
    useEffect(() => {
      fetchUserContent();
    }, [userID]);

    function handleLogout(){
      signOut(auth).
      then(()=> navigation.navigate('Login')).
      catch(error => console.log(error))
  }


      return (
        <View style={styles.container}>
          {/* Fixed Header */}
          <View style={styles.header}>
            <Text style={styles.H1}>MovieTracker</Text>
            <TouchableOpacity onPress={() => toggleShowMenu()} style={styles.profileIcon}>
              <Text style={styles.profileText}>☰</Text>
            </TouchableOpacity>
          </View>

          {showMenu && (
            <View style={styles.dropdownMenu}>
              <Text style={styles.dropdownText}>Logged in as:</Text>
              <Text style={styles.dropdownText}>
                {userEmail.split('@')[0]} 
                </Text>
                <Pressable onPress={handleLogout} style={styles.logoutContainer}>
      <Icon name="sign-out" size={24} color="white" />
  
    </Pressable>

            </View>
)}
          
          {/* Main Content Area */}
          <View style={styles.content}>
            {/* Conditional Search Overlay */}
            {open ? (
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
    
                <FlatList
                  horizontal
                  data={entries}
                  keyExtractor={(item, index) => index.toString()}
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
                        Array.from(
                          new Map(
                            item.streamingOptions.dk.map((platform) => [
                              platform.service.id,
                              platform,
                            ])
                          ).values()
                        ).slice(0, 6)
                        .map((platform, index) => (
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
                  contentContainerStyle={styles.flatlistContainer}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
         
            ) : (
              <View style={styles.splitContainer}>
                {/* Movies Section */}
                <View style={styles.section}>
                  <View style={styles.sort}>
                  <Text style={styles.H2}>Movies</Text>
                  <Pressable onPress={() => toggleSort(movies, 'movies')}
                     style={styles.sortButton}>
                    {movieOrderAsc ? (
                      <IconAction name="caret-up-outline" style={styles.actionButtonIcon} />
                    ) : (
                      <IconAction name="caret-down-outline" style={styles.actionButtonIcon} />
                    )}
                  </Pressable>
                  </View>
                  <FlatList
                    horizontal
                    data={movies}
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
                              onPress={() => removeShow("movies", item.id)
                              }
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
                
    
                {/* TV Section */}
                <View style={styles.section}>
                <View style={styles.sort}>
                  <Text style={styles.H2}>TV</Text>
                  <Pressable onPress={() => toggleSort(series, 'series')}
                    style={styles.sortButton}>
                      {seriesOrderAsc ? (
                        <IconAction name="caret-up-outline" style={styles.actionButtonIcon} />
                      ) : (
                        <IconAction name="caret-down-outline" style={styles.actionButtonIcon} />
                      )}
                    </Pressable>
                    </View>
                  <FlatList
                    horizontal
                    data={series}
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
    
          {/* Add Button at the bottom */}
          <View style={styles.footer}>

          <ActionButton buttonColor="rgba(231,76,60,1)" style={styles.addButton}>
          <ActionButton.Item  title="New Task" >
            <IconAction name="" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item buttonColor='#rgba(231,76,60,1)' title="Notifications" onPress={openAdd}>
            <IconAction name="add-outline"style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item buttonColor='#rgba(231,76,60,1)' title="Notifications" onPress={() => {}}>
            <IconAction name="search-outline" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item  >
            <IconAction name="" style={styles.actionButtonIcon} />
          </ActionButton.Item>
      
        </ActionButton>


            {//
            //<TouchableOpacity onPress={openAdd} style={styles.button}>
             // <Text style={styles.add}>+</Text>
            //</TouchableOpacity>
            }
          </View>
    
          {/* "Added" Message */}
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
      }
    });
    