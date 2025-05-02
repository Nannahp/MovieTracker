
import React from 'react';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { View, Text, StyleSheet, TouchableOpacity,Pressable, FlatList, Image, TextInput, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import * as streamingAvailability from 'streaming-availability';
import { debounce } from 'lodash';
import{ SvgUri }from 'react-native-svg';
import { useAuth } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth,db } from "./firebase";
import { doc, setDoc, collection, deleteDoc, serverTimestamp   } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';
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
                     // Sort entries: ones with streamingOptions.dk first
                        const sorted = [...(data || [])].sort((a, b) => {
                            const aHasServices = a.streamingOptions?.dk?.length > 0;
                            const bHasServices = b.streamingOptions?.dk?.length > 0;
                            return aHasServices === bHasServices ? 0 : aHasServices ? -1 : 1;
                        });
                    
                    setEntries(sorted);
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

      // Convert API item to the structure required by Firestore
  const convertedItem = {
    id: item.id,
    title: item.title,
    image: item.imageSet?.verticalPoster?.w360 || 'default-image-url', // Use a default image if no image is available
    streamingOptions: item.streamingOptions?.dk || [], // Ensure it's an empty array if no streaming options
    showType: item.showType,
    createdAt: serverTimestamp()
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
          return [convertedItem, ...prevMovies];
         
        }
        setMessage("Already Added")
        return prevMovies;  // no change
        
      });
    } else if (item.showType === 'series') {
      setSeries((prevSeries) => {
        if (!prevSeries.some(seriesItem => seriesItem.id === item.id)) {
          setMessage("Added")
          return [convertedItem,...prevSeries];
        
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
      const moviesSnapshot = await getDocs(collection(userRef, "movies"));
      const fetchedMovies = moviesSnapshot.docs.map(doc =>({
        id: doc.id,          
        ...doc.data()
      }));
      setMovies(fetchedMovies);
    
      // Fetch TV Shows
      const tvShowsSnapshot = await getDocs(collection(userRef, "tvShows"));
      const fetchedSeries = tvShowsSnapshot.docs.map(doc =>({
        id: doc.id,          
        ...doc.data()
      }));
      setSeries(fetchedSeries);
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
              <Text style={styles.dropdownText}>Logged in as: {userEmail}</Text>
              <Pressable onPress={handleLogout}>
                <Text style={styles.logout}>Logout</Text>
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
                      <Image
                        source={{
                          uri:
                            item.imageSet?.verticalPoster?.w360 ||
                            'https://via.placeholder.com/150',
                        }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                      <Text style={styles.movieTitle}>{item.title}</Text>
    
                      {item.streamingOptions?.dk ? (
                        Array.from(
                          new Map(
                            item.streamingOptions.dk.map((platform) => [
                              platform.service.id,
                              platform,
                            ])
                          ).values()
                        ).map((platform, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => Linking.openURL(platform.link)}>
                            <SvgUri
                              width="40"
                              height="40"
                              uri={platform.service.imageSet.darkThemeImage}
                            />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.platform}>No streaming info</Text>
                      )}
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
                  <Text style={styles.H2}>Movies</Text>
                  <FlatList
                    horizontal
                    data={movies}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.contentItem}>
                            <View style={styles.imageContainer}>
                            <BouncyCheckbox
                              style={styles.checkbox}
                              size={35}
                              fillColor="green"
                              unFillColor="#FFFFFF"
                              iconStyle={{ borderColor: "red" }}
                              innerIconStyle={{ borderWidth: 2 }}
                              onPress={() => removeShow("movies", item.id)}
                              isChecked={false}
                            />
                            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                          </View>
                        <Text style={styles.contentTitle}>{item.title}</Text>
      
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
                              onPress={() => Linking.openURL(platform.link)}>
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
                    )}
                    contentContainerStyle={styles.flatlistContainer}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
                
    
                {/* TV Section */}
                <View style={styles.section}>
                  <Text style={styles.H2}>TV</Text>
                  <FlatList
                    horizontal
                    data={series}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.contentItem}>
                         <View style={styles.imageContainer}>
                          <BouncyCheckbox
                            style={styles.checkbox}
                            size={30}
                            fillColor="green"
                            unFillColor="#FFFFFF"
                            iconStyle={{ borderColor: "red" }}
                            innerIconStyle={{ borderWidth: 2 }}
                            onPress={() => removeShow("tvShows", item.id)}
                            isChecked={false}
                          />
                          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                        </View>
                        <Text style={styles.contentTitle}>{item.title}</Text>
      
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
                            onPress={() => Linking.openURL(platform.link)}>
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
            <TouchableOpacity onPress={openAdd} style={styles.button}>
              <Text style={styles.add}>+</Text>
            </TouchableOpacity>
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
          paddingTop: 10,
          paddingBottom: 20,
          justifyContent: 'center',
          alignItems: 'center',
        },      
        container: {
          flex: 1,
          backgroundColor: 'black',
        },
        header: {
          paddingTop: 50,
          paddingBottom: 10,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        H1: {
          color: 'white',
          fontWeight: 'bold',
          fontSize: 36,
          textAlign: 'center',
        },
        content: {
          flex: 1,
          paddingHorizontal: 15,
        },
        splitContainer: {
          flex: 1,
          flexDirection: 'column',
        },
        section: {
          flex: 1,
          paddingHorizontal: 10,
          paddingTop: 10,
          borderBottomColor: '#444',
          borderBottomWidth: 1,
        },
        H2: {
          fontWeight: 'bold',
          color: 'white',
          fontSize: 18,
          
          
        },
        footer: {
          bottom:10,
          padding: 15,
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: 20, // Ensure footer is above overlay
        },
        button: {
          position:'absolute',
          backgroundColor: '#FF4500',
          paddingVertical: 5,
          paddingHorizontal: 20,
          borderRadius: 30,
          shadowColor: '#FF4500',
          shadowOpacity: 0.2,
        },
        logoutButton: {
          backgroundColor: '#FF4500',
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 20,
        
      
        },
        logout: {
          color: 'white',
          fontSize: 14,
          fontWeight: 'bold',
        },
        
        add: {
          color: 'white',
          fontSize: 32,
        },
        searchOverlay: {
          position: 'absolute',
          top: 0, // Starts from the top of the screen
          left: 0,
          right: 0,
          bottom: 0, // Takes the full height of the screen
          backgroundColor: 'black',
          zIndex: 30, // Make sure it's above the content and footer
          paddingHorizontal: 25,
          paddingTop: 20,
        },
        inputField: {
          marginBottom: 0,
        },
        input: {
          height: 40,
          borderWidth: 1,
          borderColor: 'white',
          backgroundColor: 'white',
          paddingHorizontal: 10,
          borderRadius: 6,
        },
        closeContainer: {
          alignItems: 'flex-end',
          marginBottom: 5,
        },
        close: {
          color: 'white',
          fontSize: 18,
        },
        movieItem: {
          marginVertical: 10,
          marginHorizontal:10,
          backgroundColor: '#1e1e1e',
          padding: 10,
          borderRadius: 10,
          width: 250,
          height:500,
        },
        contentItem: {
          marginVertical: 10,
          marginHorizontal:10,
          backgroundColor: '#1e1e1e',
          padding: 10,
          borderRadius: 10,
          width: 150,
          height:250,
          position: 'relative', 
         
        },
       
image: {
  width: '100%',
  height: '100%',
  borderRadius: 10,
},
        contentTitle: {
          color: 'white',
          fontSize: 12,
          marginTop: 10,
        },
        movieTitle: {
          color: 'white',
          fontSize: 18,
          marginTop: 10,
        },
        platform: {
          color: 'white',
          fontSize: 12,
        },
        platformImage: {
          height:5,
          width: 5,
        },
        addedMessage: {
            position: 'absolute',
            bottom: 80, 
        
            padding: 10,
            backgroundColor: 'green',
            alignItems: 'center', // Ensures text is centered horizontally
            justifyContent: 'center', // Centers the content vertically inside the container
            width: '30%',  // Adjust width as needed
            borderRadius: 5,
            zIndex: 100,  // Ensure "Added" message is above content but below footer
            alignSelf: 'center',  // Centers the container itself
          },
          
          addedText: {
            color: 'white',
            fontSize: 16,
            zIndex: 100, // Ensures text is above other content in the overlay
          },
          profileIcon: {
            position: 'absolute',
            right: 20,
            top: 60,
            zIndex: 10,
          },
          profileText: {
            fontSize: 22,
            color: 'white',
          },
          dropdownMenu: {
            position: 'absolute',
            top: 100,
            right: 20,
            backgroundColor: '#222',
            padding: 15,
            borderRadius: 10,
            zIndex: 99,
          },
          dropdownText: {
            color: 'white',
            marginBottom: 10,
          },
          checkbox: {
            position: 'absolute',
            top: 10,
            right:10,
            zIndex: 100,
          },
          imageContainer: {
            position: 'relative',
            width:130,
            height: 140, 
            marginBottom: 10,
           
          },
          
          checkbox: {
            position: 'absolute',
            left:100,
            top:-5,
            zIndex: 10,
          },
      });
      