//firebase
//login
//viwed/delete
// fix list style

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import * as streamingAvailability from 'streaming-availability';
import { debounce } from 'lodash';
import{ SvgUri }from 'react-native-svg';




export default function HomeScreen({ navigation }) {
    const [movies, setMovies] = useState([]);
    const [series, setSeries] = useState([]);
    const [entries, setEntries] = useState([]);
    const [text, onChangeText] = React.useState('');
    const [open, setOpen] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
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
    const handleAddItem = (item) => {
        if (item.showType === 'movie') {
          setMovies((prevMovies) => [...prevMovies, item]);
        } else if (item.showType === 'series') {
          setSeries((prevSeries) => [...prevSeries, item]);
        }
        
        setShowAdded(true);
        setTimeout(() => setShowAdded(false), 2000);  // Hide "Added" message after 2 seconds
      };
      return (
        <View style={styles.container}>
          {/* Fixed Header */}
          <View style={styles.header}>
            <Text style={styles.H1}>MovieTracker</Text>
          </View>
    
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
                      onPress={() => handleAddItem(item)}  // Quick press adds item
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
                        <Image
                          source={{
                            uri:
                              item.imageSet?.verticalPoster?.w360 ||
                              'https://via.placeholder.com/150',
                          }}
                          style={styles.image}
                          resizeMode="cover"
                        />
                        <Text style={styles.contentTitle}>{item.title}</Text>
      
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
                        <Image
                          source={{
                            uri:
                              item.imageSet?.verticalPoster?.w360 ||
                              'https://via.placeholder.com/150',
                          }}
                          style={styles.image}
                          resizeMode="cover"
                        />
                        <Text style={styles.contentTitle}>{item.title}</Text>
      
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
              <Text style={styles.addedText}>Added</Text>
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
        },
        H1: {
          color: 'white',
          fontWeight: 'bold',
          fontSize: 36,
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
          position: 'absolute', // Fix the footer at the bottom of the screen
          bottom: 0,
          width: '100%',
          padding: 15,
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: 20, // Ensure footer is above overlay
        },
        button: {
          backgroundColor: '#FF4500',
          paddingVertical: 16,
          paddingHorizontal: 40,
          borderRadius: 30,
          shadowColor: '#FF4500',
          shadowOpacity: 0.2,
          shadowRadius: 15,
          elevation: 10,
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
         
        },
        image: {
          width: '100%',
          height: '60%',
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
            bottom: 80,  // Adjust based on footer height
        
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
          
      });
      